"""
Phase 3 Gallery Features Test Suite
Testing published-projects endpoints:
- GET /api/published-projects - list published projects (public)
- GET /api/published-projects/{id} - get project detail (public)
- POST /api/published-projects - publish project (auth required)
- POST /api/published-projects/{id}/like - toggle like (auth required)
- POST /api/published-projects/{id}/comment - add comment (auth required)
- POST /api/published-projects/{id}/rate - rate project 1-5 (auth required)
- GET /api/published-projects/{id}/pdf/design - download design PDF
- GET /api/published-projects/{id}/pdf/survey - download survey PDF
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = f"test_gallery_{uuid.uuid4().hex[:8]}@temadom.bg"
TEST_PASSWORD = "test1234"
TEST_NAME = "Test Gallery User"


class TestPublishedProjectsPublic:
    """Test public endpoints (no auth required)"""
    
    def test_get_published_projects_list(self):
        """GET /api/published-projects returns list with pagination"""
        response = requests.get(f"{BASE_URL}/api/published-projects")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "projects" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        assert isinstance(data["projects"], list)
        print(f"✅ GET /api/published-projects - returned {data['total']} projects")
    
    def test_get_published_projects_with_filters(self):
        """GET /api/published-projects with room_type and style filters"""
        params = {"room_type": "bathroom", "style": "modern", "sort_by": "newest", "page": 1}
        response = requests.get(f"{BASE_URL}/api/published-projects", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert "projects" in data
        print(f"✅ GET /api/published-projects with filters - {data['total']} results")
    
    def test_get_published_projects_sort_by_popular(self):
        """GET /api/published-projects sorted by popular"""
        response = requests.get(f"{BASE_URL}/api/published-projects", params={"sort_by": "popular"})
        assert response.status_code == 200
        print("✅ GET /api/published-projects sorted by popular")
    
    def test_get_published_projects_sort_by_top_rated(self):
        """GET /api/published-projects sorted by top_rated"""
        response = requests.get(f"{BASE_URL}/api/published-projects", params={"sort_by": "top_rated"})
        assert response.status_code == 200
        print("✅ GET /api/published-projects sorted by top_rated")


class TestPublishedProjectsAuth:
    """Test endpoints that require authentication"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register and get auth token"""
        # First try to register
        reg_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME,
            "user_type": "client"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=reg_data)
        if response.status_code == 200:
            return response.json()["token"]
        elif response.status_code == 400 and "вече е регистриран" in response.text:
            # Login instead
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            if login_response.status_code == 200:
                return login_response.json()["token"]
        
        pytest.skip("Could not authenticate - skipping auth tests")
    
    @pytest.fixture(scope="class")
    def existing_project_id(self):
        """Get an existing published project ID for testing"""
        response = requests.get(f"{BASE_URL}/api/published-projects")
        if response.status_code == 200:
            data = response.json()
            if data["projects"]:
                return data["projects"][0]["id"]
        return None
    
    def test_publish_project_requires_auth(self):
        """POST /api/published-projects requires authentication"""
        response = requests.post(f"{BASE_URL}/api/published-projects", json={
            "title": "Test Project",
            "before_images": ["base64..."],
            "after_images": ["base64..."]
        })
        assert response.status_code == 401
        print("✅ POST /api/published-projects requires auth (401 without token)")
    
    def test_like_requires_auth(self, existing_project_id):
        """POST /api/published-projects/{id}/like requires authentication"""
        if not existing_project_id:
            pytest.skip("No existing project to test")
        
        response = requests.post(f"{BASE_URL}/api/published-projects/{existing_project_id}/like")
        assert response.status_code == 401
        print("✅ POST /api/published-projects/{id}/like requires auth (401 without token)")
    
    def test_comment_requires_auth(self, existing_project_id):
        """POST /api/published-projects/{id}/comment requires authentication"""
        if not existing_project_id:
            pytest.skip("No existing project to test")
        
        response = requests.post(f"{BASE_URL}/api/published-projects/{existing_project_id}/comment", json={
            "text": "Test comment"
        })
        assert response.status_code == 401
        print("✅ POST /api/published-projects/{id}/comment requires auth (401 without token)")
    
    def test_rate_requires_auth(self, existing_project_id):
        """POST /api/published-projects/{id}/rate requires authentication"""
        if not existing_project_id:
            pytest.skip("No existing project to test")
        
        response = requests.post(f"{BASE_URL}/api/published-projects/{existing_project_id}/rate", json={
            "rating": 5
        })
        assert response.status_code == 401
        print("✅ POST /api/published-projects/{id}/rate requires auth (401 without token)")
    
    def test_toggle_like_with_auth(self, auth_token, existing_project_id):
        """POST /api/published-projects/{id}/like with authentication"""
        if not existing_project_id:
            pytest.skip("No existing project to test")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/published-projects/{existing_project_id}/like", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "liked" in data
        assert "likes_count" in data
        print(f"✅ POST /api/published-projects/{existing_project_id}/like - liked={data['liked']}, count={data['likes_count']}")
    
    def test_add_comment_with_auth(self, auth_token, existing_project_id):
        """POST /api/published-projects/{id}/comment with authentication"""
        if not existing_project_id:
            pytest.skip("No existing project to test")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        comment_text = f"Test comment from pytest {uuid.uuid4().hex[:6]}"
        response = requests.post(
            f"{BASE_URL}/api/published-projects/{existing_project_id}/comment",
            headers=headers,
            json={"text": comment_text}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "comment" in data
        assert data["comment"]["text"] == comment_text
        print(f"✅ POST /api/published-projects/{existing_project_id}/comment - comment added")
    
    def test_add_comment_empty_rejected(self, auth_token, existing_project_id):
        """POST /api/published-projects/{id}/comment rejects empty comment"""
        if not existing_project_id:
            pytest.skip("No existing project to test")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/published-projects/{existing_project_id}/comment",
            headers=headers,
            json={"text": ""}
        )
        assert response.status_code == 400
        print("✅ POST /api/published-projects/{id}/comment rejects empty comment (400)")
    
    def test_rate_project_with_auth(self, auth_token, existing_project_id):
        """POST /api/published-projects/{id}/rate with valid rating"""
        if not existing_project_id:
            pytest.skip("No existing project to test")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/published-projects/{existing_project_id}/rate",
            headers=headers,
            json={"rating": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "avg_rating" in data
        assert "rating_count" in data
        assert "user_rating" in data
        assert data["user_rating"] == 5
        print(f"✅ POST /api/published-projects/{existing_project_id}/rate - avg={data['avg_rating']}, count={data['rating_count']}")
    
    def test_rate_project_invalid_rating(self, auth_token, existing_project_id):
        """POST /api/published-projects/{id}/rate rejects invalid rating"""
        if not existing_project_id:
            pytest.skip("No existing project to test")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Test rating > 5
        response = requests.post(
            f"{BASE_URL}/api/published-projects/{existing_project_id}/rate",
            headers=headers,
            json={"rating": 10}
        )
        assert response.status_code == 400
        
        # Test rating < 1
        response = requests.post(
            f"{BASE_URL}/api/published-projects/{existing_project_id}/rate",
            headers=headers,
            json={"rating": 0}
        )
        assert response.status_code == 400
        print("✅ POST /api/published-projects/{id}/rate rejects invalid ratings (400)")


class TestPublishedProjectsDetail:
    """Test project detail endpoint"""
    
    @pytest.fixture(scope="class")
    def existing_project_id(self):
        """Get an existing published project ID for testing"""
        response = requests.get(f"{BASE_URL}/api/published-projects")
        if response.status_code == 200:
            data = response.json()
            if data["projects"]:
                return data["projects"][0]["id"]
        return None
    
    def test_get_project_detail(self, existing_project_id):
        """GET /api/published-projects/{id} returns full project detail"""
        if not existing_project_id:
            pytest.skip("No existing project to test")
        
        response = requests.get(f"{BASE_URL}/api/published-projects/{existing_project_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "title" in data
        assert "user_name" in data
        assert "room_type" in data
        assert "style" in data
        assert "before_images" in data
        assert "after_images" in data
        assert "comments" in data
        assert "likes_count" in data
        assert "avg_rating" in data
        assert "views" in data
        print(f"✅ GET /api/published-projects/{existing_project_id} - title: {data['title']}")
    
    def test_get_nonexistent_project_returns_404(self):
        """GET /api/published-projects/{id} returns 404 for nonexistent project"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/published-projects/{fake_id}")
        assert response.status_code == 404
        print(f"✅ GET /api/published-projects/{fake_id} returns 404 for nonexistent")


class TestPublishedProjectsPDF:
    """Test PDF download endpoints"""
    
    @pytest.fixture(scope="class")
    def existing_project_id(self):
        """Get an existing published project ID for testing"""
        response = requests.get(f"{BASE_URL}/api/published-projects")
        if response.status_code == 200:
            data = response.json()
            if data["projects"]:
                return data["projects"][0]["id"]
        return None
    
    def test_download_design_pdf(self, existing_project_id):
        """GET /api/published-projects/{id}/pdf/design returns PDF"""
        if not existing_project_id:
            pytest.skip("No existing project to test")
        
        response = requests.get(f"{BASE_URL}/api/published-projects/{existing_project_id}/pdf/design")
        assert response.status_code == 200
        assert "application/pdf" in response.headers.get("Content-Type", "")
        assert len(response.content) > 0
        print(f"✅ GET /api/published-projects/{existing_project_id}/pdf/design - PDF size: {len(response.content)} bytes")
    
    def test_download_survey_pdf(self, existing_project_id):
        """GET /api/published-projects/{id}/pdf/survey returns PDF"""
        if not existing_project_id:
            pytest.skip("No existing project to test")
        
        response = requests.get(f"{BASE_URL}/api/published-projects/{existing_project_id}/pdf/survey")
        assert response.status_code == 200
        assert "application/pdf" in response.headers.get("Content-Type", "")
        assert len(response.content) > 0
        print(f"✅ GET /api/published-projects/{existing_project_id}/pdf/survey - PDF size: {len(response.content)} bytes")
    
    def test_design_pdf_nonexistent_returns_404(self):
        """GET /api/published-projects/{id}/pdf/design returns 404 for nonexistent"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/published-projects/{fake_id}/pdf/design")
        assert response.status_code == 404
        print("✅ PDF design returns 404 for nonexistent project")
    
    def test_survey_pdf_nonexistent_returns_404(self):
        """GET /api/published-projects/{id}/pdf/survey returns 404 for nonexistent"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/published-projects/{fake_id}/pdf/survey")
        assert response.status_code == 404
        print("✅ PDF survey returns 404 for nonexistent project")


class TestPublishProject:
    """Test project publishing"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register and get auth token"""
        reg_data = {
            "email": f"test_publish_{uuid.uuid4().hex[:8]}@temadom.bg",
            "password": "test1234",
            "name": "Test Publisher",
            "user_type": "client"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=reg_data)
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not register user for publish test")
    
    def test_publish_project_missing_title(self, auth_token):
        """POST /api/published-projects rejects missing title"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/published-projects",
            headers=headers,
            json={
                "title": "",
                "before_images": ["data:image/png;base64,iVBORw0KGgo="],
                "after_images": ["data:image/png;base64,iVBORw0KGgo="]
            }
        )
        assert response.status_code == 400
        print("✅ POST /api/published-projects rejects empty title (400)")
    
    def test_publish_project_missing_before_images(self, auth_token):
        """POST /api/published-projects rejects missing before_images"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/published-projects",
            headers=headers,
            json={
                "title": "Test Project",
                "before_images": [],
                "after_images": ["data:image/png;base64,iVBORw0KGgo="]
            }
        )
        assert response.status_code == 400
        print("✅ POST /api/published-projects rejects missing before_images (400)")
    
    def test_publish_project_missing_after_images(self, auth_token):
        """POST /api/published-projects rejects missing after_images"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/published-projects",
            headers=headers,
            json={
                "title": "Test Project",
                "before_images": ["data:image/png;base64,iVBORw0KGgo="],
                "after_images": []
            }
        )
        assert response.status_code == 400
        print("✅ POST /api/published-projects rejects missing after_images (400)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
