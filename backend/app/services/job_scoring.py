"""
Job Scoring and Ranking Service
Scores jobs against user's resume profile and preferences
"""
import re
from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


class JobScoringService:
    """
    Scores jobs based on resume profile and user preferences.
    Uses a weighted scoring system with multiple factors.
    """
    
    # Scoring weights (total = 100)
    WEIGHTS = {
        "skills_match": 30,
        "role_match": 20,
        "location_match": 15,
        "seniority_match": 10,
        "company_preference": 10,
        "keywords_match": 10,
        "freshness": 5
    }
    
    def __init__(self, ai_service=None):
        """
        Initialize scoring service.
        ai_service: Optional AI service for semantic matching
        """
        self.ai_service = ai_service
    
    def score_job(
        self,
        job: Dict[str, Any],
        resume: Dict[str, Any],
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Score a job against resume and preferences.
        Returns score (0-100) and breakdown.
        """
        scores = {}
        matched_skills = []
        matched_keywords = []
        
        # 1. Skills Match (30%)
        skills_result = self._score_skills(job, resume)
        scores["skills_match"] = skills_result["score"]
        matched_skills = skills_result["matched"]
        
        # 2. Role Match (20%)
        scores["role_match"] = self._score_role_match(job, resume, preferences)
        
        # 3. Location Match (15%)
        scores["location_match"] = self._score_location(job, preferences)
        
        # 4. Seniority Match (10%)
        scores["seniority_match"] = self._score_seniority(job, resume, preferences)
        
        # 5. Company Preference (10%)
        scores["company_preference"] = self._score_company(job, preferences)
        
        # 6. Keywords Match (10%)
        keywords_result = self._score_keywords(job, resume, preferences)
        scores["keywords_match"] = keywords_result["score"]
        matched_keywords = keywords_result["matched"]
        
        # 7. Freshness (5%)
        scores["freshness"] = self._score_freshness(job, preferences)
        
        # Calculate weighted total
        total_score = sum(
            scores[factor] * (self.WEIGHTS[factor] / 100)
            for factor in scores
        )
        
        return {
            "score": round(total_score, 1),
            "breakdown": {k: round(v, 1) for k, v in scores.items()},
            "matched_skills": matched_skills,
            "matched_keywords": matched_keywords
        }
    
    def _score_skills(self, job: Dict, resume: Dict) -> Dict[str, Any]:
        """Score based on skill matching."""
        resume_skills = set(s.lower() for s in resume.get("skills", []))
        
        # Extract skills from job description and requirements
        job_text = f"{job.get('title', '')} {job.get('description', '')} {' '.join(job.get('requirements', []))}"
        job_skills = self._extract_skills_from_text(job_text)
        
        if not job_skills:
            return {"score": 50, "matched": []}  # Neutral if no skills found
        
        matched = resume_skills & job_skills
        
        # Calculate score based on match percentage
        match_pct = len(matched) / len(job_skills) * 100 if job_skills else 0
        
        # Bonus for matching many skills
        if len(matched) >= 5:
            match_pct = min(100, match_pct + 10)
        
        return {
            "score": min(100, match_pct),
            "matched": list(matched)[:10]  # Return top 10 matched
        }
    
    def _score_role_match(self, job: Dict, resume: Dict, preferences: Dict) -> float:
        """Score based on role/title matching."""
        job_title = job.get("title", "").lower()
        
        # Check against preferred roles
        preferred_roles = [r.lower() for r in preferences.get("preferred_roles", [])]
        resume_roles = [r.lower() for r in resume.get("roles", [])]
        
        all_target_roles = set(preferred_roles + resume_roles)
        
        if not all_target_roles:
            return 50  # Neutral if no preferences
        
        # Check for exact or partial matches
        for role in all_target_roles:
            if role in job_title or job_title in role:
                return 100
            # Check for common words
            role_words = set(role.split())
            title_words = set(job_title.split())
            if role_words & title_words:
                return 75
        
        # Check for related roles
        role_families = {
            "engineer": ["developer", "programmer", "coder", "swe"],
            "developer": ["engineer", "programmer", "coder", "swe"],
            "manager": ["lead", "head", "director"],
            "analyst": ["scientist", "researcher"],
            "designer": ["ux", "ui", "creative"],
        }
        
        for family_key, family_members in role_families.items():
            if family_key in job_title:
                for role in all_target_roles:
                    if any(m in role for m in family_members):
                        return 60
        
        return 30  # Low match
    
    def _score_location(self, job: Dict, preferences: Dict) -> float:
        """Score based on location preferences."""
        job_location = job.get("location", "").lower()
        job_remote = job.get("remote_type", "unknown").lower()
        job_region = job.get("region", "").lower()
        
        remote_pref = preferences.get("remote_preference", "any").lower()
        preferred_locations = [l.lower() for l in preferences.get("preferred_locations", [])]
        preferred_regions = [r.lower() for r in preferences.get("preferred_regions", [])]
        
        # Remote preference matching
        if remote_pref == "remote":
            if job_remote == "remote":
                return 100
            elif job_remote == "hybrid":
                return 60
            else:
                return 30
        elif remote_pref == "onsite":
            if job_remote == "onsite":
                return 100
            elif job_remote == "hybrid":
                return 70
            else:
                return 40
        
        # Location matching
        if not preferred_locations and not preferred_regions:
            return 70  # Neutral-positive if no preference
        
        # Check region match
        if preferred_regions and job_region:
            if job_region in preferred_regions:
                return 90
        
        # Check location match
        for loc in preferred_locations:
            if loc in job_location or job_location in loc:
                return 100
        
        return 40
    
    def _score_seniority(self, job: Dict, resume: Dict, preferences: Dict) -> float:
        """Score based on seniority level matching."""
        job_seniority = job.get("seniority", "unknown").lower()
        job_title = job.get("title", "").lower()
        
        resume_years = resume.get("experience_years", 0)
        preferred_levels = [l.lower() for l in preferences.get("seniority_levels", [])]
        
        # Infer seniority from title if not specified
        if job_seniority == "unknown":
            job_seniority = self._infer_seniority(job_title)
        
        # Map seniority to expected years
        seniority_years = {
            "intern": (0, 1),
            "entry": (0, 2),
            "junior": (0, 3),
            "mid": (2, 6),
            "senior": (5, 15),
            "lead": (6, 20),
            "staff": (8, 25),
            "principal": (10, 30),
            "manager": (5, 20),
            "director": (10, 25),
            "vp": (15, 30),
            "executive": (15, 40)
        }
        
        # Check if seniority matches preferred levels
        if preferred_levels:
            if job_seniority in preferred_levels:
                return 100
            return 50
        
        # Match against experience years
        if job_seniority in seniority_years:
            min_years, max_years = seniority_years[job_seniority]
            if min_years <= resume_years <= max_years:
                return 90
            elif abs(resume_years - min_years) <= 2 or abs(resume_years - max_years) <= 2:
                return 70
            else:
                return 40
        
        return 60  # Neutral
    
    def _score_company(self, job: Dict, preferences: Dict) -> float:
        """Score based on company preferences."""
        company = job.get("company", "").lower()
        
        whitelist = [c.lower() for c in preferences.get("included_companies", [])]
        blacklist = [c.lower() for c in preferences.get("excluded_companies", [])]
        
        # Check blacklist first
        for blocked in blacklist:
            if blocked in company or company in blocked:
                return 0  # Completely exclude
        
        # Check whitelist
        for preferred in whitelist:
            if preferred in company or company in preferred:
                return 100  # High priority
        
        return 60  # Neutral
    
    def _score_keywords(self, job: Dict, resume: Dict, preferences: Dict) -> Dict[str, Any]:
        """Score based on keyword matching."""
        job_text = f"{job.get('title', '')} {job.get('description', '')}".lower()
        
        resume_keywords = set(k.lower() for k in resume.get("keywords", []))
        include_keywords = set(k.lower() for k in preferences.get("include_keywords", []))
        exclude_keywords = set(k.lower() for k in preferences.get("exclude_keywords", []))
        
        # Check exclusion keywords first
        for kw in exclude_keywords:
            if kw in job_text:
                return {"score": 0, "matched": []}
        
        # Check for matching keywords
        all_keywords = resume_keywords | include_keywords
        matched = []
        
        for kw in all_keywords:
            if kw in job_text:
                matched.append(kw)
        
        if not all_keywords:
            return {"score": 60, "matched": []}
        
        match_pct = len(matched) / len(all_keywords) * 100
        return {"score": min(100, match_pct), "matched": matched}
    
    def _score_freshness(self, job: Dict, preferences: Dict) -> float:
        """Score based on job posting date."""
        posted_at = job.get("posted_at", "")
        max_age_days = preferences.get("posted_within_days", 30)
        
        if not posted_at:
            return 50  # Neutral if no date
        
        try:
            if isinstance(posted_at, str):
                posted_date = datetime.fromisoformat(posted_at.replace('Z', '+00:00'))
            else:
                posted_date = posted_at
            
            age_days = (datetime.now(timezone.utc) - posted_date).days
            
            if age_days <= 1:
                return 100
            elif age_days <= 3:
                return 90
            elif age_days <= 7:
                return 80
            elif age_days <= max_age_days:
                return 60
            else:
                return 30
        except Exception:
            return 50
    
    def _extract_skills_from_text(self, text: str) -> Set[str]:
        """Extract skill keywords from text."""
        text = text.lower()
        
        # Common tech skills to look for
        common_skills = {
            # Programming languages
            "python", "java", "javascript", "typescript", "c++", "c#", "go", "golang",
            "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
            # Frontend
            "react", "vue", "angular", "svelte", "html", "css", "sass", "tailwind",
            # Backend
            "node", "nodejs", "django", "flask", "fastapi", "spring", "rails",
            "express", "nest", "graphql", "rest", "api",
            # Databases
            "sql", "mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch",
            "cassandra", "dynamodb", "oracle", "sqlite",
            # Cloud
            "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
            "terraform", "ansible", "jenkins", "ci/cd", "devops",
            # Data
            "machine learning", "ml", "deep learning", "ai", "data science",
            "pandas", "numpy", "tensorflow", "pytorch", "spark", "hadoop",
            # Other
            "git", "agile", "scrum", "jira", "linux", "unix", "bash",
            "microservices", "serverless", "lambda",
        }
        
        found = set()
        for skill in common_skills:
            if skill in text:
                found.add(skill)
        
        return found
    
    def _infer_seniority(self, title: str) -> str:
        """Infer seniority level from job title."""
        title = title.lower()
        
        if any(word in title for word in ["intern", "internship"]):
            return "intern"
        if any(word in title for word in ["junior", "jr", "entry", "associate"]):
            return "entry"
        if any(word in title for word in ["senior", "sr", "lead", "principal", "staff"]):
            if "principal" in title or "staff" in title:
                return "principal"
            if "lead" in title:
                return "lead"
            return "senior"
        if any(word in title for word in ["manager", "head"]):
            return "manager"
        if "director" in title:
            return "director"
        if any(word in title for word in ["vp", "vice president"]):
            return "vp"
        if any(word in title for word in ["cto", "ceo", "cfo", "chief"]):
            return "executive"
        
        return "mid"  # Default to mid-level


def rank_jobs(
    jobs: List[Dict[str, Any]],
    resume: Dict[str, Any],
    preferences: Dict[str, Any],
    ai_service=None
) -> List[Dict[str, Any]]:
    """
    Score and rank a list of jobs.
    Returns jobs sorted by score (highest first).
    """
    scorer = JobScoringService(ai_service)
    
    for job in jobs:
        result = scorer.score_job(job, resume, preferences)
        job["match_score"] = result["score"]
        job["score_breakdown"] = result["breakdown"]
        job["matched_skills"] = result["matched_skills"]
        job["matched_keywords"] = result["matched_keywords"]
    
    # Sort by score descending
    return sorted(jobs, key=lambda x: x["match_score"], reverse=True)
