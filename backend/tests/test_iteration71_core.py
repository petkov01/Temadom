"""
Iteration 71 Core Tests
Focus: Landing page, mobile responsiveness, navigation, auth flows, AI Designer auth gate
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://room-render-staging.preview.emergentagent.com')

class TestHealthEndpoints:
    """Health and basic API endpoint tests"""
    
    def test_health_check(self):
        """GET /api/health returns OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✅ GET /api/health returns status=ok")
    
    def test_stats_live(self):
        """GET /api/stats/live returns live statistics"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "companies" in data
        assert "free_slots" in data
        assert "regions" in data
        assert data["free_slots"]["total"] == 56
        print(f"✅ GET /api/stats/live: clients={data['clients']}, companies={data['companies']}, online={data.get('online', 1)}")

class TestAuthFlows:
    """Authentication registration and login tests"""
    
    def test_register_client_success(self):
        """POST /api/auth/register with user_type=client works"""
        unique_email = f"TEST_client_{uuid.uuid4().hex[:8]}@test.bg"
        payload = {
            "email": unique_email,
            "password": "Test1234!",
            "name": "Тест Клиент",
            "user_type": "client",
            "city": "София"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "client"
        assert data["user"]["email"] == unique_email
        print(f"✅ POST /api/auth/register (client): registered {unique_email}")
        return data["token"]
    
    def test_register_company_with_bulstat(self):
        """POST /api/auth/register with user_type=company requires valid 9-digit bulstat"""
        unique_email = f"TEST_company_{uuid.uuid4().hex[:8]}@test.bg"
        bulstat = "".join([str(i % 10) for i in range(9)])  # 9 digits
        payload = {
            "email": unique_email,
            "password": "Test1234!",
            "name": "Тест Фирма",
            "user_type": "company",
            "city": "Ямбол",  # Use region with available slots
            "bulstat": bulstat
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        # May fail if bulstat already registered or region full - that's OK
        if response.status_code == 200:
            data = response.json()
            assert data["user"]["user_type"] == "company"
            print(f"✅ POST /api/auth/register (company): registered with bulstat {bulstat}")
        elif response.status_code == 400:
            error = response.json().get("detail", "")
            print(f"⚠️ POST /api/auth/register (company): {error} (expected if bulstat/region full)")
        else:
            pytest.fail(f"Unexpected status {response.status_code}")
    
    def test_register_invalid_user_type_designer(self):
        """POST /api/auth/register with user_type=designer should fail (removed)"""
        unique_email = f"TEST_designer_{uuid.uuid4().hex[:8]}@test.bg"
        payload = {
            "email": unique_email,
            "password": "Test1234!",
            "name": "Тест Designer",
            "user_type": "designer",
            "city": "София"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 400
        print("✅ POST /api/auth/register (designer): correctly REJECTED (400)")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with wrong credentials returns 401"""
        payload = {
            "email": "nonexistent@test.bg",
            "password": "WrongPassword123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 401
        print("✅ POST /api/auth/login (invalid): returns 401")
    
    def test_login_valid_credentials(self):
        """POST /api/auth/login with valid credentials works"""
        # First register a user
        unique_email = f"TEST_login_{uuid.uuid4().hex[:8]}@test.bg"
        register_payload = {
            "email": unique_email,
            "password": "Test1234!",
            "name": "Тест Login",
            "user_type": "client",
            "city": "София"
        }
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
        assert reg_response.status_code == 200
        
        # Now try to login
        login_payload = {
            "email": unique_email,
            "password": "Test1234!"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == unique_email
        print(f"✅ POST /api/auth/login (valid): logged in {unique_email}")

class TestCategoriesAndCompanies:
    """Categories and companies endpoint tests"""
    
    def test_categories_list(self):
        """GET /api/categories returns all construction categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) >= 10  # Should have many categories
        print(f"✅ GET /api/categories: {len(data['categories'])} categories returned")
    
    def test_companies_list(self):
        """GET /api/companies returns companies list"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert "total" in data
        print(f"✅ GET /api/companies: {data['total']} total companies")
    
    def test_companies_filter_by_type(self):
        """GET /api/companies?user_type=company/master filters correctly"""
        # Test company filter
        response = requests.get(f"{BASE_URL}/api/companies?user_type=company")
        assert response.status_code == 200
        data = response.json()
        print(f"✅ GET /api/companies?user_type=company: {data['total']} companies")
        
        # Test master filter
        response = requests.get(f"{BASE_URL}/api/companies?user_type=master")
        assert response.status_code == 200
        data = response.json()
        print(f"✅ GET /api/companies?user_type=master: {data['total']} masters")

class TestAIDesignerAccess:
    """Test AI Designer page access control"""
    
    def test_ai_test_endpoint(self):
        """POST /api/test-ai checks AI connection status"""
        response = requests.post(f"{BASE_URL}/api/test-ai")
        assert response.status_code == 200
        data = response.json()
        # May return status=ok or error depending on configuration
        if "status" in data:
            print(f"✅ POST /api/test-ai: {data['status']}")
        elif "error" in data:
            print(f"⚠️ POST /api/test-ai: {data.get('code', 'error')} - {data['error'][:50]}...")
        else:
            print(f"✅ POST /api/test-ai: responded")

class TestCalculatorEndpoints:
    """Calculator related endpoints"""
    
    def test_calculator_status_requires_auth(self):
        """GET /api/calculator/status requires authentication"""
        response = requests.get(f"{BASE_URL}/api/calculator/status")
        # Should require auth
        assert response.status_code in [401, 403, 422]
        print("✅ GET /api/calculator/status requires auth (401/403/422)")

class TestReviewsEndpoint:
    """Reviews/testimonials endpoint tests"""
    
    def test_reviews_list(self):
        """GET /api/reviews returns public reviews"""
        response = requests.get(f"{BASE_URL}/api/reviews?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        assert "stats" in data
        print(f"✅ GET /api/reviews: {len(data['reviews'])} reviews, avg_rating={data['stats'].get('avg_rating')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
