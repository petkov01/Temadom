"""
Iteration 32: Testing IA Designer Bug Fixes
Focus areas:
1. Backend POST /api/ai-designer/generate endpoint - room_type_name fix
2. Backend validation - empty images error handling
3. Frontend AIDesignerPage - variant selector (1/2/3)
4. Frontend reading generated_images correctly
"""
import pytest
import requests
import os
import base64

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAIDesignerBackend:
    """Test AI Designer API endpoint fixes"""
    
    def test_api_health_check(self):
        """Basic API health check"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API health check passed: {data.get('message')}")
    
    def test_ai_designer_generate_empty_images_error(self):
        """POST /api/ai-designer/generate should return 400 when no images provided"""
        response = requests.post(
            f"{BASE_URL}/api/ai-designer/generate",
            json={
                "images": [],
                "room_type": "bathroom",
                "style": "modern",
                "renovation_text": "test renovation",
                "variants": 1
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        # Should return 400 for empty images
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✅ Empty images returns 400 error: {data.get('detail')}")
    
    def test_ai_designer_generate_no_images_key(self):
        """POST /api/ai-designer/generate should return 400 when images key missing"""
        response = requests.post(
            f"{BASE_URL}/api/ai-designer/generate",
            json={
                "room_type": "bathroom",
                "style": "modern",
                "renovation_text": "test renovation"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        # Should return 400 for no images
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"✅ Missing images key returns 400 error: {data.get('detail')}")
    
    def test_ai_designer_accepts_room_type_param(self):
        """POST /api/ai-designer/generate should accept room_type parameter without 500 error"""
        # Create a minimal test image (1x1 red pixel PNG as base64)
        # This will test the parameter parsing, not full AI generation
        test_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        response = requests.post(
            f"{BASE_URL}/api/ai-designer/generate",
            json={
                "images": [test_image],
                "room_type": "bathroom",
                "style": "modern",
                "renovation_text": "добави нова мивка",
                "variants": 1,
                "width": "4",
                "length": "5",
                "height": "2.6"
            },
            headers={"Content-Type": "application/json"},
            timeout=10  # Short timeout - we just want to verify params are accepted
        )
        # Should NOT return 500 (internal error from undefined variable)
        # May return 200 (success), 400 (validation), or timeout
        # The fix was room_type → room_type_name variable reference
        assert response.status_code != 500, f"Got 500 error which indicates room_type_name bug: {response.text}"
        print(f"✅ API accepts room_type param without 500 error (status: {response.status_code})")
    
    def test_ai_designer_all_room_types_accepted(self):
        """Verify all 9 room types are accepted without server error"""
        room_types = [
            "bathroom", "kitchen", "living_room", "bedroom",
            "corridor", "balcony", "stairs", "facade", "other"
        ]
        test_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        for room_type in room_types:
            response = requests.post(
                f"{BASE_URL}/api/ai-designer/generate",
                json={
                    "images": [test_image],
                    "room_type": room_type,
                    "style": "modern",
                    "renovation_text": "test",
                    "variants": 1
                },
                headers={"Content-Type": "application/json"},
                timeout=5  # Very short - just testing param acceptance
            )
            # Should NOT get 500 (undefined variable error)
            assert response.status_code != 500, f"Room type '{room_type}' caused 500 error: {response.text}"
            print(f"  ✅ Room type '{room_type}' accepted")
        
        print("✅ All 9 room types accepted without 500 error")
    
    def test_ai_designer_variants_param_accepted(self):
        """Verify variants parameter (1/2/3) is accepted"""
        test_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        for variant_count in [1, 2, 3]:
            response = requests.post(
                f"{BASE_URL}/api/ai-designer/generate",
                json={
                    "images": [test_image],
                    "room_type": "bathroom",
                    "style": "modern",
                    "renovation_text": "test",
                    "variants": variant_count
                },
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            assert response.status_code != 500, f"Variants={variant_count} caused 500 error"
            print(f"  ✅ Variants={variant_count} accepted")
        
        print("✅ All variant counts (1, 2, 3) accepted without 500 error")

    def test_ai_sketch_page_basic(self):
        """Test AI Sketch endpoint exists (from previous iteration)"""
        # Test with invalid ID to confirm endpoint exists
        response = requests.get(f"{BASE_URL}/api/ai-sketch/invalid-id-12345", timeout=10)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ AI Sketch endpoint exists and returns 404 for invalid ID")


class TestLiveStats:
    """Test live stats API (continuing from iteration 31)"""
    
    def test_stats_live_endpoint(self):
        """GET /api/stats/live returns expected fields"""
        response = requests.get(f"{BASE_URL}/api/stats/live", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert "online" in data
        assert "clients" in data
        assert "companies" in data
        print(f"✅ Live stats: online={data.get('online')}, clients={data.get('clients')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
