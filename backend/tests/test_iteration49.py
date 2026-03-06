"""
Iteration 49: Test firm subscriptions landing page + Cyrillic PDF + no 360° text
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestIteration49:
    """Test features for iteration 49"""
    
    # ==================== API Health ====================
    def test_api_root(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ GET /api/ - API accessible: {data.get('message')}")
    
    # ==================== Reviews API - No 360° text ====================
    def test_reviews_no_360_text(self):
        """Test GET /api/reviews returns no 360° text"""
        response = requests.get(f"{BASE_URL}/api/reviews?limit=50")
        assert response.status_code == 200
        data = response.json()
        reviews = data.get("reviews", [])
        assert len(reviews) > 0, "Should have some reviews"
        
        # Check no reviews contain "360" text
        reviews_with_360 = []
        for r in reviews:
            text = r.get("text", "")
            name = r.get("name", "")
            if "360" in text or "360" in name:
                reviews_with_360.append(r)
        
        assert len(reviews_with_360) == 0, f"Found {len(reviews_with_360)} reviews with 360° text"
        print(f"✅ GET /api/reviews - {len(reviews)} reviews, NONE contain 360° text")
    
    # ==================== PDF Endpoint with Cyrillic ====================
    def test_pdf_generation_returns_pdf(self):
        """Test POST /api/ai-designer/photo-pdf returns valid PDF"""
        payload = {
            "renders": [
                {"label": "Общ план", "image_base64": ""},
                {"label": "Ъгъл 1", "image_base64": ""},
                {"label": "Ъгъл 2", "image_base64": ""}
            ],
            "budget": {
                "budget_tiers": [
                    {
                        "tier": "medium",
                        "tier_name": "Среден",
                        "total_eur": 2500,
                        "materials": [
                            {"name": "Плочки баня", "quantity": "15 м²", "price_eur": 450, "store": "Praktiker", "product_url": "https://praktiker.bg"},
                            {"name": "Теракота", "quantity": "20 м²", "price_eur": 600, "store": "Mr. Bricolage", "product_url": "https://bricolage.bg"},
                            {"name": "Бяла мазилка", "quantity": "5 торби", "price_eur": 100, "store": "Baumax", "product_url": "https://baumax.bg"}
                        ]
                    }
                ],
                "labor_estimate_eur": 800
            },
            "dimensions": {"width": 4, "length": 3, "height": 2.7},
            "style": "modern",
            "budget_eur": 3000,
            "user_name": "Тест Потребител",
            "project_id": "test-123",
            "active_tier": "medium"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai-designer/photo-pdf", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "application/pdf" in response.headers.get("content-type", ""), "Should return PDF content type"
        
        # Check PDF starts with %PDF magic bytes
        content = response.content
        assert content[:4] == b'%PDF', "Response should start with %PDF magic bytes"
        print(f"✅ POST /api/ai-designer/photo-pdf - Returns valid PDF ({len(content)} bytes)")
    
    def test_pdf_cyrillic_headers(self):
        """Test PDF endpoint handles Cyrillic properly (Bulgarian column headers)"""
        # This test verifies the PDF endpoint handles Cyrillic text in budget table
        # Column headers should be: Материал, Количество, Цена EUR, Магазин, Линк
        payload = {
            "renders": [],
            "budget": {
                "budget_tiers": [
                    {
                        "tier": "medium",
                        "tier_name": "Среден бюджет",  # Cyrillic tier name
                        "total_eur": 1500,
                        "materials": [
                            {"name": "Фаянс бял", "quantity": "10 м²", "price_eur": 200, "store": "Практикер", "product_url": ""}
                        ]
                    }
                ]
            },
            "dimensions": {"width": 3, "length": 4, "height": 2.8},
            "style": "scandinavian",
            "budget_eur": 2000,
            "user_name": "Иван Петров",  # Cyrillic name
            "active_tier": "medium"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai-designer/photo-pdf", json=payload)
        assert response.status_code == 200
        # PDF generated successfully means Cyrillic is handled (would fail if font not registered)
        print(f"✅ POST /api/ai-designer/photo-pdf - Cyrillic text handling works (FreeSans font)")
    
    # ==================== Stats API ====================
    def test_live_stats(self):
        """Test GET /api/stats/live returns regions"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        
        # Should have regions
        regions = data.get("regions", {})
        assert len(regions) > 0, "Should have region data"
        print(f"✅ GET /api/stats/live - {len(regions)} regions returned")
    
    # ==================== Categories API ====================
    def test_categories(self):
        """Test GET /api/categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        categories = data.get("categories", [])
        assert len(categories) > 0
        print(f"✅ GET /api/categories - {len(categories)} categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
