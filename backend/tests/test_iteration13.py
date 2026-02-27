"""
Iteration 13 Testing - TemaDom Construction Marketplace
Features:
1. Compact navigation - links with gap-3 spacing, text-sm size
2. Navigation shows 'Проекти' and 'Майстори' next to each other
3. AI Blueprint Analysis feature - violet button with 'НОВО' badge
4. Blueprint upload dialog with upload area
5. Calculator grand total 'ОБЩА ЦЕНА ЗА ВСИЧКО' in dark box
6. Mobile sticky bar at bottom
7. /api/blueprint/analyze endpoint validation
"""

import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBlueprintAnalyzeEndpoint:
    """Tests for the AI Blueprint Analysis endpoint"""
    
    def test_blueprint_analyze_endpoint_exists(self):
        """Test that /api/blueprint/analyze endpoint exists and responds"""
        response = requests.post(f"{BASE_URL}/api/blueprint/analyze", json={})
        # Should return 400 for empty request, not 404
        assert response.status_code in [400, 422], f"Expected 400 or 422, got {response.status_code}: {response.text}"
        print(f"✅ /api/blueprint/analyze endpoint exists (status: {response.status_code})")
    
    def test_blueprint_analyze_missing_image(self):
        """Test error when image field is missing"""
        response = requests.post(f"{BASE_URL}/api/blueprint/analyze", json={"other_field": "value"})
        assert response.status_code in [400, 422], f"Expected 400 or 422, got {response.status_code}"
        # Check error message mentions image
        data = response.json()
        error_text = str(data).lower()
        assert "image" in error_text or "изображение" in error_text, f"Error should mention image: {data}"
        print(f"✅ /api/blueprint/analyze returns error for missing image field")
    
    def test_blueprint_analyze_empty_image(self):
        """Test error when image is empty string"""
        response = requests.post(f"{BASE_URL}/api/blueprint/analyze", json={"image": ""})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        print(f"✅ /api/blueprint/analyze returns 400 for empty image: {data.get('detail', '')}")


class TestExistingEndpoints:
    """Verify existing endpoints still work after changes"""
    
    def test_api_health(self):
        """Basic API health check"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API health check passed: {data.get('message')}")
    
    def test_categories_endpoint(self):
        """Categories endpoint working"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) >= 10
        print(f"✅ /api/categories returns {len(data['categories'])} categories")
    
    def test_stats_endpoint(self):
        """Stats endpoint working"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        print(f"✅ /api/stats returns projects={data['total_projects']}, companies={data['total_companies']}")
    
    def test_projects_endpoint(self):
        """Projects endpoint working"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        print(f"✅ /api/projects returns {len(data['projects'])} projects")
    
    def test_companies_endpoint(self):
        """Companies endpoint working"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        print(f"✅ /api/companies returns {len(data['companies'])} companies")


class TestCalculatorPDFEndpoint:
    """Test calculator PDF generation endpoint"""
    
    def test_calculator_pdf_endpoint(self):
        """Test PDF generation endpoint accepts valid data"""
        payload = {
            "items": [
                {"name": "Test", "quantity": 10, "unit": "м²", "basePrice": 5, "total": 50}
            ],
            "regionName": "София (столица)",
            "regionMultiplier": 1.2,
            "pricingType": "laborAndMaterial",
            "qualityLevel": "standard",
            "total": 50
        }
        response = requests.post(f"{BASE_URL}/api/calculator/pdf", json=payload)
        # Should return PDF or 200
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "application/pdf" in response.headers.get("content-type", "")
        print(f"✅ /api/calculator/pdf generates PDF successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
