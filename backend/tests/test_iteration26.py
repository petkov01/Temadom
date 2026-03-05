"""
Test iteration 26: Testing latest changes
1. POST /api/feedback accepts 'service' field
2. AI Chart analyze endpoint returns correct data
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFeedbackWithService:
    """Test feedback endpoint accepts service field"""
    
    def test_feedback_with_service_field(self):
        """Test POST /api/feedback accepts service field"""
        response = requests.post(f"{BASE_URL}/api/feedback", json={
            "rating": 5,
            "text": "Test feedback for AI Chart service",
            "name": "Test User",
            "service": "ai-chart"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("status") == "ok"
        assert "message" in data
        print("✓ POST /api/feedback with service field - PASSED")
    
    def test_feedback_without_service_defaults_to_general(self):
        """Test feedback without service field defaults to 'general'"""
        response = requests.post(f"{BASE_URL}/api/feedback", json={
            "rating": 4,
            "text": "Test feedback without service",
            "name": "Test User 2"
        })
        assert response.status_code == 200
        print("✓ POST /api/feedback without service field - PASSED")
    
    def test_feedback_invalid_rating(self):
        """Test feedback with invalid rating returns error"""
        response = requests.post(f"{BASE_URL}/api/feedback", json={
            "rating": 0,
            "text": "Invalid rating test",
            "name": "Test",
            "service": "ai-chart"
        })
        assert response.status_code == 400
        print("✓ POST /api/feedback with invalid rating - PASSED (returns 400)")


class TestAIChartAnalyze:
    """Test AI Chart analyze endpoint"""
    
    def test_ai_chart_analyze_stairs(self):
        """Test AI chart analysis with stairs type"""
        response = requests.post(f"{BASE_URL}/api/ai-chart/analyze", json={
            "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
            "chart_type": "Стълби 4248.jpg",
            "client_name": "Test Client"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "analysis" in data
        assert "contract" in data
        assert data["analysis"]["grand_total"] == 3528
        print("✓ AI Chart analyze (stairs) - PASSED")
    
    def test_ai_chart_analyze_foundation(self):
        """Test AI chart analysis with foundation type"""
        response = requests.post(f"{BASE_URL}/api/ai-chart/analyze", json={
            "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
            "chart_type": "Фундамент",
            "client_name": "Foundation Test"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["analysis"]["grand_total"] == 10061
        print("✓ AI Chart analyze (foundation) - PASSED")


class TestAPIHealth:
    """Basic API health check"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("✓ API root accessible - PASSED")
    
    def test_categories(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print("✓ Categories endpoint - PASSED")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
