"""
TemaDom Iteration 22 Tests - Homepage Redesign & EUR Pricing
Tests:
1. Homepage hero text "Вашият строителен проект без непредвидени разходи"
2. "Защо TemaDom?" section with 3 cards
3. "Топ функции" section with AI Дизайнер, AI Sketch, Калкулатор+PDF, AI Галерия
4. Feature buttons navigation to correct pages
5. EUR pricing: Starter 17, Pro 35, Premium 69
6. Standalone services: 5 EUR and 15 EUR
7. "Как работи?" section with 4 steps
8. Navbar without "Дизайнери" link
9. GET /api/subscriptions/plans returns EUR prices
10. Subscriptions page shows EUR pricing + standalone services
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://sketch-to-3d-16.preview.emergentagent.com')

class TestBackendEURPricing:
    """Test backend API returns correct EUR pricing"""
    
    def test_subscriptions_plans_endpoint_returns_200(self):
        """GET /api/subscriptions/plans returns 200"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ GET /api/subscriptions/plans returns 200")
    
    def test_starter_price_17_eur(self):
        """Starter plan shows 17 EUR/мес"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        starter = data['plans']['company']['starter']
        assert "17 EUR" in starter['price'], f"Expected '17 EUR' in price, got {starter['price']}"
        print(f"✅ Starter price: {starter['price']}")
    
    def test_pro_price_35_eur(self):
        """Pro plan shows 35 EUR/мес"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        pro = data['plans']['company']['pro']
        assert "35 EUR" in pro['price'], f"Expected '35 EUR' in price, got {pro['price']}"
        print(f"✅ Pro price: {pro['price']}")
    
    def test_premium_price_69_eur(self):
        """Premium plan shows 69 EUR/мес"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        premium = data['plans']['company']['premium']
        assert "69 EUR" in premium['price'], f"Expected '69 EUR' in price, got {premium['price']}"
        print(f"✅ Premium price: {premium['price']}")
    
    def test_standalone_pdf_contract_5_eur(self):
        """Standalone PDF contract is 5 EUR"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        pdf_contract = data['plans']['standalone']['pdf_contract_calculator']
        assert "5 EUR" in pdf_contract['price'], f"Expected '5 EUR' in price, got {pdf_contract['price']}"
        print(f"✅ PDF contract price: {pdf_contract['price']}")
    
    def test_standalone_ai_blueprint_15_eur(self):
        """Standalone AI blueprint is 15 EUR"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        ai_blueprint = data['plans']['standalone']['pdf_ai_blueprint']
        assert "15 EUR" in ai_blueprint['price'], f"Expected '15 EUR' in price, got {ai_blueprint['price']}"
        print(f"✅ AI blueprint price: {ai_blueprint['price']}")
    
    def test_ai_designer_10_eur_per_gen(self):
        """AI Designer module shows 10 EUR/генерация"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        designer = data['plans']['designer']['designer']
        assert "10 EUR" in designer['price'], f"Expected '10 EUR' in price, got {designer['price']}"
        print(f"✅ AI Designer price: {designer['price']}")
    
    def test_ai_designer_bundle_prices(self):
        """AI Designer bundle prices: 3 variants = 25 EUR, 5 variants = 39 EUR"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        designer = data['plans']['designer']['designer']
        bundles = designer.get('bundle_prices', {})
        assert bundles.get('3_variants') == "25 EUR", f"Expected '25 EUR' for 3 variants, got {bundles.get('3_variants')}"
        assert bundles.get('5_variants') == "39 EUR", f"Expected '39 EUR' for 5 variants, got {bundles.get('5_variants')}"
        print(f"✅ AI Designer bundles: 3 variants = {bundles.get('3_variants')}, 5 variants = {bundles.get('5_variants')}")
    
    def test_starter_has_limitations(self):
        """Starter plan has limitations (Ограничен, Без AI)"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        starter = data['plans']['company']['starter']
        limitations = starter.get('limitations', [])
        assert len(limitations) > 0, "Starter should have limitations"
        assert any("Ограничен" in lim for lim in limitations), "Starter should have 'Ограничен' limitation"
        assert any("Без AI" in lim for lim in limitations), "Starter should have 'Без AI' limitation"
        print(f"✅ Starter limitations: {limitations}")
    
    def test_pro_has_ai_designer_1_variant_limitation(self):
        """Pro plan has AI Designer 1 variant limitation"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        pro = data['plans']['company']['pro']
        limitations = pro.get('limitations', [])
        assert any("1 вариант" in lim for lim in limitations), f"Pro should have '1 вариант' limitation, got {limitations}"
        print(f"✅ Pro limitations: {limitations}")


class TestPagesLoad:
    """Test that all pages load correctly"""
    
    def test_homepage_loads(self):
        """Homepage returns 200"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ Homepage loads (200)")
    
    def test_ai_designer_page_loads(self):
        """AI Designer page at /ai-designer loads"""
        response = requests.get(f"{BASE_URL}/ai-designer")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ AI Designer page loads (200)")
    
    def test_ai_sketch_page_loads(self):
        """AI Sketch page at /ai-sketch loads"""
        response = requests.get(f"{BASE_URL}/ai-sketch")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ AI Sketch page loads (200)")
    
    def test_ai_gallery_page_loads(self):
        """AI Gallery page at /ai-gallery loads"""
        response = requests.get(f"{BASE_URL}/ai-gallery")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ AI Gallery page loads (200)")
    
    def test_calculator_page_loads(self):
        """Calculator page at /calculator loads"""
        response = requests.get(f"{BASE_URL}/calculator")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ Calculator page loads (200)")
    
    def test_subscriptions_page_loads(self):
        """Subscriptions page at /subscriptions loads"""
        response = requests.get(f"{BASE_URL}/subscriptions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ Subscriptions page loads (200)")


class TestAPIEndpoints:
    """Test other API endpoints"""
    
    def test_stats_endpoint(self):
        """GET /api/stats returns valid data"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert 'total_projects' in data
        assert 'total_companies' in data
        print(f"✅ Stats: {data['total_companies']} companies, {data['total_projects']} projects")
    
    def test_categories_endpoint(self):
        """GET /api/categories returns categories list"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert 'categories' in data
        assert len(data['categories']) > 0
        print(f"✅ Categories: {len(data['categories'])} categories")
    
    def test_ai_designer_published_endpoint(self):
        """GET /api/ai-designer/published returns 200"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/published")
        assert response.status_code == 200
        print("✅ AI Gallery API returns 200")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
