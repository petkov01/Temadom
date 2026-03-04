"""
Test suite for TemaDom v10.8 features
- Subscription plans endpoint
- Demo projects endpoint
- AI Design status endpoint
- Top companies endpoint
- Ads CRUD endpoints
- User registration with 4 types (client, company, designer, master)
- Reviews check endpoint
- Referrals status endpoint
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL_DESIGNER = f"test_designer_{uuid.uuid4().hex[:8]}@test.com"
TEST_EMAIL_COMPANY = f"test_company_{uuid.uuid4().hex[:8]}@test.com"
TEST_PASSWORD = "test1234"

class TestSubscriptionsEndpoint:
    """Test /api/subscriptions/plans endpoint"""
    
    def test_get_subscription_plans_returns_200(self):
        """GET /api/subscriptions/plans should return 200"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/subscriptions/plans returns 200")
        
    def test_subscription_plans_has_test_mode_flag(self):
        """Response should include test_mode=true"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        assert "test_mode" in data, "Response missing 'test_mode' field"
        assert data["test_mode"] == True, "test_mode should be True"
        print("✅ Subscription plans has test_mode=true")
        
    def test_subscription_plans_structure(self):
        """Response should have company and designer plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        assert "plans" in data, "Response missing 'plans' field"
        plans = data["plans"]
        assert "company" in plans, "Missing company plans"
        assert "designer" in plans, "Missing designer plans"
        # Company should have basic, pro, premium
        assert "basic" in plans["company"], "Missing company basic plan"
        assert "pro" in plans["company"], "Missing company pro plan"
        assert "premium" in plans["company"], "Missing company premium plan"
        # Designer should have designer plan
        assert "designer" in plans["designer"], "Missing designer plan"
        print("✅ Subscription plans structure is correct")


class TestDemoProjectsEndpoint:
    """Test /api/demo-projects endpoint"""
    
    def test_demo_projects_returns_200(self):
        """GET /api/demo-projects should return 200"""
        response = requests.get(f"{BASE_URL}/api/demo-projects")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/demo-projects returns 200")
        
    def test_demo_projects_returns_4_projects(self):
        """Should return 4 demo projects"""
        response = requests.get(f"{BASE_URL}/api/demo-projects")
        data = response.json()
        assert "projects" in data, "Response missing 'projects' field"
        assert len(data["projects"]) == 4, f"Expected 4 demo projects, got {len(data['projects'])}"
        print("✅ /api/demo-projects returns 4 projects")
        
    def test_demo_projects_have_required_fields(self):
        """Each demo project should have id, title, city, budget"""
        response = requests.get(f"{BASE_URL}/api/demo-projects")
        data = response.json()
        for project in data["projects"]:
            assert "id" in project, "Project missing 'id'"
            assert "title" in project, "Project missing 'title'"
            assert "city" in project, "Project missing 'city'"
            assert "budget" in project, "Project missing 'budget'"
        print("✅ Demo projects have all required fields")


class TestAIDesignStatusEndpoint:
    """Test /api/ai-design/status endpoint"""
    
    def test_ai_design_status_returns_200(self):
        """GET /api/ai-design/status should return 200 (unauthenticated)"""
        response = requests.get(f"{BASE_URL}/api/ai-design/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/ai-design/status returns 200")
        
    def test_ai_design_status_has_counters(self):
        """Response should include global_free_remaining and test_mode"""
        response = requests.get(f"{BASE_URL}/api/ai-design/status")
        data = response.json()
        assert "global_free_remaining" in data, "Missing 'global_free_remaining'"
        assert "global_limit" in data, "Missing 'global_limit'"
        assert "test_mode" in data, "Missing 'test_mode'"
        assert data["global_limit"] == 100, "Global limit should be 100"
        print(f"✅ AI design status: {data['global_free_remaining']}/{data['global_limit']} remaining")


class TestTopCompaniesEndpoint:
    """Test /api/top-companies endpoint"""
    
    def test_top_companies_returns_200(self):
        """GET /api/top-companies should return 200"""
        response = requests.get(f"{BASE_URL}/api/top-companies")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/top-companies returns 200")
        
    def test_top_companies_returns_list(self):
        """Response should include companies array"""
        response = requests.get(f"{BASE_URL}/api/top-companies")
        data = response.json()
        assert "companies" in data, "Response missing 'companies' field"
        assert isinstance(data["companies"], list), "companies should be a list"
        print(f"✅ /api/top-companies returns {len(data['companies'])} companies")


class TestAdsEndpoints:
    """Test /api/ads CRUD endpoints"""
    
    def test_get_ads_returns_200(self):
        """GET /api/ads should return 200"""
        response = requests.get(f"{BASE_URL}/api/ads")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/ads returns 200")
        
    def test_get_ads_returns_structure(self):
        """Response should have ads list, total, page, pages"""
        response = requests.get(f"{BASE_URL}/api/ads")
        data = response.json()
        assert "ads" in data, "Missing 'ads' field"
        assert "total" in data, "Missing 'total' field"
        assert "page" in data, "Missing 'page' field"
        assert "pages" in data, "Missing 'pages' field"
        print(f"✅ /api/ads structure correct, {len(data['ads'])} ads found")
        
    def test_create_ad_requires_auth(self):
        """POST /api/ads should require authentication"""
        response = requests.post(f"{BASE_URL}/api/ads", json={"title": "Test Ad"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ POST /api/ads requires authentication")


class TestUserRegistration:
    """Test user registration with 4 user types"""
    
    def test_register_designer_succeeds(self):
        """Registration with user_type='designer' should succeed"""
        email = f"test_designer_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": "Test Designer",
            "email": email,
            "password": "test1234",
            "user_type": "designer",
            "city": "София"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Response missing 'token'"
        assert "user" in data, "Response missing 'user'"
        assert data["user"]["user_type"] == "designer", "user_type should be 'designer'"
        print(f"✅ Designer registration successful: {email}")
        return data["token"]
        
    def test_register_client_succeeds(self):
        """Registration with user_type='client' should succeed"""
        email = f"test_client_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": "Test Client",
            "email": email,
            "password": "test1234",
            "user_type": "client",
            "city": "Пловдив"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["user"]["user_type"] == "client", "user_type should be 'client'"
        print(f"✅ Client registration successful: {email}")
        
    def test_register_master_succeeds(self):
        """Registration with user_type='master' should succeed"""
        email = f"test_master_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": "Test Master",
            "email": email,
            "password": "test1234",
            "user_type": "master",
            "city": "Варна"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["user"]["user_type"] == "master", "user_type should be 'master'"
        print(f"✅ Master registration successful: {email}")
        
    def test_register_company_requires_bulstat(self):
        """Registration with user_type='company' requires bulstat"""
        email = f"test_company_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": "Test Company",
            "email": email,
            "password": "test1234",
            "user_type": "company",
            "city": "Бургас"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        # Should fail without bulstat
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Company registration correctly requires bulstat")
        
    def test_register_company_with_bulstat_succeeds(self):
        """Registration with user_type='company' and valid bulstat should succeed"""
        email = f"test_company_{uuid.uuid4().hex[:8]}@test.com"
        bulstat = str(uuid.uuid4().int)[:9]  # Random 9-digit number
        payload = {
            "name": "Test Company Ltd",
            "email": email,
            "password": "test1234",
            "user_type": "company",
            "city": "София",
            "bulstat": bulstat
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["user"]["user_type"] == "company", "user_type should be 'company'"
        print(f"✅ Company registration with bulstat successful: {email}")


class TestReviewsCheckEndpoint:
    """Test /api/reviews/check endpoint"""
    
    def test_reviews_check_returns_200(self):
        """POST /api/reviews/check should return 200"""
        response = requests.post(f"{BASE_URL}/api/reviews/check", json={"comment": "Great work!"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ POST /api/reviews/check returns 200")
        
    def test_reviews_check_approves_clean_comment(self):
        """Clean comment should be approved"""
        response = requests.post(f"{BASE_URL}/api/reviews/check", json={"comment": "Excellent renovation work, very professional!"})
        data = response.json()
        assert "approved" in data, "Missing 'approved' field"
        assert data["approved"] == True, "Clean comment should be approved"
        print("✅ Clean review comment approved")
        
    def test_reviews_check_empty_comment(self):
        """Empty comment should be approved (no content to check)"""
        response = requests.post(f"{BASE_URL}/api/reviews/check", json={"comment": ""})
        data = response.json()
        assert data["approved"] == True, "Empty comment should be approved"
        print("✅ Empty review comment approved")


class TestAdCreationWithAuth:
    """Test creating ads with authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Register a user and return auth token"""
        email = f"test_ad_user_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": "Test Ad User",
            "email": email,
            "password": "test1234",
            "user_type": "client",
            "city": "София"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        if response.status_code == 200:
            return response.json()["token"]
        # User might already exist, try login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "test1234"})
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not get auth token")
        
    def test_create_ad_with_auth_succeeds(self, auth_token):
        """POST /api/ads with valid token should create ad"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        payload = {
            "title": "Test Ad Title",
            "description": "This is a test ad description",
            "category": "general",
            "city": "София"
        }
        response = requests.post(f"{BASE_URL}/api/ads", json=payload, headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response missing 'id'"
        assert data["title"] == "Test Ad Title", "Title mismatch"
        print(f"✅ Ad created successfully with id: {data['id']}")
        return data["id"]


class TestStatsEndpoint:
    """Test /api/stats endpoint"""
    
    def test_stats_returns_200(self):
        """GET /api/stats should return 200"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/stats returns 200")
        
    def test_stats_has_required_fields(self):
        """Stats should include total_projects, total_companies, total_reviews"""
        response = requests.get(f"{BASE_URL}/api/stats")
        data = response.json()
        assert "total_projects" in data, "Missing 'total_projects'"
        assert "total_companies" in data, "Missing 'total_companies'"
        assert "total_reviews" in data, "Missing 'total_reviews'"
        print(f"✅ Stats: {data['total_companies']} companies, {data['total_projects']} projects, {data['total_reviews']} reviews")


class TestReferralsEndpoint:
    """Test /api/referrals/status endpoint"""
    
    def test_referrals_requires_auth(self):
        """GET /api/referrals/status should require authentication"""
        response = requests.get(f"{BASE_URL}/api/referrals/status")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ GET /api/referrals/status requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
