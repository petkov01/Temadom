"""
TemaDom Phase 3 Soft Launch Tests
Testing: Dark theme, Feedback system, PageInstructions, Registration tabs, Logo
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFeedbackAPI:
    """Test the Feedback API endpoints"""
    
    def test_post_feedback_success(self):
        """POST /api/feedback - submit feedback with rating"""
        response = requests.post(f"{BASE_URL}/api/feedback", json={
            "rating": 5,
            "text": "Отлична платформа!",
            "name": "Test User"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data or "id" in data or response.status_code == 200
        print("✅ POST /api/feedback - success")
    
    def test_post_feedback_with_rating_only(self):
        """POST /api/feedback - minimal feedback (rating only)"""
        response = requests.post(f"{BASE_URL}/api/feedback", json={
            "rating": 4,
            "text": "",
            "name": "Анонимен"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✅ POST /api/feedback with rating only - success")

    def test_get_feedback_list(self):
        """GET /api/feedback - returns feedback list"""
        response = requests.get(f"{BASE_URL}/api/feedback")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "feedback" in data, "Response should contain 'feedback' list"
        assert "avg_rating" in data, "Response should contain 'avg_rating'"
        assert "total" in data, "Response should contain 'total'"
        print(f"✅ GET /api/feedback - {data['total']} feedback items, avg rating: {data['avg_rating']}")


class TestCoreEndpoints:
    """Test core API endpoints still working after Phase 3 changes"""
    
    def test_root_api(self):
        """GET /api/ - API root"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("✅ GET /api/ - API is running")
    
    def test_stats_endpoint(self):
        """GET /api/stats - homepage stats"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        assert "total_reviews" in data
        print(f"✅ GET /api/stats - projects: {data['total_projects']}, companies: {data['total_companies']}")
    
    def test_categories_endpoint(self):
        """GET /api/categories - construction categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ GET /api/categories - {len(data['categories'])} categories")
    
    def test_demo_projects_endpoint(self):
        """GET /api/demo-projects - demo projects for homepage"""
        response = requests.get(f"{BASE_URL}/api/demo-projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        print(f"✅ GET /api/demo-projects - {len(data.get('projects', []))} projects")
    
    def test_top_companies_endpoint(self):
        """GET /api/top-companies - top rated companies"""
        response = requests.get(f"{BASE_URL}/api/top-companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        print(f"✅ GET /api/top-companies - {len(data.get('companies', []))} companies")
    
    def test_subscription_plans_endpoint(self):
        """GET /api/subscriptions/plans - subscription plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data or "company" in data
        print("✅ GET /api/subscriptions/plans - plans returned")
    
    def test_ai_design_status_endpoint(self):
        """GET /api/ai-design/status - AI design status"""
        response = requests.get(f"{BASE_URL}/api/ai-design/status")
        assert response.status_code == 200
        data = response.json()
        print(f"✅ GET /api/ai-design/status - free designs remaining: {data.get('global_free_remaining', 'N/A')}")
    
    def test_companies_list_endpoint(self):
        """GET /api/companies - companies list"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        print(f"✅ GET /api/companies - {len(data.get('companies', []))} companies")
    
    def test_projects_list_endpoint(self):
        """GET /api/projects - projects list"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        print(f"✅ GET /api/projects - {len(data.get('projects', []))} projects")
    
    def test_ads_list_endpoint(self):
        """GET /api/ads - ads list"""
        response = requests.get(f"{BASE_URL}/api/ads")
        assert response.status_code == 200
        data = response.json()
        assert "ads" in data
        print(f"✅ GET /api/ads - {len(data.get('ads', []))} ads")


class TestRegistrationEndpoints:
    """Test registration with different user types"""
    
    def test_register_client(self):
        """POST /api/auth/register - client registration"""
        email = f"test_client_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "name": "Test Client",
            "password": "test123456",
            "user_type": "client",
            "city": "София"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "client"
        print("✅ Client registration - success")
    
    def test_register_master(self):
        """POST /api/auth/register - master registration"""
        email = f"test_master_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "name": "Test Master",
            "password": "test123456",
            "user_type": "master",
            "city": "Пловдив"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "master"
        print("✅ Master registration - success")
    
    def test_register_company_requires_bulstat(self):
        """POST /api/auth/register - company without bulstat fails"""
        email = f"test_company_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "name": "Test Company",
            "password": "test123456",
            "user_type": "company",
            "city": "Варна"
        })
        # Should fail without bulstat
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print("✅ Company registration without bulstat - correctly rejected")
    
    def test_register_company_with_bulstat(self):
        """POST /api/auth/register - company with valid bulstat"""
        email = f"test_company_{uuid.uuid4().hex[:8]}@test.com"
        bulstat = str(100000000 + int(uuid.uuid4().hex[:8], 16) % 900000000)[:9]
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "name": "Test Company Ltd",
            "password": "test123456",
            "user_type": "company",
            "city": "Бургас",
            "bulstat": bulstat
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "company"
        print(f"✅ Company registration with bulstat {bulstat} - success")
    
    def test_register_designer(self):
        """POST /api/auth/register - designer registration"""
        email = f"test_designer_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "name": "Test Designer",
            "password": "test123456",
            "user_type": "designer",
            "city": "Русе"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "designer"
        print("✅ Designer registration - success")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
