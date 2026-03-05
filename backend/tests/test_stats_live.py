"""
Backend API Tests for TemaDom v6.5 - /api/stats/live endpoint
Tests the live statistics endpoint that provides counter data for landing page
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStatsLiveAPI:
    """Tests for /api/stats/live endpoint used by landing page counter"""
    
    def test_stats_live_returns_200(self):
        """Test that stats/live endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/stats/live", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✅ /api/stats/live returns 200 OK")
    
    def test_stats_live_returns_valid_json(self):
        """Test that stats/live returns valid JSON with required fields"""
        response = requests.get(f"{BASE_URL}/api/stats/live", timeout=10)
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields exist
        required_fields = ['clients', 'companies', 'free_slots']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"✅ /api/stats/live returns valid JSON with required fields")
        print(f"   Data: {data}")
    
    def test_stats_live_free_slots_structure(self):
        """Test that free_slots has correct structure (used/total)"""
        response = requests.get(f"{BASE_URL}/api/stats/live", timeout=10)
        assert response.status_code == 200
        
        data = response.json()
        free_slots = data.get('free_slots', {})
        
        assert 'used' in free_slots, "free_slots missing 'used' field"
        assert 'total' in free_slots, "free_slots missing 'total' field"
        
        # Validate values are numeric
        assert isinstance(free_slots['used'], (int, float)), "free_slots.used should be numeric"
        assert isinstance(free_slots['total'], (int, float)), "free_slots.total should be numeric"
        
        # Validate total is 50 as per v6.5 spec
        assert free_slots['total'] == 50, f"Expected total=50, got {free_slots['total']}"
        
        print(f"✅ free_slots structure valid: used={free_slots['used']}, total={free_slots['total']}")
    
    def test_stats_live_data_types(self):
        """Test that all values have correct data types"""
        response = requests.get(f"{BASE_URL}/api/stats/live", timeout=10)
        assert response.status_code == 200
        
        data = response.json()
        
        # Validate data types
        assert isinstance(data.get('clients'), (int, float)), "clients should be numeric"
        assert isinstance(data.get('companies'), (int, float)), "companies should be numeric"
        
        print(f"✅ All data types valid - clients: {data['clients']}, companies: {data['companies']}")


class TestStatsAPI:
    """Tests for /api/stats general endpoint"""
    
    def test_stats_returns_200(self):
        """Test that /api/stats endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/stats", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✅ /api/stats returns 200 OK")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
