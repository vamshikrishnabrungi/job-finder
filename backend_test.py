#!/usr/bin/env python3

import requests
import json
import sys
import time
from datetime import datetime
from io import BytesIO

class JobFinderAPITester:
    def __init__(self, base_url="https://project-runner-33.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.session = requests.Session()
        
    def log_test(self, name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
            
        if headers:
            test_headers.update(headers)
            
        if files:
            # Remove Content-Type for file uploads
            test_headers.pop('Content-Type', None)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    response = self.session.post(url, files=files, data=data, headers=test_headers)
                else:
                    response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}

            details = f"Status: {response.status_code} (expected {expected_status})"
            if not success:
                details += f" | Response: {response.text[:200]}"
                
            self.log_test(name, success, details, response_data)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {"error": str(e)}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "/api/health", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPassword123!",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test("User Registration", "POST", "/api/auth/register", 200, user_data)
        
        if success and response.get('access_token'):
            self.token = response['access_token']
            self.user_id = response.get('user', {}).get('id')
            self.log_test("Token Extraction", True, f"Token received and stored")
        else:
            self.log_test("Token Extraction", False, "No token in registration response")
            
        return success

    def test_user_login(self):
        """Test user login with existing credentials"""
        # Try to login with the registered user
        if not hasattr(self, '_test_email'):
            self.log_test("User Login", False, "No test user email available")
            return False
            
        login_data = {
            "email": self._test_email,
            "password": "TestPassword123!"
        }
        
        success, response = self.run_test("User Login", "POST", "/api/auth/login", 200, login_data)
        
        if success and response.get('access_token'):
            self.token = response['access_token']
            self.log_test("Login Token Update", True, "Token updated from login")
        
        return success

    def test_auth_me(self):
        """Test authenticated user info endpoint"""
        if not self.token:
            self.log_test("Get User Info", False, "No auth token available")
            return False
            
        return self.run_test("Get User Info (/api/auth/me)", "GET", "/api/auth/me", 200)[0]

    def test_job_stats(self):
        """Test job statistics endpoint"""
        if not self.token:
            self.log_test("Job Stats", False, "No auth token available")
            return False
            
        return self.run_test("Job Statistics", "GET", "/api/jobs/stats", 200)[0]

    def test_job_sources(self):
        """Test available job sources endpoint"""
        return self.run_test("Available Job Sources", "GET", "/api/sources", 200)[0]

    def test_preferences_get(self):
        """Test get preferences endpoint"""
        if not self.token:
            self.log_test("Get Preferences", False, "No auth token available")
            return False
            
        return self.run_test("Get Preferences", "GET", "/api/preferences", 200)[0]

    def test_preferences_update(self):
        """Test update preferences endpoint"""
        if not self.token:
            self.log_test("Update Preferences", False, "No auth token available")
            return False
            
        preferences_data = {
            "preferred_roles": ["Software Engineer", "Backend Developer"],
            "preferred_industries": ["Technology", "Fintech"],
            "min_salary": 80000,
            "max_salary": 150000,
            "remote_only": True,
            "tech_stack": ["Python", "FastAPI", "MongoDB"]
        }
        
        return self.run_test("Update Preferences", "PUT", "/api/preferences", 200, preferences_data)[0]

    def test_schedule_get(self):
        """Test get schedule endpoint"""
        if not self.token:
            self.log_test("Get Schedule", False, "No auth token available")
            return False
            
        return self.run_test("Get Schedule", "GET", "/api/schedule/", 200)[0]

    def test_schedule_update(self):
        """Test update schedule endpoint"""
        if not self.token:
            self.log_test("Update Schedule", False, "No auth token available")
            return False
            
        schedule_data = {
            "enabled": True,
            "schedule_time": "09:00",
            "regions": ["US", "EU", "UK"],
            "sources": ["linkedin", "indeed", "glassdoor"],
            "frequency": "daily"
        }
        
        return self.run_test("Update Schedule", "PUT", "/api/schedule/", 200, schedule_data)[0]

    def test_resume_upload(self):
        """Test resume upload endpoint"""
        if not self.token:
            self.log_test("Resume Upload", False, "No auth token available")
            return False
            
        # Create a simple test resume file
        resume_content = """
John Doe
Software Engineer

EXPERIENCE:
- 5 years of Python development
- FastAPI and Django experience
- MongoDB and PostgreSQL databases
- AWS cloud services

SKILLS:
Python, JavaScript, React, FastAPI, MongoDB, AWS, Docker

EDUCATION:
Bachelor of Computer Science
"""
        
        files = {'file': ('test_resume.txt', BytesIO(resume_content.encode()), 'text/plain')}
        
        success, response = self.run_test("Resume Upload", "POST", "/api/resume/upload", 200, files=files)
        
        # Wait a moment for AI processing
        if success:
            time.sleep(2)
            
        return success

    def test_resume_profile(self):
        """Test get resume profile endpoint"""
        if not self.token:
            self.log_test("Get Resume Profile", False, "No auth token available")
            return False
            
        return self.run_test("Get Resume Profile", "GET", "/api/resume/profile", 200)[0]

    def test_job_discovery(self):
        """Test job discovery endpoint"""
        if not self.token:
            self.log_test("Job Discovery", False, "No auth token available")
            return False
            
        success, response = self.run_test("Job Discovery", "POST", "/api/jobs/discover", 200, {})
        
        # Wait for job discovery to complete
        if success:
            time.sleep(3)
            
        return success

    def test_get_jobs(self):
        """Test get jobs list endpoint"""
        if not self.token:
            self.log_test("Get Jobs List", False, "No auth token available")
            return False
            
        return self.run_test("Get Jobs List", "GET", "/api/jobs/", 200)[0]

    def test_get_jobs_with_filters(self):
        """Test get jobs with filters"""
        if not self.token:
            self.log_test("Get Jobs with Filters", False, "No auth token available")
            return False
            
        return self.run_test("Get Jobs with Filters", "GET", "/api/jobs/?status=new&limit=10", 200)[0]

    def test_credentials_crud(self):
        """Test credentials CRUD operations"""
        if not self.token:
            self.log_test("Credentials CRUD", False, "No auth token available")
            return False
            
        # Test GET credentials (should be empty initially)
        get_success, _ = self.run_test("Get Credentials", "GET", "/api/credentials/", 200)
        
        # Test POST credential
        cred_data = {
            "portal_name": "LinkedIn",
            "username": "test@example.com",
            "password": "testpassword123",
            "notes": "Test credential for LinkedIn"
        }
        
        post_success, post_response = self.run_test("Add Credential", "POST", "/api/credentials/", 200, cred_data)
        
        cred_id = None
        if post_success and post_response.get('credential', {}).get('id'):
            cred_id = post_response['credential']['id']
            
        # Test DELETE credential
        delete_success = True
        if cred_id:
            delete_success, _ = self.run_test("Delete Credential", "DELETE", f"/api/credentials/{cred_id}", 200)
        
        return get_success and post_success and delete_success

    def test_excel_export(self):
        """Test Excel export endpoint"""
        if not self.token:
            self.log_test("Excel Export", False, "No auth token available")
            return False
            
        # Test export (should return Excel file)
        success, response = self.run_test("Excel Export", "GET", "/api/export/excel", 200)
        return success

    def test_job_status_update(self):
        """Test job status update endpoint"""
        if not self.token:
            self.log_test("Job Status Update", False, "No auth token available")
            return False
            
        # First get jobs to find one to update
        get_success, jobs_response = self.run_test("Get Jobs for Status Update", "GET", "/api/jobs/?limit=1", 200)
        
        if not get_success or not jobs_response.get('jobs'):
            self.log_test("Job Status Update", False, "No jobs available to update status")
            return False
            
        job_id = jobs_response['jobs'][0]['id']
        status_data = {"status": "saved", "notes": "Test status update"}
        
        return self.run_test("Update Job Status", "PUT", f"/api/jobs/{job_id}/status", 200, status_data)[0]

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Job Finder AI API Tests")
        print("=" * 50)
        
        # Store test email for login test
        timestamp = int(time.time())
        self._test_email = f"test_user_{timestamp}@example.com"
        
        # Basic tests
        self.test_health_check()
        
        # Auth flow
        self.test_user_registration()
        self.test_auth_me()
        
        # Core functionality tests
        self.test_job_sources()
        self.test_preferences_get()
        self.test_preferences_update()
        self.test_schedule_get()
        self.test_schedule_update()
        
        # Resume and job discovery
        self.test_resume_upload()
        self.test_resume_profile()
        self.test_job_discovery()
        
        # Job management
        self.test_get_jobs()
        self.test_get_jobs_with_filters()
        self.test_job_stats()
        self.test_job_status_update()
        
        # Additional features
        self.test_credentials_crud()
        self.test_excel_export()
        
        # Print summary
        print("=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = JobFinderAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())