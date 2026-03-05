"""
TemaDom Iteration 23 - Pricing Updates & Video Instructions Tests
Tests:
1. EUR prices increased +15%: Starter 20, Pro 40, Premium 79 EUR
2. Pro plan has NO AI Designer (shows "Без AI Designer" in limitations)
3. Premium plan includes AI Designer up to 5 variants
4. Standalone services: PDF contract 6 EUR, AI blueprint 17 EUR
5. AI Designer standalone: 12 EUR/generation, bundles 29/45 EUR
6. All pages load correctly
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSubscriptionPlansAPI:
    """Test /api/subscriptions/plans endpoint for updated EUR pricing"""
    
    def test_subscriptions_plans_endpoint_returns_200(self):
        """Verify subscriptions plans endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/subscriptions/plans returns 200")
    
    def test_starter_plan_price_20_eur(self):
        """Verify Starter plan is 20 EUR/мес (+15% from 17 EUR)"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        starter = data["plans"]["company"]["starter"]
        assert starter["price"] == "20 EUR/мес", f"Expected '20 EUR/мес', got '{starter['price']}'"
        print("✅ Starter plan: 20 EUR/мес verified")
    
    def test_pro_plan_price_40_eur(self):
        """Verify Pro plan is 40 EUR/мес (+15% from 35 EUR)"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        pro = data["plans"]["company"]["pro"]
        assert pro["price"] == "40 EUR/мес", f"Expected '40 EUR/мес', got '{pro['price']}'"
        print("✅ Pro plan: 40 EUR/мес verified")
    
    def test_premium_plan_price_79_eur(self):
        """Verify Premium plan is 79 EUR/мес (+15% from 69 EUR)"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        premium = data["plans"]["company"]["premium"]
        assert premium["price"] == "79 EUR/мес", f"Expected '79 EUR/мес', got '{premium['price']}'"
        print("✅ Premium plan: 79 EUR/мес verified")


class TestProPlanAIDesignerRemoved:
    """Test that Pro plan does NOT have AI Designer (requirement #4)"""
    
    def test_pro_plan_has_no_ai_designer_limitation(self):
        """Verify Pro plan has 'Без AI Designer' in limitations"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        pro = data["plans"]["company"]["pro"]
        limitations = pro.get("limitations", [])
        assert "Без AI Designer" in limitations, f"Pro plan should have 'Без AI Designer' limitation. Got: {limitations}"
        print("✅ Pro plan correctly shows 'Без AI Designer' limitation")
    
    def test_pro_plan_features_do_not_include_ai_designer(self):
        """Verify Pro plan features do not include AI Designer"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        pro = data["plans"]["company"]["pro"]
        features = pro.get("features", [])
        for feature in features:
            assert "AI Designer" not in feature, f"Pro plan should NOT have AI Designer feature. Found: {feature}"
        print("✅ Pro plan features do NOT include AI Designer")


class TestPremiumPlanAIDesigner:
    """Test that Premium plan includes AI Designer with 5 variants"""
    
    def test_premium_includes_ai_designer_5_variants(self):
        """Verify Premium plan has AI Designer with up to 5 variants"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        premium = data["plans"]["company"]["premium"]
        features = premium.get("features", [])
        ai_designer_feature = None
        for feature in features:
            if "AI Designer" in feature and "5" in feature:
                ai_designer_feature = feature
                break
        assert ai_designer_feature is not None, f"Premium should include AI Designer with 5 variants. Features: {features}"
        print(f"✅ Premium plan includes AI Designer up to 5 variants: '{ai_designer_feature}'")
    
    def test_premium_has_no_limitations(self):
        """Verify Premium plan has no limitations (empty array)"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        premium = data["plans"]["company"]["premium"]
        limitations = premium.get("limitations", ["not_empty"])
        assert limitations == [], f"Premium plan should have no limitations. Got: {limitations}"
        print("✅ Premium plan has no limitations")


class TestStandaloneServices:
    """Test standalone services pricing: PDF contract 6 EUR, AI blueprint 17 EUR"""
    
    def test_pdf_contract_price_6_eur(self):
        """Verify PDF contract + количествена сметка is 6 EUR"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        pdf = data["plans"]["standalone"]["pdf_contract_calculator"]
        assert pdf["price"] == "6 EUR", f"Expected '6 EUR', got '{pdf['price']}'"
        print("✅ PDF contract standalone: 6 EUR verified")
    
    def test_ai_blueprint_price_17_eur(self):
        """Verify AI анализ на чертежи + PDF договор is 17 EUR"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        blueprint = data["plans"]["standalone"]["pdf_ai_blueprint"]
        assert blueprint["price"] == "17 EUR", f"Expected '17 EUR', got '{blueprint['price']}'"
        print("✅ AI blueprint standalone: 17 EUR verified")


class TestAIDesignerModule:
    """Test AI Designer standalone pricing: 12 EUR/generation, bundles 29/45 EUR"""
    
    def test_ai_designer_price_12_eur_per_generation(self):
        """Verify AI Designer is 12 EUR/генерация"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        designer = data["plans"]["designer"]["designer"]
        assert designer["price"] == "12 EUR/генерация", f"Expected '12 EUR/генерация', got '{designer['price']}'"
        print("✅ AI Designer standalone: 12 EUR/генерация verified")
    
    def test_ai_designer_bundle_3_variants_29_eur(self):
        """Verify AI Designer bundle: 3 variants = 29 EUR"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        designer = data["plans"]["designer"]["designer"]
        bundle_prices = designer.get("bundle_prices", {})
        assert bundle_prices.get("3_variants") == "29 EUR", f"Expected '29 EUR' for 3 variants, got '{bundle_prices}'"
        print("✅ AI Designer bundle 3 variants: 29 EUR verified")
    
    def test_ai_designer_bundle_5_variants_45_eur(self):
        """Verify AI Designer bundle: 5 variants = 45 EUR"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        designer = data["plans"]["designer"]["designer"]
        bundle_prices = designer.get("bundle_prices", {})
        assert bundle_prices.get("5_variants") == "45 EUR", f"Expected '45 EUR' for 5 variants, got '{bundle_prices}'"
        print("✅ AI Designer bundle 5 variants: 45 EUR verified")


class TestStarterPlanLimitations:
    """Test Starter plan limitations"""
    
    def test_starter_plan_has_expected_limitations(self):
        """Verify Starter plan has proper limitations"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        starter = data["plans"]["company"]["starter"]
        limitations = starter.get("limitations", [])
        # Check expected limitations
        expected_limitations = ["Ограничен брой проекти", "Без AI функции", "Без приоритетно показване"]
        for exp in expected_limitations:
            assert exp in limitations, f"Starter should have limitation '{exp}'. Got: {limitations}"
        print(f"✅ Starter plan limitations verified: {limitations}")


class TestPagesLoad:
    """Test all relevant pages load correctly"""
    
    def test_homepage_loads(self):
        """Verify homepage loads"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200, f"Homepage should return 200, got {response.status_code}"
        print("✅ Homepage loads (200)")
    
    def test_subscriptions_page_loads(self):
        """Verify subscriptions page loads"""
        response = requests.get(f"{BASE_URL}/subscriptions")
        # Frontend routes return HTML from React app
        assert response.status_code == 200, f"Subscriptions page should return 200, got {response.status_code}"
        print("✅ Subscriptions page loads (200)")
    
    def test_ai_designer_page_loads(self):
        """Verify AI Designer page loads"""
        response = requests.get(f"{BASE_URL}/ai-designer")
        assert response.status_code == 200, f"AI Designer page should return 200, got {response.status_code}"
        print("✅ AI Designer page loads (200)")
    
    def test_ai_sketch_page_loads(self):
        """Verify AI Sketch page loads"""
        response = requests.get(f"{BASE_URL}/ai-sketch")
        assert response.status_code == 200, f"AI Sketch page should return 200, got {response.status_code}"
        print("✅ AI Sketch page loads (200)")
    
    def test_ai_gallery_page_loads(self):
        """Verify AI Gallery page loads"""
        response = requests.get(f"{BASE_URL}/ai-gallery")
        assert response.status_code == 200, f"AI Gallery page should return 200, got {response.status_code}"
        print("✅ AI Gallery page loads (200)")
    
    def test_calculator_page_loads(self):
        """Verify Calculator page loads"""
        response = requests.get(f"{BASE_URL}/calculator")
        assert response.status_code == 200, f"Calculator page should return 200, got {response.status_code}"
        print("✅ Calculator page loads (200)")


class TestOtherEndpoints:
    """Test other API endpoints still work"""
    
    def test_api_stats(self):
        """Verify /api/stats returns valid data"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        print(f"✅ GET /api/stats returns valid data: {data}")
    
    def test_api_categories(self):
        """Verify /api/categories returns categories list"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ GET /api/categories returns {len(data['categories'])} categories")
    
    def test_api_ai_designer_published(self):
        """Verify /api/ai-designer/published returns 200"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/ai-designer/published returns 200")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
