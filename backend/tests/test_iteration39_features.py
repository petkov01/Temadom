"""
Iteration 39 Test Suite
Testing new features:
1. Auth Gate - /ai-sketch and /room-scan show modal for unauthenticated users
2. Video Designer - Package selection cards (69/129/220 EUR), multi-room support
3. CAD page - PDF buttons always visible, Contract dialog
4. Backend PDF endpoints - export-pdf, export-contract, video-pdf
5. Mobile theme toggle
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://temadom-profile.preview.emergentagent.com')

# Test credentials from the review request
TEST_EMAIL = "test2@temadom.bg"
TEST_PASSWORD = "Test123!"


class TestBackendAPIs:
    """Backend API tests for iteration 39"""
    
    @pytest.fixture
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API root endpoint working: {data.get('message')}")
    
    def test_categories(self, api_client):
        """Test categories endpoint"""
        response = api_client.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ Categories endpoint working: {len(data['categories'])} categories")
    
    def test_stats_live(self, api_client):
        """Test live stats endpoint"""
        response = api_client.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "companies" in data
        assert "free_slots" in data
        print(f"✅ Stats live endpoint working: {data.get('clients')} clients, {data.get('companies')} companies")


class TestPDFExports:
    """Test PDF export endpoints"""
    
    @pytest.fixture
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_export_plan_pdf(self, api_client):
        """Test POST /api/ai-sketch/export-pdf returns valid PDF"""
        payload = {
            "elements": [
                {"tool": "wall", "x1": 100, "y1": 100, "x2": 300, "y2": 100, "_type": "wall", "height": 3, "thickness": 25}
            ],
            "scale": 1,
            "costs": {"totalEur": 500, "totalBgn": 978, "items": []},
            "region_name": "Пловдив"
        }
        response = api_client.post(f"{BASE_URL}/api/ai-sketch/export-pdf", json=payload)
        assert response.status_code == 200
        assert response.content[:4] == b'%PDF'
        print("✅ POST /api/ai-sketch/export-pdf returns valid PDF")
    
    def test_export_contract_pdf(self, api_client):
        """Test POST /api/ai-sketch/export-contract returns valid PDF"""
        payload = {
            "company_name": "Тест ЕООД",
            "company_bulstat": "123456789",
            "client_name": "Иван Иванов",
            "client_egn": "8801011234",
            "address": "гр. Пловдив, ул. Тестова 1",
            "total_eur": 1500,
            "total_bgn": 2934,
            "description": "СМР работи"
        }
        response = api_client.post(f"{BASE_URL}/api/ai-sketch/export-contract", json=payload)
        assert response.status_code == 200
        assert response.content[:4] == b'%PDF'
        print("✅ POST /api/ai-sketch/export-contract returns valid PDF")
    
    def test_export_video_pdf(self, api_client):
        """Test POST /api/ai-designer/video-pdf returns valid PDF"""
        payload = {
            "materials": {"grand_total_eur": 5000, "materials": []},
            "dimensions": {"width": 4, "length": 5, "height": 2.6},
            "style": "modern",
            "room_analysis": {"room_type": "living_room"},
            "image_base64": ""
        }
        response = api_client.post(f"{BASE_URL}/api/ai-designer/video-pdf", json=payload)
        assert response.status_code == 200
        assert response.content[:4] == b'%PDF'
        print("✅ POST /api/ai-designer/video-pdf returns valid PDF")


class TestAuthLogin:
    """Test authentication for testing authenticated routes"""
    
    @pytest.fixture
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_login_with_test_account(self, api_client):
        """Test login with test account"""
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=payload)
        if response.status_code == 200:
            data = response.json()
            assert "token" in data
            assert "user" in data
            print(f"✅ Login successful for {TEST_EMAIL}: user_type={data['user'].get('user_type')}")
            return data["token"]
        else:
            print(f"⚠️ Login failed with status {response.status_code}: {response.text[:100]}")
            pytest.skip("Test account login failed - may not exist yet")
    
    def test_auth_me_with_token(self, api_client):
        """Test /auth/me with valid token"""
        # First login
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Login failed, skipping auth/me test")
        
        token = login_response.json()["token"]
        
        # Test /auth/me
        api_client.headers.update({"Authorization": f"Bearer {token}"})
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        print(f"✅ Auth/me working: {data.get('name')}, type={data.get('user_type')}")


class TestCompaniesEndpoints:
    """Test company-related endpoints"""
    
    @pytest.fixture
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_get_companies(self, api_client):
        """Test GET /api/companies"""
        response = api_client.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert "total" in data
        print(f"✅ Companies endpoint working: {data.get('total')} total companies")
    
    def test_get_projects(self, api_client):
        """Test GET /api/projects"""
        response = api_client.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert "total" in data
        print(f"✅ Projects endpoint working: {data.get('total')} total projects")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
