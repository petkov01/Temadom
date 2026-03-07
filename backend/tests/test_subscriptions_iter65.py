"""
TemaDom Subscription System Tests - Iteration 65
Tests subscription endpoints for firm users:
- Plan activation (basic, pro, premium)
- Subscription limits and features
- Profile payments tab integration
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from main agent
TEST_EMAIL = "testpro@test.bg"
TEST_PASSWORD = "Test1234!"

class TestSubscriptionAPIs:
    """Test subscription management endpoints"""
    
    token = None
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Login as test company user"""
        if not TestSubscriptionAPIs.token:
            resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            if resp.status_code == 200:
                TestSubscriptionAPIs.token = resp.json().get("token")
            else:
                pytest.skip(f"Could not login: {resp.status_code} - {resp.text}")
        yield
    
    def auth_headers(self):
        return {"Authorization": f"Bearer {TestSubscriptionAPIs.token}"}
    
    # ===== GET /api/subscriptions/plans =====
    def test_get_subscription_plans(self):
        """GET /api/subscriptions/plans - returns all 3 plans"""
        resp = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "plans" in data
        assert "test_mode" in data
        plans = data["plans"]
        assert "company" in plans, "Plans should have 'company' section"
        company_plans = plans["company"]
        # Check all 3 plans exist
        assert "basic" in company_plans, "basic plan missing"
        assert "pro" in company_plans, "pro plan missing"
        assert "premium" in company_plans, "premium plan missing"
        # Check plan structure
        basic = company_plans["basic"]
        assert "name" in basic
        assert "price" in basic
        assert "features" in basic
        print(f"✅ Plans returned: {list(company_plans.keys())}")
    
    def test_plans_have_required_fields(self):
        """Plans should have name, price, features, limitations"""
        resp = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert resp.status_code == 200
        plans = resp.json()["plans"]["company"]
        for plan_key, plan in plans.items():
            assert "name" in plan, f"{plan_key} missing name"
            assert "price" in plan, f"{plan_key} missing price"
            assert "features" in plan, f"{plan_key} missing features"
            assert isinstance(plan["features"], list), f"{plan_key} features should be list"
        print(f"✅ All plans have required fields")
    
    # ===== POST /api/subscriptions/activate =====
    def test_activate_basic_plan(self):
        """POST /api/subscriptions/activate with plan='basic'"""
        resp = requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "basic"},
            headers=self.auth_headers()
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("plan") == "basic", f"Expected plan=basic, got {data.get('plan')}"
        assert "expires" in data, "Should return expiration date"
        print(f"✅ Basic plan activated, expires: {data.get('expires')}")
    
    def test_activate_pro_plan(self):
        """POST /api/subscriptions/activate with plan='pro'"""
        resp = requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "pro"},
            headers=self.auth_headers()
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("plan") == "pro", f"Expected plan=pro, got {data.get('plan')}"
        print(f"✅ Pro plan activated")
    
    def test_activate_premium_plan(self):
        """POST /api/subscriptions/activate with plan='premium'"""
        resp = requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "premium"},
            headers=self.auth_headers()
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data.get("plan") == "premium", f"Expected plan=premium, got {data.get('plan')}"
        print(f"✅ Premium plan activated")
    
    # ===== GET /api/subscriptions/my =====
    def test_get_my_subscription(self):
        """GET /api/subscriptions/my - returns subscription status"""
        resp = requests.get(
            f"{BASE_URL}/api/subscriptions/my",
            headers=self.auth_headers()
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "subscription_active" in data
        assert "subscription_plan" in data
        assert "days_remaining" in data
        print(f"✅ My subscription: active={data.get('subscription_active')}, plan={data.get('subscription_plan')}, days={data.get('days_remaining')}")
    
    def test_subscription_has_days_remaining(self):
        """GET /api/subscriptions/my should return days_remaining"""
        resp = requests.get(
            f"{BASE_URL}/api/subscriptions/my",
            headers=self.auth_headers()
        )
        assert resp.status_code == 200
        data = resp.json()
        days = data.get("days_remaining", 0)
        assert isinstance(days, int), f"days_remaining should be int, got {type(days)}"
        print(f"✅ Days remaining: {days}")
    
    # ===== GET /api/subscriptions/my-limits =====
    def test_get_my_limits(self):
        """GET /api/subscriptions/my-limits - returns plan limits"""
        resp = requests.get(
            f"{BASE_URL}/api/subscriptions/my-limits",
            headers=self.auth_headers()
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "plan" in data
        assert "features" in data
        features = data["features"]
        assert "offers" in features
        assert "pdf_contracts" in features
        assert "ai_sketches" in features
        print(f"✅ My limits: plan={data.get('plan')}, features={list(features.keys())}")
    
    def test_pro_plan_has_pdf_contracts_enabled(self):
        """Pro plan should have pdf_contracts enabled"""
        # First ensure pro plan is active
        requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "pro"},
            headers=self.auth_headers()
        )
        resp = requests.get(
            f"{BASE_URL}/api/subscriptions/my-limits",
            headers=self.auth_headers()
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["plan"] == "pro"
        assert data["features"]["pdf_contracts"] is True, "Pro plan should have pdf_contracts=True"
        print(f"✅ Pro plan has pdf_contracts enabled")
    
    def test_basic_plan_has_pdf_contracts_disabled(self):
        """Basic plan should have pdf_contracts disabled"""
        # Activate basic plan
        requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "basic"},
            headers=self.auth_headers()
        )
        resp = requests.get(
            f"{BASE_URL}/api/subscriptions/my-limits",
            headers=self.auth_headers()
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["plan"] == "basic"
        assert data["features"]["pdf_contracts"] is False, "Basic plan should have pdf_contracts=False"
        print(f"✅ Basic plan has pdf_contracts disabled")
    
    # ===== GET /api/subscriptions/check-feature/{feature} =====
    def test_check_feature_pdf_contracts_pro(self):
        """GET /api/subscriptions/check-feature/pdf_contracts - allowed for pro"""
        # Activate pro plan
        requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "pro"},
            headers=self.auth_headers()
        )
        resp = requests.get(
            f"{BASE_URL}/api/subscriptions/check-feature/pdf_contracts",
            headers=self.auth_headers()
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "allowed" in data
        assert data["allowed"] is True, f"Pro plan should allow pdf_contracts, got {data}"
        print(f"✅ Pro plan: pdf_contracts allowed={data.get('allowed')}")
    
    def test_check_feature_pdf_contracts_basic(self):
        """GET /api/subscriptions/check-feature/pdf_contracts - denied for basic"""
        # Activate basic plan
        requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "basic"},
            headers=self.auth_headers()
        )
        resp = requests.get(
            f"{BASE_URL}/api/subscriptions/check-feature/pdf_contracts",
            headers=self.auth_headers()
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["allowed"] is False, f"Basic plan should NOT allow pdf_contracts, got {data}"
        print(f"✅ Basic plan: pdf_contracts allowed={data.get('allowed')}")
    
    def test_check_feature_offers(self):
        """GET /api/subscriptions/check-feature/offers - returns remaining count"""
        resp = requests.get(
            f"{BASE_URL}/api/subscriptions/check-feature/offers",
            headers=self.auth_headers()
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "allowed" in data
        assert "plan" in data
        # For offers feature, should also return remaining count
        if data.get("allowed"):
            assert "remaining" in data or "current" in data, f"Should have remaining or current for offers, got {data}"
        print(f"✅ Offers feature: allowed={data.get('allowed')}, data={data}")
    
    # ===== GET /api/auth/me =====
    def test_auth_me_includes_subscription_plan(self):
        """GET /api/auth/me - should include subscription_plan field"""
        resp = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=self.auth_headers()
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "subscription_plan" in data, f"auth/me should include subscription_plan field, got keys: {list(data.keys())}"
        assert "subscription_active" in data, f"auth/me should include subscription_active field"
        print(f"✅ /api/auth/me includes subscription_plan: {data.get('subscription_plan')}")
    
    # ===== Plan switch tests =====
    def test_switch_between_plans(self):
        """Test switching between different plans"""
        # Switch to basic
        resp = requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "basic"},
            headers=self.auth_headers()
        )
        assert resp.status_code == 200
        
        # Verify basic is active
        resp = requests.get(f"{BASE_URL}/api/subscriptions/my", headers=self.auth_headers())
        assert resp.json().get("subscription_plan") == "basic"
        
        # Switch to premium
        resp = requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "premium"},
            headers=self.auth_headers()
        )
        assert resp.status_code == 200
        
        # Verify premium is active
        resp = requests.get(f"{BASE_URL}/api/subscriptions/my", headers=self.auth_headers())
        assert resp.json().get("subscription_plan") == "premium"
        print(f"✅ Successfully switched from basic to premium")


class TestSubscriptionLimits:
    """Test plan-specific limits"""
    
    token = None
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Login as test company user"""
        if not TestSubscriptionLimits.token:
            resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            if resp.status_code == 200:
                TestSubscriptionLimits.token = resp.json().get("token")
            else:
                pytest.skip(f"Could not login: {resp.status_code}")
        yield
    
    def auth_headers(self):
        return {"Authorization": f"Bearer {TestSubscriptionLimits.token}"}
    
    def test_basic_plan_limits(self):
        """Basic plan should have 5 offers/month limit"""
        requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "basic"},
            headers=self.auth_headers()
        )
        resp = requests.get(f"{BASE_URL}/api/subscriptions/my-limits", headers=self.auth_headers())
        assert resp.status_code == 200
        data = resp.json()
        offers = data["features"]["offers"]
        assert offers["max"] == 5, f"Basic plan should have 5 offers/month, got {offers.get('max')}"
        print(f"✅ Basic plan: offers max={offers['max']}")
    
    def test_pro_plan_limits(self):
        """Pro plan should have 999 (unlimited) offers/month"""
        requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "pro"},
            headers=self.auth_headers()
        )
        resp = requests.get(f"{BASE_URL}/api/subscriptions/my-limits", headers=self.auth_headers())
        assert resp.status_code == 200
        data = resp.json()
        offers = data["features"]["offers"]
        assert offers["max"] == 999, f"Pro plan should have 999 offers/month, got {offers.get('max')}"
        print(f"✅ Pro plan: offers max={offers['max']} (unlimited)")
    
    def test_premium_plan_team_members(self):
        """Premium plan should have 5 team members"""
        requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "premium"},
            headers=self.auth_headers()
        )
        resp = requests.get(f"{BASE_URL}/api/subscriptions/my-limits", headers=self.auth_headers())
        assert resp.status_code == 200
        data = resp.json()
        team = data["features"]["team_members"]
        assert team == 5, f"Premium plan should have 5 team members, got {team}"
        print(f"✅ Premium plan: team_members={team}")


# Ensure test user has PRO subscription at the end for consistent state
@pytest.fixture(scope="module", autouse=True)
def restore_pro_subscription():
    yield
    # Restore PRO plan after all tests
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if resp.status_code == 200:
        token = resp.json().get("token")
        requests.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "pro"},
            headers={"Authorization": f"Bearer {token}"}
        )
        print("✅ Restored PRO subscription for test user")
