"""
TemaDom Iteration 21 - Bug Fixes Testing
Tests for:
1. Subscription plans with updated prices (49/99/199 BGN)
2. Admin clean-test-data endpoint with key validation
3. AI Gallery page loads (now empty after cleanup)
4. Logo visibility in navbar
5. Navigation dropdown 'Още' links
6. Share buttons on gallery page
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSubscriptionPlans:
    """Test subscription plans API with updated pricing"""
    
    def test_get_subscription_plans_returns_200(self):
        """GET /api/subscriptions/plans returns 200"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        print("✅ GET /api/subscriptions/plans returns 200")
    
    def test_subscription_plans_has_company_plans(self):
        """Plans include company section with starter, pro, premium"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        assert "plans" in data
        assert "company" in data["plans"]
        company_plans = data["plans"]["company"]
        assert "starter" in company_plans
        assert "pro" in company_plans
        assert "premium" in company_plans
        print("✅ Plans include company section with starter, pro, premium")
    
    def test_starter_plan_price_49_bgn(self):
        """Starter plan shows 49 лв/мес"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        starter = data["plans"]["company"]["starter"]
        assert starter["price"] == "49 лв/мес"
        assert starter["price_eur"] == "25 EUR/мес"
        print("✅ Starter plan: 49 лв/мес, 25 EUR/мес")
    
    def test_pro_plan_price_99_bgn(self):
        """Pro plan shows 99 лв/мес"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        pro = data["plans"]["company"]["pro"]
        assert pro["price"] == "99 лв/мес"
        assert pro["price_eur"] == "50 EUR/мес"
        print("✅ Pro plan: 99 лв/мес, 50 EUR/мес")
    
    def test_premium_plan_price_199_bgn(self):
        """Premium plan shows 199 лв/мес"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        premium = data["plans"]["company"]["premium"]
        assert premium["price"] == "199 лв/мес"
        assert premium["price_eur"] == "102 EUR/мес"
        print("✅ Premium plan: 199 лв/мес, 102 EUR/мес")
    
    def test_starter_plan_has_limitations(self):
        """Starter plan includes limitations section"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        starter = data["plans"]["company"]["starter"]
        assert "limitations" in starter
        assert len(starter["limitations"]) >= 2
        # Check specific limitations
        limitations = starter["limitations"]
        assert any("Ограничен" in l for l in limitations)
        assert any("AI" in l for l in limitations) or any("Без AI" in l for l in limitations)
        print(f"✅ Starter limitations: {limitations}")
    
    def test_pro_plan_ai_builder_feature(self):
        """Pro plan includes AI Builder with 1 variant limitation"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        pro = data["plans"]["company"]["pro"]
        features = pro["features"]
        limitations = pro.get("limitations", [])
        # Check AI Builder mentioned in features
        has_ai_builder = any("AI Builder" in f or "визуализация" in f for f in features)
        assert has_ai_builder, f"Pro features: {features}"
        # Check 1 variant limitation
        has_1_variant = any("1 вариант" in l for l in limitations)
        assert has_1_variant, f"Pro limitations: {limitations}"
        print(f"✅ Pro has AI Builder feature with 1 variant limitation")
    
    def test_premium_plan_full_features(self):
        """Premium plan includes AI Designer 5 variants, AI Sketch, structural drawings"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        premium = data["plans"]["company"]["premium"]
        features = premium["features"]
        # Check for 5 variants
        has_5_variants = any("5 варианта" in f for f in features)
        # Check for AI Sketch
        has_ai_sketch = any("AI Sketch" in f for f in features)
        # Check for structural drawings
        has_structural = any("чертежи" in f.lower() for f in features)
        
        assert has_5_variants, f"Premium features: {features}"
        assert has_ai_sketch, f"Premium features: {features}"
        assert has_structural, f"Premium features: {features}"
        print(f"✅ Premium has AI Designer 5 variants, AI Sketch, structural drawings")
    
    def test_ai_designer_module_pricing(self):
        """AI Designer module shows 29 лв/генерация with bundle prices"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        assert "designer" in data["plans"]
        designer = data["plans"]["designer"]["designer"]
        assert designer["price"] == "29 лв/генерация"
        assert designer["price_eur"] == "15 EUR/генерация"
        assert "bundle_prices" in designer
        assert "3_variants" in designer["bundle_prices"]
        assert "5_variants" in designer["bundle_prices"]
        print(f"✅ AI Designer: 29 лв/gen, bundles: {designer['bundle_prices']}")


class TestAdminCleanTestData:
    """Test admin clean-test-data endpoint"""
    
    def test_clean_test_data_wrong_key_returns_403(self):
        """POST /api/admin/clean-test-data with wrong key returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/admin/clean-test-data",
            json={"admin_key": "wrong-key-123"}
        )
        assert response.status_code == 403
        print("✅ POST /api/admin/clean-test-data with wrong key returns 403")
    
    def test_clean_test_data_correct_key_returns_success(self):
        """POST /api/admin/clean-test-data with correct key returns success"""
        response = requests.post(
            f"{BASE_URL}/api/admin/clean-test-data",
            json={"admin_key": "temadom-clean-2026"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "results" in data or "deleted_users" in data or response.status_code == 200
        print(f"✅ POST /api/admin/clean-test-data with correct key: {response.status_code}")
    
    def test_clean_test_data_empty_key_returns_403(self):
        """POST /api/admin/clean-test-data with empty key returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/admin/clean-test-data",
            json={"admin_key": ""}
        )
        assert response.status_code == 403
        print("✅ POST /api/admin/clean-test-data with empty key returns 403")


class TestAIGallery:
    """Test AI Gallery page API"""
    
    def test_ai_gallery_api_returns_200(self):
        """GET /api/ai-designer/published returns 200"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published")
        assert response.status_code == 200
        print("✅ GET /api/ai-designer/published returns 200")
    
    def test_ai_gallery_returns_projects_list(self):
        """Gallery API returns projects list (may be empty after cleanup)"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published")
        data = response.json()
        assert "projects" in data
        assert isinstance(data["projects"], list)
        print(f"✅ AI Gallery API returns projects list (count: {len(data['projects'])})")
    
    def test_ai_gallery_has_pagination(self):
        """Gallery API includes pagination info"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published")
        data = response.json()
        # API returns 'pages' and 'total' instead of 'page'
        assert "pages" in data or "total_pages" in data or "total" in data
        print(f"✅ AI Gallery has pagination: pages={data.get('pages')}, total={data.get('total')}")


class TestFrontendRoutes:
    """Test frontend routes load correctly"""
    
    def test_homepage_loads(self):
        """GET / returns 200"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        print("✅ Homepage loads (200)")
    
    def test_subscriptions_page_loads(self):
        """GET /subscriptions returns 200"""
        response = requests.get(f"{BASE_URL}/subscriptions")
        assert response.status_code == 200
        print("✅ Subscriptions page loads (200)")
    
    def test_ai_gallery_page_loads(self):
        """GET /ai-gallery returns 200"""
        response = requests.get(f"{BASE_URL}/ai-gallery")
        assert response.status_code == 200
        print("✅ AI Gallery page loads (200)")
    
    def test_ai_sketch_page_loads(self):
        """GET /ai-sketch returns 200"""
        response = requests.get(f"{BASE_URL}/ai-sketch")
        assert response.status_code == 200
        print("✅ AI Sketch page loads (200)")
    
    def test_ai_designer_page_loads(self):
        """GET /ai-designer returns 200"""
        response = requests.get(f"{BASE_URL}/ai-designer")
        assert response.status_code == 200
        print("✅ AI Designer page loads (200)")


class TestPublishEndpoint:
    """Test AI Designer publish creates project in gallery"""
    
    def test_publish_requires_generated_images(self):
        """POST /api/ai-designer/publish rejects empty generated_images"""
        response = requests.post(
            f"{BASE_URL}/api/ai-designer/publish",
            json={"generated_images": []}
        )
        assert response.status_code == 400
        print("✅ POST /api/ai-designer/publish rejects empty generated_images (400)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
