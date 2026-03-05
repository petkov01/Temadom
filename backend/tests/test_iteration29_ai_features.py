"""
Iteration 29: AI Sketch and IA Designer Feature Tests
Tests the AI Sketch (CV/OCR Pipeline) and IA Designer endpoints.
"""
import pytest
import requests
import os
import base64
import numpy as np
import cv2

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://sketch-to-3d-16.preview.emergentagent.com").rstrip("/")


def create_test_sketch_image():
    """Create a programmatic test image with cv2 - rectangle + text '10m'"""
    # Create a white image
    img = np.ones((400, 600, 3), dtype=np.uint8) * 255
    
    # Draw a rectangle (simulating a wall/room)
    cv2.rectangle(img, (50, 50), (550, 350), (0, 0, 0), 2)
    
    # Draw inner rectangle (simulating another wall)
    cv2.rectangle(img, (100, 100), (500, 300), (0, 0, 0), 2)
    
    # Add text for dimensions (simulating measurements)
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, '10m', (250, 40), font, 1, (0, 0, 0), 2)
    cv2.putText(img, '5m', (555, 200), font, 1, (0, 0, 0), 2)
    cv2.putText(img, '8m', (250, 370), font, 1, (0, 0, 0), 2)
    
    # Add some diagonal lines (simulating stairs)
    cv2.line(img, (150, 150), (200, 250), (0, 0, 0), 2)
    cv2.line(img, (200, 150), (250, 250), (0, 0, 0), 2)
    
    # Encode as base64
    _, buffer = cv2.imencode('.jpg', img)
    b64 = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{b64}"


class TestHealthAndBasicEndpoints:
    """Basic API health checks"""
    
    def test_api_health(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API health check passed: {data}")
    
    def test_categories_endpoint(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✅ Categories endpoint returned {len(data['categories'])} categories")


class TestAISketchEndpoint:
    """Tests for /api/ai-sketch/analyze endpoint - OpenCV + Tesseract OCR"""
    
    def test_ai_sketch_no_sketches(self):
        """Test AI Sketch endpoint with no sketches - should return 400"""
        response = requests.post(f"{BASE_URL}/api/ai-sketch/analyze", json={
            "sketches": [],
            "building_type": "residential",
            "notes": ""
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✅ AI Sketch no sketches returns 400: {data['detail']}")
    
    def test_ai_sketch_with_test_image(self):
        """Test AI Sketch endpoint with a programmatically generated test image"""
        # Create test image
        test_image_b64 = create_test_sketch_image()
        
        response = requests.post(f"{BASE_URL}/api/ai-sketch/analyze", json={
            "sketches": [test_image_b64],
            "building_type": "residential",
            "notes": "Test sketch with 10m x 5m dimensions"
        }, timeout=120)
        
        # Should return 200 with geometry and glb_base64
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "geometry" in data, "Response missing 'geometry'"
        assert "glb_base64" in data, "Response missing 'glb_base64'"
        assert "summary" in data, "Response missing 'summary'"
        
        # Verify geometry structure
        geometry = data["geometry"]
        assert "walls" in geometry, "Geometry missing 'walls'"
        assert "scale_m_per_px" in geometry, "Geometry missing 'scale_m_per_px'"
        
        # Verify summary structure
        summary = data["summary"]
        assert "walls_detected" in summary, "Summary missing 'walls_detected'"
        assert "total_lines" in summary, "Summary missing 'total_lines'"
        
        # Verify glb_base64 is valid base64
        assert len(data["glb_base64"]) > 100, "glb_base64 seems too short"
        
        print(f"✅ AI Sketch analyze passed:")
        print(f"   - Walls detected: {summary.get('walls_detected', 0)}")
        print(f"   - Total lines: {summary.get('total_lines', 0)}")
        print(f"   - Dimensions found: {summary.get('dimensions_found', 0)}")
        print(f"   - GLB base64 length: {len(data['glb_base64'])} chars")
    
    def test_ai_sketch_with_different_building_types(self):
        """Test AI Sketch with different building types"""
        test_image_b64 = create_test_sketch_image()
        
        building_types = ["residential", "commercial", "industrial", "renovation", "other"]
        
        for btype in building_types:
            response = requests.post(f"{BASE_URL}/api/ai-sketch/analyze", json={
                "sketches": [test_image_b64],
                "building_type": btype,
                "notes": f"Testing {btype} building type"
            }, timeout=120)
            
            assert response.status_code == 200, f"Failed for building type {btype}"
            data = response.json()
            assert "glb_base64" in data
            print(f"✅ Building type '{btype}' works correctly")


class TestIADesignerEndpoint:
    """Tests for /api/ai-designer/generate endpoint - GPT-4o + GPT Image 1
    Note: Actual generation is skipped (requires LLM key and 60+ seconds)
    Only verify endpoint structure and error handling
    """
    
    def test_ai_designer_no_image(self):
        """Test IA Designer endpoint with no images - should return 400"""
        response = requests.post(f"{BASE_URL}/api/ai-designer/generate", json={
            "images": [],
            "room_type": "bathroom",
            "style": "modern",
            "renovation_text": "Test renovation"
        })
        # Should return 400 for missing image
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print(f"✅ IA Designer no image returns error: {response.status_code}")
    
    def test_ai_designer_gallery_endpoint(self):
        """Test IA Designer gallery endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/gallery")
        # Should return 401 (requires auth) or 200
        assert response.status_code in [200, 401, 403], f"Unexpected status: {response.status_code}"
        print(f"✅ IA Designer gallery endpoint exists: {response.status_code}")
    
    def test_ai_designer_published_endpoint(self):
        """Test IA Designer published projects endpoint"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "projects" in data
        print(f"✅ IA Designer published endpoint: {len(data.get('projects', []))} projects")


class TestNavigationAndRoutes:
    """Test that frontend routes return correct content"""
    
    def test_homepage_loads(self):
        """Test homepage loads with correct content"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        # Check for key elements in HTML
        assert "TemaDom" in response.text or "temadom" in response.text.lower()
        print("✅ Homepage loads correctly")
    
    def test_ai_sketch_route(self):
        """Test /ai-sketch route loads"""
        response = requests.get(f"{BASE_URL}/ai-sketch")
        assert response.status_code == 200
        print("✅ /ai-sketch route loads correctly")
    
    def test_room_scan_route(self):
        """Test /room-scan route loads (IA Designer)"""
        response = requests.get(f"{BASE_URL}/room-scan")
        assert response.status_code == 200
        print("✅ /room-scan route loads correctly")


class TestThreeJsViewerRequirements:
    """Verify Three.js 3D viewer component requirements"""
    
    def test_ai_sketch_returns_valid_glb(self):
        """Test that AI Sketch returns valid GLB data for Three.js rendering"""
        test_image_b64 = create_test_sketch_image()
        
        response = requests.post(f"{BASE_URL}/api/ai-sketch/analyze", json={
            "sketches": [test_image_b64],
            "building_type": "residential",
            "notes": ""
        }, timeout=120)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify GLB is valid base64 and starts with correct magic bytes
        glb_b64 = data["glb_base64"]
        glb_bytes = base64.b64decode(glb_b64)
        
        # GLB magic bytes: 0x46546C67 (glTF)
        assert glb_bytes[:4] == b'glTF', "GLB magic bytes incorrect"
        
        # Verify reasonable file size (should be at least a few KB)
        assert len(glb_bytes) > 1000, f"GLB too small: {len(glb_bytes)} bytes"
        
        print(f"✅ AI Sketch returns valid GLB file: {len(glb_bytes)} bytes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
