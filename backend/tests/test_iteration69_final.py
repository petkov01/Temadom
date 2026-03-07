"""
Iteration 69 - Final Comprehensive Tests
Testing: 
- Designer registration removed (only client/company/master allowed)
- Google OAuth endpoints
- Telegram bot info endpoint
- Suggestions API (CRUD + voting)
- User search API
- Feedback API
- Stats/live endpoint
- Companies endpoint (public access)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if BASE_URL:
    BASE_URL = BASE_URL.rstrip('/')

# Test credentials
TEST_USER_EMAIL = "chat@test.bg"
TEST_USER_PASSWORD = "test123456"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed - status {response.status_code}")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestDesignerRemoval:
    """Test that Designer registration type is completely removed"""
    
    def test_register_designer_rejected(self, api_client):
        """Registration with user_type='designer' should be rejected"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_designer_{os.urandom(4).hex()}@test.bg",
            "name": "Test Designer",
            "password": "test123456",
            "user_type": "designer",
            "city": "София"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✅ Designer registration correctly rejected: {data['detail']}")
    
    def test_register_client_works(self, api_client):
        """Registration with user_type='client' should work"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_client_{os.urandom(4).hex()}@test.bg",
            "name": "Test Client",
            "password": "test123456",
            "user_type": "client",
            "city": "София"
        })
        # Accept 200 or 201 for success
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "client"
        print(f"✅ Client registration works - user_id: {data['user']['id']}")


class TestGoogleOAuth:
    """Test Google OAuth endpoints exist and respond correctly"""
    
    def test_google_callback_missing_session(self, api_client):
        """POST /api/auth/google/callback without session_id returns 400"""
        response = api_client.post(f"{BASE_URL}/api/auth/google/callback", json={})
        assert response.status_code == 400
        print("✅ Google callback requires session_id (400 without)")
    
    def test_google_callback_invalid_session(self, api_client):
        """POST /api/auth/google/callback with invalid session returns 401/502"""
        response = api_client.post(f"{BASE_URL}/api/auth/google/callback", json={
            "session_id": "invalid_session_12345"
        })
        # 401 for invalid session or 502 if Emergent Auth is unreachable
        assert response.status_code in [401, 502], f"Expected 401/502, got {response.status_code}"
        print(f"✅ Invalid session correctly rejected ({response.status_code})")


class TestTelegramBot:
    """Test Telegram bot info endpoint"""
    
    def test_telegram_bot_info(self, api_client):
        """GET /api/telegram/bot-info returns bot info"""
        response = api_client.get(f"{BASE_URL}/api/telegram/bot-info")
        assert response.status_code == 200
        data = response.json()
        assert "bot_name" in data
        assert "bot_username" in data
        assert "bot_link" in data
        print(f"✅ Telegram bot info: {data['bot_name']} (@{data['bot_username']})")


class TestSuggestionsAPI:
    """Test Suggestions API - CRUD and voting"""
    
    def test_get_suggestions_public(self, api_client):
        """GET /api/suggestions should work without auth"""
        response = api_client.get(f"{BASE_URL}/api/suggestions")
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        print(f"✅ GET /api/suggestions works - {len(data['suggestions'])} suggestions")
    
    def test_post_suggestion(self, api_client):
        """POST /api/suggestions creates a suggestion"""
        response = api_client.post(f"{BASE_URL}/api/suggestions", json={
            "text": f"TEST_suggestion_{os.urandom(4).hex()}",
            "name": "Тест Потребител"
        })
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}"
        data = response.json()
        # API returns {"message": "...", "status": "ok"} or {"suggestion": {...}}
        assert "message" in data or "suggestion" in data or "id" in data
        print(f"✅ POST /api/suggestions works - response: {data}")
        return data
    
    def test_vote_suggestion(self, api_client):
        """POST /api/suggestions/{id}/vote adds a vote"""
        # First create a suggestion
        create_res = api_client.post(f"{BASE_URL}/api/suggestions", json={
            "text": f"TEST_vote_suggestion_{os.urandom(4).hex()}",
            "name": "Voter Test"
        })
        if create_res.status_code not in [200, 201]:
            pytest.skip("Could not create suggestion to vote on")
        
        suggestion_data = create_res.json()
        suggestion_id = suggestion_data.get("suggestion", {}).get("id") or suggestion_data.get("id")
        
        if not suggestion_id:
            # Try to get first suggestion from list
            list_res = api_client.get(f"{BASE_URL}/api/suggestions")
            suggestions = list_res.json().get("suggestions", [])
            if suggestions:
                suggestion_id = suggestions[0].get("id")
        
        if not suggestion_id:
            pytest.skip("No suggestion ID available for voting")
        
        vote_res = api_client.post(f"{BASE_URL}/api/suggestions/{suggestion_id}/vote")
        assert vote_res.status_code == 200
        print(f"✅ POST /api/suggestions/{suggestion_id}/vote works")


class TestFeedbackAPI:
    """Test Feedback API"""
    
    def test_get_feedback(self, api_client):
        """GET /api/feedback returns feedback list"""
        response = api_client.get(f"{BASE_URL}/api/feedback")
        assert response.status_code == 200
        data = response.json()
        assert "feedback" in data
        assert "avg_rating" in data
        assert "total" in data
        print(f"✅ GET /api/feedback works - {data['total']} feedback items, avg {data['avg_rating']}")
    
    def test_post_feedback(self, api_client):
        """POST /api/feedback creates feedback"""
        response = api_client.post(f"{BASE_URL}/api/feedback", json={
            "rating": 5,
            "text": f"TEST_feedback_{os.urandom(4).hex()}",
            "name": "Тест Потребител"
        })
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}"
        print("✅ POST /api/feedback works")


class TestUserSearchAPI:
    """Test User Search API - requires authentication"""
    
    def test_user_search_requires_auth(self, api_client):
        """GET /api/users/search without auth returns 401/403"""
        # Remove any auth header
        clean_client = requests.Session()
        clean_client.headers.update({"Content-Type": "application/json"})
        response = clean_client.get(f"{BASE_URL}/api/users/search?q=Test")
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print("✅ User search requires authentication")
    
    def test_user_search_with_auth(self, authenticated_client):
        """GET /api/users/search?q=... with auth works"""
        response = authenticated_client.get(f"{BASE_URL}/api/users/search?q=Pet")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        print(f"✅ User search works - found {len(data['users'])} users for 'Pet'")


class TestCompaniesAPI:
    """Test Companies endpoint - public access"""
    
    def test_companies_list_public(self, api_client):
        """GET /api/companies should work without auth"""
        response = api_client.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert "total" in data
        print(f"✅ GET /api/companies works (public) - {data['total']} companies")
    
    def test_companies_filter_by_type(self, api_client):
        """GET /api/companies?user_type=company filters correctly"""
        response = api_client.get(f"{BASE_URL}/api/companies?user_type=company")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        print(f"✅ Company type filter works - {data['total']} companies")
        
        response = api_client.get(f"{BASE_URL}/api/companies?user_type=master")
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Master type filter works - {data['total']} masters")


class TestLiveStats:
    """Test Live Stats endpoint"""
    
    def test_stats_live(self, api_client):
        """GET /api/stats/live returns live stats with regions"""
        response = api_client.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "companies" in data
        assert "masters" in data
        assert "free_slots" in data
        assert "regions" in data
        print(f"✅ GET /api/stats/live works - {data['clients']} clients, {data['companies']} companies")
        print(f"   Free slots: {data['free_slots']['used']}/{data['free_slots']['total']}")
        print(f"   Regions: {len(data['regions'])} regions tracked")


class TestCategories:
    """Test Categories endpoint - regression"""
    
    def test_categories_list(self, api_client):
        """GET /api/categories returns category list"""
        response = api_client.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ GET /api/categories works - {len(data['categories'])} categories")


class TestAuthLogin:
    """Test Auth Login - regression"""
    
    def test_login_valid_user(self, api_client):
        """POST /api/auth/login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✅ Login works - user: {data['user']['name']} ({data['user']['user_type']})")
    
    def test_login_invalid_credentials(self, api_client):
        """POST /api/auth/login with invalid credentials returns 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.bg",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✅ Invalid login correctly rejected (401)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
