"""
Iteration 52 Backend Tests - TemaDom Bulgarian Construction App
Tests for:
1. GET /api/scrape/stores - returns exactly 21 stores
2. Technomarket is in the stores list (id: technomarket, name: Technomarket)
3. All 21 store names verification
4. GET /api/scrape/search - returns valid JSON
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Expected 21 stores
EXPECTED_STORES = {
    "praktiker": "Praktiker",
    "jysk": "Jysk",
    "mrbricolage": "Mr.Bricolage",
    "bauhaus": "Bauhaus",
    "homemax": "HomeMax",
    "technomarket": "Technomarket",
    "teknoimpex": "Teknoimpex",
    "ikea": "IKEA",
    "temax": "Temax",
    "maximarket": "Maximarket",
    "toplivo": "Toplivo",
    "marmag": "Marmag",
    "paros": "Paros",
    "praktis": "Praktis",
    "angro": "Angro",
    "rilaonline": "Rila Online",
    "baustoff": "Baustoff Metall",
    "atek": "Atek",
    "vako": "Vako",
    "buildmark": "Buildmark",
    "obijavki": "Obijavki",
}


class TestStoresEndpoint:
    """Test /api/scrape/stores endpoint"""

    def test_stores_endpoint_returns_200(self):
        """GET /api/scrape/stores returns 200"""
        response = requests.get(f"{BASE_URL}/api/scrape/stores")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✅ GET /api/scrape/stores returns 200")

    def test_stores_returns_exactly_21_stores(self):
        """Verify exactly 21 stores are returned"""
        response = requests.get(f"{BASE_URL}/api/scrape/stores")
        assert response.status_code == 200
        data = response.json()
        
        assert "stores" in data, "Response should contain 'stores' key"
        stores = data["stores"]
        
        assert len(stores) == 21, f"Expected 21 stores, got {len(stores)}"
        print(f"✅ Exactly 21 stores returned")

    def test_technomarket_in_stores(self):
        """Verify Technomarket is in the stores list with correct id and name"""
        response = requests.get(f"{BASE_URL}/api/scrape/stores")
        assert response.status_code == 200
        data = response.json()
        stores = data["stores"]
        
        # Find Technomarket
        technomarket = None
        for store in stores:
            if store.get("id") == "technomarket":
                technomarket = store
                break
        
        assert technomarket is not None, "Technomarket not found in stores"
        assert technomarket.get("name") == "Technomarket", f"Expected name 'Technomarket', got '{technomarket.get('name')}'"
        print(f"✅ Technomarket found: id='technomarket', name='Technomarket'")

    def test_all_21_store_names(self):
        """Verify all 21 expected store names are present"""
        response = requests.get(f"{BASE_URL}/api/scrape/stores")
        assert response.status_code == 200
        data = response.json()
        stores = data["stores"]
        
        # Build dict of returned stores
        returned_stores = {s.get("id"): s.get("name") for s in stores}
        
        # Verify each expected store
        missing = []
        wrong_names = []
        
        for store_id, expected_name in EXPECTED_STORES.items():
            if store_id not in returned_stores:
                missing.append(f"{store_id}: {expected_name}")
            elif returned_stores[store_id] != expected_name:
                wrong_names.append(f"{store_id}: expected '{expected_name}', got '{returned_stores[store_id]}'")
        
        assert not missing, f"Missing stores: {missing}"
        assert not wrong_names, f"Wrong store names: {wrong_names}"
        
        print(f"✅ All 21 stores verified:")
        for store_id, name in EXPECTED_STORES.items():
            print(f"   - {store_id}: {name}")


class TestSearchEndpoint:
    """Test /api/scrape/search endpoint"""

    def test_search_returns_valid_json(self):
        """GET /api/scrape/search?q=test returns valid JSON with required fields"""
        response = requests.get(f"{BASE_URL}/api/scrape/search", params={"q": "test"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify required fields
        assert "query" in data, "Response should contain 'query' field"
        assert "total" in data, "Response should contain 'total' field"
        assert "stores_searched" in data, "Response should contain 'stores_searched' field"
        
        # Verify query matches
        assert data["query"] == "test", f"Expected query='test', got query='{data['query']}'"
        
        print(f"✅ GET /api/scrape/search?q=test returns valid JSON")
        print(f"   - query: {data['query']}")
        print(f"   - total: {data['total']}")
        print(f"   - stores_searched: {data['stores_searched']}")


class TestAuthLogin:
    """Test login endpoint for CAD page access"""

    def test_login_success(self):
        """Login with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "comm2@test.bg",
            "password": "Test123!"
        })
        assert response.status_code == 200, f"Login failed with status {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain 'token'"
        assert "user" in data, "Response should contain 'user'"
        
        print(f"✅ Login successful with comm2@test.bg")
        return data["token"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
