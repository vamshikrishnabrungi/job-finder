"""
Browser-based scraper framework using Playwright
Production-grade with rate limiting, proxy support, and anti-detection
"""
import os
import re
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from playwright.async_api import async_playwright, Page, Browser
from bs4 import BeautifulSoup
import httpx
from urllib.parse import urljoin, urlparse
import random

from app.connectors.sources import BaseConnector
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)


class BrowserScraper(BaseConnector):
    """
    Base class for browser-based job scraping with anti-detection.
    Respects robots.txt, implements rate limiting, and uses AI for parsing.
    """
    
    SOURCE_TYPE = "browser"
    ROBOTS_COMPLIANT = True
    RATE_LIMIT_RPM = 20  # Conservative rate limit
    
    # User agents rotation for anti-detection
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ]
    
    def __init__(self, config: Dict[str, Any] = None):
        super().__init__(config)
        self.ai_service = AIService()
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.playwright = None
        self._robots_txt_cache = {}
        
    async def _check_robots_txt(self, url: str) -> bool:
        """Check if scraping is allowed by robots.txt"""
        if not self.ROBOTS_COMPLIANT:
            return True
            
        parsed = urlparse(url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        if base_url in self._robots_txt_cache:
            return self._robots_txt_cache[base_url]
        
        robots_url = f"{base_url}/robots.txt"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(robots_url, timeout=10)
                if response.status_code == 200:
                    # Simple check - look for "Disallow: /"
                    content = response.text.lower()
                    if "disallow: /" in content and "user-agent: *" in content:
                        logger.warning(f"Robots.txt disallows scraping for {base_url}")
                        self._robots_txt_cache[base_url] = False
                        return False
        except Exception as e:
            logger.debug(f"Could not fetch robots.txt for {base_url}: {e}")
        
        self._robots_txt_cache[base_url] = True
        return True
    
    async def _init_browser(self):
        """Initialize Playwright browser with anti-detection settings"""
        if self.browser:
            return
            
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        )
        
    async def _new_page(self) -> Page:
        """Create new page with random user agent and stealth settings"""
        await self._init_browser()
        
        context = await self.browser.new_context(
            user_agent=random.choice(self.USER_AGENTS),
            viewport={'width': 1920, 'height': 1080},
            java_script_enabled=True,
        )
        
        page = await context.new_page()
        
        # Stealth mode - hide webdriver property
        await page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false
            });
        """)
        
        return page
    
    async def _close_browser(self):
        """Clean up browser resources"""
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
    
    async def _wait_random(self, min_seconds: float = 2.0, max_seconds: float = 5.0):
        """Random delay to appear more human-like"""
        await asyncio.sleep(random.uniform(min_seconds, max_seconds))
    
    async def _extract_with_ai(
        self,
        html_content: str,
        extraction_prompt: str
    ) -> Dict[str, Any]:
        """Use AI to extract structured data from HTML"""
        try:
            prompt = f"""Extract job listing information from this HTML snippet.
{extraction_prompt}

HTML Content:
{html_content[:10000]}  # Limit to first 10k chars

Return a JSON object with the extracted fields."""

            result = await self.ai_service.extract_structured_data(prompt)
            return result
        except Exception as e:
            logger.error(f"AI extraction failed: {e}")
            return {}
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def _extract_salary(self, text: str) -> Dict[str, Any]:
        """Extract salary information from text"""
        salary_info = {
            "salary_min": None,
            "salary_max": None,
            "salary_currency": "USD",
            "salary_text": text
        }
        
        # Common patterns: $50k-$80k, £30,000-£40,000, ₹5L-₹10L
        patterns = [
            r'[\$£€₹]\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*k?\s*-\s*[\$£€₹]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*k?',
            r'(\d+(?:,\d{3})*)\s*-\s*(\d+(?:,\d{3})*)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    min_val = float(match.group(1).replace(',', ''))
                    max_val = float(match.group(2).replace(',', ''))
                    
                    # Handle k notation
                    if 'k' in text.lower():
                        min_val *= 1000
                        max_val *= 1000
                    
                    salary_info["salary_min"] = min_val
                    salary_info["salary_max"] = max_val
                    
                    # Detect currency
                    if '£' in text:
                        salary_info["salary_currency"] = "GBP"
                    elif '€' in text:
                        salary_info["salary_currency"] = "EUR"
                    elif '₹' in text:
                        salary_info["salary_currency"] = "INR"
                    
                    break
                except:
                    pass
        
        return salary_info
