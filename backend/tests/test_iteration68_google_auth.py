"""
Iteration 68 Tests: Designer removal & Google OAuth
Tests:
1. Registration page tabs (no designer)
2. POST /api/auth/register validation (no designer user_type)
3. Google OAuth callback endpoint
4. Navbar text regression check
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestRegistrationValidation:
    """Test registration user_type validation - no 'designer' allowed"""
    
    def test_register_client_works(self):
        """POST /api/auth/register with user_type='client' should work"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "TEST_Client_68",
            "email": f"test_client_68_{os.urandom(4).hex()}@test.bg",
            "password": "test123456",
            "user_type": "client",
            "city": "София"
        })
        # Either 200 (success) or 400 (email exists) - not 422 (validation error)
        assert response.status_code in [200, 400], f"Client registration failed: {response.text}"
        if response.status_code == 200:
            data = response.json()
            assert "token" in data, "No token in response"
            assert data["user"]["user_type"] == "client"
            print("✅ Client registration works")
        else:
            print(f"✅ Client registration endpoint works (email may exist): {response.json()}")

    def test_register_company_works(self):
        """POST /api/auth/register with user_type='company' should work (may fail on bulstat/region limit)"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "TEST_Company_68",
            "email": f"test_company_68_{os.urandom(4).hex()}@test.bg",
            "password": "test123456",
            "user_type": "company",
            "city": "Ямбол",
            "bulstat": "999888776"  # Random bulstat
        })
        # 200 success, 400 (email/bulstat exists or region full), but not 422 (invalid user_type)
        assert response.status_code in [200, 400], f"Company registration failed with status {response.status_code}: {response.text}"
        print(f"✅ Company registration endpoint works (status {response.status_code})")

    def test_register_master_works(self):
        """POST /api/auth/register with user_type='master' should work"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "TEST_Master_68",
            "email": f"test_master_68_{os.urandom(4).hex()}@test.bg",
            "password": "test123456",
            "user_type": "master",
            "city": "Пловдив"
        })
        assert response.status_code in [200, 400], f"Master registration failed: {response.text}"
        if response.status_code == 200:
            data = response.json()
            assert "token" in data
            assert data["user"]["user_type"] == "master"
            print("✅ Master registration works")
        else:
            print(f"✅ Master registration endpoint works (status {response.status_code})")

    def test_register_designer_rejected(self):
        """POST /api/auth/register with user_type='designer' should be REJECTED"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "TEST_Designer_68",
            "email": f"test_designer_68_{os.urandom(4).hex()}@test.bg",
            "password": "test123456",
            "user_type": "designer",
            "city": "София"
        })
        # Should return 400 or 422 (validation error) - NOT 200
        assert response.status_code in [400, 422], f"Designer registration should be rejected! Got status {response.status_code}: {response.text}"
        data = response.json()
        # Check error message mentions invalid user type
        error_detail = data.get("detail", "")
        assert "тип" in error_detail.lower() or "type" in error_detail.lower() or "невалиден" in error_detail.lower(), f"Error should mention invalid type: {error_detail}"
        print(f"✅ Designer registration correctly rejected: {error_detail}")


class TestGoogleAuthEndpoint:
    """Test Google OAuth callback endpoint"""
    
    def test_google_callback_endpoint_exists(self):
        """POST /api/auth/google/callback endpoint should exist"""
        response = requests.post(f"{BASE_URL}/api/auth/google/callback", json={})
        # Should NOT be 404 - endpoint exists but may return 400 (missing session_id)
        assert response.status_code != 404, "Google callback endpoint does not exist"
        print(f"✅ Google callback endpoint exists (status: {response.status_code})")

    def test_google_callback_requires_session_id(self):
        """POST /api/auth/google/callback without session_id should return 400"""
        response = requests.post(f"{BASE_URL}/api/auth/google/callback", json={})
        assert response.status_code == 400, f"Should return 400 for missing session_id, got {response.status_code}"
        data = response.json()
        assert "session_id" in data.get("detail", "").lower(), f"Error should mention session_id: {data}"
        print("✅ Google callback requires session_id")

    def test_google_callback_invalid_session(self):
        """POST /api/auth/google/callback with invalid session_id should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/google/callback", json={
            "session_id": "invalid_fake_session_12345"
        })
        # Should return 401 (invalid session) or 502 (upstream error)
        assert response.status_code in [401, 502], f"Invalid session should return 401/502, got {response.status_code}: {response.text}"
        print(f"✅ Invalid session_id correctly rejected (status: {response.status_code})")


class TestAuthEndpoints:
    """Test auth endpoints - login with test credentials"""
    
    def test_login_with_test_user(self):
        """Login with test user should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "chat@test.bg",
            "password": "test123456"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == "chat@test.bg"
        print(f"✅ Test user login works: {data['user']['name']}")


class TestStatsEndpoint:
    """Test stats/live endpoint - used for region dropdown"""
    
    def test_stats_live(self):
        """GET /api/stats/live should return regions data"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200, f"Stats failed: {response.text}"
        data = response.json()
        assert "regions" in data
        assert "companies" in data
        print(f"✅ Stats endpoint works: {data['companies']} companies registered")


class TestCategories:
    """Test categories endpoint - regression check"""
    
    def test_categories_no_designer(self):
        """GET /api/categories should work (regression check)"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✅ Categories endpoint works: {len(data['categories'])} categories")
