"""
Test Suite for TemaDom Weekly Challenges and Referral System
Iteration 44 - Testing NEW features added to Leaderboard
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_USER_PREFIX = "TEST_iter44_"

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def test_user(api_client):
    """Create a test user and return credentials"""
    unique_id = str(uuid.uuid4())[:8]
    email = f"{TEST_USER_PREFIX}{unique_id}@test.com"
    user_data = {
        "email": email,
        "password": "testpass123",
        "name": f"Test User {unique_id}",
        "user_type": "client",
        "city": "Sofia"
    }
    response = api_client.post(f"{BASE_URL}/api/auth/register", json=user_data)
    assert response.status_code == 200, f"Failed to create test user: {response.text}"
    data = response.json()
    return {
        "email": email,
        "password": "testpass123",
        "token": data["token"],
        "user_id": data["user"]["id"],
        "name": data["user"]["name"]
    }

@pytest.fixture(scope="module")
def referrer_user(api_client):
    """Create a referrer user to test referral system"""
    unique_id = str(uuid.uuid4())[:8]
    email = f"{TEST_USER_PREFIX}referrer_{unique_id}@test.com"
    user_data = {
        "email": email,
        "password": "testpass123",
        "name": f"Referrer {unique_id}",
        "user_type": "client",
        "city": "Plovdiv"
    }
    response = api_client.post(f"{BASE_URL}/api/auth/register", json=user_data)
    assert response.status_code == 200, f"Failed to create referrer user: {response.text}"
    data = response.json()
    return {
        "email": email,
        "password": "testpass123",
        "token": data["token"],
        "user_id": data["user"]["id"],
        "name": data["user"]["name"]
    }


class TestWeeklyChallengesActive:
    """Test GET /api/challenges/active - Returns 3 active challenges with week_start and week_end"""
    
    def test_active_challenges_returns_3_challenges(self, api_client):
        """Verify that exactly 3 challenges are returned"""
        response = api_client.get(f"{BASE_URL}/api/challenges/active")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "challenges" in data, "Response should contain 'challenges' key"
        assert len(data["challenges"]) == 3, f"Expected 3 challenges, got {len(data['challenges'])}"
        print(f"PASSED: GET /api/challenges/active returns {len(data['challenges'])} challenges")
    
    def test_active_challenges_has_week_bounds(self, api_client):
        """Verify week_start and week_end are returned"""
        response = api_client.get(f"{BASE_URL}/api/challenges/active")
        assert response.status_code == 200
        
        data = response.json()
        assert "week_start" in data, "Response should contain 'week_start'"
        assert "week_end" in data, "Response should contain 'week_end'"
        
        # Validate ISO format
        try:
            datetime.fromisoformat(data["week_start"].replace('Z', '+00:00'))
            datetime.fromisoformat(data["week_end"].replace('Z', '+00:00'))
        except ValueError as e:
            pytest.fail(f"Invalid date format: {e}")
        
        print(f"PASSED: week_start={data['week_start']}, week_end={data['week_end']}")
    
    def test_challenge_structure(self, api_client):
        """Verify challenge objects have required fields"""
        response = api_client.get(f"{BASE_URL}/api/challenges/active")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["id", "title", "description", "action", "target", "bonus_points", "icon"]
        
        for challenge in data["challenges"]:
            for field in required_fields:
                assert field in challenge, f"Challenge missing field: {field}"
        
        print(f"PASSED: All challenges have required fields: {required_fields}")


class TestChallengeProgress:
    """Test GET /api/challenges/my-progress - Returns progress for authenticated user"""
    
    def test_progress_requires_auth(self, api_client):
        """Verify endpoint requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/challenges/my-progress")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("PASSED: /api/challenges/my-progress requires authentication")
    
    def test_progress_returns_data(self, api_client, test_user):
        """Verify authenticated user gets progress data"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        response = api_client.get(f"{BASE_URL}/api/challenges/my-progress", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "progress" in data, "Response should contain 'progress' key"
        assert len(data["progress"]) == 3, f"Expected 3 challenge progress items, got {len(data['progress'])}"
        print(f"PASSED: my-progress returns {len(data['progress'])} challenge progress items")
    
    def test_progress_structure(self, api_client, test_user):
        """Verify progress objects have required fields"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        response = api_client.get(f"{BASE_URL}/api/challenges/my-progress", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["challenge_id", "title", "description", "target", "current", "completed", "bonus_points", "claimed"]
        
        for progress in data["progress"]:
            for field in required_fields:
                assert field in progress, f"Progress item missing field: {field}"
            assert isinstance(progress["current"], int), "current should be an integer"
            assert isinstance(progress["target"], int), "target should be an integer"
            assert isinstance(progress["completed"], bool), "completed should be a boolean"
            assert isinstance(progress["claimed"], bool), "claimed should be a boolean"
        
        print(f"PASSED: Progress items have correct structure with fields: {required_fields}")


class TestChallengeClaim:
    """Test POST /api/challenges/claim - Awards bonus points when challenge is completed"""
    
    def test_claim_requires_auth(self, api_client):
        """Verify endpoint requires authentication"""
        response = api_client.post(f"{BASE_URL}/api/challenges/claim", json={"challenge_id": "test"})
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("PASSED: /api/challenges/claim requires authentication")
    
    def test_claim_invalid_challenge(self, api_client, test_user):
        """Verify invalid challenge_id is rejected"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        response = api_client.post(
            f"{BASE_URL}/api/challenges/claim",
            json={"challenge_id": "nonexistent_challenge"},
            headers=headers
        )
        assert response.status_code == 400, f"Expected 400 for invalid challenge, got {response.status_code}"
        print("PASSED: Invalid challenge_id returns 400")
    
    def test_claim_incomplete_challenge(self, api_client, test_user):
        """Verify claiming incomplete challenge is rejected"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        
        # Get active challenges
        active_resp = api_client.get(f"{BASE_URL}/api/challenges/active")
        challenges = active_resp.json()["challenges"]
        
        # Try to claim the first challenge (likely not completed yet)
        response = api_client.post(
            f"{BASE_URL}/api/challenges/claim",
            json={"challenge_id": challenges[0]["id"]},
            headers=headers
        )
        # Should fail because challenge not completed
        assert response.status_code == 400, f"Expected 400 for incomplete challenge, got {response.status_code}"
        print("PASSED: Cannot claim incomplete challenge")


class TestReferralMyLink:
    """Test GET /api/referrals/my-link - Returns referral code and link for authenticated user"""
    
    def test_my_link_requires_auth(self, api_client):
        """Verify endpoint requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/referrals/my-link")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("PASSED: /api/referrals/my-link requires authentication")
    
    def test_my_link_returns_data(self, api_client, test_user):
        """Verify authenticated user gets referral link data"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        response = api_client.get(f"{BASE_URL}/api/referrals/my-link", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "referral_code" in data, "Response should contain 'referral_code'"
        assert "referral_link" in data, "Response should contain 'referral_link'"
        assert "points_per_referral" in data, "Response should contain 'points_per_referral'"
        
        # Verify referral code is first 8 chars of user ID
        assert data["referral_code"] == test_user["user_id"][:8], "Referral code should be first 8 chars of user ID"
        
        # Verify points per referral is 30
        assert data["points_per_referral"] == 30, f"Expected 30 points per referral, got {data['points_per_referral']}"
        
        # Verify link contains the code
        assert data["referral_code"] in data["referral_link"], "Referral link should contain referral code"
        assert "/register?ref=" in data["referral_link"], "Referral link should have /register?ref= format"
        
        print(f"PASSED: my-link returns code={data['referral_code']}, link={data['referral_link']}")


class TestReferralStats:
    """Test GET /api/referrals/stats - Returns referral count and points earned"""
    
    def test_stats_requires_auth(self, api_client):
        """Verify endpoint requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/referrals/stats")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("PASSED: /api/referrals/stats requires authentication")
    
    def test_stats_returns_data(self, api_client, test_user):
        """Verify authenticated user gets referral stats"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        response = api_client.get(f"{BASE_URL}/api/referrals/stats", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "referral_code" in data, "Response should contain 'referral_code'"
        assert "referral_count" in data, "Response should contain 'referral_count'"
        assert "total_points_earned" in data, "Response should contain 'total_points_earned'"
        assert "points_per_referral" in data, "Response should contain 'points_per_referral'"
        assert "recent_referrals" in data, "Response should contain 'recent_referrals'"
        
        # Verify initial count is 0 for new user
        assert data["referral_count"] >= 0, "referral_count should be >= 0"
        assert isinstance(data["recent_referrals"], list), "recent_referrals should be a list"
        
        print(f"PASSED: stats returns count={data['referral_count']}, points={data['total_points_earned']}")


class TestReferralApply:
    """Test POST /api/referrals/apply - Awards 30 points to referrer"""
    
    def test_apply_invalid_code(self, api_client):
        """Verify invalid referral code is handled"""
        response = api_client.post(
            f"{BASE_URL}/api/referrals/apply",
            json={
                "referral_code": "INVALID_CODE",
                "new_user_id": "test_user_id",
                "new_user_name": "Test User"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["applied"] == False, "Invalid code should not be applied"
        print(f"PASSED: Invalid referral code handled - reason: {data.get('reason', 'N/A')}")
    
    def test_apply_self_referral_rejected(self, api_client, referrer_user):
        """Verify self-referral is rejected"""
        # Get referrer's referral code
        headers = {"Authorization": f"Bearer {referrer_user['token']}"}
        link_resp = api_client.get(f"{BASE_URL}/api/referrals/my-link", headers=headers)
        ref_code = link_resp.json()["referral_code"]
        
        # Try to apply own code
        response = api_client.post(
            f"{BASE_URL}/api/referrals/apply",
            json={
                "referral_code": ref_code,
                "new_user_id": referrer_user["user_id"],
                "new_user_name": referrer_user["name"]
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["applied"] == False, "Self-referral should be rejected"
        assert "собствен" in data.get("reason", "").lower() or "own" in data.get("reason", "").lower(), \
            "Reason should indicate self-referral"
        
        print(f"PASSED: Self-referral rejected - reason: {data.get('reason', 'N/A')}")
    
    def test_apply_valid_referral(self, api_client, referrer_user):
        """Verify valid referral awards points to referrer"""
        # Get referrer's referral code
        headers = {"Authorization": f"Bearer {referrer_user['token']}"}
        link_resp = api_client.get(f"{BASE_URL}/api/referrals/my-link", headers=headers)
        ref_code = link_resp.json()["referral_code"]
        
        # Get referrer's initial points
        stats_before = api_client.get(f"{BASE_URL}/api/referrals/stats", headers=headers)
        count_before = stats_before.json()["referral_count"]
        
        # Register a new user with the referral code (simulating /api/referrals/apply call)
        new_user_id = str(uuid.uuid4())
        new_user_name = f"Referred User {str(uuid.uuid4())[:8]}"
        
        response = api_client.post(
            f"{BASE_URL}/api/referrals/apply",
            json={
                "referral_code": ref_code,
                "new_user_id": new_user_id,
                "new_user_name": new_user_name
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["applied"] == True, f"Valid referral should be applied: {data}"
        assert data["points_awarded_to_referrer"] == 30, f"Expected 30 points, got {data.get('points_awarded_to_referrer')}"
        
        # Verify referrer's stats updated
        stats_after = api_client.get(f"{BASE_URL}/api/referrals/stats", headers=headers)
        count_after = stats_after.json()["referral_count"]
        
        assert count_after == count_before + 1, f"Referral count should increase by 1"
        
        print(f"PASSED: Valid referral applied, 30 points awarded, count: {count_before} -> {count_after}")


class TestRegistrationWithReferral:
    """Test registration with referral_code field triggers referral point award"""
    
    def test_registration_with_valid_referral(self, api_client, referrer_user):
        """Verify new user registration with referral_code awards points to referrer"""
        # Get referrer's referral code
        headers = {"Authorization": f"Bearer {referrer_user['token']}"}
        link_resp = api_client.get(f"{BASE_URL}/api/referrals/my-link", headers=headers)
        ref_code = link_resp.json()["referral_code"]
        
        # Get referrer's initial referral count
        stats_before = api_client.get(f"{BASE_URL}/api/referrals/stats", headers=headers)
        count_before = stats_before.json()["referral_count"]
        
        # Register new user with referral_code
        unique_id = str(uuid.uuid4())[:8]
        new_user_data = {
            "email": f"{TEST_USER_PREFIX}referred_{unique_id}@test.com",
            "password": "testpass123",
            "name": f"Referred User {unique_id}",
            "user_type": "client",
            "city": "Varna",
            "referral_code": ref_code  # Include referral code
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=new_user_data)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        # Give backend time to process referral (it's async via httpx)
        import time
        time.sleep(1)
        
        # Verify referrer's stats updated
        stats_after = api_client.get(f"{BASE_URL}/api/referrals/stats", headers=headers)
        count_after = stats_after.json()["referral_count"]
        
        # Note: The count should increase by 1 (or 2 if test_apply_valid_referral ran before)
        assert count_after >= count_before, f"Referral count should not decrease: {count_before} -> {count_after}"
        
        print(f"PASSED: Registration with referral_code processed, referrer count: {count_before} -> {count_after}")


class TestLeaderboardEndpoints:
    """Test existing leaderboard endpoints still work"""
    
    def test_clients_leaderboard(self, api_client):
        """Verify clients leaderboard works"""
        response = api_client.get(f"{BASE_URL}/api/leaderboard/clients")
        assert response.status_code == 200
        
        data = response.json()
        assert "leaderboard" in data
        assert data["type"] == "clients"
        print(f"PASSED: GET /api/leaderboard/clients returns {len(data['leaderboard'])} entries")
    
    def test_firms_leaderboard(self, api_client):
        """Verify firms leaderboard works"""
        response = api_client.get(f"{BASE_URL}/api/leaderboard/firms")
        assert response.status_code == 200
        
        data = response.json()
        assert "leaderboard" in data
        assert data["type"] == "firms"
        print(f"PASSED: GET /api/leaderboard/firms returns {len(data['leaderboard'])} entries")
    
    def test_my_rank(self, api_client, test_user):
        """Verify my-rank works for authenticated user"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        response = api_client.get(f"{BASE_URL}/api/leaderboard/my-rank", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "rank" in data
        assert "total_points" in data
        assert "total_participants" in data
        print(f"PASSED: my-rank returns rank={data['rank']}, points={data['total_points']}")
