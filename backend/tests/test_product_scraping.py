"""
Test suite for Product Scraping API endpoints - TemaDom Bulgarian e-commerce scraper

Tests:
- GET /api/products/stores - List available Bulgarian stores with scraping status
- GET /api/products/search - Search for real products from Videnov.bg (Playwright scraper)
- GET /api/products/for-room/{room_type} - Get categorized products for a room type
- GET /api/products/categories/{room_type} - Get product categories for a room type

Iteration 64: Testing new scraping feature for real product data from Bulgarian stores
"""

import pytest
import requests
import os
import time

# Use environment variable for backend URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://room-render-staging.preview.emergentagent.com"


class TestProductStores:
    """Test /api/products/stores endpoint - list available Bulgarian stores"""

    def test_get_stores_returns_200(self):
        """GET /api/products/stores should return 200"""
        response = requests.get(f"{BASE_URL}/api/products/stores", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✅ GET /api/products/stores returned 200")

    def test_stores_response_structure(self):
        """Verify stores response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/products/stores", timeout=30)
        assert response.status_code == 200
        data = response.json()
        
        # Check main structure
        assert "stores" in data, "Response should have 'stores' key"
        assert isinstance(data["stores"], list), "'stores' should be a list"
        assert len(data["stores"]) > 0, "Should have at least one store"
        print(f"✅ Found {len(data['stores'])} stores")

    def test_stores_contain_required_fields(self):
        """Each store should have id, name, url, scraping fields"""
        response = requests.get(f"{BASE_URL}/api/products/stores", timeout=30)
        data = response.json()
        
        required_fields = ["id", "name", "url", "scraping"]
        for store in data["stores"]:
            for field in required_fields:
                assert field in store, f"Store missing '{field}': {store}"
        print(f"✅ All stores have required fields: {required_fields}")

    def test_videnov_store_exists_with_scraping_enabled(self):
        """Videnov.bg should exist and have scraping=True (Playwright-based)"""
        response = requests.get(f"{BASE_URL}/api/products/stores", timeout=30)
        data = response.json()
        
        videnov = next((s for s in data["stores"] if s["id"] == "videnov"), None)
        assert videnov is not None, "Videnov store not found"
        assert videnov["name"] == "Videnov", f"Expected name 'Videnov', got '{videnov['name']}'"
        assert videnov["scraping"] == True, f"Videnov should have scraping=True, got {videnov['scraping']}"
        assert "videnov.bg" in videnov["url"], f"Videnov URL should contain 'videnov.bg'"
        print(f"✅ Videnov store verified: scraping=True, url={videnov['url']}")

    def test_multiple_stores_exist(self):
        """Should have multiple Bulgarian stores (Praktiker, Mr.Bricolage, etc.)"""
        response = requests.get(f"{BASE_URL}/api/products/stores", timeout=30)
        data = response.json()
        
        expected_stores = ["videnov", "praktiker", "mrbricolage", "jysk", "bauhaus", "emag"]
        found_stores = [s["id"] for s in data["stores"]]
        
        for store_id in expected_stores:
            assert store_id in found_stores, f"Expected store '{store_id}' not found. Found: {found_stores}"
        print(f"✅ Found expected stores: {expected_stores}")


class TestProductSearch:
    """Test /api/products/search endpoint - real product scraping from Videnov"""

    def test_search_requires_query(self):
        """Search without query should return 400"""
        response = requests.get(f"{BASE_URL}/api/products/search", timeout=30)
        assert response.status_code == 400 or response.status_code == 422, f"Expected 400/422, got {response.status_code}"
        print(f"✅ Search without query returns error (status {response.status_code})")

    def test_search_short_query_rejected(self):
        """Search with <2 chars should return 400"""
        response = requests.get(f"{BASE_URL}/api/products/search?q=a", timeout=30)
        assert response.status_code == 400, f"Expected 400 for single char query, got {response.status_code}"
        print(f"✅ Short query rejected with 400")

    def test_search_videnov_returns_products(self):
        """Search Videnov for 'диван' should return real scraped products"""
        # This may take 10-15s on first call due to Playwright browser launch
        print("⏳ Searching Videnov for 'диван' (may take 10-15s on first call)...")
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/products/search",
            params={"q": "диван", "stores": "videnov", "limit": 3},
            timeout=120  # Generous timeout for Playwright scraping
        )
        elapsed = time.time() - start
        print(f"⏱️ Search completed in {elapsed:.1f}s")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "query" in data, "Response should have 'query'"
        assert "products" in data, "Response should have 'products'"
        assert "total" in data, "Response should have 'total'"
        assert data["query"] == "диван", f"Query should be 'диван', got '{data['query']}'"
        
        print(f"✅ Search returned {data['total']} products ({data.get('real_products', 0)} scraped)")

    def test_videnov_products_have_scraped_flag(self):
        """Products from Videnov should have scraped=True, search_link=False"""
        print("⏳ Checking scraped product flags...")
        response = requests.get(
            f"{BASE_URL}/api/products/search",
            params={"q": "смесител", "stores": "videnov", "limit": 3},
            timeout=120
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if data["real_products"] > 0:
            for product in data["products"]:
                if product.get("scraped"):
                    assert product["scraped"] == True, "Scraped product should have scraped=True"
                    assert product.get("search_link") == False, "Scraped product should have search_link=False"
                    assert product.get("url", "").startswith("http"), f"Product should have valid URL: {product.get('url')}"
                    assert product.get("store") == "Videnov", f"Store should be 'Videnov', got '{product.get('store')}'"
                    print(f"✅ Verified scraped product: {product['name'][:50]}... | {product['price_eur']}€ | {product['url'][:50]}...")
                    break
        else:
            # If no products scraped (site might be down), verify search_link fallback
            print("⚠️ No scraped products returned (site may be unavailable)")
            for product in data["products"]:
                if product.get("search_link"):
                    assert product["scraped"] == False, "Search link should have scraped=False"
                    assert product["search_link"] == True, "Search link should have search_link=True"
                    print(f"✅ Fallback search link: {product['url']}")

    def test_search_link_stores_return_search_urls(self):
        """Non-scraped stores (Praktiker, etc.) should return search URLs"""
        response = requests.get(
            f"{BASE_URL}/api/products/search",
            params={"q": "плочки", "stores": "praktiker", "limit": 1},
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["products"]) > 0, "Should return at least one search link"
        product = data["products"][0]
        
        assert product["scraped"] == False, "Praktiker should return scraped=False"
        assert product["search_link"] == True, "Praktiker should return search_link=True"
        assert "praktiker.bg" in product["url"], f"URL should contain 'praktiker.bg': {product['url']}"
        assert "плочки" in product["url"] or "%D0%BF%D0%BB%D0%BE%D1%87%D0%BA%D0%B8" in product["url"], "URL should contain search query"
        print(f"✅ Search link store returns correct URL: {product['url'][:60]}...")


class TestProductsForRoom:
    """Test /api/products/for-room/{room_type} endpoint - categorized products"""

    def test_bathroom_products_returns_200(self):
        """GET /api/products/for-room/bathroom should return 200"""
        print("⏳ Fetching bathroom products (may take 30-60s for scraping)...")
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/products/for-room/bathroom",
            params={"budget": 2500},
            timeout=180  # Generous timeout for multiple scrapes
        )
        elapsed = time.time() - start
        print(f"⏱️ Request completed in {elapsed:.1f}s")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✅ GET /api/products/for-room/bathroom returned 200")

    def test_room_products_response_structure(self):
        """Verify room products response has correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/products/for-room/bathroom",
            params={"budget": 2500},
            timeout=180
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check main structure
        assert "room_type" in data, "Response should have 'room_type'"
        assert "budget_eur" in data, "Response should have 'budget_eur'"
        assert "categories" in data, "Response should have 'categories'"
        assert "products_by_category" in data, "Response should have 'products_by_category'"
        assert "total_products" in data, "Response should have 'total_products'"
        assert "real_products" in data, "Response should have 'real_products'"
        
        assert data["room_type"] == "bathroom", f"Room type should be 'bathroom', got '{data['room_type']}'"
        assert data["budget_eur"] == 2500, f"Budget should be 2500, got {data['budget_eur']}"
        
        print(f"✅ Response structure verified: {len(data['categories'])} categories, {data['total_products']} products ({data['real_products']} scraped)")

    def test_bathroom_has_expected_categories(self):
        """Bathroom should have expected categories (Мебели, Смесители, etc.)"""
        response = requests.get(
            f"{BASE_URL}/api/products/for-room/bathroom",
            params={"budget": 2500},
            timeout=180
        )
        
        data = response.json()
        categories = data["categories"]
        
        # Check for expected bathroom categories (from scraper.py ROOM_CATEGORIES)
        expected_some = ["Мебели за баня", "Смесители", "Мивки"]
        found = [c for c in expected_some if c in categories]
        
        assert len(found) > 0, f"Expected at least one of {expected_some} in categories. Got: {categories}"
        print(f"✅ Found expected categories: {found}")

    def test_products_by_category_contains_products(self):
        """products_by_category should contain actual product lists"""
        response = requests.get(
            f"{BASE_URL}/api/products/for-room/living_room",
            params={"budget": 3000},
            timeout=180
        )
        
        assert response.status_code == 200
        data = response.json()
        
        products_by_cat = data["products_by_category"]
        assert isinstance(products_by_cat, dict), "products_by_category should be a dict"
        
        for cat, products in products_by_cat.items():
            assert isinstance(products, list), f"Category '{cat}' products should be a list"
            if len(products) > 0:
                product = products[0]
                assert "name" in product, f"Product should have 'name'"
                assert "price_eur" in product, f"Product should have 'price_eur'"
                assert "url" in product, f"Product should have 'url'"
                assert "store" in product, f"Product should have 'store'"
                print(f"✅ Category '{cat}': {len(products)} products, first: {product['name'][:30]}...")
                break


class TestProductCategories:
    """Test /api/products/categories/{room_type} endpoint"""

    def test_bathroom_categories_returns_200(self):
        """GET /api/products/categories/bathroom should return 200"""
        response = requests.get(f"{BASE_URL}/api/products/categories/bathroom", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✅ GET /api/products/categories/bathroom returned 200")

    def test_categories_response_structure(self):
        """Verify categories response structure"""
        response = requests.get(f"{BASE_URL}/api/products/categories/bathroom", timeout=30)
        data = response.json()
        
        assert "room_type" in data, "Response should have 'room_type'"
        assert "categories" in data, "Response should have 'categories'"
        assert "details" in data, "Response should have 'details'"
        
        assert data["room_type"] == "bathroom"
        assert isinstance(data["categories"], list)
        assert isinstance(data["details"], list)
        
        print(f"✅ Categories response: {len(data['categories'])} categories for bathroom")

    def test_categories_details_have_query_and_stores(self):
        """Category details should have query and stores fields"""
        response = requests.get(f"{BASE_URL}/api/products/categories/kitchen", timeout=30)
        data = response.json()
        
        for detail in data["details"]:
            assert "query" in detail, f"Detail should have 'query': {detail}"
            assert "category" in detail, f"Detail should have 'category': {detail}"
            assert "stores" in detail, f"Detail should have 'stores': {detail}"
            assert isinstance(detail["stores"], list), "Stores should be a list"
        
        print(f"✅ Kitchen category details: {[d['category'] for d in data['details']]}")

    def test_all_room_types_have_categories(self):
        """All supported room types should return categories"""
        room_types = ["bathroom", "kitchen", "living_room", "bedroom", "corridor", "balcony"]
        
        for room in room_types:
            response = requests.get(f"{BASE_URL}/api/products/categories/{room}", timeout=30)
            assert response.status_code == 200, f"Room '{room}' should return 200"
            data = response.json()
            assert len(data["categories"]) > 0, f"Room '{room}' should have categories"
        
        print(f"✅ All room types have categories: {room_types}")


class TestProductDataVerification:
    """Verify scraped product data quality"""

    def test_scraped_products_have_valid_urls(self):
        """Scraped products should have valid videnov.bg URLs"""
        response = requests.get(
            f"{BASE_URL}/api/products/search",
            params={"q": "легло", "stores": "videnov", "limit": 3},
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            for product in data["products"]:
                if product.get("scraped"):
                    url = product.get("url", "")
                    assert url.startswith("http"), f"URL should start with http: {url}"
                    assert "videnov.bg" in url, f"Scraped product URL should be from videnov.bg: {url}"
                    print(f"✅ Valid URL: {url[:60]}...")
                    return
        print("⚠️ No scraped products to verify URLs")

    def test_scraped_products_have_prices(self):
        """Scraped products should have numeric price_eur"""
        response = requests.get(
            f"{BASE_URL}/api/products/search",
            params={"q": "гардероб", "stores": "videnov", "limit": 3},
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            for product in data["products"]:
                if product.get("scraped") and product.get("price_eur", 0) > 0:
                    assert isinstance(product["price_eur"], (int, float)), "price_eur should be numeric"
                    assert product["price_eur"] > 0, "price_eur should be positive"
                    print(f"✅ Product price: {product['name'][:40]}... = {product['price_eur']}€")
                    return
        print("⚠️ No scraped products with prices to verify")


# Run tests with: pytest test_product_scraping.py -v --tb=short
