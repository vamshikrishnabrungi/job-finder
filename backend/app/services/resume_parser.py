"""
Resume Parsing Service
Extracts structured data from PDF, DOCX, TXT resumes
"""
import os
import re
import json
from io import BytesIO
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

import PyPDF2
from docx import Document

logger = logging.getLogger(__name__)


class ResumeParserService:
    """
    Parses resumes and extracts structured information.
    Uses AI for enhanced parsing when available.
    """
    
    def __init__(self, ai_service=None):
        """
        Initialize parser.
        ai_service: Optional AI service for enhanced parsing
        """
        self.ai_service = ai_service
    
    async def parse_file(
        self,
        file_content: bytes,
        filename: str,
        use_ai: bool = True
    ) -> Dict[str, Any]:
        """
        Parse a resume file and extract structured data.
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            use_ai: Whether to use AI for enhanced parsing
        
        Returns:
            Parsed resume data
        """
        # Extract raw text
        text = self._extract_text(file_content, filename)
        
        if not text or len(text.strip()) < 50:
            return {
                "error": "Could not extract text from file",
                "raw_text": text,
                "skills": [],
                "keywords": [],
                "experience_years": 0,
                "roles": [],
                "industries": [],
                "education": [],
                "certifications": [],
                "work_history": [],
                "location_preference": [],
                "work_authorization": "",
                "salary_expectation": {},
                "remote_preference": "any",
                "summary": ""
            }
        
        # Basic parsing
        result = self._basic_parse(text)
        result["raw_text"] = text
        
        # AI-enhanced parsing
        if use_ai and self.ai_service:
            try:
                ai_result = await self._ai_parse(text)
                result = self._merge_results(result, ai_result)
            except Exception as e:
                logger.error(f"AI parsing failed: {e}")
        
        return result
    
    def _extract_text(self, content: bytes, filename: str) -> str:
        """Extract text from file based on type."""
        filename = filename.lower()
        
        try:
            if filename.endswith('.pdf'):
                return self._extract_pdf(content)
            elif filename.endswith('.docx'):
                return self._extract_docx(content)
            elif filename.endswith('.txt'):
                return content.decode('utf-8', errors='ignore')
            else:
                # Try as text
                return content.decode('utf-8', errors='ignore')
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            return ""
    
    def _extract_pdf(self, content: bytes) -> str:
        """Extract text from PDF."""
        reader = PyPDF2.PdfReader(BytesIO(content))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    
    def _extract_docx(self, content: bytes) -> str:
        """Extract text from DOCX."""
        doc = Document(BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs]
        return "\n".join(paragraphs)
    
    def _basic_parse(self, text: str) -> Dict[str, Any]:
        """Basic regex-based parsing."""
        result = {
            "skills": [],
            "keywords": [],
            "experience_years": 0,
            "roles": [],
            "industries": [],
            "education": [],
            "certifications": [],
            "work_history": [],
            "location_preference": [],
            "work_authorization": "",
            "salary_expectation": {},
            "remote_preference": "any",
            "summary": ""
        }
        
        text_lower = text.lower()
        
        # Extract skills
        result["skills"] = self._extract_skills(text_lower)
        
        # Extract experience years
        result["experience_years"] = self._extract_years(text)
        
        # Extract education
        result["education"] = self._extract_education(text)
        
        # Extract certifications
        result["certifications"] = self._extract_certifications(text)
        
        # Extract emails/contact
        result["contact"] = self._extract_contact(text)
        
        # Generate keywords
        result["keywords"] = list(set(result["skills"][:20]))
        
        return result
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract technical and soft skills."""
        # Common tech skills
        tech_skills = {
            # Programming Languages
            "python", "java", "javascript", "typescript", "c++", "c#", "go", "golang",
            "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "perl",
            # Frontend
            "react", "vue", "angular", "svelte", "jquery", "html", "css", "sass",
            "less", "tailwind", "bootstrap", "webpack", "babel", "next.js", "nuxt",
            # Backend
            "node.js", "nodejs", "django", "flask", "fastapi", "spring", "spring boot",
            "rails", "express", "nest.js", "graphql", "rest", "grpc",
            # Databases
            "sql", "mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch",
            "cassandra", "dynamodb", "oracle", "sqlite", "mariadb", "neo4j",
            # Cloud & DevOps
            "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
            "terraform", "ansible", "jenkins", "circleci", "github actions",
            "ci/cd", "devops", "linux", "unix", "bash", "shell",
            # Data & ML
            "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
            "pandas", "numpy", "scikit-learn", "spark", "hadoop", "airflow",
            "data science", "data engineering", "etl", "data warehouse",
            # Mobile
            "ios", "android", "react native", "flutter", "xamarin",
            # Other
            "git", "agile", "scrum", "jira", "confluence", "microservices",
            "serverless", "api design", "system design", "architecture"
        }
        
        found = []
        for skill in tech_skills:
            if skill in text:
                found.append(skill)
        
        return found
    
    def _extract_years(self, text: str) -> int:
        """Extract years of experience."""
        patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)',
            r'experience[:\s]+(\d+)\+?\s*years?',
            r'(\d+)\+?\s*yrs?\s*(?:of\s*)?(?:experience|exp)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                try:
                    return int(match.group(1))
                except:
                    pass
        
        # Count year ranges in work history
        year_pattern = r'\b(19|20)\d{2}\b'
        years = re.findall(year_pattern, text)
        if len(years) >= 2:
            try:
                years = sorted([int(f"{y[0]}{y[1:]}") for y in years])
                return max(0, years[-1] - years[0])
            except:
                pass
        
        return 0
    
    def _extract_education(self, text: str) -> List[str]:
        """Extract education entries."""
        education = []
        
        degrees = [
            "ph.d", "phd", "doctorate", "doctoral",
            "master", "mba", "m.s.", "m.a.", "ms", "ma",
            "bachelor", "b.s.", "b.a.", "bs", "ba", "btech", "b.tech",
            "associate"
        ]
        
        lines = text.split('\n')
        for line in lines:
            line_lower = line.lower()
            for degree in degrees:
                if degree in line_lower:
                    cleaned = line.strip()
                    if len(cleaned) > 10 and len(cleaned) < 200:
                        education.append(cleaned)
                        break
        
        return education[:5]  # Limit to 5 entries
    
    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications."""
        certs = []
        
        cert_keywords = [
            "aws certified", "azure certified", "gcp certified",
            "pmp", "scrum master", "csm", "cissp", "cism",
            "comptia", "cisco", "ccna", "ccnp",
            "certified", "certification"
        ]
        
        lines = text.split('\n')
        for line in lines:
            line_lower = line.lower()
            for cert in cert_keywords:
                if cert in line_lower:
                    cleaned = line.strip()
                    if len(cleaned) > 5 and len(cleaned) < 100:
                        certs.append(cleaned)
                        break
        
        return list(set(certs))[:10]
    
    def _extract_contact(self, text: str) -> Dict[str, str]:
        """Extract contact information."""
        contact = {}
        
        # Email
        email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
        emails = re.findall(email_pattern, text)
        if emails:
            contact["email"] = emails[0]
        
        # Phone
        phone_pattern = r'[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}'
        phones = re.findall(phone_pattern, text)
        if phones:
            contact["phone"] = phones[0]
        
        # LinkedIn
        linkedin_pattern = r'linkedin\.com/in/[\w-]+'
        linkedin = re.findall(linkedin_pattern, text.lower())
        if linkedin:
            contact["linkedin"] = f"https://www.{linkedin[0]}"
        
        return contact
    
    async def _ai_parse(self, text: str) -> Dict[str, Any]:
        """Use AI service for enhanced parsing."""
        if not self.ai_service:
            return {}
        
        prompt = f"""Analyze this resume and extract structured information. Return a JSON object with these fields:
- skills: list of technical and soft skills
- experience_years: estimated years of experience (number)
- roles: list of job titles/roles the person has held or is suitable for
- industries: list of industries they have experience in
- education: list of education entries (degree, school, year if available)
- certifications: list of certifications
- location_preference: any mentioned location preferences
- work_authorization: visa/work authorization status if mentioned
- salary_expectation: any salary expectations mentioned (as object with min/max/currency)
- remote_preference: "remote", "hybrid", "onsite", or "any"
- summary: brief professional summary (2-3 sentences)
- keywords: important keywords for job matching

Resume text:
{text[:8000]}

Return ONLY valid JSON, no additional text."""

        try:
            response = await self.ai_service.generate(prompt)
            
            # Parse JSON from response
            response_text = response
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            return json.loads(response_text.strip())
        except Exception as e:
            logger.error(f"AI parsing failed: {e}")
            return {}
    
    def _merge_results(self, basic: Dict, ai: Dict) -> Dict[str, Any]:
        """Merge basic and AI parsing results."""
        result = dict(basic)
        
        # Merge lists by combining and deduping
        list_fields = ["skills", "keywords", "roles", "industries", "education", "certifications"]
        for field in list_fields:
            if field in ai and ai[field]:
                combined = list(set(basic.get(field, []) + ai[field]))
                result[field] = combined
        
        # Override scalar fields with AI results if present
        scalar_fields = ["experience_years", "work_authorization", "remote_preference", "summary"]
        for field in scalar_fields:
            if field in ai and ai[field]:
                result[field] = ai[field]
        
        # Merge complex fields
        if "salary_expectation" in ai and ai["salary_expectation"]:
            result["salary_expectation"] = ai["salary_expectation"]
        
        if "location_preference" in ai and ai["location_preference"]:
            result["location_preference"] = ai["location_preference"] if isinstance(ai["location_preference"], list) else [ai["location_preference"]]
        
        # Store full AI result
        result["parsed_data"] = ai
        
        return result
