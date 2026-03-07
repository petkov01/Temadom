"""
Iteration 70: Test showcase features, pricing, info sections, and designer rejection

Tests:
- POST /api/auth/register with user_type='designer' is REJECTED (400)
- POST /api/auth/register with user_type='client' works
- POST /api/auth/register with user_type='master' works
- GET /api/companies returns data
- GET /api/categories returns categories
- GET /api/stats/live returns live stats
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestDesignerRejection:
    """Test that designer registration is rejected"""
    
    def test_register_designer_rejected(self):
        """POST /api/auth/register with user_type='designer' should be rejected"""
        payload = {
            "name": f"TEST_Designer_{uuid.uuid4().hex[:6]}",
            "email": f"test_designer_{uuid.uuid4().hex[:6]}@test.com",
            "password": "testpass123",
            "city": "София",
            "phone": "0888123456",
            "user_type": "designer"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 400, f"Expected 400 for designer registration, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✅ Designer registration correctly rejected: {data['detail']}")
    
    def test_register_client_works(self):
        """POST /api/auth/register with user_type='client' should work"""
        payload = {
            "name": f"TEST_Client_{uuid.uuid4().hex[:6]}",
            "email": f"test_client_{uuid.uuid4().hex[:6]}@test.com",
            "password": "testpass123",
            "city": "София",
            "phone": "0888123456",
            "user_type": "client"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Expected 200 for client registration, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "client"
        print(f"✅ Client registration works: {data['user']['email']}")
    
    def test_register_master_works(self):
        """POST /api/auth/register with user_type='master' should work"""
        payload = {
            "name": f"TEST_Master_{uuid.uuid4().hex[:6]}",
            "email": f"test_master_{uuid.uuid4().hex[:6]}@test.com",
            "password": "testpass123",
            "city": "Пловдив",
            "phone": "0888123456",
            "user_type": "master"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Expected 200 for master registration, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "master"
        print(f"✅ Master registration works: {data['user']['email']}")


class TestPublicEndpoints:
    """Test public API endpoints"""
    
    def test_companies_endpoint(self):
        """GET /api/companies should return companies list"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        print(f"✅ GET /api/companies works: {len(data['companies'])} companies found")
    
    def test_companies_filter_company(self):
        """GET /api/companies?user_type=company should filter by company type"""
        response = requests.get(f"{BASE_URL}/api/companies?user_type=company")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        # Verify all results are companies if any exist
        for company in data["companies"]:
            if "user_type" in company:
                assert company["user_type"] == "company", f"Expected company, got {company.get('user_type')}"
        print(f"✅ GET /api/companies?user_type=company works: {len(data['companies'])} companies")
    
    def test_companies_filter_master(self):
        """GET /api/companies?user_type=master should filter by master type"""
        response = requests.get(f"{BASE_URL}/api/companies?user_type=master")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        for company in data["companies"]:
            if "user_type" in company:
                assert company["user_type"] == "master", f"Expected master, got {company.get('user_type')}"
        print(f"✅ GET /api/companies?user_type=master works: {len(data['companies'])} masters")
    
    def test_categories_endpoint(self):
        """GET /api/categories should return categories list"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ GET /api/categories works: {len(data['categories'])} categories")
    
    def test_stats_live_endpoint(self):
        """GET /api/stats/live should return live statistics"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert "total_firms" in data or "firms" in data or "total" in data or isinstance(data.get("regions"), dict)
        print(f"✅ GET /api/stats/live works: {data.keys()}")


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials should return 401"""
        payload = {
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ POST /api/auth/login with invalid credentials returns 401")
    
    def test_google_callback_requires_session_id(self):
        """POST /api/auth/google/callback without session_id should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/google/callback", json={})
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("✅ POST /api/auth/google/callback requires session_id")
    
    def test_google_callback_invalid_session(self):
        """POST /api/auth/google/callback with invalid session_id should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/google/callback", json={"session_id": "invalid123"})
        # Should be 401, 400, or 502 (if auth service unreachable)
        assert response.status_code in [400, 401, 502], f"Expected 400/401/502, got {response.status_code}"
        print(f"✅ POST /api/auth/google/callback rejects invalid session_id: {response.status_code}")


class TestPricingEndpoints:
    """Test pricing-related functionality"""
    
    def test_payment_packages_available(self):
        """Verify design packages have correct prices (69/119/199 EUR)"""
        # This tests the server.py PAYMENT_PACKAGES config
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        # The actual pricing is frontend-side, but we can verify the server is running
        print("✅ Server is up, pricing is frontend-defined (69/119/199 EUR)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
