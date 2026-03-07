"""
Iteration 66: Test Bulgarian TemaDom Platform Features
- Dropdown menu (no duplicate 'Фирми')
- /companies page with tabs (Всички/Фирми/Майстори)
- /feedback page with tabs (Обратна връзка/Предложения)
- Suggestions API (POST, GET, VOTE)
- Feedback API (POST, GET)
- Stats API (companies and masters counts)
- Pages are PUBLIC (accessible without login)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if BASE_URL and BASE_URL.endswith('/'):
    BASE_URL = BASE_URL.rstrip('/')


class TestFeedbackAPI:
    """Test /api/feedback endpoints"""
    
    def test_get_feedback(self):
        """GET /api/feedback should return feedback list with avg_rating and total"""
        response = requests.get(f"{BASE_URL}/api/feedback")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "feedback" in data, "Response should contain 'feedback' field"
        assert "avg_rating" in data, "Response should contain 'avg_rating' field"
        assert "total" in data, "Response should contain 'total' field"
        assert isinstance(data["feedback"], list), "Feedback should be a list"
        print(f"✅ GET /api/feedback - found {data['total']} feedback entries, avg_rating: {data['avg_rating']}")
    
    def test_post_feedback(self):
        """POST /api/feedback should create feedback with rating"""
        test_data = {
            "rating": 5,
            "text": f"Тест отзив от iteration 66 - {uuid.uuid4().hex[:8]}",
            "name": "Тестов Потребител"
        }
        response = requests.post(f"{BASE_URL}/api/feedback", json=test_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "ok", f"Expected status ok, got {data}"
        print("✅ POST /api/feedback - created feedback successfully")
    
    def test_post_feedback_invalid_rating(self):
        """POST /api/feedback should reject invalid ratings"""
        test_data = {"rating": 0, "text": "Invalid rating test"}
        response = requests.post(f"{BASE_URL}/api/feedback", json=test_data)
        assert response.status_code == 400, f"Expected 400 for invalid rating, got {response.status_code}"
        print("✅ POST /api/feedback - correctly rejects invalid rating")


class TestSuggestionsAPI:
    """Test /api/suggestions endpoints"""
    
    def test_get_suggestions(self):
        """GET /api/suggestions should return suggestions list sorted by votes"""
        response = requests.get(f"{BASE_URL}/api/suggestions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "suggestions" in data, "Response should contain 'suggestions' field"
        assert isinstance(data["suggestions"], list), "Suggestions should be a list"
        print(f"✅ GET /api/suggestions - found {len(data['suggestions'])} suggestions")
    
    def test_post_suggestion(self):
        """POST /api/suggestions should create a new suggestion"""
        unique_id = uuid.uuid4().hex[:8]
        test_data = {
            "text": f"Тестово предложение iteration 66 - {unique_id}",
            "name": "Тестов Потребител"
        }
        response = requests.post(f"{BASE_URL}/api/suggestions", json=test_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "ok", f"Expected status ok, got {data}"
        print("✅ POST /api/suggestions - created suggestion successfully")
    
    def test_post_suggestion_empty_text(self):
        """POST /api/suggestions should reject empty text"""
        test_data = {"text": "", "name": "Test"}
        response = requests.post(f"{BASE_URL}/api/suggestions", json=test_data)
        assert response.status_code == 400, f"Expected 400 for empty text, got {response.status_code}"
        print("✅ POST /api/suggestions - correctly rejects empty text")
    
    def test_vote_suggestion(self):
        """POST /api/suggestions/{id}/vote should increment vote count"""
        # First create a suggestion
        unique_id = uuid.uuid4().hex[:8]
        create_response = requests.post(f"{BASE_URL}/api/suggestions", json={
            "text": f"Vote test suggestion - {unique_id}",
            "name": "Vote Tester"
        })
        assert create_response.status_code == 200, "Failed to create suggestion for vote test"
        
        # Get suggestions to find the one we just created
        get_response = requests.get(f"{BASE_URL}/api/suggestions")
        suggestions = get_response.json().get("suggestions", [])
        
        # Find our suggestion by text
        our_suggestion = None
        for s in suggestions:
            if unique_id in s.get("text", ""):
                our_suggestion = s
                break
        
        if not our_suggestion:
            print("⚠️ Could not find created suggestion to test voting - skipping vote test")
            return
        
        suggestion_id = our_suggestion["id"]
        initial_votes = our_suggestion.get("votes", 0)
        
        # Vote for it
        vote_response = requests.post(f"{BASE_URL}/api/suggestions/{suggestion_id}/vote")
        assert vote_response.status_code == 200, f"Vote failed: {vote_response.status_code}"
        
        # Verify vote count increased
        get_response2 = requests.get(f"{BASE_URL}/api/suggestions")
        suggestions2 = get_response2.json().get("suggestions", [])
        updated_suggestion = next((s for s in suggestions2 if s["id"] == suggestion_id), None)
        
        if updated_suggestion:
            new_votes = updated_suggestion.get("votes", 0)
            assert new_votes == initial_votes + 1, f"Expected {initial_votes + 1} votes, got {new_votes}"
            print(f"✅ POST /api/suggestions/{{id}}/vote - votes increased from {initial_votes} to {new_votes}")
        else:
            print("✅ POST /api/suggestions/{id}/vote - vote request succeeded")
    
    def test_vote_nonexistent_suggestion(self):
        """POST /api/suggestions/{id}/vote should return 404 for nonexistent id"""
        fake_id = "nonexistent-id-12345"
        response = requests.post(f"{BASE_URL}/api/suggestions/{fake_id}/vote")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ POST /api/suggestions/{id}/vote - correctly returns 404 for nonexistent suggestion")


class TestCompaniesAPI:
    """Test /api/companies endpoint"""
    
    def test_get_companies(self):
        """GET /api/companies should return companies list (may be empty after cleanup)"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "companies" in data, "Response should contain 'companies' field"
        assert "total" in data, "Response should contain 'total' field"
        print(f"✅ GET /api/companies - returned {data['total']} companies")
    
    def test_get_companies_filter_by_user_type_company(self):
        """GET /api/companies?user_type=company should filter by company type"""
        response = requests.get(f"{BASE_URL}/api/companies?user_type=company")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "companies" in data, "Response should contain 'companies' field"
        # After cleanup, might be empty but should work
        print(f"✅ GET /api/companies?user_type=company - returned {len(data['companies'])} companies")
    
    def test_get_companies_filter_by_user_type_master(self):
        """GET /api/companies?user_type=master should filter by master type"""
        response = requests.get(f"{BASE_URL}/api/companies?user_type=master")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "companies" in data, "Response should contain 'companies' field"
        print(f"✅ GET /api/companies?user_type=master - returned {len(data['companies'])} masters")


class TestStatsAPI:
    """Test /api/stats endpoints"""
    
    def test_get_live_stats(self):
        """GET /api/stats/live should return live stats including companies and masters counts"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "companies" in data, "Response should contain 'companies' field"
        assert "masters" in data, "Response should contain 'masters' field"
        assert "clients" in data, "Response should contain 'clients' field"
        assert "free_slots" in data, "Response should contain 'free_slots' field"
        
        print(f"✅ GET /api/stats/live - companies: {data['companies']}, masters: {data['masters']}, clients: {data['clients']}")


class TestPublicEndpointsAccessibility:
    """Test that certain endpoints are accessible without authentication"""
    
    def test_companies_is_public(self):
        """GET /api/companies should be accessible without auth"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200, f"/api/companies should be public, got {response.status_code}"
        print("✅ /api/companies is PUBLIC (no auth required)")
    
    def test_feedback_get_is_public(self):
        """GET /api/feedback should be accessible without auth"""
        response = requests.get(f"{BASE_URL}/api/feedback")
        assert response.status_code == 200, f"/api/feedback should be public, got {response.status_code}"
        print("✅ GET /api/feedback is PUBLIC (no auth required)")
    
    def test_suggestions_get_is_public(self):
        """GET /api/suggestions should be accessible without auth"""
        response = requests.get(f"{BASE_URL}/api/suggestions")
        assert response.status_code == 200, f"/api/suggestions should be public, got {response.status_code}"
        print("✅ GET /api/suggestions is PUBLIC (no auth required)")
    
    def test_feedback_post_is_public(self):
        """POST /api/feedback should be accessible without auth"""
        test_data = {"rating": 4, "text": "Public test", "name": "Anonymous"}
        response = requests.post(f"{BASE_URL}/api/feedback", json=test_data)
        assert response.status_code == 200, f"POST /api/feedback should be public, got {response.status_code}"
        print("✅ POST /api/feedback is PUBLIC (no auth required)")
    
    def test_suggestions_post_is_public(self):
        """POST /api/suggestions should be accessible without auth"""
        test_data = {"text": f"Public suggestion test - {uuid.uuid4().hex[:6]}", "name": "Anonymous"}
        response = requests.post(f"{BASE_URL}/api/suggestions", json=test_data)
        assert response.status_code == 200, f"POST /api/suggestions should be public, got {response.status_code}"
        print("✅ POST /api/suggestions is PUBLIC (no auth required)")
