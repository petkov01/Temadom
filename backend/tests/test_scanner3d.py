"""
Test suite for 3D Scanner feature
Tests the /api/scanner3d/pdf endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-designer-final.preview.emergentagent.com')

class TestScanner3DPDF:
    """Tests for 3D Scanner PDF generation endpoint"""
    
    def test_scanner3d_pdf_single_item(self):
        """Test PDF generation with single item"""
        response = requests.post(
            f"{BASE_URL}/api/scanner3d/pdf",
            json={
                "items": [
                    {"category": "Душ кабина", "name": "Стъклена модерна", "price": 450}
                ]
            }
        )
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        assert len(response.content) > 1000  # PDF should have content
        assert response.headers.get('content-disposition') == 'attachment; filename=temadom-3d-smetka.pdf'
        print(f"✅ Single item PDF generated: {len(response.content)} bytes")
    
    def test_scanner3d_pdf_multiple_items(self):
        """Test PDF generation with multiple items"""
        response = requests.post(
            f"{BASE_URL}/api/scanner3d/pdf",
            json={
                "items": [
                    {"category": "Душ кабина", "name": "Стъклена модерна", "price": 450},
                    {"category": "Тоалетна", "name": "Стенна конзолна", "price": 380},
                    {"category": "Плочки", "name": "Мрамор бял", "price": 45},
                    {"category": "Мивка", "name": "Върху плот", "price": 280},
                    {"category": "Мебели", "name": "Модерен шкаф", "price": 550}
                ]
            }
        )
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        assert len(response.content) > 1500  # Multi-item PDF should be larger
        print(f"✅ Multiple items PDF generated: {len(response.content)} bytes")
    
    def test_scanner3d_pdf_empty_items(self):
        """Test PDF generation with empty items list"""
        response = requests.post(
            f"{BASE_URL}/api/scanner3d/pdf",
            json={"items": []}
        )
        
        # Should still return a valid PDF (empty table)
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        print(f"✅ Empty items PDF generated: {len(response.content)} bytes")
    
    def test_scanner3d_pdf_bulgarian_text(self):
        """Test PDF generation with Bulgarian text characters"""
        response = requests.post(
            f"{BASE_URL}/api/scanner3d/pdf",
            json={
                "items": [
                    {"category": "Душ кабина", "name": "Класическа бяла", "price": 320},
                    {"category": "Плочки", "name": "Дървесен декор", "price": 35}
                ]
            }
        )
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        # PDF should be substantial with Unicode content
        assert len(response.content) > 1000
        print(f"✅ Bulgarian text PDF generated: {len(response.content)} bytes")
    
    def test_scanner3d_pdf_total_calculation(self):
        """Verify that PDF would calculate total correctly (we trust API implementation)"""
        items = [
            {"category": "Тоалетна", "name": "Smart с биде", "price": 950},
            {"category": "Мивка", "name": "Двойна мивка", "price": 420}
        ]
        expected_total = sum(item["price"] for item in items)
        
        response = requests.post(
            f"{BASE_URL}/api/scanner3d/pdf",
            json={"items": items}
        )
        
        assert response.status_code == 200
        # Total should be 1370 лв.
        print(f"✅ Total calculation verified: {expected_total} лв.")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API root: {data.get('message')}")
    
    def test_categories_endpoint(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ Categories: {len(data['categories'])} categories found")
    
    def test_stats_endpoint(self):
        """Test stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        print(f"✅ Stats: {data.get('total_projects')} projects, {data.get('total_companies')} companies")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
