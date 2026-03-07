"""
Iteration 67: Test new chat features and AI suggestion analysis
- User search API for chat discovery (/api/users/search)
- AI suggestion analysis (/api/suggestions/analyze, /api/suggestions/analysis)
- Messaging API (conversations, messages, unread-count)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
TEST_USER_1 = {"email": "chat@test.bg", "password": "test123456"}
TEST_USER_2 = {"email": "ivan@test.bg", "password": "test123456"}


class TestUserSearch:
    """Test user search API for chat discovery"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token for test user 1"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_1)
        if response.status_code != 200:
            pytest.skip(f"Cannot login test user 1: {response.text}")
        self.token = response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_user_search_with_valid_query(self):
        """Test /api/users/search?q=Pet returns user search results"""
        response = requests.get(f"{BASE_URL}/api/users/search?q=Pet", headers=self.headers)
        assert response.status_code == 200, f"User search failed: {response.text}"
        data = response.json()
        assert "users" in data, "Response should contain 'users' key"
        print(f"✅ User search for 'Pet' returned {len(data['users'])} users")
        # Verify structure of user objects
        if data['users']:
            user = data['users'][0]
            assert "id" in user, "User should have 'id'"
            assert "name" in user, "User should have 'name'"
            assert "user_type" in user, "User should have 'user_type'"
            print(f"   First result: {user.get('name')} ({user.get('user_type')})")

    def test_user_search_short_query_returns_empty(self):
        """Test /api/users/search?q=ab returns empty for short queries (< 2 chars)"""
        response = requests.get(f"{BASE_URL}/api/users/search?q=ab", headers=self.headers)
        assert response.status_code == 200, f"User search failed: {response.text}"
        data = response.json()
        # Per the code, queries < 2 chars return empty - but "ab" is exactly 2 chars
        # Let's also test with single char
        print(f"✅ User search for 'ab' (2 chars) returned {len(data.get('users', []))} users")
        
        # Test with single char - should be empty
        response2 = requests.get(f"{BASE_URL}/api/users/search?q=a", headers=self.headers)
        assert response2.status_code == 200
        data2 = response2.json()
        assert len(data2.get('users', [])) == 0, "Single char query should return empty"
        print(f"✅ User search for 'a' (1 char) returned empty as expected")

    def test_user_search_requires_auth(self):
        """Test /api/users/search requires authentication"""
        response = requests.get(f"{BASE_URL}/api/users/search?q=test")
        assert response.status_code in [401, 403, 422], f"Should require auth: {response.status_code}"
        print(f"✅ User search correctly requires authentication (status: {response.status_code})")


class TestMessaging:
    """Test messaging and conversation APIs"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login both test users"""
        # Login user 1
        response1 = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_1)
        if response1.status_code != 200:
            pytest.skip(f"Cannot login test user 1: {response1.text}")
        self.token1 = response1.json().get("token")
        self.user1 = response1.json().get("user")
        self.headers1 = {"Authorization": f"Bearer {self.token1}"}
        
        # Login user 2
        response2 = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_2)
        if response2.status_code != 200:
            pytest.skip(f"Cannot login test user 2: {response2.text}")
        self.token2 = response2.json().get("token")
        self.user2 = response2.json().get("user")
        self.headers2 = {"Authorization": f"Bearer {self.token2}"}

    def test_send_message(self):
        """Test POST /api/messages - sends message between users"""
        unique_content = f"TEST_MSG_{int(time.time())}: Здравей от тестовете!"
        response = requests.post(
            f"{BASE_URL}/api/messages",
            json={
                "receiver_id": self.user2["id"],
                "content": unique_content
            },
            headers=self.headers1
        )
        assert response.status_code == 200, f"Send message failed: {response.text}"
        data = response.json()
        assert "id" in data, "Message should have 'id'"
        assert data["content"] == unique_content, "Message content should match"
        assert data["sender_id"] == self.user1["id"], "Sender ID should match"
        assert data["receiver_id"] == self.user2["id"], "Receiver ID should match"
        assert "conversation_id" in data, "Should have conversation_id"
        print(f"✅ Message sent successfully (id: {data['id'][:8]}...)")
        self.conversation_id = data["conversation_id"]

    def test_get_conversations(self):
        """Test GET /api/conversations - returns conversation list with other_user info"""
        response = requests.get(f"{BASE_URL}/api/conversations", headers=self.headers1)
        assert response.status_code == 200, f"Get conversations failed: {response.text}"
        data = response.json()
        assert "conversations" in data, "Response should contain 'conversations'"
        print(f"✅ User 1 has {len(data['conversations'])} conversations")
        
        # Verify structure
        if data['conversations']:
            conv = data['conversations'][0]
            assert "conversation_id" in conv, "Conversation should have 'conversation_id'"
            assert "other_user" in conv, "Conversation should have 'other_user'"
            assert "id" in conv["other_user"], "other_user should have 'id'"
            assert "name" in conv["other_user"], "other_user should have 'name'"
            print(f"   First conversation with: {conv['other_user'].get('name')}")

    def test_get_messages_for_conversation(self):
        """Test GET /api/messages/{conv_id} - returns messages for a conversation"""
        # First get conversations
        conv_response = requests.get(f"{BASE_URL}/api/conversations", headers=self.headers1)
        if conv_response.status_code != 200 or not conv_response.json().get('conversations'):
            pytest.skip("No conversations to test")
        
        conv_id = conv_response.json()['conversations'][0]['conversation_id']
        
        # Get messages
        response = requests.get(f"{BASE_URL}/api/messages/{conv_id}", headers=self.headers1)
        assert response.status_code == 200, f"Get messages failed: {response.text}"
        data = response.json()
        assert "messages" in data, "Response should contain 'messages'"
        print(f"✅ Conversation {conv_id[:20]}... has {len(data['messages'])} messages")
        
        # Verify structure
        if data['messages']:
            msg = data['messages'][0]
            assert "id" in msg, "Message should have 'id'"
            assert "content" in msg, "Message should have 'content'"
            assert "sender_id" in msg, "Message should have 'sender_id'"

    def test_get_unread_count(self):
        """Test GET /api/unread-count - returns unread message count"""
        response = requests.get(f"{BASE_URL}/api/unread-count", headers=self.headers2)
        assert response.status_code == 200, f"Get unread count failed: {response.text}"
        data = response.json()
        assert "unread_count" in data, "Response should contain 'unread_count'"
        assert isinstance(data["unread_count"], int), "Unread count should be integer"
        print(f"✅ User 2 has {data['unread_count']} unread messages")


class TestAISuggestionAnalysis:
    """Test AI analysis of suggestions"""

    def test_get_existing_analysis(self):
        """Test GET /api/suggestions/analysis - returns latest AI analysis"""
        response = requests.get(f"{BASE_URL}/api/suggestions/analysis")
        assert response.status_code == 200, f"Get analysis failed: {response.text}"
        data = response.json()
        # Either has analysis or is empty
        if data.get("analysis"):
            assert "total_suggestions" in data, "Should have total_suggestions"
            assert "total_votes" in data, "Should have total_votes"
            print(f"✅ Found existing AI analysis: {data.get('total_suggestions')} suggestions, {data.get('total_votes')} votes")
        else:
            print(f"✅ No existing AI analysis (expected on fresh DB)")

    def test_run_ai_analysis(self):
        """Test POST /api/suggestions/analyze - AI analyzes all suggestions"""
        # First ensure we have some suggestions
        suggestions_response = requests.get(f"{BASE_URL}/api/suggestions")
        if suggestions_response.status_code == 200:
            suggestions = suggestions_response.json().get("suggestions", [])
            if not suggestions:
                # Create a test suggestion first
                requests.post(f"{BASE_URL}/api/suggestions", json={
                    "text": "TEST_AI: Добавете повече функции за търсене",
                    "name": "Test User"
                })
        
        # Run AI analysis
        response = requests.post(f"{BASE_URL}/api/suggestions/analyze")
        assert response.status_code == 200, f"AI analysis failed: {response.text}"
        data = response.json()
        assert "analysis" in data, "Response should contain 'analysis'"
        assert "total_suggestions" in data, "Response should contain 'total_suggestions'"
        print(f"✅ AI Analysis completed!")
        print(f"   - Analyzed: {data.get('total_suggestions')} suggestions")
        print(f"   - Total votes: {data.get('total_votes')}")
        # Print first 200 chars of analysis
        analysis_preview = data.get('analysis', '')[:200]
        print(f"   - Preview: {analysis_preview}...")

    def test_analysis_is_persisted(self):
        """Test that AI analysis is saved and retrievable"""
        # First run analysis
        post_response = requests.post(f"{BASE_URL}/api/suggestions/analyze")
        if post_response.status_code != 200:
            pytest.skip("Cannot run analysis to test persistence")
        
        # Then verify it's saved
        get_response = requests.get(f"{BASE_URL}/api/suggestions/analysis")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data.get("analysis"), "Saved analysis should be retrievable"
        assert "analyzed_at" in data, "Should have analyzed_at timestamp"
        print(f"✅ Analysis persisted and retrievable (analyzed at: {data.get('analyzed_at')[:19]})")


class TestUserBasicEndpoint:
    """Test basic user info endpoint for chat"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user info"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_1)
        if response.status_code != 200:
            pytest.skip(f"Cannot login: {response.text}")
        self.user = response.json().get("user")

    def test_get_user_basic_info(self):
        """Test GET /api/user/{user_id}/basic returns user info"""
        response = requests.get(f"{BASE_URL}/api/user/{self.user['id']}/basic")
        assert response.status_code == 200, f"Get user basic failed: {response.text}"
        data = response.json()
        assert "id" in data, "Should have 'id'"
        assert "name" in data, "Should have 'name'"
        assert "user_type" in data, "Should have 'user_type'"
        print(f"✅ Got basic info for user: {data.get('name')}")

    def test_get_user_basic_invalid_id(self):
        """Test GET /api/user/{invalid_id}/basic returns 404"""
        response = requests.get(f"{BASE_URL}/api/user/nonexistent-user-id/basic")
        assert response.status_code == 404, f"Should return 404 for invalid user: {response.status_code}"
        print(f"✅ Correctly returns 404 for invalid user ID")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
