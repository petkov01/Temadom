"""
Iteration 74 - Visual-Only Redesign Testing
Tests for TemaDom premium dark theme redesign.
All existing functionality should work unchanged.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicAPIs:
    """Basic health and stats endpoints"""
    
    def test_health_endpoint(self):
        """GET /api/health returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("PASS: /api/health returns status=ok")
    
    def test_stats_endpoint(self):
        """GET /api/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data or "free_slots" in data
        print(f"PASS: /api/stats returns data: {list(data.keys())}")
    
    def test_stats_live_endpoint(self):
        """GET /api/stats/live returns live statistics"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "companies" in data
        assert "free_slots" in data
        print(f"PASS: /api/stats/live - clients={data.get('clients')}, companies={data.get('companies')}")


class TestAuthenticationAPIs:
    """Authentication endpoints - functionality unchanged"""
    
    def test_register_client(self):
        """POST /api/auth/register creates a new client user"""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "email": f"test_iter74_{unique_id}@temadom.bg",
            "password": "TestPass123!",
            "name": f"Test User {unique_id}",
            "user_type": "client",
            "city": "София",
            "phone": "0888123456"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == payload["email"]
        assert data["user"]["user_type"] == "client"
        print(f"PASS: /api/auth/register - created user {payload['email']}")
        return data
    
    def test_login_user(self):
        """POST /api/auth/login authenticates user"""
        # First register a user
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        reg_payload = {
            "email": f"login_test_{unique_id}@temadom.bg",
            "password": "LoginTest123!",
            "name": f"Login Test {unique_id}",
            "user_type": "client",
            "city": "Варна"
        }
        requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
        
        # Now login
        login_payload = {
            "email": reg_payload["email"],
            "password": reg_payload["password"]
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == reg_payload["email"]
        print(f"PASS: /api/auth/login - authenticated {reg_payload['email']}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login rejects invalid credentials"""
        payload = {
            "email": "nonexistent@temadom.bg",
            "password": "WrongPassword123!"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code in [401, 404, 400]
        print("PASS: /api/auth/login correctly rejects invalid credentials")


class TestCategoriesAndProjects:
    """Categories and projects endpoints"""
    
    def test_categories_endpoint(self):
        """GET /api/categories returns category list"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        # Can be dict with categories key or direct list
        if isinstance(data, dict):
            assert "categories" in data
            categories = data["categories"]
        else:
            categories = data
        assert isinstance(categories, list)
        assert len(categories) > 0
        cat = categories[0]
        assert "id" in cat or "_id" in cat or "name" in cat
        print(f"PASS: /api/categories returns {len(categories)} categories")
    
    def test_projects_endpoint(self):
        """GET /api/projects returns projects list"""
        response = requests.get(f"{BASE_URL}/api/projects")
        # This may require auth, so accept 200 or 401
        assert response.status_code in [200, 401]
        if response.status_code == 200:
            data = response.json()
            print(f"PASS: /api/projects returns data")
        else:
            print("PASS: /api/projects returns 401 (requires auth) - expected behavior")


class TestCompaniesEndpoint:
    """Companies listing endpoint"""
    
    def test_companies_endpoint(self):
        """GET /api/companies returns companies list"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))
        print(f"PASS: /api/companies returns data")
    
    def test_companies_with_filters(self):
        """GET /api/companies with query filters"""
        response = requests.get(f"{BASE_URL}/api/companies", params={"user_type": "company"})
        assert response.status_code == 200
        print("PASS: /api/companies accepts filters")


class TestCalculatorEndpoint:
    """Calculator status and functionality"""
    
    def test_calculator_status(self):
        """GET /api/calculator/status returns status"""
        response = requests.get(f"{BASE_URL}/api/calculator/status")
        # Calculator may require auth (401) or be public (200)
        assert response.status_code in [200, 401]
        if response.status_code == 200:
            data = response.json()
            print(f"PASS: /api/calculator/status returns data: {data}")
        else:
            print("PASS: /api/calculator/status requires auth (expected)")


class TestReviewsEndpoint:
    """Reviews functionality"""
    
    def test_reviews_endpoint(self):
        """GET /api/reviews returns reviews"""
        response = requests.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200
        data = response.json()
        # Should have reviews list and stats
        if isinstance(data, dict):
            assert "reviews" in data or "stats" in data
        print("PASS: /api/reviews returns data")


class TestAdditionalEndpoints:
    """Additional endpoints from the app"""
    
    def test_heartbeat(self):
        """POST /api/heartbeat for online status"""
        response = requests.post(f"{BASE_URL}/api/heartbeat", json={"session_id": "test_session"})
        assert response.status_code == 200
        print("PASS: /api/heartbeat works")
    
    def test_subscriptions_plans(self):
        """Check if subscription plans are available"""
        # This might be embedded in frontend, but check if there's an API
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        # May or may not exist as API
        if response.status_code == 200:
            print("PASS: /api/subscriptions/plans exists")
        else:
            print(f"INFO: /api/subscriptions/plans returned {response.status_code} - may be frontend-only")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
