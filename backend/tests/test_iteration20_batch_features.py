"""
Test Iteration 20 - TemaDom Batch Features
Testing:
1. Logo fix verification (h-[72px] on desktop, pt-1 padding)
2. Social sharing (Facebook, Viber, WhatsApp, Telegram, Copy Link) on gallery modal
3. Updated subscription plans (Starter/Basic, Pro, Premium with AI features)
4. AI Sketch page at /ai-sketch
5. Gallery card share buttons
6. PDF endpoints for published projects
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test project ID provided in requirements
TEST_PROJECT_ID = "d54cb750-0a3a-4845-8460-0eb714f6ccf9"


class TestAPIRoot:
    """Basic API health check"""
    
    def test_api_root_returns_200(self):
        """Test API root endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data
        print("✅ GET /api/ - API root returns 200")


class TestSubscriptionPlans:
    """Test subscription plans endpoint with updated structure"""
    
    def test_subscriptions_plans_endpoint(self):
        """Test GET /api/subscriptions/plans returns updated plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify structure
        assert "plans" in data, "Response should have 'plans' key"
        plans = data["plans"]
        
        # Verify company plans
        assert "company" in plans, "Plans should have 'company' category"
        company_plans = plans["company"]
        
        # Verify starter plan
        assert "starter" in company_plans, "Company plans should have 'starter' plan"
        starter = company_plans["starter"]
        assert starter["name"] == "Starter / Basic", f"Starter name should be 'Starter / Basic', got {starter['name']}"
        assert len(starter["features"]) > 0, "Starter should have features"
        print("✅ GET /api/subscriptions/plans - starter plan verified")
        
        # Verify pro plan
        assert "pro" in company_plans, "Company plans should have 'pro' plan"
        pro = company_plans["pro"]
        assert pro["name"] == "Pro", f"Pro name should be 'Pro', got {pro['name']}"
        assert any("AI Builder" in f for f in pro["features"]), "Pro should have AI Builder feature"
        print("✅ GET /api/subscriptions/plans - pro plan verified")
        
        # Verify premium plan
        assert "premium" in company_plans, "Company plans should have 'premium' plan"
        premium = company_plans["premium"]
        assert premium["name"] == "Premium", f"Premium name should be 'Premium', got {premium['name']}"
        assert any("чертежи" in f.lower() or "PDF" in f for f in premium["features"]), "Premium should have structural drawings"
        print("✅ GET /api/subscriptions/plans - premium plan verified")
        
        # Verify designer module
        assert "designer" in plans, "Plans should have 'designer' category"
        designer_plans = plans["designer"]
        assert "designer" in designer_plans, "Designer plans should have 'designer' plan"
        designer = designer_plans["designer"]
        assert "AI Дизайнер" in designer["name"], "Designer module name should contain 'AI Дизайнер'"
        print("✅ GET /api/subscriptions/plans - designer module verified")
        
        # Verify test mode
        assert "test_mode" in data, "Response should have 'test_mode' key"
        print("✅ GET /api/subscriptions/plans - all 4 plans verified correctly")


class TestPublishedGallery:
    """Test published gallery endpoints"""
    
    def test_published_list_endpoint(self):
        """Test GET /api/ai-designer/published returns projects list"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published?limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "projects" in data, "Response should have 'projects' key"
        assert "total" in data, "Response should have 'total' key"
        assert "pages" in data, "Response should have 'pages' key"
        print(f"✅ GET /api/ai-designer/published - returns {len(data['projects'])} projects")
    
    def test_published_project_detail(self):
        """Test GET /api/ai-designer/published/{id} returns project details"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published/{TEST_PROJECT_ID}")
        
        if response.status_code == 404:
            pytest.skip(f"Test project {TEST_PROJECT_ID} not found - may need to publish first")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "id" in data, "Project should have 'id'"
        assert data["id"] == TEST_PROJECT_ID, f"Project ID should match {TEST_PROJECT_ID}"
        print(f"✅ GET /api/ai-designer/published/{TEST_PROJECT_ID} - project details verified")
        
        # Verify views increment on fetch (check if views key exists)
        assert "views" in data, "Project should have 'views' count"
        print(f"✅ Project has {data.get('views', 0)} views")
    
    def test_published_project_not_found(self):
        """Test GET /api/ai-designer/published/{nonexistent} returns 404"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published/nonexistent-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ GET /api/ai-designer/published/nonexistent - returns 404")


class TestPDFEndpoints:
    """Test PDF generation endpoints"""
    
    def test_pdf_images_endpoint(self):
        """Test GET /api/ai-designer/published/{id}/pdf/images returns PDF"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published/{TEST_PROJECT_ID}/pdf/images")
        
        if response.status_code == 404:
            pytest.skip(f"Test project {TEST_PROJECT_ID} not found")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "application/pdf" in response.headers.get("content-type", ""), "Should return PDF content type"
        print(f"✅ GET /api/ai-designer/published/{TEST_PROJECT_ID}/pdf/images - returns PDF")
    
    def test_pdf_materials_endpoint(self):
        """Test GET /api/ai-designer/published/{id}/pdf/materials returns PDF"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published/{TEST_PROJECT_ID}/pdf/materials")
        
        if response.status_code == 404:
            pytest.skip(f"Test project {TEST_PROJECT_ID} not found")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "application/pdf" in response.headers.get("content-type", ""), "Should return PDF content type"
        print(f"✅ GET /api/ai-designer/published/{TEST_PROJECT_ID}/pdf/materials - returns PDF")
    
    def test_pdf_images_not_found(self):
        """Test GET /api/ai-designer/published/{nonexistent}/pdf/images returns 404"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published/nonexistent-12345/pdf/images")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ GET /api/ai-designer/published/nonexistent/pdf/images - returns 404")


class TestAISketchEndpoint:
    """Test AI Sketch analyze endpoint"""
    
    def test_ai_sketch_analyze_rejects_empty(self):
        """Test POST /api/ai-sketch/analyze rejects empty sketches"""
        response = requests.post(f"{BASE_URL}/api/ai-sketch/analyze", json={
            "sketches": [],
            "building_type": "residential",
            "notes": ""
        })
        assert response.status_code == 400, f"Expected 400 for empty sketches, got {response.status_code}"
        print("✅ POST /api/ai-sketch/analyze - rejects empty sketches (400)")


class TestPublishEndpoint:
    """Test publish endpoint validation"""
    
    def test_publish_rejects_empty_images(self):
        """Test POST /api/ai-designer/publish rejects empty generated_images"""
        response = requests.post(f"{BASE_URL}/api/ai-designer/publish", json={
            "generated_images": [],
            "before_images": [],
            "materials": {},
            "room_type": "Test",
            "style": "Modern"
        })
        assert response.status_code == 400, f"Expected 400 for empty images, got {response.status_code}"
        print("✅ POST /api/ai-designer/publish - rejects empty generated_images (400)")


class TestFrontendRoutes:
    """Test that frontend routes are accessible"""
    
    def test_subscriptions_page_loads(self):
        """Test /subscriptions page loads"""
        response = requests.get(f"{BASE_URL}/subscriptions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /subscriptions - page loads (200)")
    
    def test_ai_gallery_page_loads(self):
        """Test /ai-gallery page loads"""
        response = requests.get(f"{BASE_URL}/ai-gallery")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /ai-gallery - page loads (200)")
    
    def test_ai_sketch_page_loads(self):
        """Test /ai-sketch page loads"""
        response = requests.get(f"{BASE_URL}/ai-sketch")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /ai-sketch - page loads (200)")
    
    def test_ai_designer_page_loads(self):
        """Test /ai-designer page loads"""
        response = requests.get(f"{BASE_URL}/ai-designer")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /ai-designer - page loads (200)")
    
    def test_homepage_loads(self):
        """Test homepage loads"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET / - homepage loads (200)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
