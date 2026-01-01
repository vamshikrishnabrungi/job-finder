"""
AI Service wrapper for Claude Sonnet 4.5 integration
"""
import os
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class AIService:
    """
    AI Service using Claude Sonnet 4.5 via Anthropic API.
    Uses Emergent LLM Key for authentication.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get('EMERGENT_LLM_KEY')
        self._client = None
    
    def _get_client(self):
        if not self._client:
            try:
                from anthropic import Anthropic
                self._client = Anthropic(api_key=self.api_key)
            except ImportError:
                logger.error("Anthropic package not installed")
                raise
        return self._client
    
    async def generate(
        self,
        prompt: str,
        system_message: str = "You are a helpful AI assistant.",
        max_tokens: int = 2000
    ) -> str:
        """Generate text response from AI."""
        if not self.api_key:
            raise ValueError("No API key configured")
        
        try:
            client = self._get_client()
            response = client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=max_tokens,
                system=system_message,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            raise
    
    async def parse_resume(self, text: str) -> Dict[str, Any]:
        """Parse resume text and extract structured data."""
        prompt = f"""Analyze this resume and extract structured information. Return a JSON object with these fields:
- skills: list of technical and soft skills
- experience_years: estimated years of experience (number)
- roles: list of job titles/roles the person has held or is suitable for
- industries: list of industries they have experience in
- education: list of education entries
- summary: brief professional summary (2-3 sentences)
- keywords: important keywords for job matching

Resume text:
{text[:6000]}

Return ONLY valid JSON, no additional text."""

        response = await self.generate(prompt)
        
        # Parse JSON from response
        try:
            if "```json" in response:
                response = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                response = response.split("```")[1].split("```")[0]
            return json.loads(response.strip())
        except json.JSONDecodeError:
            logger.error("Failed to parse AI response as JSON")
            return {}
    
    async def score_job_match(
        self,
        job: Dict[str, Any],
        resume: Dict[str, Any],
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Score job match against resume and preferences."""
        prompt = f"""Analyze the match between this job and candidate profile. Return a JSON object with:
- score: match percentage 0-100
- matched_skills: list of matching skills
- missing_skills: list of required skills candidate lacks
- reasons: brief explanation of score

Job:
Title: {job.get('title', '')}
Company: {job.get('company', '')}
Description: {job.get('description', '')[:1500]}

Candidate Profile:
Skills: {resume.get('skills', [])}
Experience: {resume.get('experience_years', 0)} years
Roles: {resume.get('roles', [])}

Preferences:
Preferred Roles: {preferences.get('preferred_roles', [])}
Required Skills: {preferences.get('required_skills', [])}

Return ONLY valid JSON."""

        response = await self.generate(prompt, max_tokens=1000)
        
        try:
            if "```json" in response:
                response = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                response = response.split("```")[1].split("```")[0]
            return json.loads(response.strip())
        except json.JSONDecodeError:
            return {"score": 50, "matched_skills": [], "reasons": "Could not parse AI response"}
