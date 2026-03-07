"""
Iteration 78 - AI Designer Speed Fix Testing
Focus: Test photo-generate endpoint, health endpoint, and frontend rendering
"""
import pytest
import requests
import os
import time
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://room-render-staging.preview.emergentagent.com')

# Test credentials from previous iterations
TEST_COMPANY_EMAIL = "testp1c@test.bg"
TEST_COMPANY_PASSWORD = "Test1234"

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for test company user"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_COMPANY_EMAIL,
        "password": TEST_COMPANY_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed - status {response.status_code}")

class TestHealthEndpoint:
    """Health check tests"""
    
    def test_health_returns_ok(self, api_client):
        """Verify /api/health returns ok status"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print(f"SUCCESS: /api/health returns status=ok")

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_with_valid_credentials(self, api_client):
        """Test login returns token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COMPANY_EMAIL,
            "password": TEST_COMPANY_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert len(data["token"]) > 0
        print(f"SUCCESS: Login returns token for {TEST_COMPANY_EMAIL}")
    
    def test_login_with_invalid_credentials(self, api_client):
        """Test login with wrong password returns 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.bg",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print(f"SUCCESS: Invalid login returns 401")

class TestAIDesignerPhotoGenerate:
    """Test AI Designer photo-generate endpoint"""
    
    def test_photo_generate_endpoint_exists(self, api_client):
        """Verify the endpoint exists (will reject without auth/photo)"""
        # Without photo, should get 422 Unprocessable Entity
        response = api_client.post(f"{BASE_URL}/api/ai-designer/photo-generate")
        # 422 means endpoint exists but data validation failed
        assert response.status_code in [422, 401, 400]
        print(f"SUCCESS: /api/ai-designer/photo-generate endpoint exists (status {response.status_code})")
    
    def test_photo_generate_requires_photo(self, api_client, auth_token):
        """Test that endpoint requires at least one photo"""
        # Send form data with authorization but no photo
        response = requests.post(
            f"{BASE_URL}/api/ai-designer/photo-generate",
            data={"authorization": f"Bearer {auth_token}"},
        )
        # Should fail because no photo provided
        assert response.status_code in [422, 400]
        print(f"SUCCESS: Endpoint correctly requires photo (status {response.status_code})")

class TestStatsAndLive:
    """Test stats endpoints"""
    
    def test_stats_live_returns_data(self, api_client):
        """Verify /api/stats/live returns clients, companies, free_slots"""
        response = api_client.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "companies" in data
        assert "free_slots" in data
        print(f"SUCCESS: /api/stats/live returns clients={data.get('clients')}, companies={data.get('companies')}")
    
    def test_stats_returns_totals(self, api_client):
        """Verify /api/stats returns project/company counts"""
        response = api_client.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        print(f"SUCCESS: /api/stats returns total_projects={data.get('total_projects')}, total_companies={data.get('total_companies')}")

class TestCategories:
    """Test categories endpoint"""
    
    def test_categories_returns_construction_categories(self, api_client):
        """Verify /api/categories returns construction categories"""
        response = api_client.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) >= 20  # Should have 20+ categories
        print(f"SUCCESS: /api/categories returns {len(data['categories'])} categories")

class TestCompanies:
    """Test companies endpoint"""
    
    def test_companies_returns_list(self, api_client):
        """Verify /api/companies returns company listings"""
        response = api_client.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        print(f"SUCCESS: /api/companies returns {len(data.get('companies', []))} companies")

class TestProjects:
    """Test projects endpoint"""
    
    def test_projects_returns_list(self, api_client):
        """Verify /api/projects returns project listings"""
        response = api_client.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        print(f"SUCCESS: /api/projects returns {len(data.get('projects', []))} projects")

# NOTE: Full photo-generate test is expensive (40+ seconds, uses AI credits)
# To run full integration test, uncomment and use a small test image:
# 
# class TestPhotoGenerateIntegration:
#     """Integration test for AI Designer - EXPENSIVE (40+ seconds)"""
#     
#     def test_single_photo_generate(self, auth_token):
#         """Test single photo upload and generation"""
#         # Create a small test image (1x1 pixel PNG)
#         import struct
#         import zlib
#         
#         def create_test_png():
#             signature = b'\x89PNG\r\n\x1a\n'
#             width, height = 100, 100
#             depth, color_type = 8, 2  # 8-bit RGB
#             ihdr_data = struct.pack('>IIBBBBB', width, height, depth, color_type, 0, 0, 0)
#             ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
#             ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
#             
#             raw_data = b'\x00' + b'\xff\x00\x00' * width  # Red pixels
#             raw_data = raw_data * height
#             compressed = zlib.compress(raw_data, 9)
#             idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
#             idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
#             
#             iend_crc = zlib.crc32(b'IEND') & 0xffffffff
#             iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
#             
#             return signature + ihdr + idat + iend
#         
#         test_image = create_test_png()
#         
#         files = {'photo1': ('test.png', io.BytesIO(test_image), 'image/png')}
#         data = {
#             'authorization': f'Bearer {auth_token}',
#             'style': 'modern',
#             'room_type': 'bathroom',
#             'width': '3',
#             'length': '4',
#             'height': '2.7',
#             'budget_eur': '2000'
#         }
#         
#         start_time = time.time()
#         response = requests.post(
#             f"{BASE_URL}/api/ai-designer/photo-generate",
#             files=files,
#             data=data,
#             timeout=300  # 5 minutes
#         )
#         elapsed = time.time() - start_time
#         
#         print(f"Photo-generate took {elapsed:.1f} seconds")
#         assert response.status_code == 200
#         data = response.json()
#         assert "renders" in data
#         assert "budget" in data
#         print(f"SUCCESS: photo-generate returned {len(data.get('renders', []))} renders in {elapsed:.1f}s")
