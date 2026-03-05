"""
Tests for TemaDom v6.5-6.8 features:
1. Leaderboard APIs
2. Theme system endpoints  
3. Registration awards 10 leaderboard points
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLeaderboardAPI:
    """Test leaderboard API endpoints"""
    
    def test_leaderboard_clients_endpoint(self):
        """GET /api/leaderboard/clients returns ranked list"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/clients")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "leaderboard" in data
        assert "type" in data
        assert data["type"] == "clients"
        print(f"✅ GET /api/leaderboard/clients - {len(data['leaderboard'])} clients")
    
    def test_leaderboard_firms_endpoint(self):
        """GET /api/leaderboard/firms returns ranked list"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/firms")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "leaderboard" in data
        assert "type" in data
        assert data["type"] == "firms"
        print(f"✅ GET /api/leaderboard/firms - {len(data['leaderboard'])} firms/masters")
    
    def test_leaderboard_points_config_endpoint(self):
        """GET /api/leaderboard/points-config returns config with test_mode"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/points-config")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "points" in data
        assert "test_mode" in data
        assert data["test_mode"] == True  # Test mode is enabled
        points = data["points"]
        assert points.get("register") == 10
        assert points.get("create_project") == 20
        print(f"✅ GET /api/leaderboard/points-config - test_mode={data['test_mode']}, points config verified")

    def test_leaderboard_my_rank_requires_auth(self):
        """GET /api/leaderboard/my-rank requires authentication"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/my-rank")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✅ GET /api/leaderboard/my-rank requires auth")

    def test_leaderboard_award_requires_auth(self):
        """POST /api/leaderboard/award requires authentication"""
        response = requests.post(f"{BASE_URL}/api/leaderboard/award", json={"action": "daily_login"})
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✅ POST /api/leaderboard/award requires auth")


class TestRegistrationAwardsPoints:
    """Test that registration automatically awards 10 leaderboard points"""
    
    def test_registration_awards_points(self):
        """New user registration gives 10 leaderboard points"""
        unique_email = f"testlead_{uuid.uuid4().hex[:8]}@test.com"
        
        # Register new user
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "pass123",
            "name": "LeaderTest User",
            "user_type": "client",
            "city": "Sofia"
        })
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        token = reg_response.json().get("token")
        assert token, "No token returned"
        
        # Check user has leaderboard points (via /auth/me or leaderboard API)
        headers = {"Authorization": f"Bearer {token}"}
        
        # Check my rank
        rank_response = requests.get(f"{BASE_URL}/api/leaderboard/my-rank", headers=headers)
        assert rank_response.status_code == 200, f"my-rank failed: {rank_response.text}"
        rank_data = rank_response.json()
        assert rank_data.get("total_points", 0) >= 10, f"Expected at least 10 points, got {rank_data}"
        print(f"✅ New registration awards points: total_points={rank_data['total_points']}, rank={rank_data['rank']}")


class TestLeaderboardAwardWithAuth:
    """Test /api/leaderboard/award endpoint with authenticated user"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Create user and get token for tests"""
        unique_email = f"testaward_{uuid.uuid4().hex[:8]}@test.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "pass123",
            "name": "Award Test User",
            "user_type": "client",
            "city": "Sofia"
        })
        if reg_response.status_code == 200:
            self.token = reg_response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Could not create test user")
    
    def test_award_daily_login_points(self):
        """POST /api/leaderboard/award with daily_login action"""
        response = requests.post(
            f"{BASE_URL}/api/leaderboard/award",
            json={"action": "daily_login"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Award failed: {response.text}"
        data = response.json()
        assert data.get("points_awarded") == 2  # daily_login = 2 points
        assert data.get("total_points") > 0
        print(f"✅ Award daily_login: +{data['points_awarded']} points, total={data['total_points']}")
    
    def test_award_invalid_action_fails(self):
        """POST /api/leaderboard/award with invalid action should fail"""
        response = requests.post(
            f"{BASE_URL}/api/leaderboard/award",
            json={"action": "invalid_action_xyz"},
            headers=self.headers
        )
        assert response.status_code == 400, f"Expected 400 for invalid action, got {response.status_code}"
        print("✅ Invalid action returns 400")


class TestCategoriesAndStats:
    """Test categories and stats endpoints that support leaderboard page"""
    
    def test_categories_endpoint(self):
        """GET /api/categories returns construction categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ GET /api/categories - {len(data['categories'])} categories")
    
    def test_stats_endpoint(self):
        """GET /api/stats returns platform statistics"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        print(f"✅ GET /api/stats - projects={data['total_projects']}, companies={data['total_companies']}")
    
    def test_live_stats_endpoint(self):
        """GET /api/stats/live returns live counter data"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "companies" in data
        assert "free_slots" in data
        print(f"✅ GET /api/stats/live - clients={data['clients']}, companies={data['companies']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
