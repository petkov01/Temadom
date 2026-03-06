"""
Iteration 48 Tests: 360° removal verification + PDF/Share/Fullscreen features

Tests:
1. GET /api/reviews - No 360° text in reviews  
2. POST /api/ai-designer/photo-pdf - PDF generation returns valid PDF
3. GET /api/ai-designer/my-projects - Requires auth (401 without token)
4. GET /api/ - API root accessible
5. GET /api/categories - Returns categories
6. GET /api/stats/live - Returns regions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestIteration48:
    """360° removal + new features tests"""
    
    def test_api_root(self):
        """GET /api/ - API root should be accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API root failed: {response.status_code}"
        data = response.json()
        assert "message" in data or "version" in data
        print("✅ GET /api/ - API root accessible")
    
    def test_reviews_no_360_text(self):
        """GET /api/reviews - Reviews should NOT contain any 360° text"""
        response = requests.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200, f"Reviews failed: {response.status_code}"
        data = response.json()
        reviews = data.get("reviews", [])
        
        # Check each review for 360 text
        for review in reviews:
            text = str(review.get("text", "")).lower()
            name = str(review.get("name", "")).lower()
            # Check for 360 variations
            assert "360" not in text, f"Review text contains 360°: {review.get('text', '')}"
            assert "360" not in name, f"Review name contains 360°: {review.get('name', '')}"
        
        print(f"✅ GET /api/reviews - {len(reviews)} reviews, none contain 360° text")
    
    def test_photo_pdf_generates_pdf(self):
        """POST /api/ai-designer/photo-pdf - Should generate valid PDF"""
        # Minimal payload - empty renders to test endpoint response
        payload = {
            "renders": [],
            "budget": {},
            "dimensions": {"width": 4, "length": 5, "height": 2.7},
            "style": "modern",
            "budget_eur": 2500,
            "project_id": "test-123",
            "active_tier": "medium"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-designer/photo-pdf",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Photo-PDF failed: {response.status_code}"
        
        # Verify content-type is PDF
        content_type = response.headers.get("content-type", "")
        assert "pdf" in content_type.lower(), f"Expected PDF, got: {content_type}"
        
        # Verify it's a valid PDF (starts with %PDF-)
        content = response.content
        assert content[:5] == b"%PDF-", f"Response is not a valid PDF file"
        
        print(f"✅ POST /api/ai-designer/photo-pdf - Returns valid PDF ({len(content)} bytes)")
    
    def test_my_projects_requires_auth(self):
        """GET /api/ai-designer/my-projects - Should return 401 without token"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/my-projects")
        
        # Should be 401 or 403 without auth
        assert response.status_code in [401, 403], f"Expected 401/403, got: {response.status_code}"
        
        print(f"✅ GET /api/ai-designer/my-projects - Correctly requires auth ({response.status_code})")
    
    def test_stats_live_returns_regions(self):
        """GET /api/stats/live - Should return Bulgarian regions"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200, f"Stats/live failed: {response.status_code}"
        
        data = response.json()
        regions = data.get("regions", {})
        assert len(regions) >= 28, f"Expected 28 regions, got {len(regions)}"
        
        print(f"✅ GET /api/stats/live - Returns {len(regions)} Bulgarian regions")
    
    def test_categories_returns_list(self):
        """GET /api/categories - Should return categories array"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200, f"Categories failed: {response.status_code}"
        
        data = response.json()
        categories = data.get("categories", [])
        assert len(categories) > 0, "No categories returned"
        
        print(f"✅ GET /api/categories - Returns {len(categories)} categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
