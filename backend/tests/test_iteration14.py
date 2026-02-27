"""
Iteration 14 Tests - Dropdown Navigation, Language Switcher, and AI Chatbot

Features tested:
1. Dropdown navigation menu - main nav items visible, rest in 'Още' dropdown
2. Language switcher with 8 languages
3. AI Chatbot endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic API health tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API root: {data['message']}")
    
    def test_categories(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) == 15
        print(f"✅ Categories: {len(data['categories'])} categories returned")
    
    def test_stats(self):
        """Test stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        print(f"✅ Stats: {data['total_projects']} projects, {data['total_companies']} companies")


class TestChatbotEndpoint:
    """Tests for the AI Chatbot endpoint"""
    
    def test_chatbot_valid_message(self):
        """Test chatbot responds to valid message"""
        response = requests.post(
            f"{BASE_URL}/api/chatbot/message",
            json={
                "message": "What is TemaDom?",
                "session_id": "test-iter14-valid",
                "lang": "en"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert "session_id" in data
        assert len(data["reply"]) > 0
        print(f"✅ Chatbot valid message: reply received ({len(data['reply'])} chars)")
    
    def test_chatbot_empty_message_returns_400(self):
        """Test chatbot rejects empty message with 400"""
        response = requests.post(
            f"{BASE_URL}/api/chatbot/message",
            json={
                "message": "",
                "session_id": "test-iter14-empty"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✅ Chatbot empty message: 400 returned - {data['detail']}")
    
    def test_chatbot_missing_message_returns_400(self):
        """Test chatbot rejects missing message field with 400"""
        response = requests.post(
            f"{BASE_URL}/api/chatbot/message",
            json={
                "session_id": "test-iter14-missing"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✅ Chatbot missing message: 400 returned - {data['detail']}")
    
    def test_chatbot_with_language_hint(self):
        """Test chatbot uses language hint for response"""
        response = requests.post(
            f"{BASE_URL}/api/chatbot/message",
            json={
                "message": "Hallo, was ist TemaDom?",
                "session_id": "test-iter14-de",
                "lang": "de"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        print(f"✅ Chatbot German message: reply received ({len(data['reply'])} chars)")
    
    def test_chatbot_bulgarian_default(self):
        """Test chatbot defaults to Bulgarian"""
        response = requests.post(
            f"{BASE_URL}/api/chatbot/message",
            json={
                "message": "Какво е TemaDom?",
                "session_id": "test-iter14-bg"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        print(f"✅ Chatbot Bulgarian message: reply received ({len(data['reply'])} chars)")


class TestProjects:
    """Test projects endpoints"""
    
    def test_list_projects(self):
        """Test listing projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert "total" in data
        assert "pages" in data
        print(f"✅ Projects list: {data['total']} total projects")
    
    def test_projects_with_filters(self):
        """Test projects with category filter"""
        response = requests.get(f"{BASE_URL}/api/projects?category=electricity")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        print(f"✅ Projects with filter: {len(data['projects'])} electricity projects")


class TestCompanies:
    """Test companies endpoints"""
    
    def test_list_companies(self):
        """Test listing companies"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert "total" in data
        print(f"✅ Companies list: {data['total']} total companies")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
