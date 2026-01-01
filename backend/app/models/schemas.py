"""
Database models and schemas for Job Finder AI System
"""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


def generate_id() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# Enums
class JobStatus(str, Enum):
    NEW = "new"
    SAVED = "saved"
    APPLIED = "applied"
    IGNORED = "ignored"
    REJECTED = "rejected"


class RemoteType(str, Enum):
    REMOTE = "remote"
    HYBRID = "hybrid"
    ONSITE = "onsite"
    UNKNOWN = "unknown"


class SeniorityLevel(str, Enum):
    INTERN = "intern"
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    MANAGER = "manager"
    DIRECTOR = "director"
    VP = "vp"
    EXECUTIVE = "executive"
    UNKNOWN = "unknown"


class SourceType(str, Enum):
    API = "api"
    BROWSER = "browser"
    RSS = "rss"


class RunStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class CredentialType(str, Enum):
    USERNAME_PASSWORD = "username_password"
    API_KEY = "api_key"
    OAUTH_TOKEN = "oauth_token"
    SESSION_COOKIES = "session_cookies"


# ==================== USER MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==================== RESUME / PROFILE MODELS ====================

class ResumeProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    filename: str = ""
    raw_text: str = ""
    
    # Parsed fields
    skills: List[str] = []
    keywords: List[str] = []
    experience_years: int = 0
    roles: List[str] = []
    industries: List[str] = []
    education: List[Dict[str, Any]] = []
    certifications: List[str] = []
    work_history: List[Dict[str, Any]] = []
    
    # Preferences from resume
    location_preference: List[str] = []
    work_authorization: str = ""
    salary_expectation: Dict[str, Any] = {}
    remote_preference: str = "any"
    
    # AI generated
    summary: str = ""
    parsed_data: Dict[str, Any] = {}
    
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


# ==================== JOB PREFERENCES MODELS ====================

class JobPreferences(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    
    # Role preferences
    preferred_roles: List[str] = []
    preferred_industries: List[str] = []
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    
    # Company preferences
    excluded_companies: List[str] = []
    included_companies: List[str] = []  # Whitelist (prioritize these)
    
    # Location preferences
    preferred_locations: List[str] = []
    preferred_regions: List[str] = []  # US, EU, UK, India, etc.
    remote_preference: str = "any"  # remote, hybrid, onsite, any
    
    # Compensation
    min_salary: int = 0
    max_salary: int = 0
    salary_currency: str = "USD"
    
    # Seniority
    seniority_levels: List[str] = []  # intern, entry, mid, senior, lead, etc.
    min_experience_years: int = 0
    max_experience_years: int = 99
    
    # Job freshness
    posted_within_days: int = 30
    
    # Keywords
    include_keywords: List[str] = []
    exclude_keywords: List[str] = []
    
    updated_at: str = Field(default_factory=utc_now_iso)


class PreferencesUpdate(BaseModel):
    preferred_roles: Optional[List[str]] = None
    preferred_industries: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    excluded_companies: Optional[List[str]] = None
    included_companies: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    preferred_regions: Optional[List[str]] = None
    remote_preference: Optional[str] = None
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    salary_currency: Optional[str] = None
    seniority_levels: Optional[List[str]] = None
    min_experience_years: Optional[int] = None
    max_experience_years: Optional[int] = None
    posted_within_days: Optional[int] = None
    include_keywords: Optional[List[str]] = None
    exclude_keywords: Optional[List[str]] = None


# ==================== JOB LISTING MODELS ====================

class JobListing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    
    # Source info
    source_id: str  # Connector ID
    source_name: str
    source_type: str = "api"  # api, browser, rss
    
    # Job identification
    external_id: str = ""  # ID from the source
    canonical_url: str  # Main URL for deduplication
    fingerprint: str = ""  # Hash for deduplication
    
    # Job details
    company: str
    title: str
    location: str = ""
    region: str = ""  # US, EU, UK, India, etc.
    remote_type: str = "unknown"  # remote, hybrid, onsite
    seniority: str = "unknown"
    
    # Description
    description: str = ""
    description_snippet: str = ""
    requirements: List[str] = []
    
    # Dates
    posted_at: str = ""
    scraped_at: str = Field(default_factory=utc_now_iso)
    
    # Compensation
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "USD"
    salary_text: str = ""
    
    # URLs
    job_url: str
    apply_url: str = ""
    
    # Scoring
    match_score: float = 0.0
    matched_skills: List[str] = []
    matched_keywords: List[str] = []
    score_breakdown: Dict[str, float] = {}
    
    # User status
    status: str = "new"
    notes: str = ""
    
    # Metadata
    discovered_at: str = Field(default_factory=utc_now_iso)
    run_id: str = ""  # Which job run discovered this


class JobStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


# ==================== SOURCE CONNECTOR MODELS ====================

class SourceConnector(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    
    name: str
    display_name: str
    source_type: str  # api, browser, rss
    
    # Configuration
    base_url: str = ""
    api_endpoint: str = ""
    requires_auth: bool = False
    robots_compliant: bool = True
    rate_limit_rpm: int = 60  # Requests per minute
    
    # Regions supported
    regions: List[str] = []
    
    # Connector status
    enabled: bool = True
    last_success: str = ""
    last_error: str = ""
    error_count: int = 0
    
    # Metadata
    created_at: str = Field(default_factory=utc_now_iso)


# ==================== USER SOURCE CONFIG ====================

class UserSourceConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    source_id: str
    
    enabled: bool = True
    credential_id: Optional[str] = None  # Link to credential vault
    
    # Source-specific config
    search_params: Dict[str, Any] = {}  # Custom search parameters
    
    updated_at: str = Field(default_factory=utc_now_iso)


# ==================== SCHEDULE MODELS ====================

class ScheduleConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    
    enabled: bool = False
    
    # Schedule settings
    schedule_type: str = "daily"  # daily, twice_daily, weekly, custom
    schedule_time: str = "07:30"  # HH:MM format (UTC)
    schedule_days: List[int] = [0, 1, 2, 3, 4, 5, 6]  # 0=Monday
    timezone: str = "UTC"
    
    # What to run
    source_ids: List[str] = []  # Empty = all enabled sources
    region_filter: List[str] = []  # Empty = all regions
    
    # Run tracking
    last_run_at: str = ""
    last_run_id: str = ""
    next_run_at: str = ""
    
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


class ScheduleUpdate(BaseModel):
    enabled: Optional[bool] = None
    schedule_type: Optional[str] = None
    schedule_time: Optional[str] = None
    schedule_days: Optional[List[int]] = None
    timezone: Optional[str] = None
    source_ids: Optional[List[str]] = None
    region_filter: Optional[List[str]] = None


# ==================== JOB RUN MODELS ====================

class JobRun(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    
    # Run info
    trigger_type: str = "manual"  # manual, scheduled
    schedule_id: Optional[str] = None
    
    # Status
    status: str = "pending"  # pending, running, completed, failed, cancelled
    
    # Results
    sources_processed: int = 0
    jobs_found: int = 0
    jobs_new: int = 0
    jobs_updated: int = 0
    jobs_deduplicated: int = 0
    
    # Export
    export_id: Optional[str] = None
    export_path: Optional[str] = None
    
    # Timing
    started_at: str = ""
    completed_at: str = ""
    
    # Errors
    errors: List[Dict[str, Any]] = []
    
    # Artifacts
    artifacts: List[str] = []  # Paths to screenshots, logs
    
    created_at: str = Field(default_factory=utc_now_iso)


# ==================== CREDENTIAL VAULT MODELS ====================

class CredentialVault(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    
    # Identity
    name: str  # Display name
    source_id: str  # Which source this is for
    credential_type: str = "username_password"
    
    # Encrypted fields (stored encrypted in DB)
    encrypted_username: str = ""
    encrypted_password: str = ""
    encrypted_api_key: str = ""
    encrypted_cookies: str = ""  # JSON string of cookies
    encrypted_session_data: str = ""  # Other session data
    
    # Metadata
    last_used_at: str = ""
    last_success_at: str = ""
    is_valid: bool = True
    
    # Notes (not encrypted)
    notes: str = ""
    
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)


class CredentialCreate(BaseModel):
    name: str
    source_id: str
    credential_type: str = "username_password"
    username: Optional[str] = None
    password: Optional[str] = None
    api_key: Optional[str] = None
    notes: Optional[str] = ""


class CredentialResponse(BaseModel):
    id: str
    name: str
    source_id: str
    credential_type: str
    has_username: bool
    has_password: bool
    has_api_key: bool
    has_cookies: bool
    last_used_at: str
    is_valid: bool
    notes: str
    created_at: str


# ==================== CREDENTIAL AUDIT LOG ====================

class CredentialAuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    
    credential_id: str
    user_id: str
    
    action: str  # created, accessed, updated, deleted, used_for_login
    details: Dict[str, Any] = {}
    
    ip_address: str = ""
    user_agent: str = ""
    
    timestamp: str = Field(default_factory=utc_now_iso)


# ==================== EXPORT MODELS ====================

class ExportRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    
    export_type: str = "daily"  # daily, master, filtered
    run_id: Optional[str] = None
    
    # File info
    filename: str
    filepath: str
    file_size: int = 0
    
    # Content info
    job_count: int = 0
    filters_applied: Dict[str, Any] = {}
    
    # Status
    status: str = "pending"  # pending, generating, completed, failed
    error_message: str = ""
    
    created_at: str = Field(default_factory=utc_now_iso)
    expires_at: str = ""  # When to auto-delete


# ==================== BROWSER SESSION MODELS ====================

class BrowserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    source_id: str
    
    # Session data
    encrypted_cookies: str = ""
    encrypted_local_storage: str = ""
    
    # Status
    is_valid: bool = True
    last_used_at: str = ""
    expires_at: str = ""
    
    # Auth status
    is_logged_in: bool = False
    login_verified_at: str = ""
    
    created_at: str = Field(default_factory=utc_now_iso)
    updated_at: str = Field(default_factory=utc_now_iso)
