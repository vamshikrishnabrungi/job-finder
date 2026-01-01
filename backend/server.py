"""
Job Finder AI System - Main FastAPI Server
Complete backend with job discovery, browser automation, scheduling, and exports
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import json
from io import BytesIO

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'job-finder-secret-key-2025')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Import services
from app.models.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    ResumeProfile, JobPreferences, PreferencesUpdate,
    JobListing, JobStatusUpdate, ScheduleConfig, ScheduleUpdate,
    CredentialCreate, CredentialResponse, JobRun,
    generate_id, utc_now_iso
)
from app.services.credential_vault import CredentialVaultService
from app.services.resume_parser import ResumeParserService
from app.services.job_scoring import JobScoringService, rank_jobs
from app.services.excel_export import ExcelExportService, create_export
from app.services.ai_service import AIService
from app.connectors.sources import get_connector, get_all_connectors, CONNECTORS

# Initialize services
credential_service = CredentialVaultService(db)
ai_service = AIService()
resume_parser = ResumeParserService(ai_service)
job_scorer = JobScoringService(ai_service)
excel_service = ExcelExportService()

# Create the main app
app = FastAPI(
    title="Job Finder AI System",
    description="AI-powered job discovery and ranking system",
    version="1.0.0"
)

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/api/auth", tags=["Authentication"])
jobs_router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
resume_router = APIRouter(prefix="/api/resume", tags=["Resume"])
preferences_router = APIRouter(prefix="/api/preferences", tags=["Preferences"])
schedule_router = APIRouter(prefix="/api/schedule", tags=["Schedule"])
credentials_router = APIRouter(prefix="/api/credentials", tags=["Credentials"])
export_router = APIRouter(prefix="/api/export", tags=["Export"])
runs_router = APIRouter(prefix="/api/runs", tags=["Job Runs"])
sources_router = APIRouter(prefix="/api/sources", tags=["Sources"])

security = HTTPBearer()


# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"user_id": user_id, "exp": expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ==================== AUTH ROUTES ====================

@auth_router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = generate_id()
    now = utc_now_iso()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    # Create default preferences
    await db.preferences.insert_one({
        "id": generate_id(),
        "user_id": user_id,
        "preferred_roles": [],
        "preferred_industries": [],
        "required_skills": [],
        "preferred_skills": [],
        "excluded_companies": [],
        "included_companies": [],
        "preferred_locations": [],
        "preferred_regions": [],
        "remote_preference": "any",
        "min_salary": 0,
        "max_salary": 0,
        "salary_currency": "USD",
        "seniority_levels": [],
        "min_experience_years": 0,
        "max_experience_years": 99,
        "posted_within_days": 30,
        "include_keywords": [],
        "exclude_keywords": [],
        "updated_at": now
    })
    
    # Create default schedule
    await db.schedules.insert_one({
        "id": generate_id(),
        "user_id": user_id,
        "enabled": False,
        "schedule_type": "daily",
        "schedule_time": "07:30",
        "schedule_days": [0, 1, 2, 3, 4, 5, 6],
        "timezone": "UTC",
        "source_ids": [],
        "region_filter": [],
        "last_run_at": "",
        "last_run_id": "",
        "next_run_at": "",
        "created_at": now,
        "updated_at": now
    })
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=user_data.email, name=user_data.name, created_at=now)
    )

@auth_router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@auth_router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)


# ==================== RESUME ROUTES ====================

@resume_router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload and parse resume (PDF, DOCX, or TXT)"""
    filename = file.filename
    content = await file.read()
    
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    
    # Parse resume
    parsed = await resume_parser.parse_file(content, filename, use_ai=True)
    
    if parsed.get("error") and not parsed.get("skills"):
        raise HTTPException(status_code=400, detail=parsed.get("error", "Could not parse file"))
    
    now = utc_now_iso()
    resume_doc = {
        "id": generate_id(),
        "user_id": user["id"],
        "filename": filename,
        "raw_text": parsed.get("raw_text", ""),
        "skills": parsed.get("skills", []),
        "keywords": parsed.get("keywords", []),
        "experience_years": parsed.get("experience_years", 0),
        "roles": parsed.get("roles", []),
        "industries": parsed.get("industries", []),
        "education": parsed.get("education", []),
        "certifications": parsed.get("certifications", []),
        "work_history": parsed.get("work_history", []),
        "location_preference": parsed.get("location_preference", []),
        "work_authorization": parsed.get("work_authorization", ""),
        "salary_expectation": parsed.get("salary_expectation", {}),
        "remote_preference": parsed.get("remote_preference", "any"),
        "summary": parsed.get("summary", ""),
        "parsed_data": parsed.get("parsed_data", {}),
        "created_at": now,
        "updated_at": now
    }
    
    # Upsert resume
    await db.resumes.update_one(
        {"user_id": user["id"]},
        {"$set": resume_doc},
        upsert=True
    )
    
    return {"message": "Resume uploaded and parsed", "profile": resume_doc}

@resume_router.get("/profile")
async def get_resume_profile(user: dict = Depends(get_current_user)):
    """Get user's parsed resume profile"""
    resume = await db.resumes.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"profile": resume}

@resume_router.put("/profile")
async def update_resume_profile(
    updates: Dict[str, Any],
    user: dict = Depends(get_current_user)
):
    """Manually update resume profile"""
    updates["updated_at"] = utc_now_iso()
    updates.pop("_id", None)
    updates.pop("id", None)
    updates.pop("user_id", None)
    
    await db.resumes.update_one(
        {"user_id": user["id"]},
        {"$set": updates}
    )
    resume = await db.resumes.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"message": "Profile updated", "profile": resume}


# ==================== PREFERENCES ROUTES ====================

@preferences_router.get("/")
async def get_preferences(user: dict = Depends(get_current_user)):
    """Get user's job preferences"""
    prefs = await db.preferences.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"preferences": prefs}

@preferences_router.put("/")
async def update_preferences(
    updates: PreferencesUpdate,
    user: dict = Depends(get_current_user)
):
    """Update job preferences"""
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_dict["updated_at"] = utc_now_iso()
    
    await db.preferences.update_one(
        {"user_id": user["id"]},
        {"$set": update_dict}
    )
    prefs = await db.preferences.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"message": "Preferences updated", "preferences": prefs}


# ==================== JOBS ROUTES ====================

@jobs_router.get("/")
async def get_jobs(
    status: Optional[str] = None,
    min_score: Optional[float] = None,
    source_id: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = Query(50, le=500),
    skip: int = 0,
    user: dict = Depends(get_current_user)
):
    """Get discovered jobs with filters"""
    query = {"user_id": user["id"]}
    if status and status != "all":
        query["status"] = status
    if min_score:
        query["match_score"] = {"$gte": min_score}
    if source_id:
        query["source_id"] = source_id
    if region:
        query["region"] = region
    
    jobs = await db.jobs.find(query, {"_id": 0}).sort("match_score", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.jobs.count_documents(query)
    
    return {"jobs": jobs, "total": total, "limit": limit, "skip": skip}

@jobs_router.get("/stats")
async def get_job_stats(user: dict = Depends(get_current_user)):
    """Get job statistics"""
    user_id = user["id"]
    
    total = await db.jobs.count_documents({"user_id": user_id})
    new_jobs = await db.jobs.count_documents({"user_id": user_id, "status": "new"})
    saved = await db.jobs.count_documents({"user_id": user_id, "status": "saved"})
    applied = await db.jobs.count_documents({"user_id": user_id, "status": "applied"})
    ignored = await db.jobs.count_documents({"user_id": user_id, "status": "ignored"})
    
    # Average match score
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "avg_score": {"$avg": "$match_score"}}}
    ]
    result = await db.jobs.aggregate(pipeline).to_list(1)
    avg_score = round(result[0]["avg_score"], 1) if result and result[0].get("avg_score") else 0
    
    # By source
    source_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$source_id", "count": {"$sum": 1}}}
    ]
    sources = await db.jobs.aggregate(source_pipeline).to_list(50)
    
    # By region
    region_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$region", "count": {"$sum": 1}}}
    ]
    regions = await db.jobs.aggregate(region_pipeline).to_list(20)
    
    return {
        "total": total,
        "new": new_jobs,
        "saved": saved,
        "applied": applied,
        "ignored": ignored,
        "average_match_score": avg_score,
        "by_source": {s["_id"]: s["count"] for s in sources if s["_id"]},
        "by_region": {r["_id"]: r["count"] for r in regions if r["_id"]}
    }

@jobs_router.get("/{job_id}")
async def get_job(job_id: str, user: dict = Depends(get_current_user)):
    """Get a specific job"""
    job = await db.jobs.find_one({"id": job_id, "user_id": user["id"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job": job}

@jobs_router.put("/{job_id}/status")
async def update_job_status(
    job_id: str,
    update: JobStatusUpdate,
    user: dict = Depends(get_current_user)
):
    """Update job status"""
    update_doc = {"status": update.status}
    if update.notes is not None:
        update_doc["notes"] = update.notes
    
    result = await db.jobs.update_one(
        {"id": job_id, "user_id": user["id"]},
        {"$set": update_doc}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {"message": f"Job marked as {update.status}"}

@jobs_router.delete("/{job_id}")
async def delete_job(job_id: str, user: dict = Depends(get_current_user)):
    """Delete a job"""
    result = await db.jobs.delete_one({"id": job_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted"}

@jobs_router.post("/discover")
async def trigger_job_discovery(
    background_tasks: BackgroundTasks,
    source_ids: Optional[List[str]] = None,
    user: dict = Depends(get_current_user)
):
    """Trigger manual job discovery"""
    user_id = user["id"]
    
    # Check if resume exists
    resume = await db.resumes.find_one({"user_id": user_id}, {"_id": 0})
    if not resume:
        raise HTTPException(status_code=400, detail="Please upload your resume first")
    
    # Create job run
    run_id = generate_id()
    run_doc = {
        "id": run_id,
        "user_id": user_id,
        "trigger_type": "manual",
        "schedule_id": None,
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
    
    # Try to use Celery if available, otherwise run inline
    try:
        from app.tasks.celery_tasks import run_job_discovery
        run_job_discovery.delay(user_id=user_id, run_id=run_id, source_ids=source_ids)
        return {"message": "Job discovery started", "run_id": run_id, "async": True}
    except Exception as e:
        logging.warning(f"Celery not available, running inline: {e}")
        # Run inline
        background_tasks.add_task(
            _run_discovery_inline,
            user_id=user_id,
            run_id=run_id,
            source_ids=source_ids
        )
        return {"message": "Job discovery started", "run_id": run_id, "async": False}


async def _run_discovery_inline(user_id: str, run_id: str, source_ids: List[str] = None):
    """Run job discovery inline (when Celery not available)"""
    await db.job_runs.update_one(
        {"id": run_id},
        {"$set": {"status": "running", "started_at": utc_now_iso()}}
    )
    
    try:
        resume = await db.resumes.find_one({"user_id": user_id}, {"_id": 0}) or {}
        preferences = await db.preferences.find_one({"user_id": user_id}, {"_id": 0}) or {}
        
        # Determine sources
        sources_to_run = source_ids if source_ids else list(CONNECTORS.keys())
        
        all_jobs = []
        errors = []
        sources_processed = 0
        
        # Build search query
        query = " ".join(preferences.get("preferred_roles", [])[:3])
        if not query:
            query = " ".join(resume.get("roles", [])[:3])
        if not query:
            query = "software engineer"
        
        location = " ".join(preferences.get("preferred_locations", [])[:2])
        
        for source_id in sources_to_run:
            try:
                connector = get_connector(source_id)
                if not connector:
                    continue
                
                jobs = await connector.search_jobs(query=query, location=location)
                
                for job in jobs:
                    job["user_id"] = user_id
                    job["run_id"] = run_id
                
                all_jobs.extend(jobs)
                sources_processed += 1
                
            except Exception as e:
                errors.append({"source": source_id, "error": str(e)})
        
        # Deduplicate
        existing = await db.jobs.find(
            {"user_id": user_id},
            {"_id": 0, "fingerprint": 1}
        ).to_list(10000)
        existing_fps = {j["fingerprint"] for j in existing if j.get("fingerprint")}
        
        seen = set()
        unique_jobs = []
        for job in all_jobs:
            fp = job.get("fingerprint", "")
            if fp and (fp in seen or fp in existing_fps):
                continue
            seen.add(fp)
            unique_jobs.append(job)
        
        # Score jobs
        if unique_jobs and resume:
            unique_jobs = rank_jobs(unique_jobs, resume, preferences)
        
        # Insert
        if unique_jobs:
            await db.jobs.insert_many(unique_jobs)
        
        # Generate export
        export_record = None
        if unique_jobs:
            export_record = excel_service.generate_export(
                jobs=unique_jobs,
                user_id=user_id,
                export_type="daily",
                run_id=run_id
            )
            await db.exports.insert_one(export_record)
        
        # Update run
        await db.job_runs.update_one(
            {"id": run_id},
            {"$set": {
                "status": "completed",
                "completed_at": utc_now_iso(),
                "sources_processed": sources_processed,
                "jobs_found": len(all_jobs),
                "jobs_new": len(unique_jobs),
                "jobs_deduplicated": len(all_jobs) - len(unique_jobs),
                "errors": errors,
                "export_id": export_record["id"] if export_record else None,
                "export_path": export_record["filepath"] if export_record else None,
            }}
        )
        
    except Exception as e:
        await db.job_runs.update_one(
            {"id": run_id},
            {"$set": {
                "status": "failed",
                "completed_at": utc_now_iso(),
                "errors": [{"error": str(e)}]
            }}
        )


# ==================== JOB RUNS ROUTES ====================

@runs_router.get("/")
async def get_job_runs(
    limit: int = Query(20, le=100),
    user: dict = Depends(get_current_user)
):
    """Get job run history"""
    runs = await db.job_runs.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return {"runs": runs}

@runs_router.get("/{run_id}")
async def get_job_run(run_id: str, user: dict = Depends(get_current_user)):
    """Get specific job run details"""
    run = await db.job_runs.find_one({"id": run_id, "user_id": user["id"]}, {"_id": 0})
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"run": run}


# ==================== SCHEDULE ROUTES ====================

@schedule_router.get("/")
async def get_schedule(user: dict = Depends(get_current_user)):
    """Get user's job hunting schedule"""
    schedule = await db.schedules.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"schedule": schedule}

@schedule_router.put("/")
async def update_schedule(
    updates: ScheduleUpdate,
    user: dict = Depends(get_current_user)
):
    """Update job hunting schedule"""
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_dict["updated_at"] = utc_now_iso()
    
    # If enabling, calculate next run
    if updates.enabled:
        from app.tasks.celery_tasks import _calculate_next_run
        current = await db.schedules.find_one({"user_id": user["id"]}, {"_id": 0})
        if current:
            merged = {**current, **update_dict}
            update_dict["next_run_at"] = _calculate_next_run(merged)
    
    await db.schedules.update_one(
        {"user_id": user["id"]},
        {"$set": update_dict}
    )
    schedule = await db.schedules.find_one({"user_id": user["id"]}, {"_id": 0})
    return {"message": "Schedule updated", "schedule": schedule}


# ==================== CREDENTIALS ROUTES ====================

@credentials_router.get("/")
async def list_credentials(user: dict = Depends(get_current_user)):
    """List all stored credentials (without secrets)"""
    creds = await credential_service.list_credentials(user["id"])
    return {"credentials": creds}

@credentials_router.post("/")
async def add_credential(
    request: Request,
    cred: CredentialCreate,
    user: dict = Depends(get_current_user)
):
    """Add a new portal credential"""
    ip = request.client.host if request.client else ""
    ua = request.headers.get("user-agent", "")
    
    result = await credential_service.create_credential(
        user_id=user["id"],
        name=cred.name,
        source_id=cred.source_id,
        credential_type=cred.credential_type,
        username=cred.username,
        password=cred.password,
        api_key=cred.api_key,
        notes=cred.notes or "",
        ip_address=ip,
        user_agent=ua
    )
    
    return {"message": "Credential added", "credential": result}

@credentials_router.get("/{cred_id}")
async def get_credential(
    request: Request,
    cred_id: str,
    user: dict = Depends(get_current_user)
):
    """Get a credential (without secrets)"""
    ip = request.client.host if request.client else ""
    ua = request.headers.get("user-agent", "")
    
    cred = await credential_service.get_credential(
        credential_id=cred_id,
        user_id=user["id"],
        include_secrets=False,
        ip_address=ip,
        user_agent=ua
    )
    
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    return {"credential": cred}

@credentials_router.delete("/{cred_id}")
async def delete_credential(
    request: Request,
    cred_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a credential"""
    ip = request.client.host if request.client else ""
    ua = request.headers.get("user-agent", "")
    
    success = await credential_service.delete_credential(
        credential_id=cred_id,
        user_id=user["id"],
        ip_address=ip,
        user_agent=ua
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    return {"message": "Credential deleted"}

@credentials_router.get("/{cred_id}/audit")
async def get_credential_audit(cred_id: str, user: dict = Depends(get_current_user)):
    """Get audit log for a credential"""
    logs = await credential_service.get_audit_logs(
        user_id=user["id"],
        credential_id=cred_id,
        limit=50
    )
    return {"audit_logs": logs}


# ==================== EXPORT ROUTES ====================

@export_router.get("/")
async def list_exports(
    limit: int = Query(20, le=100),
    user: dict = Depends(get_current_user)
):
    """List export history"""
    exports = await db.exports.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return {"exports": exports}

@export_router.get("/excel")
async def export_jobs_excel(
    status: Optional[str] = None,
    min_score: Optional[float] = None,
    source_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Generate and download Excel export"""
    query = {"user_id": user["id"]}
    filters = {}
    
    if status and status != "all":
        query["status"] = status
        filters["status"] = status
    if min_score and min_score > 0:
        query["match_score"] = {"$gte": min_score}
        filters["min_score"] = min_score
    if source_id:
        query["source_id"] = source_id
        filters["source"] = source_id
    
    jobs = await db.jobs.find(query, {"_id": 0}).sort("match_score", -1).to_list(10000)
    
    if not jobs:
        raise HTTPException(status_code=404, detail="No jobs found")
    
    buffer = excel_service.generate_to_bytes(jobs, filters)
    
    filename = f"jobs_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@export_router.get("/download/{export_id}")
async def download_export(export_id: str, user: dict = Depends(get_current_user)):
    """Download a previously generated export"""
    export = await db.exports.find_one(
        {"id": export_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not export:
        raise HTTPException(status_code=404, detail="Export not found")
    
    filepath = export.get("filepath")
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Export file not found")
    
    return FileResponse(
        filepath,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=export.get("filename", "export.xlsx")
    )


# ==================== SOURCES ROUTES ====================

@sources_router.get("/")
async def get_sources():
    """Get available job sources"""
    connectors = get_all_connectors()
    return {"sources": connectors}

@sources_router.get("/regions")
async def get_regions():
    """Get available regions"""
    return {
        "regions": [
            {"id": "US", "name": "United States"},
            {"id": "EU", "name": "European Union"},
            {"id": "UK", "name": "United Kingdom"},
            {"id": "India", "name": "India"},
            {"id": "Canada", "name": "Canada"},
            {"id": "Australia", "name": "Australia"},
            {"id": "SEA", "name": "Southeast Asia"},
            {"id": "Middle East", "name": "Middle East"},
            {"id": "Global", "name": "Global / Remote"},
        ]
    }

@sources_router.get("/user-config")
async def get_user_source_config(user: dict = Depends(get_current_user)):
    """Get user's source configurations"""
    configs = await db.user_sources.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    return {"configurations": configs}

@sources_router.put("/user-config/{source_id}")
async def update_user_source_config(
    source_id: str,
    config: Dict[str, Any],
    user: dict = Depends(get_current_user)
):
    """Update user's source configuration"""
    config["user_id"] = user["id"]
    config["source_id"] = source_id
    config["updated_at"] = utc_now_iso()
    
    await db.user_sources.update_one(
        {"user_id": user["id"], "source_id": source_id},
        {"$set": config},
        upsert=True
    )
    
    return {"message": "Source configuration updated"}


# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": utc_now_iso()}


# Include routers
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(resume_router)
app.include_router(preferences_router)
app.include_router(schedule_router)
app.include_router(credentials_router)
app.include_router(export_router)
app.include_router(runs_router)
app.include_router(sources_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
