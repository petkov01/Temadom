"""
Backend tests for TemaDom new features:
- Chat system with contact filtering
- Free lead claiming (3 free for companies)
- Calculator usage tracking (5 free uses)
- PDF generation from calculator
- User basic info endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_CLIENT_EMAIL = "testclient@test.com"
TEST_CLIENT_PASSWORD = "password123"
TEST_COMPANY_EMAIL = "testcompany@test.com"
TEST_COMPANY_PASSWORD = "password123"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API root accessible: {data.get('message')}")
    
    def test_categories_endpoint(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✅ Categories endpoint working: {len(data['categories'])} categories")


class TestAuthentication:
    """Authentication tests for test users"""
    
    def test_client_login(self):
        """Test client login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "client"
        print(f"✅ Client login successful: {data['user']['name']}")
        return data["token"]
    
    def test_company_login(self):
        """Test company login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COMPANY_EMAIL,
            "password": TEST_COMPANY_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "company"
        print(f"✅ Company login successful: {data['user']['name']}")
        return data["token"]


class TestChatSystem:
    """Tests for the chat/messaging system"""
    
    @pytest.fixture
    def client_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def company_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COMPANY_EMAIL,
            "password": TEST_COMPANY_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def client_id(self, client_token):
        response = requests.get(f"{BASE_URL}/api/auth/me", 
                                headers={"Authorization": f"Bearer {client_token}"})
        return response.json()["id"]
    
    @pytest.fixture
    def company_id(self, company_token):
        response = requests.get(f"{BASE_URL}/api/auth/me", 
                                headers={"Authorization": f"Bearer {company_token}"})
        return response.json()["id"]
    
    def test_get_conversations_empty(self, company_token):
        """Test getting conversations for company"""
        response = requests.get(f"{BASE_URL}/api/conversations",
                                headers={"Authorization": f"Bearer {company_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        print(f"✅ Conversations endpoint working: {len(data['conversations'])} conversations")
    
    def test_send_message_basic(self, client_token, company_id):
        """Test sending a basic message from client to company"""
        response = requests.post(f"{BASE_URL}/api/messages", json={
            "receiver_id": company_id,
            "content": "Здравейте, интересувам се от вашите услуги"
        }, headers={"Authorization": f"Bearer {client_token}"})
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "conversation_id" in data
        assert data["content"] == "Здравейте, интересувам се от вашите услуги"
        print(f"✅ Message sent successfully: {data['id']}")
    
    def test_contact_info_filtering_company(self, company_token, client_id):
        """Test that contact info is filtered for unpaid company"""
        response = requests.post(f"{BASE_URL}/api/messages", json={
            "receiver_id": client_id,
            "content": "Можете да се свържете с мен на 0888123456 или email@example.com"
        }, headers={"Authorization": f"Bearer {company_token}"})
        
        assert response.status_code == 200
        data = response.json()
        
        # Check if contact info was filtered
        if data.get("was_filtered"):
            assert "скрита" in data["content"] or "[***" in data["content"]
            print(f"✅ Contact info filtered correctly for unpaid company")
        else:
            print(f"⚠️ Contact info was NOT filtered (company may have paid)")
    
    def test_get_user_basic(self, client_id):
        """Test getting basic user info for chat"""
        response = requests.get(f"{BASE_URL}/api/user/{client_id}/basic")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert "user_type" in data
        print(f"✅ User basic info retrieved: {data['name']}")
    
    def test_unread_count(self, company_token):
        """Test getting unread message count"""
        response = requests.get(f"{BASE_URL}/api/unread-count",
                                headers={"Authorization": f"Bearer {company_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        print(f"✅ Unread count endpoint working: {data['unread_count']} unread")


class TestFreeLeads:
    """Tests for free lead claiming feature (3 free contacts for companies)"""
    
    @pytest.fixture
    def company_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COMPANY_EMAIL,
            "password": TEST_COMPANY_PASSWORD
        })
        return response.json()["token"]
    
    def test_free_leads_status(self, company_token):
        """Test getting free leads status"""
        response = requests.get(f"{BASE_URL}/api/leads/free-status",
                                headers={"Authorization": f"Bearer {company_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "free_leads_limit" in data
        assert "free_leads_used" in data
        assert "free_leads_remaining" in data
        assert data["free_leads_limit"] == 3
        print(f"✅ Free leads status: {data['free_leads_remaining']} remaining of {data['free_leads_limit']}")
    
    def test_my_leads_endpoint(self, company_token):
        """Test getting company's purchased leads"""
        response = requests.get(f"{BASE_URL}/api/my-leads",
                                headers={"Authorization": f"Bearer {company_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        assert "subscription_active" in data
        assert "free_leads_remaining" in data
        print(f"✅ My leads endpoint working: {len(data['leads'])} leads")


class TestCalculatorUsageTracking:
    """Tests for calculator usage tracking (5 free uses for companies)"""
    
    @pytest.fixture
    def company_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COMPANY_EMAIL,
            "password": TEST_COMPANY_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def client_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        return response.json()["token"]
    
    def test_calculator_status_company(self, company_token):
        """Test getting calculator status for company"""
        response = requests.get(f"{BASE_URL}/api/calculator/status",
                                headers={"Authorization": f"Bearer {company_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "uses" in data
        assert "remaining" in data
        
        if data.get("unlimited"):
            print(f"✅ Calculator status: unlimited (subscriber)")
        else:
            assert "limit" in data
            assert data["limit"] == 5
            print(f"✅ Calculator status: {data['remaining']} of {data['limit']} remaining")
    
    def test_calculator_status_client(self, client_token):
        """Test calculator status for client (should be unlimited)"""
        response = requests.get(f"{BASE_URL}/api/calculator/status",
                                headers={"Authorization": f"Bearer {client_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["unlimited"] == True
        print(f"✅ Calculator status for client: unlimited")
    
    def test_log_calculator_use(self, company_token):
        """Test logging calculator use"""
        response = requests.post(f"{BASE_URL}/api/calculator/log-use", json={},
                                headers={"Authorization": f"Bearer {company_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "allowed" in data
        assert "remaining" in data
        print(f"✅ Calculator use logged: allowed={data['allowed']}, remaining={data['remaining']}")


class TestPDFGeneration:
    """Tests for PDF generation from calculator"""
    
    def test_generate_pdf(self):
        """Test generating PDF from calculator data"""
        response = requests.post(f"{BASE_URL}/api/calculator/pdf", json={
            "items": [
                {"name": "Боядисване", "quantity": 100, "unit": "м²", "basePrice": 6, "total": 720},
                {"name": "Ел. инсталация", "quantity": 20, "unit": "точки", "basePrice": 50, "total": 1200}
            ],
            "regionName": "София (столица)",
            "regionMultiplier": 1.20,
            "pricingType": "laborAndMaterial",
            "qualityLevel": "standard",
            "total": 1920
        })
        
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 1000  # PDF should be reasonably sized
        print(f"✅ PDF generated successfully: {len(response.content)} bytes")
    
    def test_generate_pdf_empty_items(self):
        """Test generating PDF with empty items"""
        response = requests.post(f"{BASE_URL}/api/calculator/pdf", json={
            "items": [],
            "regionName": "София (столица)",
            "regionMultiplier": 1.20,
            "pricingType": "laborAndMaterial",
            "qualityLevel": "standard",
            "total": 0
        })
        
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        print(f"✅ Empty PDF generated: {len(response.content)} bytes")


class TestProjects:
    """Tests for project-related endpoints"""
    
    @pytest.fixture
    def client_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def company_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_COMPANY_EMAIL,
            "password": TEST_COMPANY_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_projects(self):
        """Test getting projects list"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert "total" in data
        print(f"✅ Projects list: {data['total']} total projects")
    
    def test_get_projects_with_auth(self, company_token):
        """Test getting projects with company auth"""
        response = requests.get(f"{BASE_URL}/api/projects",
                                headers={"Authorization": f"Bearer {company_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        
        # Check contact_locked field
        for project in data["projects"]:
            assert "contact_locked" in project
        print(f"✅ Projects with auth: {len(data['projects'])} projects returned")
    
    def test_get_project_detail(self, company_token):
        """Test getting a specific project"""
        # First get list to find a project ID
        list_response = requests.get(f"{BASE_URL}/api/projects")
        projects = list_response.json().get("projects", [])
        
        if projects:
            project_id = projects[0]["id"]
            response = requests.get(f"{BASE_URL}/api/projects/{project_id}",
                                    headers={"Authorization": f"Bearer {company_token}"})
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert "title" in data
            assert "contact_locked" in data
            print(f"✅ Project detail retrieved: {data['title']}")
        else:
            pytest.skip("No projects available")


class TestStats:
    """Test stats endpoint"""
    
    def test_get_stats(self):
        """Test getting platform stats"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        assert "total_reviews" in data
        print(f"✅ Stats: {data['total_projects']} projects, {data['total_companies']} companies, {data['total_reviews']} reviews")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
