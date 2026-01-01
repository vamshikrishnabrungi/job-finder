"""
Browser Automation Service using Playwright
- Supports headless browsing for job discovery
- Session management with encrypted cookie storage
- Screenshot and artifact storage for debugging
"""
import os
import json
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Callable
from pathlib import Path
import logging
import hashlib

logger = logging.getLogger(__name__)

# Playwright imports
try:
    from playwright.async_api import async_playwright, Browser, Page, BrowserContext
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright not available. Browser automation disabled.")


class BrowserAutomationService:
    """
    Playwright-based browser automation for job discovery.
    Supports:
    - Public browsing (no login)
    - Login with stored credentials
    - Session reuse via encrypted cookies
    - Screenshot/artifact capture
    """
    
    def __init__(
        self,
        db=None,
        credential_service=None,
        artifacts_path: str = None,
        headless: bool = True
    ):
        self.db = db
        self.credential_service = credential_service
        self.artifacts_path = artifacts_path or os.environ.get('ARTIFACTS_PATH', '/app/backend/artifacts')
        self.headless = headless if headless is not None else os.environ.get('PLAYWRIGHT_HEADLESS', 'true').lower() == 'true'
        self.timeout = int(os.environ.get('BROWSER_TIMEOUT', 30000))
        
        Path(self.artifacts_path).mkdir(parents=True, exist_ok=True)
        
        self._playwright = None
        self._browser = None
    
    async def __aenter__(self):
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()
    
    async def start(self):
        """Start Playwright and browser."""
        if not PLAYWRIGHT_AVAILABLE:
            raise RuntimeError("Playwright not installed")
        
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.launch(
            headless=self.headless,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        )
        logger.info("Browser started")
    
    async def stop(self):
        """Stop browser and Playwright."""
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
        logger.info("Browser stopped")
    
    async def create_context(
        self,
        user_id: str,
        source_id: str,
        credential_id: Optional[str] = None,
        reuse_session: bool = True
    ) -> BrowserContext:
        """
        Create a browser context with optional session reuse.
        
        Args:
            user_id: User ID
            source_id: Job source ID
            credential_id: Optional credential ID for login
            reuse_session: Whether to load saved cookies
        
        Returns:
            BrowserContext
        """
        context_options = {
            'viewport': {'width': 1920, 'height': 1080},
            'user_agent': self._get_user_agent(),
            'locale': 'en-US',
            'timezone_id': 'America/Los_Angeles',
        }
        
        context = await self._browser.new_context(**context_options)
        
        # Try to load saved session cookies
        if reuse_session and credential_id and self.credential_service:
            cookies = await self.credential_service.get_session_cookies(
                credential_id=credential_id,
                user_id=user_id
            )
            if cookies:
                await context.add_cookies(cookies)
                logger.info(f"Loaded {len(cookies)} cookies from session")
        
        return context
    
    async def save_session(
        self,
        context: BrowserContext,
        user_id: str,
        credential_id: str
    ):
        """Save session cookies for reuse."""
        if not self.credential_service:
            return
        
        cookies = await context.cookies()
        if cookies:
            await self.credential_service.store_session_cookies(
                credential_id=credential_id,
                user_id=user_id,
                cookies=cookies
            )
            logger.info(f"Saved {len(cookies)} cookies to session")
    
    async def run_scraper(
        self,
        user_id: str,
        source_id: str,
        scraper_func: Callable,
        credential_id: Optional[str] = None,
        search_params: Dict[str, Any] = None,
        run_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run a scraper function with browser context.
        
        Args:
            user_id: User ID
            source_id: Job source ID
            scraper_func: Async function that takes (page, search_params) and returns jobs
            credential_id: Optional credential for login
            search_params: Search parameters for the scraper
            run_id: Job run ID for artifact naming
        
        Returns:
            Dict with jobs, artifacts, errors
        """
        result = {
            "jobs": [],
            "artifacts": [],
            "errors": [],
            "success": False
        }
        
        context = None
        page = None
        
        try:
            # Create context with session
            context = await self.create_context(
                user_id=user_id,
                source_id=source_id,
                credential_id=credential_id,
                reuse_session=bool(credential_id)
            )
            
            page = await context.new_page()
            page.set_default_timeout(self.timeout)
            
            # Run the scraper
            jobs = await scraper_func(page, search_params or {})
            result["jobs"] = jobs
            result["success"] = True
            
            # Save session if credential provided
            if credential_id:
                await self.save_session(context, user_id, credential_id)
                if self.credential_service:
                    await self.credential_service.mark_credential_used(
                        credential_id=credential_id,
                        user_id=user_id,
                        success=True
                    )
            
            logger.info(f"Scraper completed: {len(jobs)} jobs found")
            
        except Exception as e:
            error_msg = str(e)
            result["errors"].append({"error": error_msg, "source": source_id})
            logger.error(f"Scraper error for {source_id}: {error_msg}")
            
            # Capture error screenshot
            if page:
                screenshot_path = await self._capture_screenshot(
                    page, f"error_{source_id}_{run_id or 'manual'}"
                )
                if screenshot_path:
                    result["artifacts"].append(screenshot_path)
            
            # Mark credential as potentially invalid
            if credential_id and self.credential_service:
                await self.credential_service.mark_credential_used(
                    credential_id=credential_id,
                    user_id=user_id,
                    success=False
                )
        
        finally:
            if page:
                await page.close()
            if context:
                await context.close()
        
        return result
    
    async def _capture_screenshot(self, page: Page, name: str) -> Optional[str]:
        """Capture a screenshot for debugging."""
        try:
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            filename = f"{name}_{timestamp}.png"
            filepath = os.path.join(self.artifacts_path, filename)
            await page.screenshot(path=filepath, full_page=True)
            logger.info(f"Screenshot saved: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Screenshot failed: {e}")
            return None
    
    def _get_user_agent(self) -> str:
        """Get a realistic user agent."""
        try:
            from fake_useragent import UserAgent
            ua = UserAgent()
            return ua.chrome
        except:
            return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


# ==================== EXAMPLE SCRAPER IMPLEMENTATIONS ====================

async def scrape_public_jobs_page(
    page,
    base_url: str,
    search_params: Dict[str, Any],
    selectors: Dict[str, str]
) -> List[Dict[str, Any]]:
    """
    Generic public job page scraper.
    
    Args:
        page: Playwright page
        base_url: URL to scrape
        search_params: Search parameters (query, location, etc.)
        selectors: CSS selectors for job elements
    
    Returns:
        List of job dictionaries
    """
    jobs = []
    
    # Build URL with search params
    url = base_url
    if search_params:
        params = "&".join(f"{k}={v}" for k, v in search_params.items() if v)
        url = f"{base_url}?{params}"
    
    await page.goto(url, wait_until='networkidle')
    
    # Wait for job listings
    job_cards = await page.query_selector_all(selectors.get("job_card", ".job-card"))
    
    for card in job_cards:
        try:
            job = {
                "title": await _safe_text(card, selectors.get("title", ".title")),
                "company": await _safe_text(card, selectors.get("company", ".company")),
                "location": await _safe_text(card, selectors.get("location", ".location")),
                "job_url": await _safe_href(card, selectors.get("link", "a")),
            }
            
            if job["title"] and job["company"]:
                jobs.append(job)
        except Exception as e:
            logger.debug(f"Failed to parse job card: {e}")
    
    return jobs


async def _safe_text(element, selector: str) -> str:
    """Safely get text content from element."""
    try:
        el = await element.query_selector(selector)
        if el:
            return (await el.text_content() or "").strip()
    except:
        pass
    return ""


async def _safe_href(element, selector: str) -> str:
    """Safely get href attribute from element."""
    try:
        el = await element.query_selector(selector)
        if el:
            return await el.get_attribute("href") or ""
    except:
        pass
    return ""


# ==================== JOB PORTAL LOGIN HANDLERS ====================

class LoginHandler:
    """Base class for portal login handlers."""
    
    async def login(
        self,
        page,
        username: str,
        password: str
    ) -> bool:
        """Attempt login. Returns True if successful."""
        raise NotImplementedError
    
    async def is_logged_in(self, page) -> bool:
        """Check if currently logged in."""
        raise NotImplementedError


class LinkedInLoginHandler(LoginHandler):
    """
    LinkedIn login handler.
    NOTE: Only use with explicit user consent and within LinkedIn's terms.
    """
    
    async def login(self, page, username: str, password: str) -> bool:
        try:
            await page.goto("https://www.linkedin.com/login")
            await page.fill("#username", username)
            await page.fill("#password", password)
            await page.click('button[type="submit"]')
            
            # Wait for redirect
            await page.wait_for_url("**/feed/**", timeout=30000)
            return True
        except Exception as e:
            logger.error(f"LinkedIn login failed: {e}")
            return False
    
    async def is_logged_in(self, page) -> bool:
        try:
            await page.goto("https://www.linkedin.com/feed/")
            await page.wait_for_selector(".feed-identity-module", timeout=5000)
            return True
        except:
            return False


class IndeedLoginHandler(LoginHandler):
    """Indeed login handler."""
    
    async def login(self, page, username: str, password: str) -> bool:
        try:
            await page.goto("https://secure.indeed.com/account/login")
            await page.fill('input[name="__email"]', username)
            await page.click('button[type="submit"]')
            
            # Wait for password field
            await page.wait_for_selector('input[name="__password"]', timeout=10000)
            await page.fill('input[name="__password"]', password)
            await page.click('button[type="submit"]')
            
            # Wait for redirect
            await page.wait_for_timeout(5000)
            return "indeed.com" in page.url and "login" not in page.url
        except Exception as e:
            logger.error(f"Indeed login failed: {e}")
            return False
    
    async def is_logged_in(self, page) -> bool:
        try:
            await page.goto("https://www.indeed.com/")
            profile = await page.query_selector('[data-gnav-element-name="Profile"]')
            return profile is not None
        except:
            return False
