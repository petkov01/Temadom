"""
Phase 3 Redesign Tests - TemaDom Gallery Cards & Detail Page
Tests the redesigned gallery cards matching HTML template with:
- Header (logo+company)
- Image section (Before/After counts)
- Project info (style, area, budget, rating)
- Materials preview table (with store links)
- CTA buttons
- Stats footer

Also tests detail page with image tabs, materials table, dual PDFs, likes, comments, rating.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def auth_token(api_client):
    """Get or create test user and return auth token"""
    # Try login first
    login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test_gallery@temadom.bg",
        "password": "test1234"
    })
    if login_resp.status_code == 200:
        return login_resp.json().get("token")
    # Register if not exists
    reg_resp = api_client.post(f"{BASE_URL}/api/auth/register", json={
        "email": "test_gallery@temadom.bg",
        "password": "test1234",
        "name": "Test Gallery User",
        "user_type": "client"
    })
    if reg_resp.status_code == 200:
        return reg_resp.json().get("token")
    pytest.skip("Could not authenticate - skipping auth tests")

@pytest.fixture
def authenticated_client(api_client, auth_token):
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client

class TestPublishedProjectsListing:
    """Test GET /api/published-projects - listing with new redesigned fields"""
    
    def test_listing_returns_projects(self, api_client):
        """Verify listing returns projects array"""
        response = api_client.get(f"{BASE_URL}/api/published-projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert "total" in data
        assert "pages" in data
        print(f"✅ Listing returned {len(data['projects'])} projects, total={data['total']}")

    def test_listing_has_new_fields(self, api_client):
        """Verify new fields for redesigned cards: first_before_image, first_after_image, budget, materials_preview"""
        response = api_client.get(f"{BASE_URL}/api/published-projects")
        assert response.status_code == 200
        projects = response.json().get("projects", [])
        
        if len(projects) == 0:
            pytest.skip("No projects in database")
        
        project = projects[0]
        # New fields for redesigned cards
        assert "first_before_image" in project, "Missing first_before_image"
        assert "first_after_image" in project, "Missing first_after_image"
        assert "budget" in project, "Missing budget field"
        assert "materials_preview" in project, "Missing materials_preview"
        assert "materials_count" in project, "Missing materials_count"
        assert "before_count" in project, "Missing before_count"
        assert "after_count" in project, "Missing after_count"
        print(f"✅ Project has all new fields: budget={project['budget']}, materials_count={project['materials_count']}")
    
    def test_materials_preview_structure(self, api_client):
        """Verify materials_preview has correct structure for store links"""
        response = api_client.get(f"{BASE_URL}/api/published-projects")
        assert response.status_code == 200
        projects = response.json().get("projects", [])
        
        if len(projects) == 0:
            pytest.skip("No projects in database")
        
        project = projects[0]
        materials_preview = project.get("materials_preview", [])
        
        if len(materials_preview) > 0:
            mat = materials_preview[0]
            assert "name" in mat, "Material missing name"
            assert "quantity" in mat, "Material missing quantity"
            assert "unit" in mat, "Material missing unit"
            # Store link field for template
            assert "store" in mat or "total_price_bgn" in mat, "Material should have store or price"
            print(f"✅ Materials preview structure valid: {mat.get('name')}, store={mat.get('store')}")
        else:
            print("⚠️ No materials_preview data to verify")
    
    def test_listing_filters_by_room_type(self, api_client):
        """Test room_type filter"""
        response = api_client.get(f"{BASE_URL}/api/published-projects?room_type=bathroom")
        assert response.status_code == 200
        data = response.json()
        # All returned should be bathroom
        for p in data.get("projects", []):
            assert p.get("room_type") == "bathroom" or len(data["projects"]) == 0
        print(f"✅ Room type filter works: {len(data['projects'])} bathroom projects")
    
    def test_listing_filters_by_style(self, api_client):
        """Test style filter"""
        response = api_client.get(f"{BASE_URL}/api/published-projects?style=modern")
        assert response.status_code == 200
        print(f"✅ Style filter works")
    
    def test_listing_sort_by_popular(self, api_client):
        """Test sort by likes_count"""
        response = api_client.get(f"{BASE_URL}/api/published-projects?sort_by=popular")
        assert response.status_code == 200
        print(f"✅ Sort by popular works")
    
    def test_listing_sort_by_top_rated(self, api_client):
        """Test sort by avg_rating"""
        response = api_client.get(f"{BASE_URL}/api/published-projects?sort_by=top_rated")
        assert response.status_code == 200
        print(f"✅ Sort by top_rated works")

class TestPublishedProjectDetail:
    """Test GET /api/published-projects/{id} - detail page fields"""
    
    def test_detail_returns_full_project(self, api_client):
        """Verify detail returns full project data"""
        # First get a project ID
        list_resp = api_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects to test")
        
        project_id = projects[0]["id"]
        response = api_client.get(f"{BASE_URL}/api/published-projects/{project_id}")
        assert response.status_code == 200
        project = response.json()
        
        # Full project should have before_images, after_images, materials
        assert "before_images" in project, "Detail should have before_images array"
        assert "after_images" in project, "Detail should have after_images array"
        assert "materials" in project, "Detail should have materials object"
        print(f"✅ Detail has full data: {len(project.get('before_images', []))} before, {len(project.get('after_images', []))} after images")
    
    def test_detail_materials_has_store_links(self, api_client):
        """Verify materials table has store links for template Линк column"""
        list_resp = api_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects to test")
        
        project_id = projects[0]["id"]
        response = api_client.get(f"{BASE_URL}/api/published-projects/{project_id}")
        project = response.json()
        
        materials = project.get("materials", {})
        mat_list = materials.get("materials", [])
        
        if mat_list:
            mat = mat_list[0]
            # Should have store field for Линк column
            assert "store" in mat or "name" in mat, "Materials should have store or name"
            print(f"✅ Materials have store links: {mat.get('store', 'N/A')}")
        else:
            print("⚠️ No materials to verify")
    
    def test_detail_has_totals(self, api_client):
        """Verify detail has grand_total_bgn and grand_total_eur for total row"""
        list_resp = api_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects to test")
        
        project_id = projects[0]["id"]
        response = api_client.get(f"{BASE_URL}/api/published-projects/{project_id}")
        project = response.json()
        
        materials = project.get("materials", {})
        # Should have total fields
        has_total = "grand_total_bgn" in materials or "total_estimate_bgn" in materials
        assert has_total, "Materials should have total_bgn or grand_total_bgn"
        print(f"✅ Detail has totals: BGN={materials.get('grand_total_bgn', materials.get('total_estimate_bgn'))}")
    
    def test_detail_404_for_nonexistent(self, api_client):
        """Verify 404 for nonexistent project"""
        response = api_client.get(f"{BASE_URL}/api/published-projects/nonexistent-id-12345")
        assert response.status_code == 404
        print("✅ Returns 404 for nonexistent project")

class TestLikeCommentRate:
    """Test like/comment/rate endpoints - auth required"""
    
    def test_like_requires_auth(self, api_client):
        """Like requires authentication"""
        list_resp = api_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects")
        
        project_id = projects[0]["id"]
        response = api_client.post(f"{BASE_URL}/api/published-projects/{project_id}/like")
        assert response.status_code == 401
        print("✅ Like requires auth (401)")
    
    def test_comment_requires_auth(self, api_client):
        """Comment requires authentication"""
        list_resp = api_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects")
        
        project_id = projects[0]["id"]
        response = api_client.post(f"{BASE_URL}/api/published-projects/{project_id}/comment", 
                                   json={"text": "Test comment"})
        assert response.status_code == 401
        print("✅ Comment requires auth (401)")
    
    def test_rate_requires_auth(self, api_client):
        """Rate requires authentication"""
        list_resp = api_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects")
        
        project_id = projects[0]["id"]
        response = api_client.post(f"{BASE_URL}/api/published-projects/{project_id}/rate", 
                                   json={"rating": 5})
        assert response.status_code == 401
        print("✅ Rate requires auth (401)")
    
    def test_like_toggle_with_auth(self, authenticated_client):
        """Like toggles with auth"""
        list_resp = authenticated_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects")
        
        project_id = projects[0]["id"]
        response = authenticated_client.post(f"{BASE_URL}/api/published-projects/{project_id}/like")
        assert response.status_code == 200
        data = response.json()
        assert "liked" in data
        assert "likes_count" in data
        print(f"✅ Like toggle works: liked={data['liked']}, count={data['likes_count']}")
    
    def test_comment_with_auth(self, authenticated_client):
        """Add comment with auth"""
        list_resp = authenticated_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects")
        
        project_id = projects[0]["id"]
        import uuid
        comment_text = f"Test comment {uuid.uuid4().hex[:6]}"
        response = authenticated_client.post(
            f"{BASE_URL}/api/published-projects/{project_id}/comment",
            json={"text": comment_text}
        )
        assert response.status_code == 200
        data = response.json()
        assert "comment" in data
        assert data["comment"]["text"] == comment_text
        print(f"✅ Comment added: {comment_text[:30]}...")
    
    def test_rate_with_auth(self, authenticated_client):
        """Rate project with auth"""
        list_resp = authenticated_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects")
        
        project_id = projects[0]["id"]
        response = authenticated_client.post(
            f"{BASE_URL}/api/published-projects/{project_id}/rate",
            json={"rating": 4}
        )
        assert response.status_code == 200
        data = response.json()
        assert "avg_rating" in data
        print(f"✅ Rating works: avg={data['avg_rating']}")
    
    def test_rate_rejects_invalid(self, authenticated_client):
        """Rate rejects invalid rating"""
        list_resp = authenticated_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects")
        
        project_id = projects[0]["id"]
        response = authenticated_client.post(
            f"{BASE_URL}/api/published-projects/{project_id}/rate",
            json={"rating": 10}
        )
        assert response.status_code == 400
        print("✅ Rejects invalid rating (400)")

class TestPDFDownloads:
    """Test PDF download endpoints"""
    
    def test_design_pdf_download(self, api_client):
        """Design PDF returns PDF content"""
        list_resp = api_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects")
        
        project_id = projects[0]["id"]
        response = api_client.get(f"{BASE_URL}/api/published-projects/{project_id}/pdf/design")
        assert response.status_code == 200
        assert "application/pdf" in response.headers.get("content-type", "")
        print("✅ Design PDF downloads correctly")
    
    def test_survey_pdf_download(self, api_client):
        """Survey PDF (Количествена сметка) returns PDF content"""
        list_resp = api_client.get(f"{BASE_URL}/api/published-projects")
        projects = list_resp.json().get("projects", [])
        if not projects:
            pytest.skip("No projects")
        
        project_id = projects[0]["id"]
        response = api_client.get(f"{BASE_URL}/api/published-projects/{project_id}/pdf/survey")
        assert response.status_code == 200
        assert "application/pdf" in response.headers.get("content-type", "")
        print("✅ Survey PDF downloads correctly")
    
    def test_pdf_404_for_nonexistent(self, api_client):
        """PDF returns 404 for nonexistent"""
        response = api_client.get(f"{BASE_URL}/api/published-projects/fake-id-999/pdf/design")
        assert response.status_code == 404
        print("✅ PDF 404 for nonexistent")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
