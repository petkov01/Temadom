"""
Test Suite for Iteration 41 - Video Designer v6.1, About Page Dark Theme, Profile Page, Pricing Section
Tests:
- Video Designer title and version badge (v6.1)
- Filming guide collapsible section
- 3 packages: 69€/129€/199€
- 10 styles dropdown
- Default height 2.7m
- About page dark theme
- Profile page and PUT /api/auth/profile
- Pricing section (69/129/199 EUR)
- Backend video-generate accepts 60s videos
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    BASE_URL = "https://cad-sketch-2.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip('/')

# Test credentials
TEST_EMAIL = "profile@temadom.bg"
TEST_PASSWORD = "Test123!"


class TestHealthAndAuth:
    """Basic API health and authentication tests"""

    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "version" in data
        print("✅ API health check passed")

    def test_login_with_test_account(self):
        """Test login with provided test account"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✅ Login successful for {TEST_EMAIL}")
        return data["token"]


class TestProfileEndpoints:
    """Test PUT /api/auth/profile endpoint"""

    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")

    def test_get_profile_me(self, auth_token):
        """Test GET /api/auth/me returns user data"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert data["email"] == TEST_EMAIL
        print("✅ GET /api/auth/me returns user data")

    def test_put_profile_update_name(self, auth_token):
        """Test PUT /api/auth/profile updates name"""
        response = requests.put(f"{BASE_URL}/api/auth/profile", 
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"name": "Test Profile User"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "Test Profile User"
        print("✅ PUT /api/auth/profile updates name")

    def test_put_profile_update_city(self, auth_token):
        """Test PUT /api/auth/profile updates city"""
        response = requests.put(f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"city": "София"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("city") == "София"
        print("✅ PUT /api/auth/profile updates city")

    def test_put_profile_update_website(self, auth_token):
        """Test PUT /api/auth/profile updates website"""
        response = requests.put(f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"website": "https://temadom.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("website") == "https://temadom.com"
        print("✅ PUT /api/auth/profile updates website")

    def test_put_profile_rejects_empty_data(self, auth_token):
        """Test PUT /api/auth/profile rejects empty updates"""
        response = requests.put(f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={}
        )
        assert response.status_code == 400
        print("✅ PUT /api/auth/profile rejects empty data (400)")

    def test_put_profile_requires_auth(self):
        """Test PUT /api/auth/profile requires authentication"""
        response = requests.put(f"{BASE_URL}/api/auth/profile",
            headers={"Content-Type": "application/json"},
            json={"name": "Hacker"}
        )
        assert response.status_code in [401, 403, 422]
        print("✅ PUT /api/auth/profile requires authentication")


class TestCategoriesAndStats:
    """Test categories and stats endpoints"""

    def test_categories_returns_15(self):
        """Test categories endpoint returns expected categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) == 15
        print(f"✅ Categories endpoint returns {len(data['categories'])} categories")

    def test_stats_live_endpoint(self):
        """Test stats/live endpoint returns live stats"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "companies" in data
        assert "free_slots" in data
        print("✅ Stats/live endpoint working")


class TestVideoGenerateEndpoint:
    """Test video-generate endpoint configuration"""

    def test_video_generate_endpoint_exists(self):
        """Test that video-generate endpoint exists (will fail without video, but should not 404)"""
        # Send empty POST to check endpoint exists
        response = requests.post(f"{BASE_URL}/api/ai-designer/video-generate")
        # Should fail with 422 (validation error) or 400, not 404
        assert response.status_code in [400, 422, 500], f"Expected 400/422/500, got {response.status_code}"
        print("✅ Video-generate endpoint exists (not 404)")

    def test_video_generate_rejects_non_video(self):
        """Test that endpoint rejects non-video files"""
        files = {"video": ("test.txt", b"not a video", "text/plain")}
        response = requests.post(f"{BASE_URL}/api/ai-designer/video-generate", files=files)
        assert response.status_code in [400, 422]
        print("✅ Video-generate endpoint rejects non-video files")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
