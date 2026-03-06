"""
Test iteration 8: Free platform, Telegram integration, city field, mobile menu features
Tests for:
1. Registration with city and telegram_username fields
2. Projects return contact_locked=false (free platform)
3. Chat message sending without filtering
4. Telegram endpoints availability
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://interior-vision-79.preview.emergentagent.com').rstrip('/')


class TestFreeplatformRegistration:
    """Test registration with new city and telegram_username fields"""
    
    def test_register_client_with_city(self):
        """Test client registration accepts city field"""
        test_email = f"test_client_{uuid.uuid4().hex[:8]}@test.bg"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "name": "Тест Клиент",
            "password": "test12345",
            "phone": "+359888123456",
            "user_type": "client",
            "city": "София"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == test_email
    
    def test_register_company_with_city_and_telegram(self):
        """Test company registration accepts city and telegram_username fields"""
        test_email = f"test_company_{uuid.uuid4().hex[:8]}@test.bg"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "name": "Тест Фирма ЕООД",
            "password": "test12345",
            "phone": "+359888654321",
            "user_type": "company",
            "city": "Пловдив",
            "telegram_username": "@test_company_tg"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == test_email


class TestFreeplatformProjects:
    """Test projects API returns contact_locked=false (free platform)"""
    
    def test_projects_list_contact_unlocked(self):
        """Test /api/projects returns contact_locked=false for all projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        
        # Check that projects have contact_locked=false
        for project in data.get("projects", []):
            assert project.get("contact_locked") == False, \
                f"Project {project.get('id')} has contact_locked=True, expected False"
    
    def test_project_detail_contact_unlocked(self):
        """Test /api/projects/<id> returns contact_locked=false"""
        # First get a project ID
        response = requests.get(f"{BASE_URL}/api/projects?limit=1")
        assert response.status_code == 200
        projects = response.json().get("projects", [])
        
        if len(projects) > 0:
            project_id = projects[0]["id"]
            detail_response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
            assert detail_response.status_code == 200
            project = detail_response.json()
            assert project.get("contact_locked") == False, \
                "Project detail should have contact_locked=False"
        else:
            pytest.skip("No projects available to test")
    
    def test_project_detail_shows_client_info(self):
        """Test project detail shows client contact info when free"""
        response = requests.get(f"{BASE_URL}/api/projects?limit=1")
        assert response.status_code == 200
        projects = response.json().get("projects", [])
        
        if len(projects) > 0:
            project_id = projects[0]["id"]
            detail_response = requests.get(f"{BASE_URL}/api/projects/{project_id}")
            assert detail_response.status_code == 200
            project = detail_response.json()
            
            # Since platform is free, client info should be visible
            assert "client_name" in project
            assert "client_email" in project
        else:
            pytest.skip("No projects available to test")


class TestChatWithoutFiltering:
    """Test chat message sending without contact filtering"""
    
    @pytest.fixture
    def company_auth(self):
        """Login as test company or create new one"""
        # Try existing test account
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testfirma@test.bg",
            "password": "test12345"
        })
        if response.status_code == 200:
            return response.json()["token"]
        
        # Create new company
        test_email = f"test_chat_company_{uuid.uuid4().hex[:8]}@test.bg"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "name": "Chat Test Фирма",
            "password": "test12345",
            "phone": "+359888111222",
            "user_type": "company",
            "city": "Варна"
        })
        if reg_response.status_code == 200:
            return reg_response.json()["token"]
        pytest.skip("Cannot authenticate for chat test")
    
    @pytest.fixture
    def client_auth(self):
        """Login as test client or create new one"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ivan_client@test.bg",
            "password": "test12345"
        })
        if response.status_code == 200:
            return response.json()["token"]
        
        # Create new client
        test_email = f"test_chat_client_{uuid.uuid4().hex[:8]}@test.bg"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "name": "Chat Test Клиент",
            "password": "test12345",
            "phone": "+359888333444",
            "user_type": "client",
            "city": "Бургас"
        })
        if reg_response.status_code == 200:
            return reg_response.json()["token"]
        pytest.skip("Cannot authenticate client for chat test")
    
    def test_send_message_with_contact_info(self, company_auth, client_auth):
        """Test that messages with phone/email are NOT filtered (platform is free)"""
        # Get client user ID
        client_me = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {client_auth}"
        })
        assert client_me.status_code == 200
        client_id = client_me.json()["id"]
        
        # Send message with contact info from company
        message_with_contact = "Здравейте! Можете да се свържете с мен на 0888123456 или test@email.com"
        response = requests.post(f"{BASE_URL}/api/messages", json={
            "receiver_id": client_id,
            "content": message_with_contact
        }, headers={
            "Authorization": f"Bearer {company_auth}"
        })
        
        assert response.status_code == 200, f"Message send failed: {response.text}"
        data = response.json()
        
        # Message should NOT be filtered since platform is free
        assert data.get("was_filtered") == False, "Message should not be filtered (platform is free)"
        assert "0888123456" in data.get("content", ""), "Phone number should be preserved"


class TestTelegramIntegration:
    """Test Telegram bot integration endpoints"""
    
    def test_telegram_webhook_endpoint_exists(self):
        """Test that Telegram webhook endpoint is available"""
        # Send empty payload to webhook - should return ok
        response = requests.post(f"{BASE_URL}/api/telegram/webhook", json={})
        assert response.status_code == 200
        assert response.json().get("ok") == True
    
    @pytest.fixture
    def company_auth(self):
        """Get company auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testfirma@test.bg",
            "password": "test12345"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Cannot authenticate for Telegram test")
    
    def test_telegram_link_endpoint(self, company_auth):
        """Test Telegram link endpoint is available"""
        response = requests.post(f"{BASE_URL}/api/telegram/link", json={
            "chat_id": "123456789"
        }, headers={
            "Authorization": f"Bearer {company_auth}"
        })
        assert response.status_code == 200
        assert "успешно" in response.json().get("message", "").lower() or \
               "свързан" in response.json().get("message", "").lower()


class TestCalculatorNoPaywall:
    """Test calculator has no paywall"""
    
    @pytest.fixture
    def company_auth(self):
        """Get company auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testfirma@test.bg",
            "password": "test12345"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Cannot authenticate for calculator test")
    
    def test_calculator_log_use_unlimited(self, company_auth):
        """Test calculator use is unlimited (platform is free)"""
        response = requests.post(f"{BASE_URL}/api/calculator/log-use", headers={
            "Authorization": f"Bearer {company_auth}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("allowed") == True, "Calculator should be allowed (free platform)"
    
    def test_calculator_status_unlimited(self, company_auth):
        """Test calculator status shows unlimited"""
        response = requests.get(f"{BASE_URL}/api/calculator/status", headers={
            "Authorization": f"Bearer {company_auth}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("unlimited") == True or data.get("remaining") == -1, \
            "Calculator should show unlimited status"


class TestCategories:
    """Test categories endpoint"""
    
    def test_get_categories(self):
        """Test categories endpoint returns valid data"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        
        # Check category structure
        for cat in data["categories"]:
            assert "id" in cat
            assert "name" in cat


class TestAuthMeWithNewFields:
    """Test /auth/me returns new fields"""
    
    def test_auth_me_returns_city_and_telegram(self):
        """Test /auth/me includes city and telegram_username"""
        # Register new user with city and telegram
        test_email = f"test_me_{uuid.uuid4().hex[:8]}@test.bg"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "name": "Test Me User",
            "password": "test12345",
            "phone": "+359888555666",
            "user_type": "company",
            "city": "Русе",
            "telegram_username": "@test_me_tg"
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["token"]
        
        # Check /auth/me response
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert me_response.status_code == 200
        data = me_response.json()
        
        assert data.get("city") == "Русе", f"Expected city 'Русе', got {data.get('city')}"
        assert data.get("telegram_username") == "@test_me_tg", \
            f"Expected telegram '@test_me_tg', got {data.get('telegram_username')}"
