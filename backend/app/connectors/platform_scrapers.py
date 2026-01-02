"""
Platform-specific scrapers for top 10 job platforms
Production-grade implementation with error handling and rate limiting
"""
import logging
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from app.connectors.browser_scraper import BrowserScraper
from app.models.schemas import generate_id, utc_now_iso

logger = logging.getLogger(__name__)


class LinkedInScraper(BrowserScraper):
    """
    LinkedIn job scraper - searches public job listings
    """
    SOURCE_ID = "linkedin"
    SOURCE_NAME = "LinkedIn"
    REGIONS = ["Global", "US", "UK", "India", "UAE", "Canada", "Germany"]
    RATE_LIMIT_RPM = 15
    
    BASE_URL = "https://www.linkedin.com/jobs/search"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 25,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search LinkedIn for jobs"""
        if not await self._check_robots_txt(self.BASE_URL):
            logger.warning("LinkedIn robots.txt check failed")
            return []
        
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            params = []
            if query:
                params.append(f"keywords={query}")
            if location:
                params.append(f"location={location}")
            
            url = f"{self.BASE_URL}?{' &'.join(params)}" if params else self.BASE_URL
            
            logger.info(f"Scraping LinkedIn: {url}")
            await page.goto(url, wait_until='networkidle', timeout=30000)
            await self._wait_random(2, 4)
            
            # Extract job cards
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            job_cards = soup.select('div.base-card')[:limit]
            
            for card in job_cards:
                try:
                    title_elem = card.select_one('h3.base-search-card__title')
                    company_elem = card.select_one('h4.base-search-card__subtitle')
                    location_elem = card.select_one('span.job-search-card__location')
                    link_elem = card.select_one('a.base-card__full-link')
                    
                    if not title_elem or not company_elem:
                        continue
                    
                    job_data = {
                        "title": self._clean_text(title_elem.get_text()),
                        "company": self._clean_text(company_elem.get_text()),
                        "location": self._clean_text(location_elem.get_text()) if location_elem else location,
                        "url": link_elem.get('href', '') if link_elem else '',
                        "description": f"Job at {company_elem.get_text()} - {title_elem.get_text()}",
                        "posted_at": utc_now_iso(),
                    }
                    
                    jobs.append(self.normalize_job(job_data))
                except Exception as e:
                    logger.debug(f"Error parsing LinkedIn job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Found {len(jobs)} jobs on LinkedIn")
            return jobs
            
        except Exception as e:
            logger.error(f"LinkedIn scraping error: {e}")
            return []


class IndeedScraper(BrowserScraper):
    """
    Indeed job scraper - multi-region support
    """
    SOURCE_ID = "indeed"
    SOURCE_NAME = "Indeed"
    REGIONS = ["US", "UK", "India", "Canada", "Germany"]
    RATE_LIMIT_RPM = 20
    
    REGION_DOMAINS = {
        "US": "indeed.com",
        "UK": "indeed.co.uk",
        "India": "indeed.co.in",
        "Canada": "indeed.ca",
        "Germany": "de.indeed.com",
    }
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        region: str = "US",
        limit: int = 25,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Indeed for jobs"""
        domain = self.REGION_DOMAINS.get(region, "indeed.com")
        base_url = f"https://{domain}/jobs"
        
        if not await self._check_robots_txt(base_url):
            logger.warning(f"Indeed {region} robots.txt check failed")
            return []
        
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            params = []
            if query:
                params.append(f"q={query}")
            if location:
                params.append(f"l={location}")
            
            url = f"{base_url}?{'&'.join(params)}" if params else base_url
            
            logger.info(f"Scraping Indeed {region}: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(2, 4)
            
            # Extract job cards
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            
            # Indeed uses multiple card formats
            job_cards = soup.select('div.job_seen_beacon, div.jobsearch-SerpJobCard, td.resultContent')[:limit]
            
            for card in job_cards:
                try:
                    # Try multiple selector patterns
                    title_elem = (
                        card.select_one('h2.jobTitle span') or 
                        card.select_one('a.jcs-JobTitle') or
                        card.select_one('h2 a')
                    )
                    
                    company_elem = (
                        card.select_one('span.companyName') or
                        card.select_one('span[data-testid="company-name"]')
                    )
                    
                    location_elem = (
                        card.select_one('div.companyLocation') or
                        card.select_one('div[data-testid="text-location"]')
                    )
                    
                    snippet_elem = card.select_one('div.job-snippet, div.summary')
                    
                    if not title_elem or not company_elem:
                        continue
                    
                    # Get job URL
                    job_link = card.select_one('a[data-jk], a.jcs-JobTitle')
                    job_url = ""
                    if job_link and job_link.get('href'):
                        job_url = f"https://{domain}{job_link['href']}"
                    
                    job_data = {
                        "title": self._clean_text(title_elem.get_text()),
                        "company": self._clean_text(company_elem.get_text()),
                        "location": self._clean_text(location_elem.get_text()) if location_elem else location,
                        "url": job_url,
                        "description": self._clean_text(snippet_elem.get_text()) if snippet_elem else "",
                        "posted_at": utc_now_iso(),
                    }
                    
                    jobs.append(self.normalize_job(job_data))
                except Exception as e:
                    logger.debug(f"Error parsing Indeed job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Found {len(jobs)} jobs on Indeed {region}")
            return jobs
            
        except Exception as e:
            logger.error(f"Indeed scraping error: {e}")
            return []


class NaukriScraper(BrowserScraper):
    """
    Naukri.com scraper - India's largest job portal
    """
    SOURCE_ID = "naukri"
    SOURCE_NAME = "Naukri.com"
    REGIONS = ["India"]
    RATE_LIMIT_RPM = 15
    
    BASE_URL = "https://www.naukri.com"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 25,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Naukri.com for jobs"""
        if not await self._check_robots_txt(self.BASE_URL):
            logger.warning("Naukri robots.txt check failed")
            return []
        
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            search_path = f"{query}-jobs" if query else "jobs"
            if location:
                search_path += f"-in-{location}"
            
            url = f"{self.BASE_URL}/{search_path}"
            
            logger.info(f"Scraping Naukri: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(3, 5)
            
            # Extract job cards
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            job_cards = soup.select('article.jobTuple, div.jobTuple')[:limit]
            
            for card in job_cards:
                try:
                    title_elem = card.select_one('a.title')
                    company_elem = card.select_one('a.subTitle')
                    exp_elem = card.select_one('span.expwdth')
                    loc_elem = card.select_one('span.locWdth')
                    salary_elem = card.select_one('span.salaryWdth')
                    desc_elem = card.select_one('div.job-description')
                    
                    if not title_elem or not company_elem:
                        continue
                    
                    job_url = title_elem.get('href', '')
                    if job_url and not job_url.startswith('http'):
                        job_url = f"{self.BASE_URL}{job_url}"
                    
                    job_data = {
                        "title": self._clean_text(title_elem.get_text()),
                        "company": self._clean_text(company_elem.get_text()),
                        "location": self._clean_text(loc_elem.get_text()) if loc_elem else location,
                        "url": job_url,
                        "description": self._clean_text(desc_elem.get_text()) if desc_elem else "",
                        "posted_at": utc_now_iso(),
                    }
                    
                    # Extract salary if present
                    if salary_elem:
                        salary_text = self._clean_text(salary_elem.get_text())
                        salary_info = self._extract_salary(salary_text)
                        job_data.update(salary_info)
                    
                    jobs.append(self.normalize_job(job_data))
                except Exception as e:
                    logger.debug(f"Error parsing Naukri job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Found {len(jobs)} jobs on Naukri")
            return jobs
            
        except Exception as e:
            logger.error(f"Naukri scraping error: {e}")
            return []


class GlassdoorScraper(BrowserScraper):
    """
    Glassdoor job scraper
    """
    SOURCE_ID = "glassdoor"
    SOURCE_NAME = "Glassdoor"
    REGIONS = ["Global", "US", "UK", "India", "Canada", "Germany"]
    RATE_LIMIT_RPM = 10  # More conservative due to anti-bot measures
    
    BASE_URL = "https://www.glassdoor.com/Job/jobs.htm"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 20,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Glassdoor for jobs"""
        if not await self._check_robots_txt(self.BASE_URL):
            logger.warning("Glassdoor robots.txt check failed")
            return []
        
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            params = []
            if query:
                params.append(f"sc.keyword={query}")
            if location:
                params.append(f"locT=C&locId=&loc={location}")
            
            url = f"{self.BASE_URL}?{'&'.join(params)}" if params else self.BASE_URL
            
            logger.info(f"Scraping Glassdoor: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(3, 6)
            
            # Glassdoor often requires interaction
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            job_cards = soup.select('li[data-test="jobListing"], div[data-test="job-listing"]')[:limit]
            
            for card in job_cards:
                try:
                    title_elem = card.select_one('a[data-test="job-title"]')
                    company_elem = card.select_one('span[data-test="employer-name"]')
                    location_elem = card.select_one('span[data-test="location"]')
                    salary_elem = card.select_one('span[data-test="detailSalary"]')
                    
                    if not title_elem or not company_elem:
                        continue
                    
                    job_url = title_elem.get('href', '')
                    if job_url and not job_url.startswith('http'):
                        job_url = f"https://www.glassdoor.com{job_url}"
                    
                    job_data = {
                        "title": self._clean_text(title_elem.get_text()),
                        "company": self._clean_text(company_elem.get_text()),
                        "location": self._clean_text(location_elem.get_text()) if location_elem else location,
                        "url": job_url,
                        "description": "",
                        "posted_at": utc_now_iso(),
                    }
                    
                    if salary_elem:
                        salary_text = self._clean_text(salary_elem.get_text())
                        salary_info = self._extract_salary(salary_text)
                        job_data.update(salary_info)
                    
                    jobs.append(self.normalize_job(job_data))
                except Exception as e:
                    logger.debug(f"Error parsing Glassdoor job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Found {len(jobs)} jobs on Glassdoor")
            return jobs
            
        except Exception as e:
            logger.error(f"Glassdoor scraping error: {e}")
            return []


class MonsterScraper(BrowserScraper):
    """
    Monster job scraper - multi-region
    """
    SOURCE_ID = "monster"
    SOURCE_NAME = "Monster"
    REGIONS = ["US", "UK", "India", "Canada", "Germany"]
    RATE_LIMIT_RPM = 20
    
    REGION_DOMAINS = {
        "US": "monster.com",
        "UK": "monster.co.uk",
        "India": "monsterindia.com",
        "Canada": "monster.ca",
        "Germany": "monster.de",
    }
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        region: str = "US",
        limit: int = 25,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Monster for jobs"""
        domain = self.REGION_DOMAINS.get(region, "monster.com")
        base_url = f"https://www.{domain}/jobs/search"
        
        if not await self._check_robots_txt(base_url):
            logger.warning(f"Monster {region} robots.txt check failed")
            return []
        
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            params = []
            if query:
                params.append(f"q={query}")
            if location:
                params.append(f"where={location}")
            
            url = f"{base_url}?{'&'.join(params)}" if params else base_url
            
            logger.info(f"Scraping Monster {region}: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(2, 4)
            
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            job_cards = soup.select('div.job-card, article[data-test-id="jobCard"]')[:limit]
            
            for card in job_cards:
                try:
                    title_elem = card.select_one('h2.job-title a, a.job-title')
                    company_elem = card.select_one('div.company, span.company-name')
                    location_elem = card.select_one('div.location, span.location')
                    
                    if not title_elem or not company_elem:
                        continue
                    
                    job_url = title_elem.get('href', '')
                    if job_url and not job_url.startswith('http'):
                        job_url = f"https://www.{domain}{job_url}"
                    
                    job_data = {
                        "title": self._clean_text(title_elem.get_text()),
                        "company": self._clean_text(company_elem.get_text()),
                        "location": self._clean_text(location_elem.get_text()) if location_elem else location,
                        "url": job_url,
                        "description": "",
                        "posted_at": utc_now_iso(),
                    }
                    
                    jobs.append(self.normalize_job(job_data))
                except Exception as e:
                    logger.debug(f"Error parsing Monster job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Found {len(jobs)} jobs on Monster {region}")
            return jobs
            
        except Exception as e:
            logger.error(f"Monster scraping error: {e}")
            return []


class ShineScraper(BrowserScraper):
    """
    Shine.com scraper - India
    """
    SOURCE_ID = "shine"
    SOURCE_NAME = "Shine.com"
    REGIONS = ["India"]
    RATE_LIMIT_RPM = 15
    
    BASE_URL = "https://www.shine.com/job-search"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 25,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Shine.com for jobs"""
        if not await self._check_robots_txt(self.BASE_URL):
            logger.warning("Shine robots.txt check failed")
            return []
        
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            search_path = self.BASE_URL
            if query:
                search_path += f"/{query}-jobs"
            if location:
                search_path += f"-in-{location}"
            
            logger.info(f"Scraping Shine: {search_path}")
            await page.goto(search_path, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(2, 4)
            
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            job_cards = soup.select('div.jb_list, li.job-card')[:limit]
            
            for card in job_cards:
                try:
                    title_elem = card.select_one('h3 a, a.job-title')
                    company_elem = card.select_one('span.company-name, div.company')
                    location_elem = card.select_one('span.location, div.job-location')
                    
                    if not title_elem:
                        continue
                    
                    job_url = title_elem.get('href', '')
                    if job_url and not job_url.startswith('http'):
                        job_url = f"https://www.shine.com{job_url}"
                    
                    job_data = {
                        "title": self._clean_text(title_elem.get_text()),
                        "company": self._clean_text(company_elem.get_text()) if company_elem else "Unknown",
                        "location": self._clean_text(location_elem.get_text()) if location_elem else location,
                        "url": job_url,
                        "description": "",
                        "posted_at": utc_now_iso(),
                    }
                    
                    jobs.append(self.normalize_job(job_data))
                except Exception as e:
                    logger.debug(f"Error parsing Shine job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Found {len(jobs)} jobs on Shine")
            return jobs
            
        except Exception as e:
            logger.error(f"Shine scraping error: {e}")
            return []


class BaytScraper(BrowserScraper):
    """
    Bayt.com scraper - Middle East/UAE
    """
    SOURCE_ID = "bayt"
    SOURCE_NAME = "Bayt"
    REGIONS = ["UAE", "Middle East"]
    RATE_LIMIT_RPM = 15
    
    BASE_URL = "https://www.bayt.com/en/jobs"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 25,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Bayt.com for jobs"""
        if not await self._check_robots_txt(self.BASE_URL):
            logger.warning("Bayt robots.txt check failed")
            return []
        
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            params = []
            if query:
                params.append(f"q={query}")
            if location:
                params.append(f"location={location}")
            
            url = f"{self.BASE_URL}?{'&'.join(params)}" if params else self.BASE_URL
            
            logger.info(f"Scraping Bayt: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(2, 4)
            
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            job_cards = soup.select('li.card, div.job-card')[:limit]
            
            for card in job_cards:
                try:
                    title_elem = card.select_one('h2 a, a.job-title')
                    company_elem = card.select_one('b.company-name, span.company')
                    location_elem = card.select_one('span.location')
                    
                    if not title_elem:
                        continue
                    
                    job_url = title_elem.get('href', '')
                    if job_url and not job_url.startswith('http'):
                        job_url = f"https://www.bayt.com{job_url}"
                    
                    job_data = {
                        "title": self._clean_text(title_elem.get_text()),
                        "company": self._clean_text(company_elem.get_text()) if company_elem else "Unknown",
                        "location": self._clean_text(location_elem.get_text()) if location_elem else location,
                        "url": job_url,
                        "description": "",
                        "posted_at": utc_now_iso(),
                    }
                    
                    jobs.append(self.normalize_job(job_data))
                except Exception as e:
                    logger.debug(f"Error parsing Bayt job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Found {len(jobs)} jobs on Bayt")
            return jobs
            
        except Exception as e:
            logger.error(f"Bayt scraping error: {e}")
            return []


class StepStoneScraper(BrowserScraper):
    """
    StepStone scraper - Germany
    """
    SOURCE_ID = "stepstone"
    SOURCE_NAME = "StepStone"
    REGIONS = ["Germany"]
    RATE_LIMIT_RPM = 15
    
    BASE_URL = "https://www.stepstone.de/jobs"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 25,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search StepStone for jobs"""
        if not await self._check_robots_txt(self.BASE_URL):
            logger.warning("StepStone robots.txt check failed")
            return []
        
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            params = []
            if query:
                params.append(f"what={query}")
            if location:
                params.append(f"where={location}")
            
            url = f"{self.BASE_URL}?{'&'.join(params)}" if params else self.BASE_URL
            
            logger.info(f"Scraping StepStone: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(2, 4)
            
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            job_cards = soup.select('article[data-at="job-item"]')[:limit]
            
            for card in job_cards:
                try:
                    title_elem = card.select_one('a[data-at="job-item-title"]')
                    company_elem = card.select_one('[data-at="job-item-company-name"]')
                    location_elem = card.select_one('[data-at="job-item-location"]')
                    
                    if not title_elem:
                        continue
                    
                    job_url = title_elem.get('href', '')
                    if job_url and not job_url.startswith('http'):
                        job_url = f"https://www.stepstone.de{job_url}"
                    
                    job_data = {
                        "title": self._clean_text(title_elem.get_text()),
                        "company": self._clean_text(company_elem.get_text()) if company_elem else "Unknown",
                        "location": self._clean_text(location_elem.get_text()) if location_elem else location,
                        "url": job_url,
                        "description": "",
                        "posted_at": utc_now_iso(),
                    }
                    
                    jobs.append(self.normalize_job(job_data))
                except Exception as e:
                    logger.debug(f"Error parsing StepStone job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Found {len(jobs)} jobs on StepStone")
            return jobs
            
        except Exception as e:
            logger.error(f"StepStone scraping error: {e}")
            return []


class TotalJobsScraper(BrowserScraper):
    """
    Totaljobs scraper - UK
    """
    SOURCE_ID = "totaljobs"
    SOURCE_NAME = "Totaljobs"
    REGIONS = ["UK"]
    RATE_LIMIT_RPM = 15
    
    BASE_URL = "https://www.totaljobs.com/jobs"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 25,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Totaljobs for jobs"""
        if not await self._check_robots_txt(self.BASE_URL):
            logger.warning("Totaljobs robots.txt check failed")
            return []
        
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            params = []
            if query:
                params.append(f"keywords={query}")
            if location:
                params.append(f"location={location}")
            
            url = f"{self.BASE_URL}?{'&'.join(params)}" if params else self.BASE_URL
            
            logger.info(f"Scraping Totaljobs: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(2, 4)
            
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            job_cards = soup.select('div.job, div.job-item')[:limit]
            
            for card in job_cards:
                try:
                    title_elem = card.select_one('h2 a, a.job-title')
                    company_elem = card.select_one('div.company, span.company')
                    location_elem = card.select_one('div.location, span.location')
                    salary_elem = card.select_one('div.salary, span.salary')
                    
                    if not title_elem:
                        continue
                    
                    job_url = title_elem.get('href', '')
                    if job_url and not job_url.startswith('http'):
                        job_url = f"https://www.totaljobs.com{job_url}"
                    
                    job_data = {
                        "title": self._clean_text(title_elem.get_text()),
                        "company": self._clean_text(company_elem.get_text()) if company_elem else "Unknown",
                        "location": self._clean_text(location_elem.get_text()) if location_elem else location,
                        "url": job_url,
                        "description": "",
                        "posted_at": utc_now_iso(),
                    }
                    
                    if salary_elem:
                        salary_text = self._clean_text(salary_elem.get_text())
                        salary_info = self._extract_salary(salary_text)
                        job_data.update(salary_info)
                    
                    jobs.append(self.normalize_job(job_data))
                except Exception as e:
                    logger.debug(f"Error parsing Totaljobs job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Found {len(jobs)} jobs on Totaljobs")
            return jobs
            
        except Exception as e:
            logger.error(f"Totaljobs scraping error: {e}")
            return []


class ZipRecruiterScraper(BrowserScraper):
    """
    ZipRecruiter scraper - US
    """
    SOURCE_ID = "ziprecruiter"
    SOURCE_NAME = "ZipRecruiter"
    REGIONS = ["US"]
    RATE_LIMIT_RPM = 15
    
    BASE_URL = "https://www.ziprecruiter.com/jobs-search"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 25,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search ZipRecruiter for jobs"""
        if not await self._check_robots_txt(self.BASE_URL):
            logger.warning("ZipRecruiter robots.txt check failed")
            return []
        
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            params = []
            if query:
                params.append(f"search={query}")
            if location:
                params.append(f"location={location}")
            
            url = f"{self.BASE_URL}?{'&'.join(params)}" if params else self.BASE_URL
            
            logger.info(f"Scraping ZipRecruiter: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(2, 4)
            
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            job_cards = soup.select('div.job_content, article.job-card')[:limit]
            
            for card in job_cards:
                try:
                    title_elem = card.select_one('h2 a, a.job-title')
                    company_elem = card.select_one('a.company-name, span.company')
                    location_elem = card.select_one('span.location, div.location')
                    
                    if not title_elem:
                        continue
                    
                    job_url = title_elem.get('href', '')
                    if job_url and not job_url.startswith('http'):
                        job_url = f"https://www.ziprecruiter.com{job_url}"
                    
                    job_data = {
                        "title": self._clean_text(title_elem.get_text()),
                        "company": self._clean_text(company_elem.get_text()) if company_elem else "Unknown",
                        "location": self._clean_text(location_elem.get_text()) if location_elem else location,
                        "url": job_url,
                        "description": "",
                        "posted_at": utc_now_iso(),
                    }
                    
                    jobs.append(self.normalize_job(job_data))
                except Exception as e:
                    logger.debug(f"Error parsing ZipRecruiter job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Found {len(jobs)} jobs on ZipRecruiter")
            return jobs
            
        except Exception as e:
            logger.error(f"ZipRecruiter scraping error: {e}")
            return []


# Registry of all platform scrapers
PLATFORM_SCRAPERS = {
    "linkedin": LinkedInScraper,
    "indeed": IndeedScraper,
    "naukri": NaukriScraper,
    "glassdoor": GlassdoorScraper,
    "monster": MonsterScraper,
    "shine": ShineScraper,
    "bayt": BaytScraper,
    "stepstone": StepStoneScraper,
    "totaljobs": TotalJobsScraper,
    "ziprecruiter": ZipRecruiterScraper,
}


def get_scraper(platform_id: str, config: Dict[str, Any] = None):
    """Get a scraper instance by platform ID"""
    scraper_class = PLATFORM_SCRAPERS.get(platform_id)
    if not scraper_class:
        raise ValueError(f"Unknown platform: {platform_id}")
    return scraper_class(config)
