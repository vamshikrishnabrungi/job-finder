"""
Enhanced scrapers for LinkedIn (Jobs + Posts), Wellfound, and Naukri
Focus on comprehensive job discovery from these priority platforms
"""
import logging
import re
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta
from app.connectors.browser_scraper import BrowserScraper
from app.models.schemas import generate_id, utc_now_iso

logger = logging.getLogger(__name__)


class LinkedInJobsScraper(BrowserScraper):
    """
    Enhanced LinkedIn Jobs scraper with better parsing
    Focuses on LinkedIn's public job board
    """
    SOURCE_ID = "linkedin_jobs"
    SOURCE_NAME = "LinkedIn Jobs"
    REGIONS = ["Global", "US", "UK", "India", "UAE", "Canada", "Germany"]
    RATE_LIMIT_RPM = 10  # Conservative for LinkedIn
    
    BASE_URL = "https://www.linkedin.com/jobs/search"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 50,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search LinkedIn Jobs with enhanced parsing"""
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL with better parameters
            params = []
            if query:
                params.append(f"keywords={query.replace(' ', '%20')}")
            if location:
                params.append(f"location={location.replace(' ', '%20')}")
            params.append("f_TPR=r604800")  # Past week
            params.append("sortBy=DD")  # Sort by date
            
            url = f"{self.BASE_URL}?{'&'.join(params)}"
            
            logger.info(f"Scraping LinkedIn Jobs: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(3, 5)
            
            # Scroll to load more jobs
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await self._wait_random(2, 3)
            
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            
            # Try multiple selector patterns for job cards
            job_cards = (
                soup.select('div.base-card') or
                soup.select('li.jobs-search__results-list') or
                soup.select('div.job-search-card') or
                soup.select('[data-job-id]')
            )
            
            logger.info(f"Found {len(job_cards)} job cards on LinkedIn")
            
            for card in job_cards[:limit]:
                try:
                    # Multiple selector attempts for each field
                    title_elem = (
                        card.select_one('h3.base-search-card__title') or
                        card.select_one('a.job-card-list__title') or
                        card.select_one('h3.job-card-title') or
                        card.select_one('[class*="title"]')
                    )
                    
                    company_elem = (
                        card.select_one('h4.base-search-card__subtitle') or
                        card.select_one('a.job-card-container__company-name') or
                        card.select_one('h4.job-card-company-name') or
                        card.select_one('[class*="company"]')
                    )
                    
                    location_elem = (
                        card.select_one('span.job-search-card__location') or
                        card.select_one('span.job-card-location') or
                        card.select_one('[class*="location"]')
                    )
                    
                    link_elem = (
                        card.select_one('a.base-card__full-link') or
                        card.select_one('a[href*="/jobs/view/"]') or
                        card.find('a', href=True)
                    )
                    
                    time_elem = (
                        card.select_one('time') or
                        card.select_one('[class*="time"]') or
                        card.select_one('[class*="date"]')
                    )
                    
                    if not title_elem:
                        continue
                    
                    title = self._clean_text(title_elem.get_text())
                    company = self._clean_text(company_elem.get_text()) if company_elem else "Unknown Company"
                    job_location = self._clean_text(location_elem.get_text()) if location_elem else location
                    
                    # Get job URL
                    job_url = ""
                    if link_elem and link_elem.get('href'):
                        job_url = link_elem['href']
                        if not job_url.startswith('http'):
                            job_url = f"https://www.linkedin.com{job_url}"
                        # Clean tracking parameters
                        job_url = job_url.split('?')[0]
                    
                    # Extract job ID from URL or data attribute
                    job_id = card.get('data-job-id', '')
                    if not job_id and job_url:
                        match = re.search(r'/jobs/view/(\d+)', job_url)
                        if match:
                            job_id = match.group(1)
                    
                    # Get posting time
                    posted_at = utc_now_iso()
                    if time_elem:
                        time_text = self._clean_text(time_elem.get_text())
                        posted_at = self._parse_relative_time(time_text)
                    
                    # Get snippet/description
                    snippet_elem = card.select_one('.job-card-snippet') or card.select_one('[class*="snippet"]')
                    description = self._clean_text(snippet_elem.get_text()) if snippet_elem else f"{title} at {company}"
                    
                    job_data = {
                        "id": job_id or generate_id(),
                        "title": title,
                        "company": company,
                        "location": job_location,
                        "url": job_url,
                        "description": description,
                        "posted_at": posted_at,
                    }
                    
                    jobs.append(self.normalize_job(job_data))
                    
                except Exception as e:
                    logger.debug(f"Error parsing LinkedIn job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Successfully scraped {len(jobs)} jobs from LinkedIn")
            return jobs
            
        except Exception as e:
            logger.error(f"LinkedIn Jobs scraping error: {e}")
            return []
    
    def _parse_relative_time(self, time_text: str) -> str:
        """Parse relative time like '2 days ago' to ISO timestamp"""
        try:
            time_text = time_text.lower()
            now = datetime.now(timezone.utc)
            
            if 'hour' in time_text or 'hr' in time_text:
                hours = int(re.search(r'(\d+)', time_text).group(1))
                posted = now - timedelta(hours=hours)
            elif 'day' in time_text:
                days = int(re.search(r'(\d+)', time_text).group(1))
                posted = now - timedelta(days=days)
            elif 'week' in time_text or 'wk' in time_text:
                weeks = int(re.search(r'(\d+)', time_text).group(1))
                posted = now - timedelta(weeks=weeks)
            elif 'month' in time_text or 'mo' in time_text:
                months = int(re.search(r'(\d+)', time_text).group(1))
                posted = now - timedelta(days=months*30)
            else:
                posted = now
            
            return posted.isoformat()
        except:
            return utc_now_iso()


class LinkedInPostsScraper(BrowserScraper):
    """
    LinkedIn Posts scraper - finds job postings in LinkedIn feed/posts
    This scrapes job postings shared as regular posts (hiring announcements)
    """
    SOURCE_ID = "linkedin_posts"
    SOURCE_NAME = "LinkedIn Posts (Hiring)"
    REGIONS = ["Global"]
    RATE_LIMIT_RPM = 8
    
    SEARCH_URL = "https://www.linkedin.com/search/results/content/"
    
    async def search_jobs(
        self,
        query: str = "hiring software engineer",
        location: str = "",
        limit: int = 30,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search LinkedIn posts for hiring announcements"""
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search query for hiring posts
            search_keywords = f"{query} (hiring OR opportunity OR join OR team OR position)"
            if location:
                search_keywords += f" {location}"
            
            params = f"keywords={search_keywords.replace(' ', '%20')}&origin=GLOBAL_SEARCH_HEADER"
            url = f"{self.SEARCH_URL}?{params}"
            
            logger.info(f"Scraping LinkedIn Posts: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(3, 6)
            
            # Scroll to load more posts
            for _ in range(3):
                await page.evaluate("window.scrollBy(0, 800)")
                await self._wait_random(1, 2)
            
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            
            # Find post containers
            posts = soup.select('div.feed-shared-update-v2') or soup.select('[data-id*="urn:li:activity"]')
            
            logger.info(f"Found {len(posts)} posts on LinkedIn")
            
            for post in posts[:limit]:
                try:
                    # Extract post content
                    content_elem = (
                        post.select_one('div.feed-shared-text') or
                        post.select_one('span.break-words')
                    )
                    
                    if not content_elem:
                        continue
                    
                    content = self._clean_text(content_elem.get_text())
                    
                    # Check if it's a hiring post
                    hiring_keywords = ['hiring', 'looking for', 'join our team', 'opportunity', 
                                     'position', 'opening', 'role', 'career', 'apply']
                    if not any(keyword in content.lower() for keyword in hiring_keywords):
                        continue
                    
                    # Extract company/author
                    author_elem = (
                        post.select_one('span.feed-shared-actor__name') or
                        post.select_one('[data-test-id="actor-name"]')
                    )
                    company = self._clean_text(author_elem.get_text()) if author_elem else "LinkedIn Post"
                    
                    # Extract title from content (first sentence or key phrase)
                    title = self._extract_title_from_content(content)
                    
                    # Get post URL
                    post_link = post.select_one('a[href*="/feed/update/"]')
                    post_url = ""
                    if post_link and post_link.get('href'):
                        post_url = post_link['href']
                        if not post_url.startswith('http'):
                            post_url = f"https://www.linkedin.com{post_url}"
                    
                    # Get timestamp
                    time_elem = post.select_one('time') or post.select_one('[class*="time"]')
                    posted_at = utc_now_iso()
                    if time_elem:
                        time_text = self._clean_text(time_elem.get_text())
                        posted_at = self._parse_relative_time(time_text)
                    
                    job_data = {
                        "title": title,
                        "company": company,
                        "location": location or "Remote/Various",
                        "url": post_url,
                        "description": content[:500],  # First 500 chars
                        "posted_at": posted_at,
                    }
                    
                    jobs.append(self.normalize_job(job_data))
                    
                except Exception as e:
                    logger.debug(f"Error parsing LinkedIn post: {e}")
                    continue
            
            await page.close()
            logger.info(f"Found {len(jobs)} hiring posts on LinkedIn")
            return jobs
            
        except Exception as e:
            logger.error(f"LinkedIn Posts scraping error: {e}")
            return []
    
    def _extract_title_from_content(self, content: str) -> str:
        """Extract a job title from post content"""
        # Common patterns for job titles
        patterns = [
            r"hiring (?:a |an )?([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Designer|Analyst|Specialist))",
            r"looking for (?:a |an )?([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Designer|Analyst|Specialist))",
            r"position:\s*([A-Z][a-zA-Z\s]+)",
            r"role:\s*([A-Z][a-zA-Z\s]+)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # Fallback: use first sentence
        first_sentence = content.split('.')[0][:100]
        return first_sentence if first_sentence else "LinkedIn Hiring Post"
    
    def _parse_relative_time(self, time_text: str) -> str:
        """Parse relative time to ISO timestamp"""
        try:
            time_text = time_text.lower()
            now = datetime.now(timezone.utc)
            
            if 'hour' in time_text or 'hr' in time_text or 'h' == time_text[-1]:
                hours = int(re.search(r'(\d+)', time_text).group(1))
                posted = now - timedelta(hours=hours)
            elif 'day' in time_text or 'd' == time_text[-1]:
                days = int(re.search(r'(\d+)', time_text).group(1))
                posted = now - timedelta(days=days)
            elif 'week' in time_text or 'w' == time_text[-1]:
                weeks = int(re.search(r'(\d+)', time_text).group(1))
                posted = now - timedelta(weeks=weeks)
            else:
                posted = now
            
            return posted.isoformat()
        except:
            return utc_now_iso()


class WellfoundScraper(BrowserScraper):
    """
    Wellfound (formerly AngelList Talent) scraper
    Focus on startup jobs
    """
    SOURCE_ID = "wellfound"
    SOURCE_NAME = "Wellfound"
    REGIONS = ["Global", "US"]
    RATE_LIMIT_RPM = 15
    
    BASE_URL = "https://wellfound.com/jobs"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 30,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Wellfound for startup jobs"""
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            params = []
            if query:
                params.append(f"role={query.replace(' ', '-').lower()}")
            if location:
                params.append(f"location={location.replace(' ', '%20')}")
            
            url = f"{self.BASE_URL}?{'&'.join(params)}" if params else self.BASE_URL
            
            logger.info(f"Scraping Wellfound: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(3, 5)
            
            # Scroll to load jobs
            for _ in range(3):
                await page.evaluate("window.scrollBy(0, 600)")
                await self._wait_random(1, 2)
            
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            
            # Multiple selector attempts for Wellfound's job cards
            job_cards = (
                soup.select('div[data-test="JobSearchResult"]') or
                soup.select('div.job-listing') or
                soup.select('[class*="JobSearchCard"]') or
                soup.select('div[class*="styles_component"]')
            )
            
            logger.info(f"Found {len(job_cards)} job cards on Wellfound")
            
            for card in job_cards[:limit]:
                try:
                    # Extract job details
                    title_elem = (
                        card.select_one('[class*="JobTitle"]') or
                        card.select_one('h2') or
                        card.select_one('[class*="title"]')
                    )
                    
                    company_elem = (
                        card.select_one('[class*="CompanyName"]') or
                        card.select_one('[class*="company"]') or
                        card.find('a', href=lambda x: x and '/company/' in x)
                    )
                    
                    location_elem = (
                        card.select_one('[class*="Location"]') or
                        card.select_one('[class*="location"]')
                    )
                    
                    link_elem = card.find('a', href=lambda x: x and '/jobs/' in x)
                    
                    if not title_elem:
                        continue
                    
                    title = self._clean_text(title_elem.get_text())
                    company = self._clean_text(company_elem.get_text()) if company_elem else "Startup"
                    job_location = self._clean_text(location_elem.get_text()) if location_elem else location
                    
                    # Get job URL
                    job_url = ""
                    if link_elem and link_elem.get('href'):
                        job_url = link_elem['href']
                        if not job_url.startswith('http'):
                            job_url = f"https://wellfound.com{job_url}"
                    
                    # Get description/snippet
                    desc_elem = card.select_one('[class*="description"]') or card.select_one('p')
                    description = self._clean_text(desc_elem.get_text()) if desc_elem else f"{title} at {company}"
                    
                    # Get salary if available
                    salary_elem = card.select_one('[class*="salary"]') or card.select_one('[class*="compensation"]')
                    salary_text = ""
                    if salary_elem:
                        salary_text = self._clean_text(salary_elem.get_text())
                    
                    job_data = {
                        "title": title,
                        "company": company,
                        "location": job_location,
                        "url": job_url,
                        "description": description,
                        "posted_at": utc_now_iso(),
                        "salary_text": salary_text,
                    }
                    
                    jobs.append(self.normalize_job(job_data))
                    
                except Exception as e:
                    logger.debug(f"Error parsing Wellfound job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Successfully scraped {len(jobs)} jobs from Wellfound")
            return jobs
            
        except Exception as e:
            logger.error(f"Wellfound scraping error: {e}")
            return []


class NaukriEnhancedScraper(BrowserScraper):
    """
    Enhanced Naukri.com scraper with better parsing
    India's largest job portal
    """
    SOURCE_ID = "naukri_enhanced"
    SOURCE_NAME = "Naukri.com"
    REGIONS = ["India"]
    RATE_LIMIT_RPM = 12
    
    BASE_URL = "https://www.naukri.com"
    
    async def search_jobs(
        self,
        query: str = "",
        location: str = "",
        limit: int = 40,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Search Naukri.com with enhanced parsing"""
        await self._rate_limit()
        
        try:
            page = await self._new_page()
            
            # Build search URL
            search_path = f"{query.replace(' ', '-')}-jobs" if query else "jobs"
            if location:
                search_path += f"-in-{location.replace(' ', '-').lower()}"
            
            url = f"{self.BASE_URL}/{search_path}"
            
            logger.info(f"Scraping Naukri: {url}")
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
            await self._wait_random(3, 5)
            
            # Scroll to load more jobs
            for _ in range(2):
                await page.evaluate("window.scrollBy(0, 1000)")
                await self._wait_random(2, 3)
            
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            jobs = []
            
            # Multiple selector patterns for Naukri
            job_cards = (
                soup.select('article.jobTuple') or
                soup.select('div.jobTuple') or
                soup.select('[class*="jobTuple"]') or
                soup.select('div[class*="job-card"]')
            )
            
            logger.info(f"Found {len(job_cards)} job cards on Naukri")
            
            for card in job_cards[:limit]:
                try:
                    # Extract job details with multiple selector attempts
                    title_elem = (
                        card.select_one('a.title') or
                        card.select_one('a[class*="title"]') or
                        card.select_one('h2 a')
                    )
                    
                    company_elem = (
                        card.select_one('a.subTitle') or
                        card.select_one('a[class*="company"]') or
                        card.select_one('[class*="companyInfo"]')
                    )
                    
                    exp_elem = card.select_one('span.expwdth') or card.select_one('[class*="experience"]')
                    loc_elem = card.select_one('span.locWdth') or card.select_one('[class*="location"]')
                    salary_elem = card.select_one('span.salaryWdth') or card.select_one('[class*="salary"]')
                    desc_elem = card.select_one('div.job-description') or card.select_one('[class*="snippet"]')
                    skills_elems = card.select('span.chip') or card.select('[class*="skill"]')
                    
                    if not title_elem:
                        continue
                    
                    title = self._clean_text(title_elem.get_text())
                    company = self._clean_text(company_elem.get_text()) if company_elem else "Company"
                    job_location = self._clean_text(loc_elem.get_text()) if loc_elem else location
                    
                    # Get job URL
                    job_url = title_elem.get('href', '') if title_elem else ''
                    if job_url and not job_url.startswith('http'):
                        job_url = f"{self.BASE_URL}{job_url}"
                    
                    # Get description
                    description = self._clean_text(desc_elem.get_text()) if desc_elem else f"{title} at {company}"
                    
                    # Get experience
                    experience = self._clean_text(exp_elem.get_text()) if exp_elem else ""
                    
                    # Get skills
                    skills = [self._clean_text(skill.get_text()) for skill in skills_elems]
                    if skills:
                        description += f" | Skills: {', '.join(skills[:5])}"
                    
                    # Get salary
                    salary_text = ""
                    salary_info = {}
                    if salary_elem:
                        salary_text = self._clean_text(salary_elem.get_text())
                        salary_info = self._extract_salary(salary_text)
                    
                    job_data = {
                        "title": title,
                        "company": company,
                        "location": job_location,
                        "url": job_url,
                        "description": description,
                        "posted_at": utc_now_iso(),
                        "salary_text": salary_text,
                        **salary_info
                    }
                    
                    # Add experience to description
                    if experience:
                        job_data["description"] += f" | Experience: {experience}"
                    
                    jobs.append(self.normalize_job(job_data))
                    
                except Exception as e:
                    logger.debug(f"Error parsing Naukri job card: {e}")
                    continue
            
            await page.close()
            logger.info(f"Successfully scraped {len(jobs)} jobs from Naukri")
            return jobs
            
        except Exception as e:
            logger.error(f"Naukri scraping error: {e}")
            return []


# Registry of enhanced scrapers
ENHANCED_SCRAPERS = {
    "linkedin_jobs": LinkedInJobsScraper,
    "linkedin_posts": LinkedInPostsScraper,
    "wellfound": WellfoundScraper,
    "naukri_enhanced": NaukriEnhancedScraper,
}


def get_enhanced_scraper(platform_id: str, config: Dict[str, Any] = None):
    """Get an enhanced scraper instance by platform ID"""
    scraper_class = ENHANCED_SCRAPERS.get(platform_id)
    if not scraper_class:
        raise ValueError(f"Unknown enhanced platform: {platform_id}")
    return scraper_class(config)
