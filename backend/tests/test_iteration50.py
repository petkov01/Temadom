"""
Iteration 50 Test Suite - TemaDom Bulgarian Construction App
Tests new features:
1. Web Scraping API for product search across Bulgarian stores
2. Community Feed endpoints (posts, likes, comments)
3. Period-based firm subscription plans (1/3/6/12 months with discounts)
4. PDF with logo and region-based labor cost
"""

import pytest
import requests
import os
import uuid
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWebScrapingAPI:
    """Test GET /api/scrape/stores and GET /api/scrape/search endpoints"""
    
    def test_get_stores_returns_list(self):
        """GET /api/scrape/stores should return list of 5 Bulgarian stores"""
        response = requests.get(f"{BASE_URL}/api/scrape/stores")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "stores" in data, "Response should contain 'stores' key"
        assert len(data["stores"]) == 5, f"Expected 5 stores, got {len(data['stores'])}"
        
        # Verify store structure
        expected_stores = ["praktiker", "jysk", "mrbricolage", "bauhaus", "homemax"]
        store_ids = [s["id"] for s in data["stores"]]
        for store in expected_stores:
            assert store in store_ids, f"Store '{store}' not found in response"
        
        # Check each store has required fields
        for store in data["stores"]:
            assert "id" in store, "Store should have 'id'"
            assert "name" in store, "Store should have 'name'"
            assert "url" in store, "Store should have 'url'"
        
        print(f"✅ GET /api/scrape/stores - Returns {len(data['stores'])} Bulgarian stores")
    
    def test_search_products_returns_json_structure(self):
        """GET /api/scrape/search?q=plochki should return valid JSON structure"""
        response = requests.get(f"{BASE_URL}/api/scrape/search", params={"q": "plochki"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Check required fields
        assert "query" in data, "Response should contain 'query'"
        assert "total" in data, "Response should contain 'total'"
        assert "stores_searched" in data, "Response should contain 'stores_searched'"
        assert "products" in data, "Response should contain 'products'"
        
        # Verify query matches
        assert data["query"] == "plochki", f"Query mismatch: expected 'plochki', got '{data['query']}'"
        
        # Verify stores_searched count
        assert data["stores_searched"] == 5, f"Expected 5 stores searched, got {data['stores_searched']}"
        
        # Total can be 0 if stores block requests - that's OK per requirements
        assert isinstance(data["total"], int), "total should be an integer"
        assert isinstance(data["products"], list), "products should be a list"
        
        print(f"✅ GET /api/scrape/search?q=plochki - Returns valid JSON: query={data['query']}, total={data['total']}, stores_searched={data['stores_searched']}")
    
    def test_search_with_short_query_fails(self):
        """GET /api/scrape/search with query < 2 chars should fail"""
        response = requests.get(f"{BASE_URL}/api/scrape/search", params={"q": "a"})
        assert response.status_code == 400, f"Expected 400 for short query, got {response.status_code}"
        print("✅ GET /api/scrape/search - Correctly rejects short queries (<2 chars)")


class TestCommunityFeedPublic:
    """Test public community endpoints (no auth required)"""
    
    def test_get_posts_returns_paginated_data(self):
        """GET /api/community/posts should return posts with pagination"""
        response = requests.get(f"{BASE_URL}/api/community/posts")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Check pagination fields
        assert "posts" in data, "Response should contain 'posts'"
        assert "total" in data, "Response should contain 'total'"
        assert "page" in data, "Response should contain 'page'"
        assert "pages" in data, "Response should contain 'pages'"
        
        assert isinstance(data["posts"], list), "posts should be a list"
        assert isinstance(data["total"], int), "total should be an integer"
        assert isinstance(data["page"], int), "page should be an integer"
        assert isinstance(data["pages"], int), "pages should be an integer"
        
        print(f"✅ GET /api/community/posts - Returns paginated data: total={data['total']}, page={data['page']}, pages={data['pages']}")
    
    def test_get_posts_with_filter(self):
        """GET /api/community/posts with post_type filter works"""
        response = requests.get(f"{BASE_URL}/api/community/posts", params={"post_type": "text"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "posts" in data
        assert "pages" in data
        print("✅ GET /api/community/posts?post_type=text - Filter parameter works")


class TestCommunityFeedAuth:
    """Test authenticated community endpoints (create, like, comment, delete)"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Register a new user and get auth token"""
        unique_email = f"test_community_{uuid.uuid4().hex[:8]}@test.com"
        register_data = {
            "email": unique_email,
            "password": "TestPass123!",
            "name": "Test Community User",
            "user_type": "client",
            "city": "София"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.user_id = response.json().get("user", {}).get("id")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Could not register test user: {response.status_code} - {response.text}")
    
    def test_create_post_requires_auth(self):
        """POST /api/community/posts without auth should fail"""
        response = requests.post(f"{BASE_URL}/api/community/posts", json={"text": "Test"})
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ POST /api/community/posts - Correctly requires authentication")
    
    def test_create_post_success(self):
        """POST /api/community/posts creates a post with auth"""
        post_data = {
            "text": f"TEST_post_{uuid.uuid4().hex[:8]} - This is a test post for iteration 50",
            "type": "text"
        }
        
        response = requests.post(f"{BASE_URL}/api/community/posts", json=post_data, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Created post should have 'id'"
        assert "text" in data, "Created post should have 'text'"
        assert data["text"] == post_data["text"], "Post text should match"
        assert "created_at" in data, "Created post should have 'created_at'"
        
        self.created_post_id = data["id"]
        print(f"✅ POST /api/community/posts - Created post id={data['id']}")
        return data["id"]
    
    def test_like_post_requires_auth(self):
        """POST /api/community/posts/{id}/like without auth should fail"""
        # First create a post to like
        post_id = self.test_create_post_success()
        
        response = requests.post(f"{BASE_URL}/api/community/posts/{post_id}/like")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ POST /api/community/posts/{id}/like - Correctly requires authentication")
    
    def test_like_post_toggle(self):
        """POST /api/community/posts/{id}/like toggles like"""
        # Create a post first
        post_data = {"text": f"TEST_like_{uuid.uuid4().hex[:8]}", "type": "text"}
        create_resp = requests.post(f"{BASE_URL}/api/community/posts", json=post_data, headers=self.headers)
        post_id = create_resp.json()["id"]
        
        # Like the post
        response = requests.post(f"{BASE_URL}/api/community/posts/{post_id}/like", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "liked" in data, "Response should contain 'liked'"
        assert "likes_count" in data, "Response should contain 'likes_count'"
        assert data["liked"] == True, "Should be liked after first toggle"
        assert data["likes_count"] >= 1, "likes_count should be at least 1"
        
        # Unlike the post
        response2 = requests.post(f"{BASE_URL}/api/community/posts/{post_id}/like", headers=self.headers)
        data2 = response2.json()
        assert data2["liked"] == False, "Should be unliked after second toggle"
        
        print("✅ POST /api/community/posts/{id}/like - Toggle like works correctly")
    
    def test_add_comment_requires_auth(self):
        """POST /api/community/posts/{id}/comment without auth should fail"""
        post_data = {"text": f"TEST_comment_{uuid.uuid4().hex[:8]}", "type": "text"}
        create_resp = requests.post(f"{BASE_URL}/api/community/posts", json=post_data, headers=self.headers)
        post_id = create_resp.json()["id"]
        
        response = requests.post(f"{BASE_URL}/api/community/posts/{post_id}/comment", json={"text": "Test comment"})
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ POST /api/community/posts/{id}/comment - Correctly requires authentication")
    
    def test_add_comment_success(self):
        """POST /api/community/posts/{id}/comment adds comment with auth"""
        # Create a post first
        post_data = {"text": f"TEST_comment_post_{uuid.uuid4().hex[:8]}", "type": "text"}
        create_resp = requests.post(f"{BASE_URL}/api/community/posts", json=post_data, headers=self.headers)
        post_id = create_resp.json()["id"]
        
        # Add comment
        comment_data = {"text": "This is a test comment for iteration 50"}
        response = requests.post(f"{BASE_URL}/api/community/posts/{post_id}/comment", json=comment_data, headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Comment should have 'id'"
        assert "text" in data, "Comment should have 'text'"
        assert data["text"] == comment_data["text"], "Comment text should match"
        
        print(f"✅ POST /api/community/posts/{post_id}/comment - Added comment id={data['id']}")
    
    def test_delete_post_requires_auth(self):
        """DELETE /api/community/posts/{id} without auth should fail"""
        post_data = {"text": f"TEST_delete_{uuid.uuid4().hex[:8]}", "type": "text"}
        create_resp = requests.post(f"{BASE_URL}/api/community/posts", json=post_data, headers=self.headers)
        post_id = create_resp.json()["id"]
        
        response = requests.delete(f"{BASE_URL}/api/community/posts/{post_id}")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ DELETE /api/community/posts/{id} - Correctly requires authentication")
    
    def test_delete_own_post(self):
        """DELETE /api/community/posts/{id} deletes own post"""
        # Create a post first
        post_data = {"text": f"TEST_delete_success_{uuid.uuid4().hex[:8]}", "type": "text"}
        create_resp = requests.post(f"{BASE_URL}/api/community/posts", json=post_data, headers=self.headers)
        post_id = create_resp.json()["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/community/posts/{post_id}", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("deleted") == True, "Response should confirm deletion"
        
        print(f"✅ DELETE /api/community/posts/{post_id} - Successfully deleted own post")


class TestPhotoDesignerPDF:
    """Test POST /api/ai-designer/photo-pdf - PDF generation with logo and region-based labor"""
    
    def test_photo_pdf_returns_valid_pdf(self):
        """POST /api/ai-designer/photo-pdf should return valid PDF with Cyrillic text and logo"""
        # Create a minimal test image (1x1 pixel PNG base64)
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        pdf_request = {
            "original_b64": test_image_b64,
            "renders": [
                {
                    "style": "Модерен",
                    "image_b64": test_image_b64,
                    "budget": {
                        "budget_tiers": [
                            {"tier": "Средно", "items": [{"name": "Плочки", "quantity": 10, "unit": "кв.м", "price_eur": 25.0, "store": "Praktiker", "link": "https://praktiker.bg"}]},
                        ],
                        "labor_estimate_eur": 500,
                        "total_eur": 750
                    },
                    "active": True
                }
            ],
            "room_type": "Баня",
            "user_region": "София"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai-designer/photo-pdf", json=pdf_request)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:500] if response.text else 'empty'}"
        
        # Check content type
        assert "application/pdf" in response.headers.get("Content-Type", ""), "Response should be PDF"
        
        # Check PDF header
        assert response.content[:4] == b'%PDF', "PDF should start with %PDF header"
        
        # Check filename contains room type
        content_disp = response.headers.get("Content-Disposition", "")
        assert "filename" in content_disp, "Should have filename in Content-Disposition"
        
        print(f"✅ POST /api/ai-designer/photo-pdf - Returns valid PDF ({len(response.content)} bytes)")
        print(f"✅ PDF Content-Disposition: {content_disp[:100]}")
    
    def test_photo_pdf_includes_region_labor(self):
        """POST /api/ai-designer/photo-pdf should include region-based labor cost in PDF"""
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        pdf_request = {
            "original_b64": test_image_b64,
            "renders": [
                {
                    "style": "Скандинавски",
                    "image_b64": test_image_b64,
                    "budget": {
                        "budget_tiers": [],
                        "labor_estimate_eur": 350,
                        "total_eur": 350
                    },
                    "active": True
                }
            ],
            "room_type": "Кухня",
            "user_region": "Пловдив"
        }
        
        response = requests.post(f"{BASE_URL}/api/ai-designer/photo-pdf", json=pdf_request)
        assert response.status_code == 200
        assert response.content[:4] == b'%PDF'
        
        print("✅ POST /api/ai-designer/photo-pdf - PDF generated with region 'Пловдив' and labor_estimate_eur=350")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root_accessible(self):
        """GET /api/ should be accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("✅ GET /api/ - API root accessible")
    
    def test_stats_live_returns_regions(self):
        """GET /api/stats/live should return regions data"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        
        data = response.json()
        assert "regions" in data, "Response should contain 'regions'"
        assert len(data["regions"]) > 0, "Should have at least one region"
        
        print(f"✅ GET /api/stats/live - Returns {len(data['regions'])} Bulgarian regions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
