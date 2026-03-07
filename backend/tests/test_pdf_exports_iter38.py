"""
TemaDom - Iteration 38 Backend Tests
Testing PDF export endpoints for:
1. /api/ai-sketch/export-pdf - CAD plan + cost estimate PDF
2. /api/ai-sketch/export-contract - Construction contract PDF
3. /api/ai-designer/video-pdf - Video Designer project PDF
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://interior-ai-dev-1.preview.emergentagent.com')


class TestHealthCheck:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API root: {data.get('message')}")

    def test_api_stats(self):
        """Test stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        print("✅ Stats endpoint working")


class TestPDFExports:
    """Test all PDF export endpoints"""
    
    def test_export_cad_plan_pdf(self):
        """Test POST /api/ai-sketch/export-pdf returns valid PDF"""
        payload = {
            "elements": [
                {"tool": "wall", "x1": 100, "y1": 100, "x2": 300, "y2": 100, "_type": "wall"}
            ],
            "scale": 1,
            "costs": {
                "items": [
                    {"label": "Бетон", "qty": 5, "unit": "м³", "price": 90, "total": 450},
                    {"label": "Кофраж", "qty": 20, "unit": "м²", "price": 22, "total": 440}
                ],
                "totalEur": 890,
                "totalBgn": 1740
            },
            "region_name": "Пловдив"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-sketch/export-pdf",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get('content-type') == 'application/pdf', "Expected PDF content type"
        assert response.content[:4] == b'%PDF', "Response should start with %PDF header"
        assert len(response.content) > 1000, "PDF should have reasonable size"
        
        print(f"✅ CAD Plan PDF export: {len(response.content)} bytes")

    def test_export_contract_pdf(self):
        """Test POST /api/ai-sketch/export-contract returns valid PDF"""
        payload = {
            "company_name": "Test Company Ltd",
            "company_bulstat": "123456789",
            "client_name": "Test Client",
            "client_egn": "1234567890",
            "address": "ул. Тестова 1, гр. София",
            "total_eur": 5000,
            "total_bgn": 9779,
            "description": "Строително-монтажни работи съгласно приложена сметка."
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-sketch/export-contract",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get('content-type') == 'application/pdf', "Expected PDF content type"
        assert response.content[:4] == b'%PDF', "Response should start with %PDF header"
        assert len(response.content) > 1000, "PDF should have reasonable size"
        
        print(f"✅ Contract PDF export: {len(response.content)} bytes")

    def test_export_video_designer_pdf(self):
        """Test POST /api/ai-designer/video-pdf returns valid PDF"""
        payload = {
            "materials": {
                "materials": [
                    {"name": "Flooring", "quantity": 20, "unit": "m2", "price_per_unit_eur": 25, "total_price_eur": 500},
                    {"name": "Paint", "quantity": 50, "unit": "m2", "price_per_unit_eur": 8, "total_price_eur": 400}
                ],
                "grand_total_eur": 1500,
                "labor_estimate_eur": 800
            },
            "dimensions": {
                "width": "4",
                "length": "5",
                "height": "2.6"
            },
            "style": "modern",
            "room_analysis": {
                "room_type": "living_room",
                "features": ["windows", "door"]
            },
            "image_base64": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-designer/video-pdf",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get('content-type') == 'application/pdf', "Expected PDF content type"
        assert response.content[:4] == b'%PDF', "Response should start with %PDF header"
        assert len(response.content) > 500, "PDF should have reasonable size"
        
        print(f"✅ Video Designer PDF export: {len(response.content)} bytes")

    def test_export_pdf_with_empty_elements(self):
        """Test PDF export with empty elements still works"""
        payload = {
            "elements": [],
            "scale": 1,
            "costs": {"items": [], "totalEur": 0, "totalBgn": 0},
            "region_name": "София"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-sketch/export-pdf",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        assert response.content[:4] == b'%PDF'
        print("✅ PDF export with empty elements works")

    def test_export_contract_with_minimal_data(self):
        """Test contract PDF with minimal/empty fields"""
        payload = {
            "total_eur": 1000,
            "total_bgn": 1956
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-sketch/export-contract",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200
        assert response.content[:4] == b'%PDF'
        print("✅ Contract PDF with minimal data works")


class TestCategories:
    """Test categories endpoint for region verification"""
    
    def test_categories_endpoint(self):
        """Test GET /api/categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) == 15
        print(f"✅ Categories: {len(data['categories'])} found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
