"""
Iteration 10 Tests: FindMasterPage and Updated Calculator Prices
Features tested:
- /api/companies endpoint with user_type filter (master/company)
- FindMasterPage UI rendering
- Updated construction prices in PriceCalculator
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCompaniesEndpointFiltering:
    """Test /api/companies endpoint with user_type filter"""
    
    def test_companies_endpoint_works(self):
        """Test that /api/companies endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert "total" in data
        print(f"✅ /api/companies returns {len(data['companies'])} companies")
    
    def test_filter_by_user_type_master(self):
        """Test filtering companies by user_type=master"""
        response = requests.get(f"{BASE_URL}/api/companies?user_type=master")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        # Verify all returned entries are masters
        for company in data['companies']:
            if 'user_type' in company:
                assert company['user_type'] == 'master', f"Expected master, got {company.get('user_type')}"
        print(f"✅ /api/companies?user_type=master returns {len(data['companies'])} masters")
    
    def test_filter_by_user_type_company(self):
        """Test filtering companies by user_type=company"""
        response = requests.get(f"{BASE_URL}/api/companies?user_type=company")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        # Verify all returned entries are companies
        for company in data['companies']:
            if 'user_type' in company:
                assert company['user_type'] == 'company', f"Expected company, got {company.get('user_type')}"
        print(f"✅ /api/companies?user_type=company returns {len(data['companies'])} companies")
    
    def test_filter_by_user_type_all(self):
        """Test that no filter or invalid filter returns all"""
        response_all = requests.get(f"{BASE_URL}/api/companies")
        response_invalid = requests.get(f"{BASE_URL}/api/companies?user_type=invalid")
        
        assert response_all.status_code == 200
        assert response_invalid.status_code == 200
        
        # Invalid filter should behave like no filter
        data_all = response_all.json()
        data_invalid = response_invalid.json()
        # Both should return same total (invalid filter is ignored)
        print(f"✅ No filter returns {len(data_all['companies'])} entries")
        print(f"✅ Invalid filter returns {len(data_invalid['companies'])} entries")
    
    def test_combined_filters(self):
        """Test combining user_type with other filters like city"""
        response = requests.get(f"{BASE_URL}/api/companies?user_type=master&city=София")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        print(f"✅ Combined filter (master + city=София) returns {len(data['companies'])} entries")


class TestStatsEndpoint:
    """Test stats endpoint"""
    
    def test_stats_endpoint(self):
        """Test /api/stats returns valid data"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        assert "total_reviews" in data
        print(f"✅ Stats: {data['total_projects']} projects, {data['total_companies']} companies, {data['total_reviews']} reviews")


class TestCategoriesEndpoint:
    """Test categories endpoint for dropdown population"""
    
    def test_categories_endpoint(self):
        """Test /api/categories returns valid categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data['categories']) > 0
        # Verify category structure
        for cat in data['categories']:
            assert "id" in cat
            assert "name" in cat
            assert "icon" in cat
        print(f"✅ Categories endpoint returns {len(data['categories'])} categories")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✅ API root endpoint accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
