"""
Celery task configuration and job discovery tasks
"""
import os
from celery import Celery
from celery.schedules import crontab
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

# Celery configuration
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

celery_app = Celery(
    'job_finder',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max per task
    worker_prefetch_multiplier=1,
)

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    'check-scheduled-runs': {
        'task': 'app.tasks.celery_tasks.check_scheduled_runs',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
    'cleanup-old-exports': {
        'task': 'app.tasks.celery_tasks.cleanup_old_exports',
        'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM
    },
}


@celery_app.task(bind=True, name='app.tasks.celery_tasks.run_job_discovery')
def run_job_discovery(
    self,
    user_id: str,
    run_id: str,
    source_ids: list = None,
    search_params: dict = None
):
    """
    Run job discovery for a user with new browser-based scrapers.
    This is the main task that orchestrates job fetching from all sources.
    """
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    
    async def _run():
        from dotenv import load_dotenv
        load_dotenv()
        
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ['DB_NAME']
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        from app.models.schemas import utc_now_iso
        from app.connectors.sources import get_connector, CONNECTORS
        from app.connectors.platform_scrapers import PLATFORM_SCRAPERS, get_scraper
        from app.connectors.enhanced_scrapers import ENHANCED_SCRAPERS, get_enhanced_scraper
        from app.services.job_scoring import rank_jobs
        from app.services.excel_export import ExcelExportService
        from app.services.job_run_manager import JobRunManager
        
        run_manager = JobRunManager(db)
        
        # Check if run should continue (not stopped)
        run_doc = await run_manager.get_run(run_id)
        if not run_doc or run_doc.get("status") == "stopped":
            logger.info(f"Run {run_id} was stopped before starting")
            return
        
        # Update run status
        await run_manager.update_run_status(run_id, "running")
        
        try:
            # Get user's resume and preferences
            resume = await db.resumes.find_one({"user_id": user_id}, {"_id": 0}) or {}
            preferences = await db.preferences.find_one({"user_id": user_id}, {"_id": 0}) or {}
            
            # Build search parameters
            query = search_params.get("query", "") if search_params else ""
            location = search_params.get("location", "") if search_params else ""
            
            # Use query from preferences if not provided
            if not query:
                roles = preferences.get("target_roles", [])
                if roles:
                    query = roles[0]  # Use first role as query
            
            if not location:
                locations = preferences.get("target_locations", [])
                if locations:
                    location = locations[0]
            
            # Determine which sources to use
            all_source_ids = list(CONNECTORS.keys()) + list(PLATFORM_SCRAPERS.keys()) + list(ENHANCED_SCRAPERS.keys())
            
            if source_ids:
                sources_to_run = [s for s in source_ids if s in all_source_ids]
            else:
                # Use all available sources by default
                sources_to_run = all_source_ids
            
            # Update total sources count
            await run_manager.update_run_progress(
                run_id,
                current_source=None,
            )
            await db.job_runs.update_one(
                {"id": run_id},
                {"$set": {"progress.total_sources": len(sources_to_run)}}
            )
            
            all_jobs = []
            errors = []
            sources_processed = 0
            
            # Process each source
            for source_id in sources_to_run:
                # Check if run was stopped
                run_check = await run_manager.get_run(run_id)
                if run_check.get("status") == "stopped":
                    logger.info(f"Run {run_id} stopped by user during processing")
                    break
                
                # Update progress
                await run_manager.update_run_progress(
                    run_id,
                    current_source=source_id,
                    completed_sources=sources_processed
                )
                
                try:
                    # Try platform scrapers first (browser-based)
                    if source_id in PLATFORM_SCRAPERS:
                        scraper = get_scraper(source_id)
                        jobs = await scraper.search_jobs(
                            query=query,
                            location=location,
                            limit=25  # Limit per source to avoid overload
                        )
                    # Fall back to API connectors
                    elif source_id in CONNECTORS:
                        connector = get_connector(source_id)
                        if not connector:
                            continue
                        jobs = await connector.search_jobs(
                            query=query,
                            location=location
                        )
                    else:
                        logger.warning(f"Unknown source: {source_id}")
                        continue
                    
                    # Add metadata to jobs
                    for job in jobs:
                        job["user_id"] = user_id
                        job["run_id"] = run_id
                    
                    all_jobs.extend(jobs)
                    sources_processed += 1
                    
                    # Update progress with jobs found
                    await run_manager.update_run_progress(
                        run_id,
                        jobs_found=len(all_jobs)
                    )
                    
                    logger.info(f"Source {source_id}: found {len(jobs)} jobs")
                    
                except Exception as e:
                    error_msg = f"Source {source_id} failed: {str(e)}"
                    errors.append({"source": source_id, "error": error_msg})
                    await run_manager.add_run_error(run_id, source_id, str(e))
                    logger.error(error_msg)
            
            # Deduplicate jobs
            seen_fingerprints = set()
            unique_jobs = []
            duplicates = 0
            
            # Check existing jobs in DB
            existing_jobs = await db.jobs.find(
                {"user_id": user_id},
                {"_id": 0, "fingerprint": 1, "canonical_url": 1}
            ).to_list(10000)
            existing_fps = {j["fingerprint"] for j in existing_jobs if j.get("fingerprint")}
            existing_urls = {j["canonical_url"] for j in existing_jobs if j.get("canonical_url")}
            
            for job in all_jobs:
                fp = job.get("fingerprint", "")
                url = job.get("canonical_url", "")
                
                if fp in seen_fingerprints or fp in existing_fps:
                    duplicates += 1
                    continue
                if url in existing_urls:
                    duplicates += 1
                    continue
                
                seen_fingerprints.add(fp)
                unique_jobs.append(job)
            
            # Score and rank jobs
            if unique_jobs and resume:
                unique_jobs = rank_jobs(unique_jobs, resume, preferences)
            
            # Insert new jobs
            if unique_jobs:
                await db.jobs.insert_many(unique_jobs)
            
            # Generate daily export
            export_record = None
            if unique_jobs:
                export_service = ExcelExportService()
                export_record = export_service.generate_export(
                    jobs=unique_jobs,
                    user_id=user_id,
                    export_type="daily",
                    run_id=run_id
                )
                await db.exports.insert_one(export_record)
            
            # Check if run was stopped during processing
            run_check = await run_manager.get_run(run_id)
            final_status = "stopped" if run_check.get("status") == "stopped" else "completed"
            
            # Update run with results
            await run_manager.update_run_status(
                run_id,
                final_status,
                completed_at=utc_now_iso()
            )
            
            await db.job_runs.update_one(
                {"id": run_id},
                {"$set": {
                    "sources_processed": sources_processed,
                    "stats.total_jobs": len(all_jobs),
                    "stats.new_jobs": len(unique_jobs),
                    "stats.duplicate_jobs": duplicates,
                    "stats.failed_sources": len(errors),
                    "export_id": export_record["id"] if export_record else None,
                    "export_path": export_record["filepath"] if export_record else None,
                }}
            )
            
            # Update final progress
            await run_manager.update_run_progress(
                run_id,
                completed_sources=sources_processed,
                jobs_found=len(all_jobs),
                jobs_new=len(unique_jobs)
            )
            
            logger.info(f"Run {run_id} {final_status}: {len(unique_jobs)} new jobs from {sources_processed} sources")
            
            return {
                "run_id": run_id,
                "status": final_status,
                "jobs_new": len(unique_jobs),
                "jobs_total": len(all_jobs),
                "sources_processed": sources_processed
            }
            
        except Exception as e:
            logger.error(f"Run {run_id} failed: {str(e)}")
            
            from app.services.job_run_manager import JobRunManager
            run_manager = JobRunManager(db)
            await run_manager.update_run_status(
                run_id,
                "failed",
                completed_at=utc_now_iso()
            )
            
            await db.job_runs.update_one(
                {"id": run_id},
                {"$set": {
                    "errors": [{"error": str(e), "timestamp": utc_now_iso()}]
                }}
            )
            raise
        finally:
            client.close()
    
    return asyncio.get_event_loop().run_until_complete(_run())


@celery_app.task(bind=True, name='app.tasks.celery_tasks.run_browser_job')
def run_browser_job(
    self,
    user_id: str,
    run_id: str,
    source_id: str,
    credential_id: str = None,
    search_params: dict = None
):
    """
    Run browser-based job discovery.
    Used for sources that require browser automation.
    """
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    
    async def _run():
        from dotenv import load_dotenv
        load_dotenv()
        
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ['DB_NAME']
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        from app.models.schemas import utc_now_iso
        from app.services.credential_vault import CredentialVaultService
        from app.services.browser_automation import BrowserAutomationService
        
        credential_service = CredentialVaultService(db)
        
        try:
            async with BrowserAutomationService(
                db=db,
                credential_service=credential_service
            ) as browser:
                # Define scraper function based on source
                # This would be customized per source
                async def scraper_func(page, params):
                    # Generic scraper - override for specific sources
                    return []
                
                result = await browser.run_scraper(
                    user_id=user_id,
                    source_id=source_id,
                    scraper_func=scraper_func,
                    credential_id=credential_id,
                    search_params=search_params,
                    run_id=run_id
                )
                
                # Process results...
                return result
                
        except Exception as e:
            logger.error(f"Browser job failed: {e}")
            raise
        finally:
            client.close()
    
    return asyncio.get_event_loop().run_until_complete(_run())


@celery_app.task(name='app.tasks.celery_tasks.check_scheduled_runs')
def check_scheduled_runs():
    """
    Check for scheduled runs that need to be executed.
    Called periodically by Celery Beat.
    """
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    
    async def _check():
        from dotenv import load_dotenv
        load_dotenv()
        
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ['DB_NAME']
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        from app.models.schemas import generate_id, utc_now_iso
        
        try:
            now = datetime.now(timezone.utc)
            now_str = now.isoformat()
            
            # Find schedules due for execution
            schedules = await db.schedules.find({
                "enabled": True,
                "$or": [
                    {"next_run_at": {"$lte": now_str}},
                    {"next_run_at": ""}
                ]
            }, {"_id": 0}).to_list(100)
            
            for schedule in schedules:
                user_id = schedule["user_id"]
                schedule_id = schedule["id"]
                
                # Create a new run
                run_id = generate_id()
                run_doc = {
                    "id": run_id,
                    "user_id": user_id,
                    "trigger_type": "scheduled",
                    "schedule_id": schedule_id,
                    "status": "pending",
                    "sources_processed": 0,
                    "jobs_found": 0,
                    "jobs_new": 0,
                    "jobs_updated": 0,
                    "jobs_deduplicated": 0,
                    "export_id": None,
                    "export_path": None,
                    "started_at": "",
                    "completed_at": "",
                    "errors": [],
                    "artifacts": [],
                    "created_at": utc_now_iso()
                }
                
                await db.job_runs.insert_one(run_doc)
                
                # Queue the discovery task
                run_job_discovery.delay(
                    user_id=user_id,
                    run_id=run_id,
                    source_ids=schedule.get("source_ids", []) or None
                )
                
                # Calculate next run time
                next_run = _calculate_next_run(schedule)
                
                await db.schedules.update_one(
                    {"id": schedule_id},
                    {"$set": {
                        "last_run_at": now_str,
                        "last_run_id": run_id,
                        "next_run_at": next_run
                    }}
                )
                
                logger.info(f"Triggered scheduled run {run_id} for user {user_id}")
        
        finally:
            client.close()
    
    asyncio.get_event_loop().run_until_complete(_check())


def _calculate_next_run(schedule: dict) -> str:
    """Calculate next run time based on schedule config."""
    from datetime import timedelta
    
    now = datetime.now(timezone.utc)
    schedule_type = schedule.get("schedule_type", "daily")
    schedule_time = schedule.get("schedule_time", "07:30")
    
    # Parse time
    try:
        hour, minute = map(int, schedule_time.split(":"))
    except:
        hour, minute = 7, 30
    
    if schedule_type == "daily":
        next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
    elif schedule_type == "twice_daily":
        # Run at specified time and 12 hours later
        next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(hours=12)
        if next_run <= now:
            next_run += timedelta(hours=12)
    elif schedule_type == "weekly":
        next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(weeks=1)
    else:
        next_run = now + timedelta(days=1)
    
    return next_run.isoformat()


@celery_app.task(name='app.tasks.celery_tasks.cleanup_old_exports')
def cleanup_old_exports():
    """Clean up expired export files."""
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    
    async def _cleanup():
        from dotenv import load_dotenv
        load_dotenv()
        
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ['DB_NAME']
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        try:
            now = datetime.now(timezone.utc).isoformat()
            
            # Find expired exports
            expired = await db.exports.find({
                "expires_at": {"$lte": now, "$ne": ""}
            }, {"_id": 0, "filepath": 1, "id": 1}).to_list(1000)
            
            for export in expired:
                filepath = export.get("filepath")
                if filepath and os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                        logger.info(f"Removed expired export: {filepath}")
                    except Exception as e:
                        logger.error(f"Failed to remove {filepath}: {e}")
                
                # Delete DB record
                await db.exports.delete_one({"id": export["id"]})
            
            logger.info(f"Cleaned up {len(expired)} expired exports")
        
        finally:
            client.close()
    
    asyncio.get_event_loop().run_until_complete(_cleanup())
