# Job Finder AI System - PRD

## Original Problem Statement
Design and implement a Job-Finding AI System that continuously discovers and ranks jobs based on a user's resume, across global regions and portals, and automatically exports results into structured Excel files—without requiring the user to keep the app open.

## User Persona
- Job seekers looking for automated job discovery
- Professionals targeting specific companies/roles
- Remote workers seeking global opportunities

## Core Requirements (Implemented)

### 1. Resume-Based Matching ✅
- PDF/DOCX/TXT upload support
- Text extraction and parsing
- Skill extraction (27+ common tech skills)
- Experience years detection
- Education/certification extraction
- AI-enhanced parsing (Claude 4.5 - requires valid key)

### 2. Multi-Source Job Discovery ✅
- Modular connector system
- Implemented connectors:
  - Remotive (remote jobs API)
  - Arbeitnow (EU/German jobs API)  
  - HackerNews Jobs (tech startup jobs)
  - USAJobs.gov (US government - requires API key)
- Region inference from location
- Deduplication via fingerprinting

### 3. Cloud Browser Automation ✅
- Playwright-based browser service
- Session management with encrypted cookies
- Credential integration for portal login
- Screenshot/artifact capture
- Celery task integration ready

### 4. Scheduled 24/7 Job Hunting ✅
- Daily/twice-daily/weekly schedules
- Custom time configuration (UTC)
- Source selection per schedule
- Celery Beat integration ready
- Manual trigger available

### 5. Job Scoring & Ranking ✅
- Multi-factor scoring (skills, role, location, seniority, company, keywords, freshness)
- Weighted score calculation
- Matched skills/keywords tracking
- Score breakdown per job

### 6. Excel Export ✅
- Full column set per requirements
- Summary sheet with statistics
- Daily exports per run
- Download via API
- File expiration management

### 7. Secure Credential Vault ✅
- Fernet encryption (AES-128-CBC)
- Master key from environment
- Audit logging for all access
- Session cookie storage
- Ready for AWS KMS integration

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Resume
- POST /api/resume/upload
- GET /api/resume/profile
- PUT /api/resume/profile

### Preferences
- GET /api/preferences/
- PUT /api/preferences/

### Jobs
- GET /api/jobs/
- GET /api/jobs/stats
- GET /api/jobs/{job_id}
- PUT /api/jobs/{job_id}/status
- DELETE /api/jobs/{job_id}
- POST /api/jobs/discover

### Job Runs
- GET /api/runs/
- GET /api/runs/{run_id}

### Schedule
- GET /api/schedule/
- PUT /api/schedule/

### Credentials
- GET /api/credentials/
- POST /api/credentials/
- GET /api/credentials/{id}
- DELETE /api/credentials/{id}
- GET /api/credentials/{id}/audit

### Export
- GET /api/export/
- GET /api/export/excel
- GET /api/export/download/{id}

### Sources
- GET /api/sources/
- GET /api/sources/regions

## Tech Stack
- Backend: FastAPI + MongoDB
- Task Queue: Celery + Redis
- Browser: Playwright (Chromium)
- Encryption: Fernet/cryptography
- Excel: openpyxl

## What's Been Implemented
- [x] Complete backend API
- [x] Resume parsing (basic + AI)
- [x] 4 job source connectors
- [x] Job scoring algorithm
- [x] Excel export with summary
- [x] Credential vault with encryption
- [x] Audit logging
- [x] Schedule configuration
- [x] Browser automation framework
- [x] Celery task definitions

## Next Action Items (P0)
1. Start Celery worker for async tasks: `celery -A app.tasks.celery_tasks worker --loglevel=info`
2. Start Celery Beat for scheduled runs: `celery -A app.tasks.celery_tasks beat --loglevel=info`
3. Add more job source connectors (LinkedIn, Indeed, Glassdoor)
4. Configure valid Emergent LLM key for AI parsing

## Backlog (P1/P2)
- LinkedIn browser connector (with login)
- Indeed browser connector
- Email notifications for new jobs
- Google Sheets sync
- Cover letter generation
- Resume tailoring per job
