"""
Test iteration 76 - P1 Features Testing
Testing:
1. Subscription flow: activate, check status, feature access, limits
2. Chat enhancements: online status, typing indicators, read receipts, heartbeat
3. Scraping: 21 stores product search
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
COMPANY_USER = {"email": "testp1c@test.bg", "password": "Test1234"}
CHAT_USER_1 = {"email": "chattest1@test.bg", "password": "Test1234"}
CHAT_USER_2 = {"email": "chattest2@test.bg", "password": "Test1234"}


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def company_token(api_client):
    """Get token for company user with pro subscription"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=COMPANY_USER)
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Company login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def chat_user1_token(api_client):
    """Get token for chat user 1"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=CHAT_USER_1)
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Chat user 1 login failed: {response.status_code}")


@pytest.fixture(scope="module")
def chat_user2_token(api_client):
    """Get token for chat user 2"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=CHAT_USER_2)
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Chat user 2 login failed: {response.status_code}")


@pytest.fixture(scope="module")
def chat_user1_info(api_client, chat_user1_token):
    """Get chat user 1 info"""
    response = api_client.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {chat_user1_token}"})
    if response.status_code == 200:
        return response.json()
    return {"id": "unknown", "name": "Chat User 1"}


@pytest.fixture(scope="module")
def chat_user2_info(api_client, chat_user2_token):
    """Get chat user 2 info"""
    response = api_client.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {chat_user2_token}"})
    if response.status_code == 200:
        return response.json()
    return {"id": "unknown", "name": "Chat User 2"}


# ============== SUBSCRIPTION TESTS ==============

class TestSubscriptionFlow:
    """Test subscription activation, status, and feature access"""

    def test_subscription_plans_available(self, api_client):
        """Test GET /api/subscriptions/plans returns plans"""
        response = api_client.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert isinstance(data["plans"], dict)
        assert len(data["plans"]) >= 3  # basic, pro, premium
        print(f"✓ Subscription plans: {list(data['plans'].keys())}")

    def test_activate_pro_subscription(self, api_client, company_token):
        """Test POST /api/subscriptions/activate with plan=pro"""
        response = api_client.post(
            f"{BASE_URL}/api/subscriptions/activate",
            json={"plan": "pro"},
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["plan"] == "pro"
        assert "expires" in data
        print(f"✓ Pro subscription activated, expires: {data['expires']}")

    def test_get_my_subscription_status(self, api_client, company_token):
        """Test GET /api/subscriptions/my returns plan status and days_remaining"""
        response = api_client.get(
            f"{BASE_URL}/api/subscriptions/my",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate required fields
        assert "subscription_active" in data
        assert "subscription_plan" in data
        assert "days_remaining" in data
        
        # Verify data
        assert data["subscription_active"] == True
        assert data["subscription_plan"] == "pro"
        assert isinstance(data["days_remaining"], int)
        assert data["days_remaining"] >= 0
        print(f"✓ Subscription status: plan={data['subscription_plan']}, active={data['subscription_active']}, days_remaining={data['days_remaining']}")

    def test_check_feature_access_telegram(self, api_client, company_token):
        """Test GET /api/subscriptions/check-feature/telegram_notifications returns allowed=true for pro"""
        response = api_client.get(
            f"{BASE_URL}/api/subscriptions/check-feature/telegram_notifications",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "allowed" in data
        assert data["allowed"] == True, f"Pro plan should have telegram_notifications access. Response: {data}"
        print(f"✓ Feature access (telegram_notifications): allowed={data['allowed']}")

    def test_subscription_limits(self, api_client, company_token):
        """Test GET /api/subscriptions/my-limits returns plan limits"""
        response = api_client.get(
            f"{BASE_URL}/api/subscriptions/my-limits",
            headers={"Authorization": f"Bearer {company_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✓ Subscription limits retrieved: {list(data.keys())}")


# ============== CHAT ENHANCEMENT TESTS ==============

class TestChatOnlineStatus:
    """Test chat online status heartbeat and status check"""

    def test_send_heartbeat(self, api_client, chat_user1_token):
        """Test POST /api/chat/online sends heartbeat"""
        response = api_client.post(
            f"{BASE_URL}/api/chat/online",
            json={},
            headers={"Authorization": f"Bearer {chat_user1_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        print("✓ Heartbeat sent successfully")

    def test_check_online_status(self, api_client, chat_user1_token, chat_user1_info):
        """Test GET /api/chat/online/{user_id} returns online status"""
        # First send heartbeat
        api_client.post(
            f"{BASE_URL}/api/chat/online",
            json={},
            headers={"Authorization": f"Bearer {chat_user1_token}"}
        )
        
        # Check online status
        user_id = chat_user1_info.get("id")
        if user_id and user_id != "unknown":
            response = api_client.get(f"{BASE_URL}/api/chat/online/{user_id}")
            assert response.status_code == 200
            data = response.json()
            assert "online" in data
            assert isinstance(data["online"], bool)
            print(f"✓ Online status for user {user_id}: online={data['online']}")

    def test_conversations_include_online_status(self, api_client, chat_user1_token):
        """Test GET /api/conversations includes is_online field"""
        response = api_client.get(
            f"{BASE_URL}/api/conversations",
            headers={"Authorization": f"Bearer {chat_user1_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        
        # Check if conversations have online status
        if len(data["conversations"]) > 0:
            conv = data["conversations"][0]
            assert "other_user" in conv
            assert "is_online" in conv["other_user"]
            print(f"✓ Conversations include is_online: {conv['other_user'].get('is_online')}")
        else:
            print("✓ Conversations endpoint working (no conversations yet)")


class TestChatTypingIndicators:
    """Test typing indicators POST and GET"""

    def test_send_typing_indicator(self, api_client, chat_user1_token, chat_user2_info):
        """Test POST /api/chat/typing sends typing status"""
        user1_id = "user1"
        user2_id = chat_user2_info.get("id", "user2")
        conv_id = f"{min(user1_id, user2_id)}_{max(user1_id, user2_id)}"
        
        response = api_client.post(
            f"{BASE_URL}/api/chat/typing",
            json={"conversation_id": conv_id, "is_typing": True},
            headers={"Authorization": f"Bearer {chat_user1_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        print(f"✓ Typing indicator sent for conversation {conv_id}")

    def test_get_typing_status(self, api_client, chat_user1_token):
        """Test GET /api/chat/typing/{conv_id} returns typing status"""
        test_conv_id = "test_typing_conv"
        response = api_client.get(
            f"{BASE_URL}/api/chat/typing/{test_conv_id}",
            headers={"Authorization": f"Bearer {chat_user1_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "is_typing" in data
        assert isinstance(data["is_typing"], bool)
        print(f"✓ Typing status retrieved: is_typing={data['is_typing']}")


class TestChatReadReceipts:
    """Test message read receipts"""

    def test_messages_have_read_field(self, api_client, chat_user1_token, chat_user2_token, chat_user1_info, chat_user2_info):
        """Test messages include 'read' field"""
        # Send a message from user1 to user2
        receiver_id = chat_user2_info.get("id")
        if not receiver_id or receiver_id == "unknown":
            pytest.skip("Could not get chat user 2 ID")
        
        # Send test message
        response = api_client.post(
            f"{BASE_URL}/api/messages",
            json={"receiver_id": receiver_id, "content": f"TEST_MSG_{uuid.uuid4().hex[:8]}"},
            headers={"Authorization": f"Bearer {chat_user1_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            assert "read" in data
            assert data["read"] == False  # New messages should be unread
            print(f"✓ Message created with read=False: {data['id']}")
        else:
            print(f"⚠ Message send returned {response.status_code}")

    def test_mark_message_read(self, api_client, chat_user1_token, chat_user2_token, chat_user1_info, chat_user2_info):
        """Test POST /api/messages/{id}/read marks message as read"""
        # First send a message from user1 to user2
        receiver_id = chat_user2_info.get("id")
        sender_id = chat_user1_info.get("id")
        if not receiver_id or receiver_id == "unknown":
            pytest.skip("Could not get chat user IDs")
        
        # Send test message
        send_response = api_client.post(
            f"{BASE_URL}/api/messages",
            json={"receiver_id": receiver_id, "content": f"TEST_READ_{uuid.uuid4().hex[:8]}"},
            headers={"Authorization": f"Bearer {chat_user1_token}"}
        )
        
        if send_response.status_code != 200:
            pytest.skip("Could not send test message")
        
        msg_id = send_response.json()["id"]
        
        # Mark as read by receiver (user2)
        response = api_client.post(
            f"{BASE_URL}/api/messages/{msg_id}/read",
            json={},
            headers={"Authorization": f"Bearer {chat_user2_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        print(f"✓ Message {msg_id} marked as read")


# ============== SCRAPING TESTS ==============

class TestProductScraping:
    """Test product search across Bulgarian stores"""

    def test_get_stores_list(self, api_client):
        """Test GET /api/scrape/stores lists all available stores"""
        response = api_client.get(f"{BASE_URL}/api/scrape/stores")
        assert response.status_code == 200
        data = response.json()
        assert "stores" in data
        assert len(data["stores"]) >= 21, f"Expected at least 21 stores, got {len(data['stores'])}"
        
        store_names = [s["name"] for s in data["stores"]]
        print(f"✓ Available stores ({len(data['stores'])}): {', '.join(store_names)}")
        
        # Verify key stores are present
        expected_stores = ["HomeMax", "Bauhaus", "Jysk", "Praktiker", "IKEA"]
        for store in expected_stores:
            assert any(store.lower() in s["name"].lower() for s in data["stores"]), f"Store {store} not found"

    def test_product_search_all_stores(self, api_client):
        """Test GET /api/scrape/search?q=стол&store=all returns products"""
        response = api_client.get(
            f"{BASE_URL}/api/scrape/search",
            params={"q": "стол", "store": "all"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "query" in data
        assert "total" in data
        assert "products" in data
        assert "stores_searched" in data
        assert "stores_with_results" in data
        
        print(f"✓ Product search: query='{data['query']}', total={data['total']}, stores_searched={data['stores_searched']}, stores_with_results={data['stores_with_results']}")
        
        # If products found, verify structure
        if data["products"]:
            product = data["products"][0]
            assert "name" in product
            assert "store" in product
            assert "url" in product
            print(f"  Sample product: {product['name']} from {product['store']}")

    def test_product_search_single_store(self, api_client):
        """Test product search on a specific store"""
        response = api_client.get(
            f"{BASE_URL}/api/scrape/search",
            params={"q": "маса", "store": "jysk"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✓ Single store search (Jysk): {data['total']} products found")

    def test_product_search_query_validation(self, api_client):
        """Test search requires at least 2 characters"""
        response = api_client.get(
            f"{BASE_URL}/api/scrape/search",
            params={"q": "a", "store": "all"}
        )
        assert response.status_code == 400
        print("✓ Query validation: requires at least 2 characters")


# ============== BASIC AUTH AND HEALTH TESTS ==============

class TestBasicEndpoints:
    """Basic health and auth tests"""

    def test_health_check(self, api_client):
        """Test API health check"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ Health check passed")

    def test_company_user_login(self, api_client):
        """Test company user can login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=COMPANY_USER)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data or "access_token" in data
        print(f"✓ Company user login successful")

    def test_chat_users_login(self, api_client):
        """Test chat test users can login"""
        for user in [CHAT_USER_1, CHAT_USER_2]:
            response = api_client.post(f"{BASE_URL}/api/auth/login", json=user)
            assert response.status_code == 200
            data = response.json()
            assert "token" in data or "access_token" in data
        print("✓ Chat test users login successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
