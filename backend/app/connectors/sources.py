"""
Base Source Connector interface and implementations
"""
import os
import re
import json
import hashlib
import asyncio
from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import logging
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class BaseConnector(ABC):
    """Base class for job source connectors."""
    
    SOURCE_ID = "base"
    SOURCE_NAME = "Base Connector"
    SOURCE_TYPE = "api"  # api, browser, rss
    REGIONS = []
    REQUIRES_AUTH = False
    ROBOTS_COMPLIANT = True
    RATE_LIMIT_RPM = 60
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self._last_request_time = 0
        self._request_interval = 60.0 / self.RATE_LIMIT_RPM
    
    @abstractmethod
    async def search_jobs(
        self,
        query: str,
        location: str = "",
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search for jobs. Returns list of raw job data."""
        pass
    
    def normalize_job(self, raw_job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize raw job data to standard schema.
        Override in subclasses for source-specific normalization.
        """
        from app.models.schemas import generate_id, utc_now_iso
        
        return {
            "id": generate_id(),
            "source_id": self.SOURCE_ID,
            "source_name": self.SOURCE_NAME,
            "source_type": self.SOURCE_TYPE,
            "external_id": raw_job.get("id", ""),
            "canonical_url": raw_job.get("url", ""),
            "fingerprint": self._generate_fingerprint(raw_job),
            "company": raw_job.get("company", ""),
            "title": raw_job.get("title", ""),
            "location": raw_job.get("location", ""),
            "region": self._infer_region(raw_job.get("location", "")),
            "remote_type": self._infer_remote_type(raw_job),
            "seniority": self._infer_seniority(raw_job.get("title", "")),
            "description": raw_job.get("description", ""),
            "description_snippet": (raw_job.get("description", "") or "")[:500],
            "requirements": raw_job.get("requirements", []),
            "posted_at": raw_job.get("posted_at", ""),
            "scraped_at": utc_now_iso(),
            "salary_min": raw_job.get("salary_min"),
            "salary_max": raw_job.get("salary_max"),
            "salary_currency": raw_job.get("salary_currency", "USD"),
            "salary_text": raw_job.get("salary_text", ""),
            "job_url": raw_job.get("url", ""),
            "apply_url": raw_job.get("apply_url", raw_job.get("url", "")),
            "status": "new",
            "notes": "",
            "match_score": 0.0,
            "matched_skills": [],
            "matched_keywords": [],
            "score_breakdown": {},
        }
    
    def _generate_fingerprint(self, job: Dict[str, Any]) -> str:
        """Generate a fingerprint for deduplication."""
        key_parts = [
            job.get("company", "").lower().strip(),
            job.get("title", "").lower().strip(),
            job.get("location", "").lower().strip(),
        ]
        key_string = "|".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _infer_region(self, location: str) -> str:
        """Infer region from location string."""
        location = location.lower()
        
        # US states/cities
        us_indicators = [
            "usa", "united states", "u.s.", "america",
            "california", "new york", "texas", "washington", "massachusetts",
            "san francisco", "los angeles", "seattle", "boston", "nyc", "austin"
        ]
        if any(ind in location for ind in us_indicators):
            return "US"
        
        # UK
        uk_indicators = ["uk", "united kingdom", "london", "manchester", "birmingham", "england", "scotland"]
        if any(ind in location for ind in uk_indicators):
            return "UK"
        
        # EU
        eu_indicators = [
            "germany", "france", "netherlands", "spain", "italy", "poland",
            "berlin", "paris", "amsterdam", "munich", "barcelona"
        ]
        if any(ind in location for ind in eu_indicators):
            return "EU"
        
        # India
        india_indicators = ["india", "bangalore", "mumbai", "delhi", "hyderabad", "chennai", "pune"]
        if any(ind in location for ind in india_indicators):
            return "India"
        
        # Australia
        aus_indicators = ["australia", "sydney", "melbourne", "brisbane", "perth"]
        if any(ind in location for ind in aus_indicators):
            return "Australia"
        
        # SEA
        sea_indicators = ["singapore", "malaysia", "indonesia", "philippines", "thailand", "vietnam"]
        if any(ind in location for ind in sea_indicators):
            return "SEA"
        
        # Middle East
        me_indicators = ["uae", "dubai", "saudi", "qatar", "bahrain", "kuwait"]
        if any(ind in location for ind in me_indicators):
            return "Middle East"
        
        # Canada
        canada_indicators = ["canada", "toronto", "vancouver", "montreal", "calgary"]
        if any(ind in location for ind in canada_indicators):
            return "Canada"
        
        return "Global"
    
    def _infer_remote_type(self, job: Dict[str, Any]) -> str:
        """Infer remote work type from job data."""
        text = f"{job.get('title', '')} {job.get('location', '')} {job.get('description', '')}".lower()
        
        if "remote" in text and "hybrid" not in text:
            return "remote"
        if "hybrid" in text:
            return "hybrid"
        if "on-site" in text or "onsite" in text or "in-office" in text:
            return "onsite"
        
        return "unknown"
    
    def _infer_seniority(self, title: str) -> str:
        """Infer seniority from title."""
        title = title.lower()
        
        if any(word in title for word in ["intern", "internship"]):
            return "intern"
        if any(word in title for word in ["junior", "jr", "entry", "associate", "graduate"]):
            return "entry"
        if any(word in title for word in ["senior", "sr", "principal", "staff"]):
            if "principal" in title or "staff" in title:
                return "principal"
            return "senior"
        if any(word in title for word in ["lead", "team lead"]):
            return "lead"
        if any(word in title for word in ["manager", "head of"]):
            return "manager"
        if "director" in title:
            return "director"
        if any(word in title for word in ["vp", "vice president"]):
            return "vp"
        if any(word in title for word in ["cto", "ceo", "cfo", "chief"]):
            return "executive"
        
        return "mid"
    
    async def _rate_limit(self):
        """Enforce rate limiting."""
        import time
        now = time.time()
        elapsed = now - self._last_request_time
        if elapsed < self._request_interval:
            await asyncio.sleep(self._request_interval - elapsed)
        self._last_request_time = time.time()


# ==================== API-BASED CONNECTORS ====================

class RemotiveConnector(BaseConnector):
    """
    Remotive.io API connector - free public API for remote jobs.
    https://remotive.io/api/remote-jobs
    """
    
    SOURCE_ID = "remotive"
    SOURCE_NAME = "Remotive"
    SOURCE_TYPE = "api"
    REGIONS = ["Global"]
    REQUIRES_AUTH = False
    ROBOTS_COMPLIANT = True
    RATE_LIMIT_RPM = 30
    
    BASE_URL = "https://remotive.io/api/remote-jobs"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        category: str = "",
        limit: int = 50,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Remotive for remote jobs."""
        await self._rate_limit()
        
        params = {}
        if category:
            params["category"] = category
        if query:
            params["search"] = query
        if limit:
            params["limit"] = limit
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.BASE_URL, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                jobs = data.get("jobs", [])
                return [self.normalize_job(job) for job in jobs]
            except Exception as e:
                logger.error(f"Remotive API error: {e}")
                return []
    
    def normalize_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        job = super().normalize_job({
            "id": str(raw.get("id", "")),
            "url": raw.get("url", ""),
            "company": raw.get("company_name", ""),
            "title": raw.get("title", ""),
            "location": raw.get("candidate_required_location", "Worldwide"),
            "description": raw.get("description", ""),
            "posted_at": raw.get("publication_date", ""),
            "salary_text": raw.get("salary", ""),
        })
        job["remote_type"] = "remote"  # All Remotive jobs are remote
        job["apply_url"] = raw.get("url", "")
        return job


class ArbeitNowConnector(BaseConnector):
    """
    Arbeitnow API connector - free public API for EU/German jobs.
    https://www.arbeitnow.com/api/job-board-api
    """
    
    SOURCE_ID = "arbeitnow"
    SOURCE_NAME = "Arbeitnow"
    SOURCE_TYPE = "api"
    REGIONS = ["EU", "Germany"]
    REQUIRES_AUTH = False
    ROBOTS_COMPLIANT = True
    RATE_LIMIT_RPM = 30
    
    BASE_URL = "https://www.arbeitnow.com/api/job-board-api"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        page: int = 1,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Arbeitnow for jobs."""
        await self._rate_limit()
        
        params = {"page": page}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.BASE_URL, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                jobs = data.get("data", [])
                normalized = []
                for job in jobs:
                    # Filter by query if provided
                    if query:
                        job_text = f"{job.get('title', '')} {job.get('company_name', '')} {job.get('description', '')}".lower()
                        if query.lower() not in job_text:
                            continue
                    normalized.append(self.normalize_job(job))
                
                return normalized
            except Exception as e:
                logger.error(f"Arbeitnow API error: {e}")
                return []
    
    def normalize_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        return super().normalize_job({
            "id": str(raw.get("slug", "")),
            "url": raw.get("url", ""),
            "company": raw.get("company_name", ""),
            "title": raw.get("title", ""),
            "location": raw.get("location", ""),
            "description": raw.get("description", ""),
            "posted_at": raw.get("created_at", ""),
            "apply_url": raw.get("url", ""),
        })


class JobsGovConnector(BaseConnector):
    """
    USAJobs.gov API connector for US government jobs.
    https://developer.usajobs.gov/
    """
    
    SOURCE_ID = "usajobs"
    SOURCE_NAME = "USAJobs.gov"
    SOURCE_TYPE = "api"
    REGIONS = ["US"]
    REQUIRES_AUTH = True  # Requires API key
    ROBOTS_COMPLIANT = True
    RATE_LIMIT_RPM = 60
    
    BASE_URL = "https://data.usajobs.gov/api/Search"
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.api_key = config.get("api_key") if config else None
        self.email = config.get("email") if config else None
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        page: int = 1,
        results_per_page: int = 50,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search USAJobs for government positions."""
        if not self.api_key or not self.email:
            logger.warning("USAJobs requires API key and email")
            return []
        
        await self._rate_limit()
        
        headers = {
            "Authorization-Key": self.api_key,
            "User-Agent": self.email
        }
        
        params = {
            "Page": page,
            "ResultsPerPage": results_per_page
        }
        if query:
            params["Keyword"] = query
        if location:
            params["LocationName"] = location
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    self.BASE_URL,
                    headers=headers,
                    params=params,
                    timeout=30
                )
                response.raise_for_status()
                data = response.json()
                
                jobs = data.get("SearchResult", {}).get("SearchResultItems", [])
                return [self.normalize_job(job.get("MatchedObjectDescriptor", {})) for job in jobs]
            except Exception as e:
                logger.error(f"USAJobs API error: {e}")
                return []
    
    def normalize_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        position = raw.get("PositionTitle", "")
        org = raw.get("OrganizationName", "")
        locations = raw.get("PositionLocationDisplay", "")
        
        salary_min = None
        salary_max = None
        remuneration = raw.get("PositionRemuneration", [])
        if remuneration:
            salary_min = remuneration[0].get("MinimumRange")
            salary_max = remuneration[0].get("MaximumRange")
            if salary_min:
                try:
                    salary_min = int(float(salary_min))
                except:
                    salary_min = None
            if salary_max:
                try:
                    salary_max = int(float(salary_max))
                except:
                    salary_max = None
        
        return super().normalize_job({
            "id": raw.get("PositionID", ""),
            "url": raw.get("PositionURI", ""),
            "company": org,
            "title": position,
            "location": locations,
            "description": raw.get("UserArea", {}).get("Details", {}).get("MajorDuties", [""])[0] if raw.get("UserArea") else "",
            "posted_at": raw.get("PublicationStartDate", ""),
            "salary_min": salary_min,
            "salary_max": salary_max,
            "salary_currency": "USD",
        })


# ==================== RSS/PUBLIC FEED CONNECTORS ====================

class HackerNewsJobsConnector(BaseConnector):
    """
    HackerNews Jobs connector using the public API.
    """
    
    SOURCE_ID = "hackernews_jobs"
    SOURCE_NAME = "HackerNews Jobs"
    SOURCE_TYPE = "api"
    REGIONS = ["Global", "US"]
    REQUIRES_AUTH = False
    ROBOTS_COMPLIANT = True
    RATE_LIMIT_RPM = 30
    
    async def search_jobs(
        self,
        query: str = "",
        limit: int = 50,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Fetch HN job posts."""
        await self._rate_limit()
        
        async with httpx.AsyncClient() as client:
            try:
                # Get job stories
                response = await client.get(
                    "https://hacker-news.firebaseio.com/v0/jobstories.json",
                    timeout=30
                )
                response.raise_for_status()
                job_ids = response.json()[:limit]
                
                jobs = []
                for job_id in job_ids[:limit]:
                    try:
                        item_response = await client.get(
                            f"https://hacker-news.firebaseio.com/v0/item/{job_id}.json",
                            timeout=10
                        )
                        item = item_response.json()
                        if item and item.get("type") == "job":
                            # Filter by query if provided
                            if query:
                                item_text = f"{item.get('title', '')} {item.get('text', '')}".lower()
                                if query.lower() not in item_text:
                                    continue
                            jobs.append(self.normalize_job(item))
                    except Exception as e:
                        logger.debug(f"Failed to fetch HN item {job_id}: {e}")
                
                return jobs
            except Exception as e:
                logger.error(f"HackerNews API error: {e}")
                return []
    
    def normalize_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        title = raw.get("title", "")
        text = raw.get("text", "")
        
        # Parse company from title (usually "Company Name - Position")
        company = ""
        job_title = title
        if " - " in title:
            parts = title.split(" - ", 1)
            company = parts[0].strip()
            job_title = parts[1].strip() if len(parts) > 1 else title
        
        return super().normalize_job({
            "id": str(raw.get("id", "")),
            "url": raw.get("url", f"https://news.ycombinator.com/item?id={raw.get('id', '')}"),
            "company": company,
            "title": job_title,
            "location": "Remote",  # HN jobs are typically remote
            "description": text,
            "posted_at": datetime.fromtimestamp(raw.get("time", 0), timezone.utc).isoformat() if raw.get("time") else "",
        })


# ==================== CONNECTOR REGISTRY ====================

CONNECTORS = {
    "remotive": RemotiveConnector,
    "arbeitnow": ArbeitNowConnector,
    "usajobs": JobsGovConnector,
    "hackernews_jobs": HackerNewsJobsConnector,
}


def get_connector(source_id: str, config: Dict[str, Any] = None) -> Optional[BaseConnector]:
    """Get a connector instance by ID."""
    connector_class = CONNECTORS.get(source_id)
    if connector_class:
        return connector_class(config)
    return None


def get_all_connectors() -> List[Dict[str, Any]]:
    """Get metadata for all available connectors."""
    return [
        {
            "id": conn.SOURCE_ID,
            "name": conn.SOURCE_NAME,
            "type": conn.SOURCE_TYPE,
            "regions": conn.REGIONS,
            "requires_auth": conn.REQUIRES_AUTH,
            "robots_compliant": conn.ROBOTS_COMPLIANT
        }
        for conn in CONNECTORS.values()
    ]
