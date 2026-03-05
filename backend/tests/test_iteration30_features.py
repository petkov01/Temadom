"""
Iteration 30: Test Live Counter, AI Sketch share links, BeforeAfter slider, and Logo cleanup
Features:
1. Live Counter widget (/api/stats/live endpoint)
2. AI Sketch project save/load via URL param ?id=xxx
3. BeforeAfterSlider component structure in IA Designer
4. Logo cleanup (no white text next to logo)
"""

import pytest
import requests
import os
import base64
import numpy as np

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ---------------------------
# Live Counter API Tests
# ---------------------------
class TestLiveCounterAPI:
    """Test /api/stats/live endpoint for the floating widget"""
    
    def test_stats_live_returns_200(self):
        """GET /api/stats/live should return 200"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: /api/stats/live returns 200")
        
    def test_stats_live_returns_required_fields(self):
        """Response should contain clients, companies, masters, free_slots fields"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "clients" in data, "Missing 'clients' field"
        assert "companies" in data, "Missing 'companies' field"
        assert "masters" in data, "Missing 'masters' field"
        assert "free_slots" in data, "Missing 'free_slots' field"
        
        # Verify free_slots structure
        assert "used" in data["free_slots"], "Missing 'free_slots.used' field"
        assert "total" in data["free_slots"], "Missing 'free_slots.total' field"
        
        # Verify types
        assert isinstance(data["clients"], int), "'clients' should be an integer"
        assert isinstance(data["companies"], int), "'companies' should be an integer"
        assert isinstance(data["masters"], int), "'masters' should be an integer"
        assert isinstance(data["free_slots"]["used"], int), "'free_slots.used' should be an integer"
        assert isinstance(data["free_slots"]["total"], int), "'free_slots.total' should be an integer"
        
        print(f"PASS: /api/stats/live returns all fields: clients={data['clients']}, companies={data['companies']}, masters={data['masters']}, free_slots={data['free_slots']}")
        
    def test_stats_live_values_are_non_negative(self):
        """All values should be non-negative"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        data = response.json()
        
        assert data["clients"] >= 0, "clients should be >= 0"
        assert data["companies"] >= 0, "companies should be >= 0"
        assert data["masters"] >= 0, "masters should be >= 0"
        assert data["free_slots"]["used"] >= 0, "free_slots.used should be >= 0"
        assert data["free_slots"]["total"] >= 0, "free_slots.total should be >= 0"
        
        print("PASS: All /api/stats/live values are non-negative")


# ---------------------------
# AI Sketch Save/Load Tests
# ---------------------------
class TestAISketchShareFeature:
    """Test AI Sketch project save and load via share links"""
    
    def _create_test_image_base64(self):
        """Create a simple test image (100x100 white with black rectangle)"""
        import cv2
        img = np.ones((100, 100, 3), dtype=np.uint8) * 255
        cv2.rectangle(img, (10, 10), (90, 90), (0, 0, 0), 2)
        cv2.putText(img, "5m", (40, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        _, buffer = cv2.imencode('.jpg', img)
        return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode()}"
    
    def test_ai_sketch_analyze_returns_id(self):
        """POST /api/ai-sketch/analyze should return an 'id' field for sharing"""
        test_img = self._create_test_image_base64()
        
        response = requests.post(f"{BASE_URL}/api/ai-sketch/analyze", json={
            "sketches": [test_img],
            "building_type": "residential",
            "notes": "Test sketch for share feature"
        }, timeout=120)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "id" in data, "Response should contain 'id' field for sharing"
        assert isinstance(data["id"], str), "'id' should be a string"
        assert len(data["id"]) > 10, "'id' should be a valid UUID-like string"
        
        # Store ID for next test
        self.sketch_id = data["id"]
        print(f"PASS: /api/ai-sketch/analyze returns id={data['id']}")
        return data["id"]
        
    def test_ai_sketch_get_by_id(self):
        """GET /api/ai-sketch/{sketch_id} should return saved project data"""
        # First create a sketch
        test_img = self._create_test_image_base64()
        create_resp = requests.post(f"{BASE_URL}/api/ai-sketch/analyze", json={
            "sketches": [test_img],
            "building_type": "commercial",
            "notes": "Test for GET endpoint"
        }, timeout=120)
        
        assert create_resp.status_code == 200, f"Create failed: {create_resp.status_code}"
        sketch_id = create_resp.json()["id"]
        
        # Now GET the sketch by ID
        response = requests.get(f"{BASE_URL}/api/ai-sketch/{sketch_id}")
        
        assert response.status_code == 200, f"GET failed: {response.status_code}"
        data = response.json()
        
        # Verify returned data structure
        assert "id" in data, "Response missing 'id'"
        assert "building_type" in data, "Response missing 'building_type'"
        assert "geometry" in data, "Response missing 'geometry'"
        assert "glb_base64" in data, "Response missing 'glb_base64'"
        assert "summary" in data, "Response missing 'summary'"
        
        assert data["id"] == sketch_id, "Returned ID doesn't match requested ID"
        assert data["building_type"] == "commercial", "building_type should be 'commercial'"
        
        print(f"PASS: GET /api/ai-sketch/{sketch_id} returns complete project data")
        
    def test_ai_sketch_get_nonexistent_returns_404(self):
        """GET /api/ai-sketch/{invalid_id} should return 404"""
        response = requests.get(f"{BASE_URL}/api/ai-sketch/nonexistent-id-12345")
        assert response.status_code == 404, f"Expected 404 for invalid ID, got {response.status_code}"
        print("PASS: GET /api/ai-sketch/{invalid_id} returns 404")


# ---------------------------
# General Stats Endpoint Test
# ---------------------------
class TestStatsEndpoint:
    """Test general stats endpoint"""
    
    def test_stats_returns_200(self):
        """GET /api/stats should return 200"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_projects" in data
        assert "total_companies" in data
        assert "total_reviews" in data
        
        print(f"PASS: /api/stats returns: projects={data['total_projects']}, companies={data['total_companies']}, reviews={data['total_reviews']}")


# ---------------------------
# Health Check
# ---------------------------
class TestHealthCheck:
    """Basic health checks"""
    
    def test_api_root(self):
        """GET /api/ should return 200"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("PASS: GET /api/ returns 200")
        
    def test_homepage_loads(self):
        """GET / should return 200"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        print("PASS: Homepage loads")
        
    def test_ai_sketch_page_loads(self):
        """GET /ai-sketch route should load"""
        response = requests.get(f"{BASE_URL}/ai-sketch")
        assert response.status_code == 200
        print("PASS: /ai-sketch page loads")
        
    def test_room_scan_page_loads(self):
        """GET /room-scan route should load"""
        response = requests.get(f"{BASE_URL}/room-scan")
        assert response.status_code == 200
        print("PASS: /room-scan page loads")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
