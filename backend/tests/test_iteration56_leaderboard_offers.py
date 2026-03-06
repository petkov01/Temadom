"""
Iteration 56: Testing Leaderboard and Community v3 Offers features
- Leaderboard: GET /api/leaderboard/clients and /api/leaderboard/companies
- Community Offers: POST /api/community/offers, GET /api/community/offers/{post_id}
- Public Projects: GET /api/community/public-projects
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLeaderboard:
    """Leaderboard endpoint tests"""
    
    def test_leaderboard_clients_returns_entries(self):
        """GET /api/leaderboard/clients returns entries array"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/clients")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "entries" in data, "Response should contain 'entries'"
        assert "period" in data, "Response should contain 'period'"
        assert "type" in data, "Response should contain 'type'"
        assert data["type"] == "clients"
        
        # If there are entries, verify structure
        if data["entries"]:
            entry = data["entries"][0]
            assert "rank" in entry, "Entry should have 'rank'"
            assert "user_name" in entry, "Entry should have 'user_name'"
            assert "score" in entry, "Entry should have 'score'"
            assert "projects_count" in entry, "Entry should have 'projects_count'"
        print(f"✅ GET /api/leaderboard/clients - returned {len(data['entries'])} entries")

    def test_leaderboard_clients_period_month(self):
        """GET /api/leaderboard/clients?period=month works"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/clients?period=month")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["period"] == "month", "Period should be 'month'"
        assert "entries" in data
        print("✅ GET /api/leaderboard/clients?period=month - works correctly")

    def test_leaderboard_companies_returns_entries(self):
        """GET /api/leaderboard/companies returns entries array"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/companies")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "entries" in data, "Response should contain 'entries'"
        assert "period" in data, "Response should contain 'period'"
        assert "type" in data, "Response should contain 'type'"
        assert data["type"] == "companies"
        
        # If there are entries, verify structure
        if data["entries"]:
            entry = data["entries"][0]
            assert "rank" in entry, "Entry should have 'rank'"
            assert "company_name" in entry, "Entry should have 'company_name'"
            assert "avg_rating" in entry, "Entry should have 'avg_rating'"
            assert "score" in entry, "Entry should have 'score'"
        print(f"✅ GET /api/leaderboard/companies - returned {len(data['entries'])} entries")

    def test_leaderboard_companies_period_month(self):
        """GET /api/leaderboard/companies?period=month works"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/companies?period=month")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["period"] == "month", "Period should be 'month'"
        assert "entries" in data
        print("✅ GET /api/leaderboard/companies?period=month - works correctly")


class TestCommunityOffers:
    """Community Offers endpoint tests"""
    
    @pytest.fixture(scope="class")
    def client_token(self):
        """Register/login client user and get token"""
        timestamp = int(time.time())
        email = f"test_client_lb_{timestamp}@test.bg"
        
        # Try to register new client
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "TestClient LB",
            "email": email,
            "password": "Test123!",
            "user_type": "client",
            "city": "София"
        })
        
        if reg_response.status_code == 200:
            return reg_response.json()["token"]
        
        # If registration fails, try to login with existing test user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "reftest@test.bg",
            "password": "Test123!"
        })
        
        if login_response.status_code == 200:
            return login_response.json()["token"]
        
        pytest.skip("Could not get client token")

    @pytest.fixture(scope="class")
    def company_token(self):
        """Register/login company user and get token"""
        timestamp = int(time.time())
        email = f"test_firma_lb_{timestamp}@test.bg"
        
        # Try to register new company
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "TestFirma LB",
            "email": email,
            "password": "Test123!",
            "user_type": "company",
            "city": "Пловдив",
            "bulstat": f"1{timestamp%100000000:08d}"
        })
        
        if reg_response.status_code == 200:
            return reg_response.json()["token"]
        
        pytest.skip("Could not register company for testing")

    def test_create_offer_requires_auth(self):
        """POST /api/community/offers requires authentication (401)"""
        response = requests.post(f"{BASE_URL}/api/community/offers", json={
            "post_id": "test123",
            "price_eur": 100,
            "message": "Test offer"
        })
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✅ POST /api/community/offers - requires auth (401)")

    def test_create_offer_requires_company(self, client_token):
        """POST /api/community/offers requires company user type (403 for clients)"""
        response = requests.post(
            f"{BASE_URL}/api/community/offers",
            json={
                "post_id": "test123",
                "price_eur": 100,
                "message": "Test offer"
            },
            headers={"Authorization": f"Bearer {client_token}"}
        )
        assert response.status_code == 403, f"Expected 403 for client, got {response.status_code}"
        print("✅ POST /api/community/offers - requires company user type (403 for clients)")

    def test_create_offer_as_company(self, company_token, client_token):
        """POST /api/community/offers creates offer with price_eur, message, timeline_days"""
        # First, create a project post as client
        post_response = requests.post(
            f"{BASE_URL}/api/community/posts",
            json={
                "text": "Търся фирма за ремонт на баня - Test for offers",
                "type": "project"
            },
            headers={"Authorization": f"Bearer {client_token}"}
        )
        
        if post_response.status_code != 200:
            pytest.skip(f"Could not create post for offer testing: {post_response.status_code}")
        
        post_id = post_response.json()["id"]
        
        # Now create offer as company
        offer_response = requests.post(
            f"{BASE_URL}/api/community/offers",
            json={
                "post_id": post_id,
                "price_eur": 2500,
                "message": "Можем да направим ремонта за 2500 EUR",
                "timeline_days": 14
            },
            headers={"Authorization": f"Bearer {company_token}"}
        )
        
        assert offer_response.status_code == 200, f"Expected 200, got {offer_response.status_code}: {offer_response.text}"
        
        data = offer_response.json()
        assert "id" in data, "Offer should have 'id'"
        assert data["price_eur"] == 2500, "Offer should have correct price_eur"
        assert data["message"] == "Можем да направим ремонта за 2500 EUR"
        assert data["timeline_days"] == 14, "Offer should have correct timeline_days"
        print(f"✅ POST /api/community/offers - created offer with id={data['id']}")
        
        return {"post_id": post_id, "offer_id": data["id"]}

    def test_get_post_offers_returns_array(self, company_token, client_token):
        """GET /api/community/offers/{post_id} returns offers array"""
        # Create post and offer first
        post_response = requests.post(
            f"{BASE_URL}/api/community/posts",
            json={"text": "Test post for offers list", "type": "project"},
            headers={"Authorization": f"Bearer {client_token}"}
        )
        
        if post_response.status_code != 200:
            pytest.skip("Could not create post")
        
        post_id = post_response.json()["id"]
        
        # Get offers (may be empty initially)
        response = requests.get(f"{BASE_URL}/api/community/offers/{post_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "offers" in data, "Response should have 'offers' array"
        assert isinstance(data["offers"], list), "'offers' should be a list"
        print(f"✅ GET /api/community/offers/{post_id} - returns offers array ({len(data['offers'])} offers)")


class TestPublicProjects:
    """Public Projects endpoint tests"""
    
    def test_public_projects_returns_array(self):
        """GET /api/community/public-projects returns projects array"""
        response = requests.get(f"{BASE_URL}/api/community/public-projects")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "projects" in data, "Response should have 'projects'"
        assert "total" in data, "Response should have 'total'"
        assert "page" in data, "Response should have 'page'"
        assert isinstance(data["projects"], list)
        print(f"✅ GET /api/community/public-projects - returned {len(data['projects'])} projects, total={data['total']}")

    def test_public_projects_pagination(self):
        """GET /api/community/public-projects supports pagination"""
        response = requests.get(f"{BASE_URL}/api/community/public-projects?page=1&limit=5")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["page"] == 1, "Page should be 1"
        assert len(data["projects"]) <= 5, "Should return max 5 projects"
        print("✅ GET /api/community/public-projects - pagination works correctly")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """GET /api/ is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API root not accessible: {response.status_code}"
        print("✅ GET /api/ - API accessible")

    def test_community_posts_endpoint(self):
        """GET /api/community/posts is accessible"""
        response = requests.get(f"{BASE_URL}/api/community/posts")
        assert response.status_code == 200, f"Community posts not accessible: {response.status_code}"
        
        data = response.json()
        assert "posts" in data, "Should have 'posts' in response"
        print(f"✅ GET /api/community/posts - accessible ({len(data['posts'])} posts)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
