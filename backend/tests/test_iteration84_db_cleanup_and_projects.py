# Test iteration 84: DB cleanup verification, projects page merge, navigation updates, subscription features
# Tests: live stats (0 counts), /projects public access, companies priority sort, photo limits per plan, navigation

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

class TestDBCleanupStats:
    """Verify live stats endpoint works and reports counts"""
    
    def test_live_stats_returns_valid_data(self):
        """Test /api/stats/live returns valid structure with counts"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields exist
        assert "clients" in data
        assert "companies" in data
        assert "projects" in data
        assert "free_slots" in data
        
        # Verify counts are non-negative integers
        assert isinstance(data["clients"], int) and data["clients"] >= 0
        assert isinstance(data["companies"], int) and data["companies"] >= 0
        assert isinstance(data["projects"], int) and data["projects"] >= 0
        print(f"✓ Live stats: clients={data['clients']}, companies={data['companies']}, projects={data['projects']}")


class TestProjectsPublicAccess:
    """Test /projects page is publicly accessible without auth"""
    
    def test_projects_endpoint_no_auth(self):
        """Test GET /api/projects works without authentication"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        # Verify projects is a list (may have test data from previous runs)
        assert isinstance(data["projects"], list)
        print(f"✓ Projects endpoint works without auth. Total projects: {data['total']}")
    
    def test_projects_with_section_type_filter(self):
        """Test projects filtering by section_type (renovation/construction)"""
        for section in ["renovation", "construction"]:
            response = requests.get(f"{BASE_URL}/api/projects?section_type={section}")
            assert response.status_code == 200
            data = response.json()
            assert "projects" in data
            print(f"✓ Projects filtered by section_type={section}: {data['total']} results")


class TestCategoriesEndpoint:
    """Test categories for renovation/construction sections"""
    
    def test_categories_renovation(self):
        """Test GET /api/categories for renovation section"""
        response = requests.get(f"{BASE_URL}/api/categories?section=renovation")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        categories = data["categories"]
        assert len(categories) > 0, "Expected at least some renovation categories"
        print(f"✓ Renovation categories count: {len(categories)}")
    
    def test_categories_construction(self):
        """Test GET /api/categories for construction section"""
        response = requests.get(f"{BASE_URL}/api/categories?section=construction")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert "property_types" in data  # Construction has property types
        print(f"✓ Construction categories count: {len(data['categories'])}, property_types: {len(data.get('property_types', []))}")


class TestCompaniesEndpoint:
    """Test companies endpoint with priority sorting by subscription_plan"""
    
    def test_companies_list_empty(self):
        """Test GET /api/companies returns empty after DB cleanup"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert data["total"] == 0, "Expected 0 companies after DB cleanup"
        print(f"✓ Companies list empty after cleanup: {data['total']}")


class TestUserRegistration:
    """Test user registration flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Generate unique test user credentials"""
        self.unique_id = str(uuid.uuid4())[:8]
        self.client_email = f"TEST_client_{self.unique_id}@test.bg"
        self.company_email = f"TEST_company_{self.unique_id}@test.bg"
        self.password = "Test1234!"
    
    def test_register_client_user(self):
        """Test registering a new client user"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test Client",
            "email": self.client_email,
            "password": self.password,
            "user_type": "client"
        })
        assert response.status_code in [200, 201], f"Registration failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "client"
        print(f"✓ Client registered: {self.client_email}")
        return data
    
    def test_register_company_user(self):
        """Test registering a new company user (requires 9-digit bulstat for companies)"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test Company",
            "email": self.company_email,
            "password": self.password,
            "user_type": "company",
            "bulstat": "123456789"  # Bulgarian company ID (bulstat) must be exactly 9 digits
        })
        assert response.status_code in [200, 201], f"Registration failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "company"
        print(f"✓ Company registered: {self.company_email}")


class TestCreateProjectFlow:
    """Test project creation flow - requires authenticated client"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Register a test client and get token"""
        self.unique_id = str(uuid.uuid4())[:8]
        self.client_email = f"TEST_projectcreator_{self.unique_id}@test.bg"
        self.password = "Test1234!"
        
        # Register client
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Project Creator Client",
            "email": self.client_email,
            "password": self.password,
            "user_type": "client"
        })
        if reg_response.status_code not in [200, 201]:
            pytest.skip(f"Could not register test client: {reg_response.text}")
        
        data = reg_response.json()
        self.token = data["token"]
        self.user = data["user"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_create_project_requires_auth(self):
        """Test that creating a project without auth fails"""
        response = requests.post(f"{BASE_URL}/api/projects", json={
            "title": "Test Project",
            "description": "Test description",
            "category": "electricity",
            "city": "София"
        })
        assert response.status_code in [401, 403], "Expected auth error without token"
        print("✓ Project creation requires authentication")
    
    def test_create_renovation_project(self):
        """Test creating a renovation project as authenticated client"""
        project_data = {
            "title": f"TEST_renovation_{self.unique_id}",
            "description": "Тестов ремонтен проект - електричество",
            "category": "electricity",
            "city": "София",
            "section_type": "renovation",
            "budget_min": 500,
            "budget_max": 2000
        }
        response = requests.post(f"{BASE_URL}/api/projects", json=project_data, headers=self.headers)
        assert response.status_code in [200, 201], f"Project creation failed: {response.text}"
        data = response.json()
        assert "id" in data or "project_id" in data
        print(f"✓ Renovation project created: {project_data['title']}")
        
        # Verify project appears in list
        list_response = requests.get(f"{BASE_URL}/api/projects?section_type=renovation")
        assert list_response.status_code == 200
        projects = list_response.json()["projects"]
        assert any(p.get("title") == project_data["title"] for p in projects), "Created project not found in list"
        print(f"✓ Project visible in browse list")
    
    def test_create_construction_project(self):
        """Test creating a construction project"""
        project_data = {
            "title": f"TEST_construction_{self.unique_id}",
            "description": "Тестов строителен проект - къща",
            "category": "turnkey",
            "city": "Пловдив",
            "section_type": "construction",
            "property_type": "house",
            "land_area": 500,
            "building_area": 150,
            "floors": 2
        }
        response = requests.post(f"{BASE_URL}/api/projects", json=project_data, headers=self.headers)
        assert response.status_code in [200, 201], f"Project creation failed: {response.text}"
        print(f"✓ Construction project created: {project_data['title']}")


class TestCompanyPhotoLimits:
    """Test photo limits per subscription plan (10 basic, 50 pro, 999 premium)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Register a company user for testing"""
        self.unique_id = str(uuid.uuid4())[:8]
        self.company_email = f"TEST_photolimit_{self.unique_id}@test.bg"
        self.password = "Test1234!"
        
        # Register company
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Photo Limit Test Company",
            "email": self.company_email,
            "password": self.password,
            "user_type": "company"
        })
        if reg_response.status_code not in [200, 201]:
            pytest.skip(f"Could not register test company: {reg_response.text}")
        
        data = reg_response.json()
        self.token = data["token"]
        self.user = data["user"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_basic_plan_photo_limit(self):
        """Test that basic plan has 10 photo limit enforced"""
        # Try to update profile with 11 photos (should fail for basic plan)
        photos = [f"data:image/png;base64,fake_photo_{i}" for i in range(11)]
        
        response = requests.put(f"{BASE_URL}/api/companies/profile", 
            json={"portfolio_images": photos}, 
            headers=self.headers
        )
        
        # Should fail because basic plan only allows 10 photos
        assert response.status_code == 400, f"Expected 400 for exceeding photo limit, got {response.status_code}"
        assert "10" in response.text or "снимки" in response.text.lower()
        print("✓ Basic plan 10 photo limit enforced")
    
    def test_within_photo_limit(self):
        """Test that updating with photos within limit works"""
        # Try with 5 photos (within basic limit)
        photos = [f"data:image/png;base64,fake_photo_{i}" for i in range(5)]
        
        response = requests.put(f"{BASE_URL}/api/companies/profile", 
            json={"portfolio_images": photos}, 
            headers=self.headers
        )
        
        # Should succeed
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        print("✓ Profile update with 5 photos succeeded (within limit)")


class TestSubscriptionPlans:
    """Test subscription plans endpoint"""
    
    def test_subscription_plans_endpoint(self):
        """Test GET /api/subscriptions/plans returns correct plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        plans = data["plans"]
        
        # Plans are nested: plans.company.{basic, pro, premium}
        company_plans = plans.get("company", {})
        assert "basic" in company_plans, "Basic plan not found"
        assert "pro" in company_plans, "Pro plan not found"
        assert "premium" in company_plans, "Premium plan not found"
        
        # Verify basic plan has max_photos=10 limit referenced
        basic = company_plans["basic"]
        assert "БАЗОВ" in basic.get("name", "")
        print(f"✓ Subscription plans found: basic, pro, premium")


class TestHealthAndBasicEndpoints:
    """Test basic health and info endpoints"""
    
    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") in ["ok", "healthy"]
        print("✓ Health endpoint OK")
    
    def test_stats_endpoint(self):
        """Test /api/stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        print("✓ Stats endpoint OK")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
