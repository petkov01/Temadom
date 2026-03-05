"""
Iteration 40 Tests: About page redesign, Video Designer multi-room packages, Profile page, PUT /api/auth/profile
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestIteration40Backend:
    """Backend API tests for iteration 40 features"""
    
    # Test credentials
    TEST_EMAIL = "profile@temadom.bg"
    TEST_PASSWORD = "Test123!"
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup base URL"""
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self):
        """Helper to login and get auth token"""
        response = self.session.post(f"{self.base_url}/api/auth/login", json={
            "email": self.TEST_EMAIL,
            "password": self.TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_api_health(self):
        """Test API is responding"""
        response = self.session.get(f"{self.base_url}/api/")
        assert response.status_code == 200
        print("✅ API health check passed")
    
    def test_login_with_test_account(self):
        """Test login with profile@temadom.bg test account"""
        response = self.session.post(f"{self.base_url}/api/auth/login", json={
            "email": self.TEST_EMAIL,
            "password": self.TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == self.TEST_EMAIL
        print(f"✅ Login successful for {self.TEST_EMAIL}")
    
    def test_auth_me_endpoint(self):
        """Test GET /api/auth/me returns user data"""
        token = self.get_auth_token()
        assert token, "Failed to get auth token"
        
        response = self.session.get(
            f"{self.base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Auth/me failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert data["email"] == self.TEST_EMAIL
        print(f"✅ GET /api/auth/me returns user data")
        return data
    
    def test_put_auth_profile_update_name(self):
        """Test PUT /api/auth/profile updates user name"""
        token = self.get_auth_token()
        assert token, "Failed to get auth token"
        
        # Update name
        new_name = "Test Profile Updated"
        response = self.session.put(
            f"{self.base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={"name": new_name}
        )
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        data = response.json()
        assert data.get("name") == new_name
        print(f"✅ PUT /api/auth/profile updated name to '{new_name}'")
        
        # Restore original name
        self.session.put(
            f"{self.base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={"name": "Test Profile Company"}
        )
    
    def test_put_auth_profile_update_city(self):
        """Test PUT /api/auth/profile updates city"""
        token = self.get_auth_token()
        assert token, "Failed to get auth token"
        
        # Update city
        new_city = "София"
        response = self.session.put(
            f"{self.base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={"city": new_city}
        )
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        data = response.json()
        assert data.get("city") == new_city
        print(f"✅ PUT /api/auth/profile updated city to '{new_city}'")
    
    def test_put_auth_profile_update_website(self):
        """Test PUT /api/auth/profile updates website"""
        token = self.get_auth_token()
        assert token, "Failed to get auth token"
        
        # Update website
        new_website = "https://temadom.bg"
        response = self.session.put(
            f"{self.base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={"website": new_website}
        )
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        data = response.json()
        assert data.get("website") == new_website
        print(f"✅ PUT /api/auth/profile updated website to '{new_website}'")
    
    def test_put_auth_profile_update_description(self):
        """Test PUT /api/auth/profile updates description"""
        token = self.get_auth_token()
        assert token, "Failed to get auth token"
        
        # Update description
        new_desc = "Професионална строителна компания"
        response = self.session.put(
            f"{self.base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={"description": new_desc}
        )
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        data = response.json()
        assert data.get("description") == new_desc
        print(f"✅ PUT /api/auth/profile updated description")
    
    def test_put_auth_profile_empty_data_rejected(self):
        """Test PUT /api/auth/profile rejects empty data"""
        token = self.get_auth_token()
        assert token, "Failed to get auth token"
        
        response = self.session.put(
            f"{self.base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {token}"},
            json={}
        )
        assert response.status_code == 400, f"Expected 400 for empty data, got {response.status_code}"
        print("✅ PUT /api/auth/profile correctly rejects empty data")
    
    def test_put_auth_profile_requires_auth(self):
        """Test PUT /api/auth/profile requires authentication"""
        response = self.session.put(
            f"{self.base_url}/api/auth/profile",
            json={"name": "Unauthorized"}
        )
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ PUT /api/auth/profile requires authentication")
    
    def test_categories_endpoint(self):
        """Test categories endpoint"""
        response = self.session.get(f"{self.base_url}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✅ Categories endpoint returns {len(data['categories'])} categories")
    
    def test_stats_live_endpoint(self):
        """Test live stats endpoint"""
        response = self.session.get(f"{self.base_url}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "companies" in data
        assert "free_slots" in data
        print("✅ Stats/live endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
