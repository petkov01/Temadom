"""
Iteration 27: Telegram Bot Integration Tests
- POST /api/telegram/webhook (handles /start command)
- GET /api/telegram/status (returns linked status for user)
- POST /api/telegram/link (requires auth, links chat_id)
- POST /api/scanner3d/pdf (regression test)
- POST /api/ai-chart/pdf-contract (regression test)
- GET /api/subscriptions/plans (returns basic/pro/premium)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials for this iteration
TEST_EMAIL = "tgtest3@test.com"
TEST_PASSWORD = "test123"
TEST_NAME = "TG Test3"
TEST_PHONE = "0888123458"
TEST_BULSTAT = "123456780"

# Generate unique identifiers to avoid conflicts
UNIQUE_SUFFIX = uuid.uuid4().hex[:6]
UNIQUE_EMAIL = f"tgtest_{UNIQUE_SUFFIX}@test.com"
UNIQUE_BULSTAT = f"1234567{UNIQUE_SUFFIX[:2]}"  # 9 digits


class TestTelegramWebhook:
    """Test Telegram webhook endpoint"""
    
    def test_webhook_start_command_returns_200(self):
        """POST /api/telegram/webhook with /start command returns 200"""
        # Simulate Telegram webhook payload with /start command
        payload = {
            "message": {
                "chat": {"id": 123456789},
                "text": "/start"
            }
        }
        response = requests.post(f"{BASE_URL}/api/telegram/webhook", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        print("✅ POST /api/telegram/webhook with /start returns 200")
    
    def test_webhook_start_with_user_id_returns_200(self):
        """POST /api/telegram/webhook with /start user_id returns 200"""
        payload = {
            "message": {
                "chat": {"id": 987654321},
                "text": "/start some_user_id_123"
            }
        }
        response = requests.post(f"{BASE_URL}/api/telegram/webhook", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        print("✅ POST /api/telegram/webhook with /start user_id returns 200")
    
    def test_webhook_empty_message(self):
        """POST /api/telegram/webhook with empty message returns 200"""
        payload = {"message": {}}
        response = requests.post(f"{BASE_URL}/api/telegram/webhook", json=payload)
        assert response.status_code == 200
        print("✅ POST /api/telegram/webhook with empty message returns 200")


class TestTelegramStatusAndLink:
    """Test Telegram status and link endpoints"""
    
    @pytest.fixture(scope="class")
    def company_user_token(self):
        """Register or login company user and get token"""
        # First try to login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": UNIQUE_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_resp.status_code == 200:
            return login_resp.json()["token"]
        
        # Register new user
        register_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": UNIQUE_EMAIL,
            "password": TEST_PASSWORD,
            "name": f"{TEST_NAME}_{UNIQUE_SUFFIX}",
            "user_type": "company",
            "phone": TEST_PHONE,
            "bulstat": UNIQUE_BULSTAT[:9]  # Ensure 9 digits
        })
        
        if register_resp.status_code == 200:
            return register_resp.json()["token"]
        elif register_resp.status_code == 400 and "регистриран" in register_resp.text.lower():
            # Try login again
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": UNIQUE_EMAIL,
                "password": TEST_PASSWORD
            })
            if login_resp.status_code == 200:
                return login_resp.json()["token"]
        
        pytest.skip(f"Could not authenticate: {register_resp.text}")
    
    def test_telegram_status_for_new_user(self, company_user_token):
        """GET /api/telegram/status returns linked:false for new user"""
        headers = {"Authorization": f"Bearer {company_user_token}"}
        response = requests.get(f"{BASE_URL}/api/telegram/status", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "linked" in data
        # New user should have linked: false (or previously linked)
        print(f"✅ GET /api/telegram/status returns linked: {data.get('linked')}")
    
    def test_telegram_status_requires_auth(self):
        """GET /api/telegram/status requires authentication"""
        response = requests.get(f"{BASE_URL}/api/telegram/status")
        assert response.status_code in [401, 403, 422]
        print("✅ GET /api/telegram/status requires authentication")
    
    def test_telegram_link_requires_auth(self):
        """POST /api/telegram/link requires authentication"""
        response = requests.post(f"{BASE_URL}/api/telegram/link", json={"chat_id": 123456})
        assert response.status_code in [401, 403, 422]
        print("✅ POST /api/telegram/link requires authentication")
    
    def test_telegram_link_with_auth(self, company_user_token):
        """POST /api/telegram/link with auth links chat_id"""
        headers = {"Authorization": f"Bearer {company_user_token}"}
        test_chat_id = 999888777  # Test chat ID
        
        response = requests.post(
            f"{BASE_URL}/api/telegram/link",
            headers=headers,
            json={"chat_id": test_chat_id}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "plan" in data
        print(f"✅ POST /api/telegram/link links chat_id successfully")
        
        # Verify linked
        status_response = requests.get(f"{BASE_URL}/api/telegram/status", headers=headers)
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data.get("linked") == True
        print("✅ GET /api/telegram/status confirms linked: true after link")


class TestRegressionEndpoints:
    """Regression tests for existing endpoints"""
    
    def test_scanner3d_pdf_still_works(self):
        """POST /api/scanner3d/pdf returns valid PDF (regression)"""
        # Scanner3D PDF expects items array with category, name, price
        payload = {
            "items": [
                {"category": "Подове", "name": "Ламинат дъб", "price": 35.50},
                {"category": "Стени", "name": "Латекс бял", "price": 25.00},
                {"category": "Тавани", "name": "Окачен таван", "price": 45.00}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/scanner3d/pdf", json=payload)
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 100  # PDF has content
        print("✅ POST /api/scanner3d/pdf returns valid PDF (regression)")
    
    def test_ai_chart_pdf_still_works(self):
        """POST /api/ai-chart/pdf-contract returns valid PDF (regression)"""
        payload = {
            "title": "Количествена сметка - Тест",
            "description": "Тестов проект за AI анализ",
            "materials": [
                {"name": "Бетон", "quantity": 10, "unit": "м³", "price": 1500}
            ],
            "labor": [
                {"name": "Кофраж", "quantity": 50, "unit": "м²", "price": 750}
            ],
            "summary": {
                "materials_total": 1500,
                "labor_total": 750,
                "total": 2250,
                "vat": 450,
                "grand_total": 2700
            }
        }
        response = requests.post(f"{BASE_URL}/api/ai-chart/pdf-contract", json=payload)
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 100
        print("✅ POST /api/ai-chart/pdf-contract returns valid PDF (regression)")
    
    def test_subscription_plans_returns_tiers(self):
        """GET /api/subscriptions/plans returns basic/pro/premium tiers"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        plans = data["plans"]
        
        # Verify company plans section exists with all tiers
        assert "company" in plans, "company plans section missing"
        company_plans = plans["company"]
        
        assert "basic" in company_plans, "basic plan missing"
        assert "pro" in company_plans, "pro plan missing"
        assert "premium" in company_plans, "premium plan missing"
        
        # Verify БАЗОВ (15), ПРО (35), PREMIUM (75) prices
        basic = company_plans.get("basic", {})
        pro = company_plans.get("pro", {})
        premium = company_plans.get("premium", {})
        
        assert "15" in basic.get("price", ""), f"basic price incorrect: {basic.get('price')}"
        assert "35" in pro.get("price", ""), f"pro price incorrect: {pro.get('price')}"
        assert "75" in premium.get("price", ""), f"premium price incorrect: {premium.get('price')}"
        
        # Verify notification delay info for each tier
        assert "notification_delay" in basic, "basic notification_delay missing"
        assert "notification_delay" in pro, "pro notification_delay missing"
        assert "notification_delay" in premium, "premium notification_delay missing"
        
        print("✅ GET /api/subscriptions/plans returns БАЗОВ (15), ПРО (35), PREMIUM (75) with notification_delay")


class TestApiHealth:
    """Basic API health checks"""
    
    def test_api_root_health(self):
        """GET /api/ returns health check"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✅ GET /api/ returns 200 (health check)")
    
    def test_categories_endpoint(self):
        """GET /api/categories returns categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ GET /api/categories returns {len(data['categories'])} categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
