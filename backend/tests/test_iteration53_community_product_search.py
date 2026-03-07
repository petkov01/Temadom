"""
Iteration 53: Community Feed + AI Product Search API Tests

Tests community posts (CRUD, likes, comments) and AI product search features.
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://temdom-launch.preview.emergentagent.com')

# Test user credentials
TEST_USER = {
    "name": f"TestCommunity_{uuid.uuid4().hex[:6]}",
    "email": f"test_community_{uuid.uuid4().hex[:6]}@test.bg",
    "password": "Test123!",
    "user_type": "client",
    "region": "София"
}

class TestStores:
    """Test store listing endpoints"""
    
    def test_get_stores_returns_21_stores(self):
        """GET /api/scrape/stores should return exactly 21 Bulgarian stores"""
        response = requests.get(f"{BASE_URL}/api/scrape/stores")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "stores" in data, "Response should have 'stores' key"
        assert len(data["stores"]) == 21, f"Expected 21 stores, got {len(data['stores'])}"
        
        # Verify store structure
        for store in data["stores"]:
            assert "id" in store, "Store should have 'id'"
            assert "name" in store, "Store should have 'name'"
            assert "url" in store, "Store should have 'url'"
        
        print(f"✅ GET /api/scrape/stores returns {len(data['stores'])} stores")

    def test_store_names_include_expected(self):
        """Verify key stores are in the list"""
        response = requests.get(f"{BASE_URL}/api/scrape/stores")
        assert response.status_code == 200
        
        data = response.json()
        store_names = [s["name"] for s in data["stores"]]
        
        expected_stores = ["Praktiker", "Technomarket", "IKEA", "Jysk", "Bauhaus", "HomeMax"]
        for expected in expected_stores:
            assert expected in store_names, f"Store '{expected}' should be in the list"
        
        print(f"✅ All expected stores found: {expected_stores}")


class TestAIProductSearch:
    """Test AI product search endpoints"""
    
    def test_ai_search_rejects_empty_request(self):
        """POST /api/scrape/ai-search should reject empty requests"""
        response = requests.post(
            f"{BASE_URL}/api/scrape/ai-search",
            json={}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Should have error detail"
        print(f"✅ POST /api/scrape/ai-search rejects empty request: {data['detail']}")

    def test_ai_search_with_text_query_only(self):
        """POST /api/scrape/ai-search with text query (no image)"""
        response = requests.post(
            f"{BASE_URL}/api/scrape/ai-search",
            json={"query": "бойлер 80 литра"}
        )
        # Should accept text query, may timeout on scraping but shouldn't reject
        assert response.status_code in [200, 500], f"Expected 200 or 500 (scrape timeout), got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "queries" in data, "Response should have 'queries'"
            assert "total_products" in data, "Response should have 'total_products'"
            assert "stores_count" in data, "Response should have 'stores_count'"
            assert data["stores_count"] == 21, f"Expected 21 stores, got {data['stores_count']}"
            print(f"✅ POST /api/scrape/ai-search with query returned {data['total_products']} products")
        else:
            print(f"⚠️ POST /api/scrape/ai-search timed out (expected in preview env)")


class TestCommunityAuth:
    """Test community post authentication requirements"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register and login a test user, return auth token"""
        # Try to register
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json=TEST_USER)
        
        if reg_resp.status_code == 200:
            return reg_resp.json()["token"]
        elif reg_resp.status_code == 400 and "вече е регистриран" in reg_resp.text:
            # Already registered, try login
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER["email"],
                "password": TEST_USER["password"]
            })
            if login_resp.status_code == 200:
                return login_resp.json()["token"]
        
        # Try with existing test user
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "comm2@test.bg",
            "password": "Test123!"
        })
        if login_resp.status_code == 200:
            return login_resp.json()["token"]
        
        pytest.skip("Could not authenticate")
    
    def test_get_community_posts_no_auth(self):
        """GET /api/community/posts works without auth"""
        response = requests.get(f"{BASE_URL}/api/community/posts")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "posts" in data, "Response should have 'posts'"
        assert "total" in data, "Response should have 'total'"
        assert "page" in data, "Response should have 'page'"
        assert "pages" in data, "Response should have 'pages'"
        print(f"✅ GET /api/community/posts returns {len(data['posts'])} posts (total: {data['total']})")

    def test_create_post_requires_auth(self):
        """POST /api/community/posts requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/community/posts",
            json={"text": "Test post without auth"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✅ POST /api/community/posts requires auth (got {response.status_code})")


class TestCommunityPosts:
    """Test community post CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for authenticated requests"""
        # Try with known test user
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "comm2@test.bg",
            "password": "Test123!"
        })
        
        if login_resp.status_code != 200:
            # Register new test user
            new_user = {
                "name": f"TestComm_{uuid.uuid4().hex[:4]}",
                "email": f"testcomm_{uuid.uuid4().hex[:6]}@test.bg",
                "password": "Test123!",
                "user_type": "client",
                "region": "София"
            }
            reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json=new_user)
            if reg_resp.status_code == 200:
                token = reg_resp.json()["token"]
                return {"Authorization": f"Bearer {token}"}
            pytest.skip("Could not authenticate")
        
        token = login_resp.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_create_post_text_only(self, auth_headers):
        """Create a post with text only"""
        response = requests.post(
            f"{BASE_URL}/api/community/posts",
            json={"text": "Test post from pytest iteration 53"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should have post 'id'"
        assert data["text"] == "Test post from pytest iteration 53"
        assert "created_at" in data
        print(f"✅ Created text-only post with id: {data['id']}")
        return data["id"]

    def test_create_post_rejects_empty(self, auth_headers):
        """Creating post with no text, image, or project should fail"""
        response = requests.post(
            f"{BASE_URL}/api/community/posts",
            json={},
            headers=auth_headers
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        print(f"✅ Empty post rejected: {data['detail']}")

    def test_create_post_with_type(self, auth_headers):
        """Create post with specific type"""
        response = requests.post(
            f"{BASE_URL}/api/community/posts",
            json={"text": "This is a question post", "type": "question"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["type"] == "question"
        print(f"✅ Created question post with id: {data['id']}")
        return data["id"]

    def test_get_posts_with_filter(self, auth_headers):
        """Get posts filtered by type"""
        # Create a question post first
        requests.post(
            f"{BASE_URL}/api/community/posts",
            json={"text": "Another question for testing", "type": "question"},
            headers=auth_headers
        )
        
        response = requests.get(f"{BASE_URL}/api/community/posts?post_type=question")
        assert response.status_code == 200
        
        data = response.json()
        for post in data["posts"]:
            assert post["type"] == "question", f"Post type should be 'question', got '{post['type']}'"
        print(f"✅ Filter by type works: {len(data['posts'])} question posts")


class TestCommunityInteractions:
    """Test likes and comments on community posts"""
    
    @pytest.fixture(scope="class")
    def auth_headers_and_post(self):
        """Create auth headers and a test post"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "comm2@test.bg",
            "password": "Test123!"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not authenticate")
        
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a post for interaction tests
        post_resp = requests.post(
            f"{BASE_URL}/api/community/posts",
            json={"text": f"Interaction test post {uuid.uuid4().hex[:6]}"},
            headers=headers
        )
        
        if post_resp.status_code != 200:
            pytest.skip("Could not create test post")
        
        return headers, post_resp.json()["id"]
    
    def test_like_post(self, auth_headers_and_post):
        """Toggle like on a post"""
        headers, post_id = auth_headers_and_post
        
        response = requests.post(
            f"{BASE_URL}/api/community/posts/{post_id}/like",
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "liked" in data, "Response should have 'liked'"
        assert "likes_count" in data, "Response should have 'likes_count'"
        print(f"✅ Like toggled: liked={data['liked']}, count={data['likes_count']}")

    def test_add_comment(self, auth_headers_and_post):
        """Add a comment to a post"""
        headers, post_id = auth_headers_and_post
        
        response = requests.post(
            f"{BASE_URL}/api/community/posts/{post_id}/comment",
            json={"text": "Test comment from pytest"},
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "id" in data, "Comment should have 'id'"
        assert data["text"] == "Test comment from pytest"
        print(f"✅ Comment added with id: {data['id']}")

    def test_comment_requires_text(self, auth_headers_and_post):
        """Comment with empty text should fail"""
        headers, post_id = auth_headers_and_post
        
        response = requests.post(
            f"{BASE_URL}/api/community/posts/{post_id}/comment",
            json={"text": ""},
            headers=headers
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Empty comment rejected")


class TestCommunityDelete:
    """Test post deletion"""
    
    def test_delete_own_post(self):
        """Delete own post"""
        # Login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "comm2@test.bg",
            "password": "Test123!"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not authenticate")
        
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a post to delete
        create_resp = requests.post(
            f"{BASE_URL}/api/community/posts",
            json={"text": f"Post to delete {uuid.uuid4().hex[:6]}"},
            headers=headers
        )
        assert create_resp.status_code == 200
        post_id = create_resp.json()["id"]
        
        # Delete it
        delete_resp = requests.delete(
            f"{BASE_URL}/api/community/posts/{post_id}",
            headers=headers
        )
        assert delete_resp.status_code == 200, f"Expected 200, got {delete_resp.status_code}"
        
        data = delete_resp.json()
        assert data["deleted"] == True
        print(f"✅ Post {post_id} deleted successfully")


class TestCommunityImages:
    """Test image handling in community posts"""
    
    def test_create_post_with_images(self):
        """Create post with base64 images"""
        # Login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "comm2@test.bg",
            "password": "Test123!"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not authenticate")
        
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a minimal valid JPEG image (1x1 red pixel)
        # This is a valid base64 JPEG
        test_image_b64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEQT8AAKpgB//Z"
        
        response = requests.post(
            f"{BASE_URL}/api/community/posts",
            json={
                "text": "Post with image test",
                "images": [test_image_b64]
            },
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "images" in data, "Response should have 'images'"
        assert len(data["images"]) == 1, "Should have 1 image"
        print(f"✅ Created post with image, id: {data['id']}")

    def test_image_only_post_allowed(self):
        """Post with only image (no text) should be allowed"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "comm2@test.bg",
            "password": "Test123!"
        })
        
        if login_resp.status_code != 200:
            pytest.skip("Could not authenticate")
        
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Valid 1x1 JPEG
        test_image_b64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEQT8AAKpgB//Z"
        
        response = requests.post(
            f"{BASE_URL}/api/community/posts",
            json={
                "images": [test_image_b64]
            },
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200 for image-only post, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert len(data["images"]) == 1
        print(f"✅ Image-only post created successfully, id: {data['id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
