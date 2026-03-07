"""
Iteration 72 Tests: Construction/Renovation sections, categories with section field, projects with construction fields
Testing new features:
- Categories with 'section' field (renovation/construction/both) and 'property_types' array
- GET /api/categories?section=construction|renovation filtering
- GET /api/projects?section_type=renovation|construction filtering  
- POST /api/projects with construction-specific fields (property_type, land_area, building_area, floors)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthAndCategories:
    """Health check and categories API tests"""
    
    def test_health_endpoint(self):
        """GET /api/health returns status=ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✅ GET /api/health returns status=ok")
    
    def test_categories_returns_section_field(self):
        """GET /api/categories returns categories with 'section' field"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        categories = data["categories"]
        assert len(categories) > 0
        
        # Check that categories have 'section' field
        for cat in categories:
            assert "section" in cat, f"Category {cat.get('id')} missing 'section' field"
            assert cat["section"] in ["renovation", "construction", "both"], f"Invalid section: {cat['section']}"
        
        # Verify some known categories
        cat_dict = {c["id"]: c for c in categories}
        
        # Renovation only categories
        if "electricity" in cat_dict:
            assert cat_dict["electricity"]["section"] == "renovation"
        if "painting" in cat_dict:
            assert cat_dict["painting"]["section"] == "renovation"
        
        # Construction only categories
        if "foundation" in cat_dict:
            assert cat_dict["foundation"]["section"] == "construction"
        if "turnkey" in cat_dict:
            assert cat_dict["turnkey"]["section"] == "construction"
        
        # Both categories
        if "roofing" in cat_dict:
            assert cat_dict["roofing"]["section"] == "both"
        if "hvac" in cat_dict:
            assert cat_dict["hvac"]["section"] == "both"
        
        print(f"✅ GET /api/categories returns {len(categories)} categories with 'section' field")
    
    def test_categories_returns_property_types(self):
        """GET /api/categories returns property_types array"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        
        assert "property_types" in data
        property_types = data["property_types"]
        assert len(property_types) > 0
        
        # Check property types structure
        for pt in property_types:
            assert "id" in pt
            assert "name" in pt
        
        # Verify some known property types
        pt_ids = [pt["id"] for pt in property_types]
        expected_types = ["house", "apartment_building", "warehouse", "office", "commercial"]
        for expected in expected_types:
            assert expected in pt_ids, f"Missing property type: {expected}"
        
        print(f"✅ GET /api/categories returns {len(property_types)} property_types")
    
    def test_categories_filter_construction(self):
        """GET /api/categories?section=construction returns only construction and 'both' categories"""
        response = requests.get(f"{BASE_URL}/api/categories?section=construction")
        assert response.status_code == 200
        data = response.json()
        
        categories = data["categories"]
        for cat in categories:
            assert cat["section"] in ["construction", "both"], f"Wrong section in construction filter: {cat['id']} has {cat['section']}"
        
        # Make sure we have some construction-specific categories
        cat_ids = [c["id"] for c in categories]
        assert "foundation" in cat_ids or "turnkey" in cat_ids or "structural" in cat_ids, "Missing construction-specific categories"
        
        print(f"✅ GET /api/categories?section=construction returns {len(categories)} categories (construction/both only)")
    
    def test_categories_filter_renovation(self):
        """GET /api/categories?section=renovation returns only renovation and 'both' categories"""
        response = requests.get(f"{BASE_URL}/api/categories?section=renovation")
        assert response.status_code == 200
        data = response.json()
        
        categories = data["categories"]
        for cat in categories:
            assert cat["section"] in ["renovation", "both"], f"Wrong section in renovation filter: {cat['id']} has {cat['section']}"
        
        # Make sure we have some renovation-specific categories
        cat_ids = [c["id"] for c in categories]
        assert "electricity" in cat_ids or "plumbing" in cat_ids or "painting" in cat_ids, "Missing renovation-specific categories"
        
        print(f"✅ GET /api/categories?section=renovation returns {len(categories)} categories (renovation/both only)")


class TestAuthAndProjects:
    """Authentication and project creation/retrieval tests"""
    
    @pytest.fixture(scope="class")
    def test_user_credentials(self):
        """Generate unique test user credentials"""
        unique_id = str(uuid.uuid4())[:8]
        return {
            "email": f"TEST_client_{unique_id}@temadom.bg",
            "password": "TestPass123!",
            "name": "Тест Клиент",
            "user_type": "client",
            "city": "София",
            "phone": "0888123456"
        }
    
    @pytest.fixture(scope="class")
    def auth_token(self, test_user_credentials):
        """Register a test user and get auth token"""
        # Try to register
        response = requests.post(f"{BASE_URL}/api/auth/register", json=test_user_credentials)
        
        if response.status_code == 400 and "вече е регистриран" in response.text:
            # User exists, try login
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_user_credentials["email"],
                "password": test_user_credentials["password"]
            })
        
        if response.status_code not in [200, 201]:
            pytest.skip(f"Could not authenticate: {response.status_code} - {response.text}")
        
        data = response.json()
        return data.get("token")
    
    def test_register_client_user(self, test_user_credentials):
        """POST /api/auth/register creates a test client user"""
        # Use a fresh email to avoid conflicts
        unique_id = str(uuid.uuid4())[:8]
        creds = {
            "email": f"TEST_newclient_{unique_id}@temadom.bg",
            "password": "TestPass123!",
            "name": "Нов Тест Клиент",
            "user_type": "client",
            "city": "Пловдив",
            "phone": "0888654321"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=creds)
        
        if response.status_code == 400 and "вече е регистриран" in response.text:
            print("✅ POST /api/auth/register - user already exists (expected)")
            return
        
        assert response.status_code in [200, 201], f"Registration failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "client"
        print("✅ POST /api/auth/register creates a client user successfully")
    
    def test_login_user(self, test_user_credentials, auth_token):
        """POST /api/auth/login authenticates user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_user_credentials["email"],
            "password": test_user_credentials["password"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print("✅ POST /api/auth/login authenticates user successfully")
    
    def test_create_renovation_project(self, auth_token):
        """POST /api/projects creates a renovation project with section_type=renovation"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        project_data = {
            "title": "TEST_Ремонт на баня",
            "description": "Тестов проект за ремонт на баня в София",
            "category": "plumbing",
            "city": "София",
            "section_type": "renovation",
            "budget_min": 1000,
            "budget_max": 3000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/projects",
            json=project_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [200, 201], f"Project creation failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "project_id" in data or "message" in data
        print("✅ POST /api/projects creates a renovation project with section_type=renovation")
    
    def test_create_construction_project(self, auth_token):
        """POST /api/projects creates a construction project with construction-specific fields"""
        if not auth_token:
            pytest.skip("No auth token available")
        
        project_data = {
            "title": "TEST_Строителство на къща 120 м²",
            "description": "Двуетажна къща в покрайнините на София",
            "category": "turnkey",
            "city": "София",
            "section_type": "construction",
            "property_type": "house",
            "land_area": 500,
            "building_area": 120,
            "floors": 2,
            "construction_notes": "Тестови бележки за строителството"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/projects",
            json=project_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [200, 201], f"Construction project creation failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "project_id" in data or "message" in data
        print("✅ POST /api/projects creates a construction project with property_type=house, land_area=500, building_area=120, floors=2")
    
    def test_get_renovation_projects(self):
        """GET /api/projects?section_type=renovation returns renovation projects"""
        response = requests.get(f"{BASE_URL}/api/projects?section_type=renovation")
        assert response.status_code == 200
        data = response.json()
        
        assert "projects" in data
        # Projects should either be renovation or null (legacy)
        for proj in data.get("projects", []):
            section = proj.get("section_type")
            # null/None is treated as renovation
            assert section in ["renovation", None], f"Non-renovation project in renovation filter: {proj.get('id')} has section_type={section}"
        
        print(f"✅ GET /api/projects?section_type=renovation returns {len(data.get('projects', []))} projects")
    
    def test_get_construction_projects(self):
        """GET /api/projects?section_type=construction returns construction projects"""
        response = requests.get(f"{BASE_URL}/api/projects?section_type=construction")
        assert response.status_code == 200
        data = response.json()
        
        assert "projects" in data
        for proj in data.get("projects", []):
            section = proj.get("section_type")
            assert section == "construction", f"Non-construction project in construction filter: {proj.get('id')} has section_type={section}"
        
        print(f"✅ GET /api/projects?section_type=construction returns {len(data.get('projects', []))} projects")


class TestLiveStats:
    """Live stats endpoint tests"""
    
    def test_stats_live(self):
        """GET /api/stats/live returns live statistics"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "clients" in data
        assert "companies" in data
        assert "free_slots" in data
        assert data["free_slots"]["total"] == 56
        
        # Check regions
        assert "regions" in data
        
        print(f"✅ GET /api/stats/live returns stats (clients={data['clients']}, companies={data['companies']}, free_slots={data['free_slots']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
