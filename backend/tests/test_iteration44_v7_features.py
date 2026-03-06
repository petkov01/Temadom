"""
Iteration 44: Testing TemaDom 3D Designer v7 features
- New logo at /temadom-logo.png
- Photo-based 3D Designer (3 photos instead of video)
- New endpoints: /api/ai-designer/photo-generate, /api/ai-designer/my-projects, /api/ai-designer/project/{id}
- Regional firm limit: 2 firms per Bulgarian region (28 regions × 2 = 56 total)
- Landing page shows 56 in hero and live counter
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestBasicEndpoints:
    """Basic health and existing endpoint tests"""
    
    def test_api_root(self):
        """Test API root is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✅ API root accessible")
    
    def test_categories_endpoint(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✅ Categories endpoint returns {len(data['categories'])} categories")


class TestLiveStatsAndSlots:
    """Test live stats showing 56 free slots"""
    
    def test_live_stats_returns_56_total(self):
        """Verify /api/stats/live returns free_slots.total = 56"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        
        assert "free_slots" in data
        assert data["free_slots"]["total"] == 56, f"Expected 56, got {data['free_slots']['total']}"
        print(f"✅ Live stats returns free_slots.total = {data['free_slots']['total']}")
        print(f"   free_slots.used = {data['free_slots']['used']}")


class TestAIDesignerPhotoGenerate:
    """Test new photo-based 3D Designer endpoint"""
    
    def test_photo_generate_endpoint_exists(self):
        """Test /api/ai-designer/photo-generate endpoint exists (method check)"""
        # POST without data to check endpoint exists
        response = requests.post(f"{BASE_URL}/api/ai-designer/photo-generate")
        # Should fail with 422 (validation error) not 404 (not found)
        assert response.status_code in [422, 400], f"Expected 422/400, got {response.status_code}"
        print("✅ POST /api/ai-designer/photo-generate endpoint exists")
    
    def test_photo_generate_requires_photo(self):
        """Test that photo-generate requires at least one photo"""
        # POST without files should return error
        response = requests.post(
            f"{BASE_URL}/api/ai-designer/photo-generate",
            data={
                "width": "4",
                "length": "5",
                "height": "2.7",
                "style": "modern",
                "room_type": "bathroom"
            }
        )
        # Should require photo file
        assert response.status_code in [422, 400], f"Expected 422/400 when missing photos, got {response.status_code}"
        print("✅ photo-generate endpoint correctly requires photo files")


class TestAIDesignerMyProjects:
    """Test my-projects endpoint requires authentication"""
    
    def test_my_projects_requires_auth(self):
        """Test /api/ai-designer/my-projects requires authentication"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/my-projects")
        # Should return 401/403 without auth
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ GET /api/ai-designer/my-projects requires authentication")


class TestAIDesignerProjectById:
    """Test project retrieval by ID"""
    
    def test_project_by_id_returns_404_for_invalid(self):
        """Test /api/ai-designer/project/{id} returns 404 for non-existent project"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/project/nonexistent-id-12345")
        assert response.status_code == 404
        print("✅ GET /api/ai-designer/project/{id} returns 404 for invalid ID")


class TestRegionalFirmLimit:
    """Test regional firm registration limit (2 per region)"""
    
    def test_register_validates_company_bulstat(self):
        """Test that company registration requires valid 9-digit bulstat"""
        # Try to register company without bulstat
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Test Company",
                "email": f"testcompany{os.urandom(4).hex()}@test.com",
                "password": "Test1234!",
                "city": "София",
                "user_type": "company"
                # Missing bulstat
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "булстат" in data.get("detail", "").lower() or "bulstat" in data.get("detail", "").lower()
        print("✅ Company registration requires bulstat")
    
    def test_register_validates_bulstat_format(self):
        """Test that bulstat must be exactly 9 digits"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Test Company",
                "email": f"testcompany{os.urandom(4).hex()}@test.com",
                "password": "Test1234!",
                "city": "София",
                "user_type": "company",
                "bulstat": "12345"  # Invalid - not 9 digits
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "9" in data.get("detail", "") or "цифри" in data.get("detail", "")
        print("✅ Bulstat format validation works (requires 9 digits)")


class TestUserAuthentication:
    """Test user registration and login"""
    
    def test_register_client(self):
        """Test client registration"""
        email = f"testclient{os.urandom(4).hex()}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Тест Клиент",
                "email": email,
                "password": "Test1234!",
                "city": "София",
                "user_type": "client"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "client"
        print(f"✅ Client registration successful: {email}")
        return data["token"], email
    
    def test_login(self):
        """Test login with registered user"""
        # First register
        email = f"testlogin{os.urandom(4).hex()}@test.com"
        password = "Test1234!"
        
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Test Login",
                "email": email,
                "password": password,
                "city": "София",
                "user_type": "client"
            }
        )
        assert reg_response.status_code == 200
        
        # Then login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": email,
                "password": password
            }
        )
        assert login_response.status_code == 200
        data = login_response.json()
        assert "token" in data
        print(f"✅ Login successful for {email}")


class TestMyProjectsWithAuth:
    """Test my-projects with authenticated user"""
    
    def test_my_projects_with_auth(self):
        """Test /api/ai-designer/my-projects returns data with auth"""
        # Register user
        email = f"testprojects{os.urandom(4).hex()}@test.com"
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Test Projects",
                "email": email,
                "password": "Test1234!",
                "city": "София",
                "user_type": "client"
            }
        )
        assert reg_response.status_code == 200
        token = reg_response.json()["token"]
        
        # Get my projects
        response = requests.get(
            f"{BASE_URL}/api/ai-designer/my-projects",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        print(f"✅ my-projects returns {len(data['projects'])} projects for authenticated user")


class TestLogoEndpoint:
    """Test new logo file is accessible"""
    
    def test_logo_file_exists(self):
        """Test /temadom-logo.png is accessible"""
        response = requests.get(f"{BASE_URL}/temadom-logo.png")
        # Frontend static files should return 200 or redirect
        assert response.status_code in [200, 302, 304], f"Expected 200/302/304, got {response.status_code}"
        print(f"✅ Logo file accessible: /temadom-logo.png (status {response.status_code})")


class TestShareProjectEndpoint:
    """Test project sharing endpoint"""
    
    def test_share_project_requires_auth(self):
        """Test /api/ai-designer/project/{id}/share requires auth"""
        response = requests.post(f"{BASE_URL}/api/ai-designer/project/test-id/share")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ POST /api/ai-designer/project/{id}/share requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
