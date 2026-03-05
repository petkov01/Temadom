"""
Backend tests for TemaDom Video Designer v6 and AI Sketch endpoints
Tests the new /api/ai-designer/video-generate endpoint and existing AI Sketch endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestVideoDesignerEndpoint:
    """Tests for POST /api/ai-designer/video-generate"""
    
    def test_video_generate_endpoint_exists(self):
        """Test that video-generate endpoint exists and returns 422 without proper data"""
        response = requests.post(f"{BASE_URL}/api/ai-designer/video-generate", 
                                 headers={"Content-Type": "application/json"})
        # Should return 422 because video is required
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Response should contain 'detail' field"
        print(f"✅ PASS: video-generate endpoint exists, returns 422 for missing video")
        print(f"   Response: {data}")
    
    def test_video_generate_requires_video_file(self):
        """Test that endpoint requires video file in form data"""
        # Send empty form data
        response = requests.post(f"{BASE_URL}/api/ai-designer/video-generate", 
                                 data={})
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        data = response.json()
        # Check error mentions missing video field
        detail = data.get("detail", [])
        assert any("video" in str(d).lower() for d in detail), "Error should mention missing video"
        print(f"✅ PASS: Endpoint correctly requires 'video' field")
    
    def test_video_generate_accepts_form_params(self):
        """Test that endpoint accepts width, length, height, style, room_type, notes params"""
        # Send form data with just params but no video
        response = requests.post(f"{BASE_URL}/api/ai-designer/video-generate", 
                                 data={
                                     "width": "4",
                                     "length": "5", 
                                     "height": "2.6",
                                     "style": "modern",
                                     "room_type": "living_room",
                                     "notes": "test"
                                 })
        # Should still return 422 because video is required
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        data = response.json()
        detail = data.get("detail", [])
        # Only video should be missing
        missing_fields = [d.get("loc", [])[-1] for d in detail if isinstance(d, dict)]
        assert "video" in missing_fields, "Only video should be missing"
        print(f"✅ PASS: Endpoint accepts form params, only requires video file")


class TestAISketchEndpoint:
    """Tests for POST /api/ai-sketch/analyze"""
    
    def test_ai_sketch_analyze_endpoint_exists(self):
        """Test that ai-sketch analyze endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/ai-sketch/analyze",
                                 json={})
        # Should return 400 or 422 for invalid data
        assert response.status_code in [400, 422, 500], f"Expected 400/422/500, got {response.status_code}"
        print(f"✅ PASS: ai-sketch/analyze endpoint exists, status: {response.status_code}")


class TestAPIHealth:
    """Basic API health tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Maistori" in data["message"] or "API" in data["message"]
        print(f"✅ PASS: API root accessible: {data.get('message')}")
    
    def test_stats_endpoint(self):
        """Test stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data or "projects" in str(data).lower()
        print(f"✅ PASS: Stats endpoint accessible")
    
    def test_stats_live_endpoint(self):
        """Test live stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data or "companies" in data
        print(f"✅ PASS: Live stats endpoint accessible")


class TestCategories:
    """Tests for categories endpoint"""
    
    def test_categories_endpoint(self):
        """Test categories list endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ PASS: Categories endpoint returns {len(data['categories'])} categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
