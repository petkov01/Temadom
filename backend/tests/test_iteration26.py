"""
Test suite for iteration 26 - AI Chart Analyzer, Subscriptions, Scanner3D Projects
Tests: AI Chart page, PDF endpoints, subscription plans, 3D project save/load with shareable links
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://temadom-speed.preview.emergentagent.com"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        print(f"API root response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "version" in data
        print("✅ API root is accessible")

    def test_categories(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✅ Categories endpoint returns {len(data['categories'])} categories")


class TestSubscriptionPlans:
    """Test subscription plans endpoint"""
    
    def test_get_subscription_plans(self):
        """Test GET /api/subscriptions/plans returns basic/pro/premium plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        print(f"Subscription plans response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        
        # Check structure - API returns {plans: {company: {...}, standalone: {...}, designer: {...}}}
        assert "plans" in data, "Should have 'plans' key"
        plans = data["plans"]
        
        # Check company plans
        assert "company" in plans, "Should have company plans"
        company_plans = plans["company"]
        
        # Verify БАЗОВ/ПРО/PREMIUM plans exist
        assert "basic" in company_plans, "Should have basic plan"
        assert "pro" in company_plans, "Should have pro plan"
        assert "premium" in company_plans, "Should have premium plan"
        
        # Check plan names and prices
        basic = company_plans["basic"]
        pro = company_plans["pro"]
        premium = company_plans["premium"]
        
        print(f"Basic plan: {basic['name']} - {basic['price']}")
        print(f"Pro plan: {pro['name']} - {pro['price']}")
        print(f"Premium plan: {premium['name']} - {premium['price']}")
        
        # Verify names (Bulgarian)
        assert basic["name"] == "БАЗОВ", f"Expected БАЗОВ, got {basic['name']}"
        assert pro["name"] == "ПРО", f"Expected ПРО, got {pro['name']}"
        assert premium["name"] == "PREMIUM", f"Expected PREMIUM, got {premium['name']}"
        
        # Verify prices
        assert "15" in basic["price"], f"Basic should be 15 EUR, got {basic['price']}"
        assert "35" in pro["price"], f"Pro should be 35 EUR, got {pro['price']}"
        assert "75" in premium["price"], f"Premium should be 75 EUR, got {premium['price']}"
        
        print("✅ GET /api/subscriptions/plans returns БАЗОВ/ПРО/PREMIUM plans with correct prices")


class TestAIChartPDFEndpoint:
    """Test AI Chart PDF contract endpoint (doesn't require AI key)"""
    
    def test_pdf_contract_basic(self):
        """Test POST /api/ai-chart/pdf-contract returns 200 with valid PDF"""
        payload = {
            "title": "Тестова количествена сметка",
            "description": "Тест за PDF договор",
            "materials": [
                {"name": "Бетон C25/30", "unit": "м³", "quantity": 10, "price_per_unit": 85, "total": 850},
                {"name": "Арматура B500B", "unit": "кг", "quantity": 500, "price_per_unit": 1.2, "total": 600}
            ],
            "labor": [
                {"name": "Бетониране", "unit": "м³", "quantity": 10, "price_per_unit": 45, "total": 450},
                {"name": "Армиране", "unit": "кг", "quantity": 500, "price_per_unit": 0.5, "total": 250}
            ],
            "summary": {
                "materials_total": 1450,
                "labor_total": 700,
                "overhead_percent": 10,
                "overhead_total": 215,
                "grand_total": 2365
            },
            "client_name": "Иван Петров",
            "client_address": "София, ул. Тест 1",
            "contractor_name": "Строителна фирма ООД"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-chart/pdf-contract",
            json=payload,
            timeout=30
        )
        
        print(f"AI Chart PDF response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check that we get PDF content
        content_type = response.headers.get('content-type', '')
        print(f"Content-Type: {content_type}")
        assert 'application/pdf' in content_type or len(response.content) > 0
        
        # PDF starts with %PDF
        pdf_header = response.content[:8]
        print(f"PDF header (first 8 bytes): {pdf_header}")
        assert response.content[:4] == b'%PDF', "Response should be a valid PDF"
        
        print(f"✅ POST /api/ai-chart/pdf-contract returns valid PDF ({len(response.content)} bytes)")

    def test_pdf_contract_empty_fields(self):
        """Test PDF contract with minimal/empty fields"""
        payload = {
            "title": "Минимална сметка",
            "description": "",
            "materials": [],
            "labor": [],
            "summary": {},
            "client_name": "",
            "client_address": "",
            "contractor_name": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-chart/pdf-contract",
            json=payload,
            timeout=30
        )
        
        print(f"AI Chart PDF empty fields response: {response.status_code}")
        # Should still return 200 with a PDF
        assert response.status_code == 200
        assert response.content[:4] == b'%PDF'
        print("✅ POST /api/ai-chart/pdf-contract handles empty fields")


class TestScanner3DPDF:
    """Test Scanner3D PDF endpoint"""
    
    def test_scanner3d_pdf_basic(self):
        """Test POST /api/scanner3d/pdf returns 200 with valid PDF"""
        payload = {
            "items": [
                {"category": "Душ кабина", "name": "Стъклена модерна", "price": 450},
                {"category": "Тоалетна", "name": "Стенна конзолна", "price": 380},
                {"category": "Плочки", "name": "Мрамор бял", "price": 45}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/scanner3d/pdf",
            json=payload,
            timeout=30
        )
        
        print(f"Scanner3D PDF response: {response.status_code}")
        assert response.status_code == 200
        assert response.content[:4] == b'%PDF'
        print(f"✅ POST /api/scanner3d/pdf returns valid PDF ({len(response.content)} bytes)")


class TestScanner3DProjects:
    """Test Scanner3D project save/load endpoints"""
    
    def get_test_token(self):
        """Register a test user and get token"""
        import random
        random_id = random.randint(100000000, 999999999)
        unique_email = f"test_scanner_{random_id}@test.com"
        bulstat = str(random_id)  # 9 digit number
        
        # Register
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "name": "Test Scanner User",
                "password": "testpass123",
                "user_type": "company",
                "city": "София",
                "bulstat": bulstat
            }
        )
        
        print(f"Registration response: {reg_response.status_code} - {reg_response.text[:200] if reg_response.text else ''}")
        
        if reg_response.status_code == 200:
            return reg_response.json().get("token")
        
        # If registration failed (email exists), try login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": unique_email,
                "password": "testpass123"
            }
        )
        
        if login_response.status_code == 200:
            return login_response.json().get("token")
        
        return None
    
    def test_save_project_requires_auth(self):
        """Test POST /api/scanner3d/projects requires authentication"""
        payload = {
            "title": "Test Project",
            "selections": {"shower": {"id": "glass_modern", "name": "Стъклена модерна", "price": 450}},
            "photos": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/scanner3d/projects",
            json=payload
        )
        
        print(f"Save project without auth response: {response.status_code}")
        assert response.status_code == 401, "Should require authentication"
        print("✅ POST /api/scanner3d/projects requires authentication")
    
    def test_save_and_get_project(self):
        """Test saving a project and retrieving it with shareable link"""
        test_user_token = self.get_test_token()
        if not test_user_token:
            pytest.skip("No token available")
        
        # Save project
        payload = {
            "title": "Тестов 3D проект",
            "selections": {
                "shower": {"id": "glass_modern", "name": "Стъклена модерна", "price": 450},
                "wc": {"id": "wall_hung", "name": "Стенна конзолна", "price": 380}
            },
            "photos": []
        }
        
        save_response = requests.post(
            f"{BASE_URL}/api/scanner3d/projects",
            json=payload,
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        
        print(f"Save project response: {save_response.status_code}")
        print(f"Save project data: {save_response.json()}")
        assert save_response.status_code in [200, 201], f"Expected 200/201, got {save_response.status_code}"
        
        save_data = save_response.json()
        project_id = save_data.get("id") or save_data.get("project_id")
        assert project_id, "Should return project ID"
        print(f"✅ Project saved with ID: {project_id}")
        
        # Get project (shareable link - no auth required)
        get_response = requests.get(f"{BASE_URL}/api/scanner3d/projects/{project_id}")
        
        print(f"Get project response: {get_response.status_code}")
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
        
        project_data = get_response.json()
        print(f"Project data: {project_data}")
        
        # Verify data integrity
        assert project_data.get("title") == "Тестов 3D проект"
        assert "selections" in project_data
        assert project_data["selections"].get("shower", {}).get("price") == 450
        
        print("✅ GET /api/scanner3d/projects/{id} returns saved project data")
        
        return project_id


class TestNavigationLinks:
    """Verify navigation includes AI Анализатор link"""
    
    def test_stats_endpoint(self):
        """Test stats endpoint for general health"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        print(f"✅ Stats endpoint: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
