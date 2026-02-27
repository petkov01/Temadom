"""
Iteration 11 Backend Tests - Cleanup and SEO Blog Articles
Tests: Empty companies/projects, no payment future mentions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestDataCleanup:
    """Test that all fake data has been deleted"""
    
    def test_companies_endpoint_returns_zero(self):
        """Verify /api/companies returns 0 companies (all fake data deleted)"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 0, f"Expected 0 companies but got {data['total']}"
        assert len(data['companies']) == 0
        print(f"PASS: /api/companies returns 0 companies (data cleaned)")
        
    def test_projects_endpoint_returns_zero(self):
        """Verify /api/projects returns 0 projects (all fake data deleted)"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 0, f"Expected 0 projects but got {data['total']}"
        assert len(data['projects']) == 0
        print(f"PASS: /api/projects returns 0 projects (data cleaned)")


class TestAPIEndpoints:
    """Test other API endpoints still work"""
    
    def test_categories_endpoint(self):
        """Verify /api/categories still works"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert 'categories' in data
        assert len(data['categories']) > 0
        print(f"PASS: /api/categories returns {len(data['categories'])} categories")
        
    def test_stats_endpoint(self):
        """Verify /api/stats works with cleaned data"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        # Stats should reflect the cleanup
        assert 'total_companies' in data
        assert 'total_projects' in data
        print(f"PASS: /api/stats returns - companies: {data.get('total_companies')}, projects: {data.get('total_projects')}")


class TestCompaniesFilter:
    """Test companies filtering still works (even with no data)"""
    
    def test_filter_by_user_type_master(self):
        """Filter companies by user_type=master should return empty"""
        response = requests.get(f"{BASE_URL}/api/companies?user_type=master")
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 0
        print("PASS: /api/companies?user_type=master returns empty (no data)")
        
    def test_filter_by_user_type_company(self):
        """Filter companies by user_type=company should return empty"""
        response = requests.get(f"{BASE_URL}/api/companies?user_type=company")
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 0
        print("PASS: /api/companies?user_type=company returns empty (no data)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
