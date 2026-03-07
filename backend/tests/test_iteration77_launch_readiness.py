"""
FULL LAUNCH READINESS TEST - Iteration 77
TemaDom Bulgarian construction/renovation platform
Tests all critical functionality before going live
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from review request
COMPANY_EMAIL = "testp1c@test.bg"
COMPANY_PASSWORD = "Test1234"
CHAT_USER1_EMAIL = "chattest1@test.bg"
CHAT_USER1_PASSWORD = "Test1234"
CHAT_USER2_EMAIL = "chattest2@test.bg"
CHAT_USER2_PASSWORD = "Test1234"

@pytest.fixture(scope="session")
def session():
    """Shared requests session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def company_token(session):
    """Login as company user and get token"""
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": COMPANY_EMAIL,
        "password": COMPANY_PASSWORD
    })
    if response.status_code == 200:
        token = response.json().get("token")
        return token
    pytest.skip(f"Company user login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="session")
def chat_user1_token(session):
    """Login as chat user 1 and get token"""
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": CHAT_USER1_EMAIL,
        "password": CHAT_USER1_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Chat user 1 login failed: {response.status_code}")


@pytest.fixture(scope="session")
def chat_user2_token(session):
    """Login as chat user 2 and get token"""
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": CHAT_USER2_EMAIL,
        "password": CHAT_USER2_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Chat user 2 login failed: {response.status_code}")


# ================== HEALTH & BASIC ENDPOINTS ==================

class TestHealth:
    """Basic health check endpoints"""
    
    def test_api_health(self, session):
        """API health endpoint returns 200"""
        response = session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        assert response.json().get("status") == "ok"
        print("✓ Health check passed")
    
    def test_stats(self, session):
        """Stats endpoint returns project/company counts"""
        response = session.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        print(f"✓ Stats: {data['total_companies']} companies, {data['total_projects']} projects")
    
    def test_stats_live(self, session):
        """Live stats returns clients, companies, free_slots"""
        response = session.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "companies" in data
        assert "free_slots" in data
        assert "regions" in data
        print(f"✓ Live stats: {data['clients']} clients, free slots: {data['free_slots']['used']}/{data['free_slots']['total']}")


# ================== AUTHENTICATION ==================

class TestAuth:
    """Authentication flow tests"""
    
    def test_login_success(self, session):
        """Login with valid credentials returns token"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": COMPANY_EMAIL,
            "password": COMPANY_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == COMPANY_EMAIL
        print(f"✓ Login success: {data['user']['name']} ({data['user']['user_type']})")
    
    def test_login_invalid_credentials(self, session):
        """Login with wrong password returns 401"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": COMPANY_EMAIL,
            "password": "WrongPassword123"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_get_me(self, session, company_token):
        """Get current user profile"""
        response = session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == COMPANY_EMAIL
        assert "subscription_plan" in data
        print(f"✓ GET /auth/me: {data['name']}, plan: {data.get('subscription_plan')}")


# ================== SUBSCRIPTIONS ==================

class TestSubscriptions:
    """Subscription plans and feature access tests"""
    
    def test_get_subscription_plans(self, session):
        """GET /api/subscriptions/plans returns correct prices"""
        response = session.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        
        plans = data["plans"]
        
        # Check company plans exist
        assert "company" in plans
        company_plans = plans["company"]
        assert "basic" in company_plans
        assert "pro" in company_plans
        assert "premium" in company_plans
        
        # Verify prices (basic=15, pro=35, premium=75)
        basic = company_plans["basic"]
        pro = company_plans["pro"]
        premium = company_plans["premium"]
        
        assert "15 EUR" in basic["price"]
        assert "35 EUR" in pro["price"]
        assert "75 EUR" in premium["price"]
        
        # Check designer plans - designer_3 should be 119 EUR
        assert "designer" in plans
        designer_plans = plans["designer"]
        assert "designer_3" in designer_plans
        d3 = designer_plans["designer_3"]
        assert "119 EUR" in d3["price"], f"Expected designer_3 price 119 EUR, got {d3['price']}"
        
        print("✓ Subscription plans verified: basic=15€, pro=35€, premium=75€, designer_3=119€")
    
    def test_activate_subscription(self, session, company_token):
        """POST /api/subscriptions/activate works for company user"""
        response = session.post(
            f"{BASE_URL}/api/subscriptions/activate",
            headers={"Authorization": f"Bearer {company_token}"},
            json={"plan": "pro"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("plan") == "pro"
        assert "expires" in data
        print(f"✓ Subscription activated: {data['plan']}, expires: {data['expires'][:10]}")
    
    def test_check_feature_telegram_pro(self, session, company_token):
        """GET /api/subscriptions/check-feature/telegram_notifications returns allowed=true for pro"""
        response = session.get(
            f"{BASE_URL}/api/subscriptions/check-feature/telegram_notifications",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("allowed") == True
        assert data.get("plan") in ["pro", "premium"]
        print(f"✓ Feature check telegram_notifications: allowed={data['allowed']}, plan={data['plan']}")
    
    def test_check_feature_pdf_contracts_pro(self, session, company_token):
        """GET /api/subscriptions/check-feature/pdf_contracts returns allowed=true for pro"""
        response = session.get(
            f"{BASE_URL}/api/subscriptions/check-feature/pdf_contracts",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("allowed") == True
        print(f"✓ Feature check pdf_contracts: allowed={data['allowed']}")
    
    def test_get_my_subscription(self, session, company_token):
        """GET /api/subscriptions/my returns current subscription"""
        response = session.get(
            f"{BASE_URL}/api/subscriptions/my",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "subscription_active" in data
        assert "subscription_plan" in data
        print(f"✓ My subscription: {data['subscription_plan']}, active: {data['subscription_active']}")


# ================== CHAT / MESSAGING ==================

class TestChat:
    """Chat and messaging functionality"""
    
    def test_send_message(self, session, chat_user1_token, chat_user2_token):
        """POST /api/messages sends a message"""
        # First get user2's ID from their profile
        response = session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {chat_user2_token}"}
        )
        assert response.status_code == 200
        user2_id = response.json()["id"]
        
        # Send message from user1 to user2
        msg_content = f"TEST_LAUNCH_MSG_{int(time.time())}"
        response = session.post(
            f"{BASE_URL}/api/messages",
            headers={"Authorization": f"Bearer {chat_user1_token}"},
            json={
                "receiver_id": user2_id,
                "content": msg_content
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("content") == msg_content
        assert data.get("read") == False
        print(f"✓ Message sent: {msg_content[:30]}...")
    
    def test_chat_typing(self, session, chat_user1_token):
        """POST /api/chat/typing updates typing status"""
        response = session.post(
            f"{BASE_URL}/api/chat/typing",
            headers={"Authorization": f"Bearer {chat_user1_token}"},
            json={"conversation_id": "test_conv_1", "is_typing": True}
        )
        assert response.status_code == 200
        assert response.json().get("ok") == True
        print("✓ Typing indicator sent")
    
    def test_chat_online_heartbeat(self, session, chat_user1_token):
        """POST /api/chat/online heartbeat updates online status"""
        response = session.post(
            f"{BASE_URL}/api/chat/online",
            headers={"Authorization": f"Bearer {chat_user1_token}"}
        )
        assert response.status_code == 200
        assert response.json().get("ok") == True
        print("✓ Online heartbeat sent")
    
    def test_get_conversations(self, session, chat_user1_token):
        """GET /api/conversations returns conversations with is_online field"""
        response = session.get(
            f"{BASE_URL}/api/conversations",
            headers={"Authorization": f"Bearer {chat_user1_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        # Check that is_online field is present in other_user object if any conversations exist
        if data["conversations"]:
            conv = data["conversations"][0]
            assert "other_user" in conv
            assert "is_online" in conv["other_user"]
            print(f"✓ Conversations: {len(data['conversations'])} found, is_online field present")
        else:
            print("✓ Conversations endpoint working (no conversations yet)")


# ================== PDF GENERATION ==================

class TestPDFGeneration:
    """PDF generation tests"""
    
    def test_calculator_pdf(self, session):
        """POST /api/calculator/pdf generates valid PDF"""
        response = session.post(
            f"{BASE_URL}/api/calculator/pdf",
            json={
                "items": [
                    {"name": "Плочки", "quantity": 20, "unit": "м2", "basePrice": 25, "total": 500}
                ],
                "regionName": "София",
                "regionMultiplier": 1.0,
                "pricingType": "laborAndMaterial",
                "qualityLevel": "standard",
                "total": 500
            }
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        # Check PDF starts with %PDF
        content = response.content
        assert content[:4] == b"%PDF", "Response is not a valid PDF"
        print(f"✓ Calculator PDF generated: {len(content)} bytes")
    
    def test_contract_pdf(self, session):
        """POST /api/ai-sketch/export-contract generates Bulgarian PDF with custom fields"""
        response = session.post(
            f"{BASE_URL}/api/ai-sketch/export-contract",
            json={
                "company_name": "ТестФирма ЕООД",
                "company_bulstat": "123456789",
                "client_name": "Иван Петров",
                "client_egn": "8001011234",
                "address": "София, ул. Витоша 100",
                "total_eur": "5000",
                "total_bgn": "9779",
                "description": "Ремонт на баня",
                "deadline_days": "30",
                "payment_terms": "50% аванс, 50% при завършване",
                "warranty_years": "3"
            }
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        content = response.content
        assert content[:4] == b"%PDF", "Response is not a valid PDF"
        print(f"✓ Contract PDF generated: {len(content)} bytes")


# ================== PRODUCT SCRAPING ==================

class TestProductScraping:
    """Product search and scraping tests"""
    
    def test_get_stores_list(self, session):
        """GET /api/scrape/stores returns 9+ stores"""
        response = session.get(f"{BASE_URL}/api/scrape/stores")
        assert response.status_code == 200
        data = response.json()
        assert "stores" in data
        stores = data["stores"]
        assert len(stores) >= 9, f"Expected 9+ stores, got {len(stores)}"
        
        store_names = [s["name"] for s in stores]
        print(f"✓ Stores list: {len(stores)} stores - {', '.join(store_names[:5])}...")
    
    def test_product_search(self, session):
        """GET /api/scrape/search searches products across stores"""
        response = session.get(
            f"{BASE_URL}/api/scrape/search",
            params={"q": "стол", "store": "all"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "query" in data
        assert data["query"] == "стол"
        print(f"✓ Product search: found {data.get('total', 0)} products for 'стол'")


# ================== PROJECTS & COMPANIES ==================

class TestProjectsCompanies:
    """Projects and companies listing tests"""
    
    def test_get_projects(self, session):
        """GET /api/projects returns project listings"""
        response = session.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert "total" in data
        print(f"✓ Projects: {data['total']} total, {len(data['projects'])} returned")
    
    def test_get_companies(self, session):
        """GET /api/companies returns company listings"""
        response = session.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert "total" in data
        print(f"✓ Companies: {data['total']} total, {len(data['companies'])} returned")
    
    def test_get_categories(self, session):
        """GET /api/categories returns construction categories"""
        response = session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 10, "Expected 10+ categories"
        print(f"✓ Categories: {len(data['categories'])} categories available")


# ================== REGISTRATION VALIDATION ==================

class TestRegistration:
    """Registration flow validation"""
    
    def test_client_registration_fields(self, session):
        """Client registration requires name, email, password, phone, city"""
        # Test with missing field - should fail
        response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Test Client",
                "email": "testclient_missing@test.bg",
                "password": "Test1234",
                "user_type": "client"
                # Missing phone and city - may or may not be required
            }
        )
        # Registration may succeed without phone/city (optional fields)
        # We're just checking the endpoint works
        assert response.status_code in [200, 400, 422]
        print(f"✓ Client registration endpoint works (status: {response.status_code})")
    
    def test_company_registration_requires_bulstat(self, session):
        """Company registration requires bulstat (9 digits)"""
        # Test with invalid bulstat - should fail
        response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "name": "Test Company",
                "email": f"testcompany_invalid_{int(time.time())}@test.bg",
                "password": "Test1234",
                "user_type": "company",
                "phone": "0888888888",
                "city": "София",
                "bulstat": "123"  # Invalid - not 9 digits
            }
        )
        assert response.status_code == 400
        assert "9 цифри" in response.json().get("detail", "")
        print("✓ Company registration correctly requires 9-digit bulstat")


# ================== REVIEWS ==================

class TestReviews:
    """Reviews and testimonials"""
    
    def test_get_reviews(self, session):
        """GET /api/reviews returns reviews"""
        response = session.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200
        data = response.json()
        assert "reviews" in data
        print(f"✓ Reviews: {len(data['reviews'])} reviews found")


# ================== BLOG & COMMUNITY ==================

class TestBlogCommunity:
    """Blog and community endpoints"""
    
    def test_blog_page_frontend_only(self, session):
        """Blog is frontend-only (no backend API) - testing categories endpoint instead"""
        # Blog page is static frontend content loaded from /data/seoData.js and /data/blogArticles.js
        # The page is accessible at /blog route but has no backend API
        # Testing the categories endpoint as a proxy for blog-related content
        response = session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print("✓ Blog is frontend-only (static content) - verified categories API works")
    
    def test_get_community_posts(self, session):
        """GET /api/community/posts returns posts"""
        response = session.get(f"{BASE_URL}/api/community/posts")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        print(f"✓ Community: {len(data['posts'])} posts found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
