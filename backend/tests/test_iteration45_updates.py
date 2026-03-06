"""
Iteration 45 Tests - TemaDom Updates
Tests for:
1. Text changes from '3D Video Designer' to '3D Photo Designer'
2. Regional firm limit UI with dropdown
3. Stats API returning per-region data
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStatsEndpoint:
    """Test /api/stats/live endpoint for regional data"""
    
    def test_stats_live_returns_regions(self):
        """Verify /api/stats/live returns 'regions' field with 28 entries"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Check that regions field exists
        assert "regions" in data, "Response missing 'regions' field"
        
        regions = data["regions"]
        
        # Check that we have 28 regions
        assert len(regions) == 28, f"Expected 28 regions, got {len(regions)}"
        
        # Verify structure of region data
        for region_name, region_data in regions.items():
            assert "used" in region_data, f"Region {region_name} missing 'used' field"
            assert "total" in region_data, f"Region {region_name} missing 'total' field"
            assert region_data["total"] == 2, f"Region {region_name} total should be 2, got {region_data['total']}"
        
        print(f"✅ Stats API returns {len(regions)} regions with correct structure")

    def test_stats_live_returns_free_slots(self):
        """Verify /api/stats/live returns free_slots with total=56"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check free_slots structure
        assert "free_slots" in data, "Response missing 'free_slots' field"
        assert data["free_slots"]["total"] == 56, f"Expected total=56, got {data['free_slots']['total']}"
        
        print(f"✅ Stats API returns free_slots with total=56")

    def test_stats_live_all_bulgarian_regions(self):
        """Verify all 28 Bulgarian regions are present"""
        expected_regions = [
            "Благоевград", "Бургас", "Варна", "Велико Търново", "Видин",
            "Враца", "Габрово", "Добрич", "Кърджали", "Кюстендил",
            "Ловеч", "Монтана", "Пазарджик", "Перник", "Плевен",
            "Пловдив", "Разград", "Русе", "Силистра", "Сливен",
            "Смолян", "София", "София-град", "Стара Загора",
            "Търговище", "Хасково", "Шумен", "Ямбол"
        ]
        
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        
        data = response.json()
        regions = data.get("regions", {})
        
        for region in expected_regions:
            assert region in regions, f"Missing region: {region}"
        
        print(f"✅ All 28 Bulgarian regions present in stats API")


class TestCompanyRegistration:
    """Test company registration flow with regional limits"""
    
    def test_company_registration_requires_bulstat(self):
        """Verify company registration requires bulstat"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test Company No Bulstat",
            "email": "testcompanynobulstat@test.com",
            "password": "testpass123",
            "user_type": "company",
            "city": "София"
        })
        
        # Should fail without bulstat
        assert response.status_code == 400
        assert "булстат" in response.json().get("detail", "").lower() or "bulstat" in response.json().get("detail", "").lower()
        print("✅ Company registration correctly requires bulstat")

    def test_company_registration_validates_bulstat_format(self):
        """Verify bulstat must be 9 digits"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test Company Bad Bulstat",
            "email": "testcompanybadbulstat@test.com",
            "password": "testpass123",
            "user_type": "company",
            "bulstat": "12345",  # Too short
            "city": "София"
        })
        
        # Should fail with invalid bulstat
        assert response.status_code == 400
        assert "9" in response.json().get("detail", "")
        print("✅ Company registration validates bulstat format (9 digits)")


class TestAPIEndpoints:
    """General API endpoint tests"""
    
    def test_api_root(self):
        """Verify API root is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("✅ API root accessible")
    
    def test_categories_endpoint(self):
        """Verify categories endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ Categories endpoint returns {len(data['categories'])} categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
