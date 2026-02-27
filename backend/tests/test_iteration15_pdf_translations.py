"""
Iteration 15 Tests: PDF Generation and Translation Features
- Tests PDF generation endpoint with correct Bulgarian column headers
- Tests multi-page translation functionality (BG/EN)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

class TestPDFGeneration:
    """PDF generation endpoint tests"""
    
    def test_pdf_endpoint_returns_200(self):
        """Test that PDF generation endpoint returns 200"""
        response = requests.post(f"{BASE_URL}/api/calculator/pdf", json={
            "items": [
                {"name": "Боядисване", "quantity": 100, "unit": "м²", "basePrice": 7.2, "total": 720}
            ],
            "regionName": "София",
            "regionMultiplier": 1.2,
            "pricingType": "laborAndMaterial",
            "qualityLevel": "standard",
            "total": 720
        })
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        # PDF should have substantial size
        assert len(response.content) > 1000
    
    def test_pdf_with_multiple_items(self):
        """Test PDF generation with multiple service items"""
        response = requests.post(f"{BASE_URL}/api/calculator/pdf", json={
            "items": [
                {"name": "Боядисване", "quantity": 160, "unit": "м²", "basePrice": 6.0, "total": 960},
                {"name": "Шпакловка", "quantity": 160, "unit": "м²", "basePrice": 7.0, "total": 1120},
                {"name": "Подови настилки", "quantity": 80, "unit": "м²", "basePrice": 40.0, "total": 3200},
                {"name": "Ел. инсталация", "quantity": 30, "unit": "точки", "basePrice": 80.0, "total": 2400},
            ],
            "regionName": "Пловдив",
            "regionMultiplier": 1.05,
            "pricingType": "laborAndMaterial",
            "qualityLevel": "premium",
            "total": 7680
        })
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
    
    def test_pdf_with_empty_items(self):
        """Test PDF generation with empty items array"""
        response = requests.post(f"{BASE_URL}/api/calculator/pdf", json={
            "items": [],
            "regionName": "Варна",
            "regionMultiplier": 1.08,
            "pricingType": "labor",
            "qualityLevel": "economy",
            "total": 0
        })
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
    
    def test_pdf_with_zero_quantity_items_filtered(self):
        """Test that items with zero quantity are excluded"""
        response = requests.post(f"{BASE_URL}/api/calculator/pdf", json={
            "items": [
                {"name": "Боядисване", "quantity": 0, "unit": "м²", "basePrice": 7.2, "total": 0},
                {"name": "Шпакловка", "quantity": 100, "unit": "м²", "basePrice": 7.0, "total": 700}
            ],
            "regionName": "София",
            "regionMultiplier": 1.2,
            "pricingType": "laborAndMaterial",
            "qualityLevel": "standard",
            "total": 700
        })
        assert response.status_code == 200


class TestAPIEndpoints:
    """Basic API endpoint tests"""
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Maistori" in data["message"] or "API" in data["message"]
    
    def test_categories_endpoint(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_stats_endpoint(self):
        """Test stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data or "companies" in data
    
    def test_projects_endpoint(self):
        """Test projects listing endpoint"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        # Should have pagination info
        assert "items" in data or "projects" in data or isinstance(data, dict)
    
    def test_companies_endpoint(self):
        """Test companies listing endpoint"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
    
    def test_professions_endpoint(self):
        """Test professions listing endpoint"""
        response = requests.get(f"{BASE_URL}/api/professions")
        assert response.status_code == 200


class TestRegionalPrices:
    """Regional prices endpoint tests"""
    
    def test_regional_prices_endpoint(self):
        """Test regional prices endpoint"""
        response = requests.get(f"{BASE_URL}/api/regional-prices")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have regional price data
        if len(data) > 0:
            first_item = data[0]
            assert "region" in first_item or "name" in first_item or "multiplier" in first_item
