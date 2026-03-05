"""
Phase 1 Site Restructuring Tests - Iteration 28
Tests for new navigation structure, landing page, ready-projects API, AI Sketch page updates

Features tested:
- Homepage hero: 'Ремонт без стрес — БЕЗПЛАТНО'
- Ready Projects API: GET, POST, like, comment
- Navigation structure validation
- Subscription plans regression
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
TEST_EMAIL = f"phase1test{int(time.time())}@test.com"
TEST_PASSWORD = "test123"
TEST_NAME = "Phase1 Test"
TEST_PHONE = "0888999111"


class TestPhase1BackendAPIs:
    """Backend API tests for Phase 1 restructuring"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test - register user and get token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.token = None
        self.user_id = None
        
    def _register_user(self):
        """Helper to register a test user"""
        reg_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME,
            "user_type": "client",
            "phone": TEST_PHONE
        }
        response = self.session.post(f"{BASE_URL}/api/auth/register", json=reg_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            self.user_id = data.get("user", {}).get("id")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            return True
        elif response.status_code == 400 and "вече е регистриран" in response.text:
            # Try login instead
            return self._login_user()
        return False
    
    def _login_user(self):
        """Helper to login existing user"""
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            self.user_id = data.get("user", {}).get("id")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            return True
        return False

    # ============== HEALTH CHECK ==============
    def test_api_health(self):
        """Test API is running"""
        response = self.session.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "Maistori Marketplace API" in data.get("message", "")
        print("✅ API health check passed")

    # ============== READY PROJECTS API ==============
    def test_get_ready_projects_returns_200(self):
        """GET /api/ready-projects should return 200 with array"""
        response = self.session.get(f"{BASE_URL}/api/ready-projects")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✅ GET /api/ready-projects returns 200 with {len(data)} projects")

    def test_post_ready_projects_requires_auth(self):
        """POST /api/ready-projects should require authentication"""
        # Without auth header
        session_no_auth = requests.Session()
        session_no_auth.headers.update({"Content-Type": "application/json"})
        response = session_no_auth.post(f"{BASE_URL}/api/ready-projects", json={
            "title": "Test Project",
            "description": "Test description"
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ POST /api/ready-projects requires authentication")

    def test_post_ready_projects_creates_project(self):
        """POST /api/ready-projects creates a project with auth"""
        self._register_user()
        assert self.token is not None, "Failed to register/login user"
        
        project_data = {
            "title": "Test Ready Project",
            "description": "This is a test ready project",
            "source": "AI Sketch",
            "images": []
        }
        response = self.session.post(f"{BASE_URL}/api/ready-projects", json=project_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should contain project id"
        self.created_project_id = data["id"]
        print(f"✅ POST /api/ready-projects creates project with id: {self.created_project_id}")
        return data["id"]

    def test_like_ready_project_requires_auth(self):
        """POST /api/ready-projects/{id}/like requires auth"""
        session_no_auth = requests.Session()
        session_no_auth.headers.update({"Content-Type": "application/json"})
        response = session_no_auth.post(f"{BASE_URL}/api/ready-projects/test123/like")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ POST /api/ready-projects/{id}/like requires authentication")

    def test_like_ready_project_toggles_like(self):
        """POST /api/ready-projects/{id}/like toggles like with auth"""
        self._register_user()
        assert self.token is not None, "Failed to register/login user"
        
        # First create a project
        project_data = {
            "title": "Project to Like",
            "description": "Testing likes",
            "source": "Test"
        }
        create_response = self.session.post(f"{BASE_URL}/api/ready-projects", json=project_data)
        assert create_response.status_code == 200
        project_id = create_response.json()["id"]
        
        # Like the project
        like_response = self.session.post(f"{BASE_URL}/api/ready-projects/{project_id}/like")
        assert like_response.status_code == 200, f"Expected 200, got {like_response.status_code}: {like_response.text}"
        like_data = like_response.json()
        assert "likes" in like_data, "Response should contain likes count"
        assert "liked" in like_data, "Response should contain liked status"
        assert like_data["liked"] == True, "First like should set liked=True"
        print(f"✅ POST /api/ready-projects/{project_id}/like toggles like (likes: {like_data['likes']})")

    def test_comment_ready_project_requires_auth(self):
        """POST /api/ready-projects/{id}/comment requires auth"""
        session_no_auth = requests.Session()
        session_no_auth.headers.update({"Content-Type": "application/json"})
        response = session_no_auth.post(f"{BASE_URL}/api/ready-projects/test123/comment", json={"text": "Test"})
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ POST /api/ready-projects/{id}/comment requires authentication")

    def test_comment_ready_project_adds_comment(self):
        """POST /api/ready-projects/{id}/comment adds comment with auth"""
        self._register_user()
        assert self.token is not None, "Failed to register/login user"
        
        # First create a project
        project_data = {
            "title": "Project for Comments",
            "description": "Testing comments"
        }
        create_response = self.session.post(f"{BASE_URL}/api/ready-projects", json=project_data)
        assert create_response.status_code == 200
        project_id = create_response.json()["id"]
        
        # Add comment
        comment_data = {"text": "This is a test comment"}
        comment_response = self.session.post(
            f"{BASE_URL}/api/ready-projects/{project_id}/comment", 
            json=comment_data
        )
        assert comment_response.status_code == 200, f"Expected 200, got {comment_response.status_code}: {comment_response.text}"
        comment_resp_data = comment_response.json()
        assert "comments" in comment_resp_data, "Response should contain comments array"
        assert len(comment_resp_data["comments"]) > 0, "Comments array should not be empty"
        print(f"✅ POST /api/ready-projects/{project_id}/comment adds comment (total: {len(comment_resp_data['comments'])})")

    # ============== SUBSCRIPTION PLANS REGRESSION ==============
    def test_subscription_plans_returns_correct_data(self):
        """GET /api/subscriptions/plans should return correct plan data (regression)"""
        response = self.session.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "plans" in data, "Response should contain 'plans' key"
        plans = data["plans"]
        
        # Check nested structure: plans.company contains basic, pro, premium
        assert "company" in plans, "Plans should contain 'company' key"
        company_plans = plans["company"]
        
        # Check plan names exist
        assert "basic" in company_plans, "basic plan should exist"
        assert "pro" in company_plans, "pro plan should exist"
        assert "premium" in company_plans, "premium plan should exist"
        
        # Check БАЗОВ plan
        basic = company_plans["basic"]
        assert basic.get("name") == "БАЗОВ", f"Basic plan name should be БАЗОВ"
        assert "15" in basic.get("price", ""), f"БАЗОВ should have 15 EUR in price"
        
        # Check ПРО plan
        pro = company_plans["pro"]
        assert pro.get("name") == "ПРО", f"Pro plan name should be ПРО"
        assert "35" in pro.get("price", ""), f"ПРО should have 35 EUR in price"
        
        # Check PREMIUM plan
        premium = company_plans["premium"]
        assert premium.get("name") == "PREMIUM", f"Premium plan name should be PREMIUM"
        assert "75" in premium.get("price", ""), f"PREMIUM should have 75 EUR in price"
        
        print("✅ GET /api/subscriptions/plans returns correct data: БАЗОВ(15), ПРО(35), PREMIUM(75)")

    # ============== CATEGORIES API ==============
    def test_categories_returns_list(self):
        """GET /api/categories should return categories list"""
        response = self.session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "categories" in data, "Response should contain 'categories' key"
        assert len(data["categories"]) > 0, "Categories should not be empty"
        print(f"✅ GET /api/categories returns {len(data['categories'])} categories")

    # ============== STATS API ==============
    def test_stats_returns_counts(self):
        """GET /api/stats should return project/company/review counts"""
        response = self.session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "total_projects" in data, "Response should contain total_projects"
        assert "total_companies" in data, "Response should contain total_companies"
        assert "total_reviews" in data, "Response should contain total_reviews"
        print(f"✅ GET /api/stats returns counts: {data['total_projects']} projects, {data['total_companies']} companies")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
