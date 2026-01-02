"""
Job Run Management Service
Handles creation, monitoring, and control of job discovery runs
"""
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.schemas import generate_id, utc_now_iso

logger = logging.getLogger(__name__)


class JobRunManager:
    """
    Manages job discovery runs with real-time status tracking
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def create_run(
        self,
        user_id: str,
        source_ids: List[str] = None,
        search_params: Dict[str, Any] = None,
        triggered_by: str = "manual"
    ) -> Dict[str, Any]:
        """
        Create a new job discovery run
        """
        run_id = generate_id()
        
        run_doc = {
            "id": run_id,
            "user_id": user_id,
            "status": "pending",  # pending, running, completed, failed, stopped
            "triggered_by": triggered_by,  # manual, scheduled
            "created_at": utc_now_iso(),
            "started_at": None,
            "completed_at": None,
            "source_ids": source_ids or [],
            "search_params": search_params or {},
            "progress": {
                "total_sources": len(source_ids) if source_ids else 0,
                "completed_sources": 0,
                "jobs_found": 0,
                "jobs_new": 0,
                "jobs_updated": 0,
                "current_source": None
            },
            "errors": [],
            "stats": {
                "total_jobs": 0,
                "new_jobs": 0,
                "duplicate_jobs": 0,
                "failed_sources": 0
            }
        }
        
        await self.db.job_runs.insert_one(run_doc)
        logger.info(f"Created job run {run_id} for user {user_id}")
        
        return run_doc
    
    async def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        """Get run by ID"""
        return await self.db.job_runs.find_one({"id": run_id}, {"_id": 0})
    
    async def get_user_runs(
        self,
        user_id: str,
        limit: int = 20,
        status: str = None
    ) -> List[Dict[str, Any]]:
        """Get all runs for a user"""
        query = {"user_id": user_id}
        if status:
            query["status"] = status
        
        cursor = self.db.job_runs.find(query, {"_id": 0}) \
            .sort("created_at", -1) \
            .limit(limit)
        
        return await cursor.to_list(length=limit)
    
    async def get_active_run(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get currently running job discovery for user"""
        return await self.db.job_runs.find_one(
            {"user_id": user_id, "status": {"$in": ["pending", "running"]}},
            {"_id": 0}
        )
    
    async def update_run_status(
        self,
        run_id: str,
        status: str,
        **kwargs
    ) -> bool:
        """Update run status"""
        update_fields = {"status": status}
        
        if status == "running" and "started_at" not in kwargs:
            update_fields["started_at"] = utc_now_iso()
        elif status in ["completed", "failed", "stopped"] and "completed_at" not in kwargs:
            update_fields["completed_at"] = utc_now_iso()
        
        update_fields.update(kwargs)
        
        result = await self.db.job_runs.update_one(
            {"id": run_id},
            {"$set": update_fields}
        )
        
        return result.modified_count > 0
    
    async def update_run_progress(
        self,
        run_id: str,
        current_source: str = None,
        completed_sources: int = None,
        jobs_found: int = None,
        jobs_new: int = None,
        jobs_updated: int = None
    ) -> bool:
        """Update run progress"""
        update_fields = {}
        
        if current_source is not None:
            update_fields["progress.current_source"] = current_source
        if completed_sources is not None:
            update_fields["progress.completed_sources"] = completed_sources
        if jobs_found is not None:
            update_fields["progress.jobs_found"] = jobs_found
        if jobs_new is not None:
            update_fields["progress.jobs_new"] = jobs_new
        if jobs_updated is not None:
            update_fields["progress.jobs_updated"] = jobs_updated
        
        if not update_fields:
            return False
        
        result = await self.db.job_runs.update_one(
            {"id": run_id},
            {"$set": update_fields}
        )
        
        return result.modified_count > 0
    
    async def add_run_error(
        self,
        run_id: str,
        source_id: str,
        error_message: str
    ) -> bool:
        """Add error to run"""
        error_doc = {
            "source_id": source_id,
            "error": error_message,
            "timestamp": utc_now_iso()
        }
        
        result = await self.db.job_runs.update_one(
            {"id": run_id},
            {"$push": {"errors": error_doc}}
        )
        
        return result.modified_count > 0
    
    async def stop_run(self, run_id: str, user_id: str) -> bool:
        """Stop a running job discovery"""
        run = await self.get_run(run_id)
        
        if not run or run["user_id"] != user_id:
            return False
        
        if run["status"] not in ["pending", "running"]:
            return False
        
        # Update status to stopped
        await self.update_run_status(
            run_id,
            "stopped",
            completed_at=utc_now_iso()
        )
        
        # Try to revoke Celery task if it exists
        try:
            from app.tasks.celery_tasks import celery_app
            celery_app.control.revoke(run_id, terminate=True)
            logger.info(f"Revoked Celery task for run {run_id}")
        except Exception as e:
            logger.warning(f"Could not revoke Celery task: {e}")
        
        return True
    
    async def cleanup_old_runs(self, days: int = 30) -> int:
        """Clean up old runs"""
        from datetime import timedelta
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        cutoff_iso = cutoff_date.isoformat()
        
        result = await self.db.job_runs.delete_many({
            "created_at": {"$lt": cutoff_iso},
            "status": {"$in": ["completed", "failed", "stopped"]}
        })
        
        logger.info(f"Cleaned up {result.deleted_count} old job runs")
        return result.deleted_count
