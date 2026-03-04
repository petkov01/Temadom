"""
TemaDom Phase 3 Iteration 17 - Backend Tests
Testing: AI Designer, Feedback, Subscriptions, and new features
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicAPIs:
    """Test basic API endpoints"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API root: {data}")
    
    def test_stats(self):
        """Test stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        assert "total_reviews" in data
        print(f"✅ Stats: {data}")
    
    def test_categories(self):
        """Test categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) == 15
        print(f"✅ Categories: {len(data['categories'])} categories")


class TestFeedbackEndpoints:
    """Test /api/feedback POST and GET"""
    
    def test_submit_feedback_full(self):
        """Test submitting feedback with all fields"""
        response = requests.post(f"{BASE_URL}/api/feedback", json={
            "rating": 5,
            "text": "Отлична платформа за ремонти! - Test iteration 17",
            "name": "Тест Потребител"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ Feedback POST full: {data}")
    
    def test_submit_feedback_rating_only(self):
        """Test submitting feedback with only rating"""
        response = requests.post(f"{BASE_URL}/api/feedback", json={
            "rating": 4
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ Feedback POST rating only: {data}")
    
    def test_submit_feedback_no_name(self):
        """Test submitting feedback without name (should use Анонимен)"""
        response = requests.post(f"{BASE_URL}/api/feedback", json={
            "rating": 3,
            "text": "Test without name"
        })
        assert response.status_code == 200
        print(f"✅ Feedback POST without name: success")
    
    def test_get_feedback_list(self):
        """Test getting feedback list with average rating"""
        response = requests.get(f"{BASE_URL}/api/feedback")
        assert response.status_code == 200
        data = response.json()
        assert "feedback" in data
        assert "avg_rating" in data
        assert "total" in data
        assert isinstance(data["feedback"], list)
        print(f"✅ Feedback GET: total={data['total']}, avg_rating={data['avg_rating']}")


class TestSubscriptionPlansEndpoint:
    """Test /api/subscriptions/plans"""
    
    def test_get_subscription_plans(self):
        """Test getting subscription plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert "test_mode" in data
        
        plans = data["plans"]
        # Check company plans exist
        assert "company" in plans
        assert "basic" in plans["company"]
        assert "pro" in plans["company"]
        assert "premium" in plans["company"]
        
        # Check designer plan exists
        assert "designer" in plans
        assert "designer" in plans["designer"]
        
        # Verify plan structure
        basic = plans["company"]["basic"]
        assert "name" in basic
        assert "price" in basic
        assert "features" in basic
        assert basic["name"] == "Базов"
        
        pro = plans["company"]["pro"]
        assert pro["name"] == "Про"
        
        premium = plans["company"]["premium"]
        assert premium["name"] == "Премиум"
        
        designer = plans["designer"]["designer"]
        assert designer["name"] == "AI Дизайнер"
        assert "note" in designer
        
        print(f"✅ Subscription plans: company (basic/pro/premium), designer - test_mode={data['test_mode']}")


class TestAIDesignerEndpoints:
    """Test /api/ai-designer/ endpoints"""
    
    def test_ai_designer_generate_no_image(self):
        """Test generate endpoint without image (should fail)"""
        response = requests.post(f"{BASE_URL}/api/ai-designer/generate", json={
            "style": "modern",
            "material_class": "standard"
        })
        # Should return 400 because image is required
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✅ AI Designer generate without image correctly rejected: {data['detail']}")
    
    def test_ai_designer_gallery(self):
        """Test getting AI design gallery"""
        response = requests.get(f"{BASE_URL}/api/ai-designer/gallery")
        assert response.status_code == 200
        data = response.json()
        assert "designs" in data
        assert isinstance(data["designs"], list)
        print(f"✅ AI Designer gallery: {len(data['designs'])} designs")


class TestRegistrationWithUserTypes:
    """Test registration with all user types"""
    
    def test_register_client(self):
        """Test client registration"""
        unique_email = f"test_client_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "name": "Тест Клиент",
            "password": "test123456",
            "user_type": "client",
            "phone": "+359888111111",
            "city": "София"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "client"
        print(f"✅ Client registration: {unique_email}")
    
    def test_register_master(self):
        """Test master (individual) registration"""
        unique_email = f"test_master_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "name": "Майстор Иванов",
            "password": "test123456",
            "user_type": "master",
            "phone": "+359888222222",
            "city": "Пловдив"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["user_type"] == "master"
        print(f"✅ Master registration: {unique_email}")
    
    def test_register_company_without_bulstat_fails(self):
        """Test company registration without bulstat (should fail)"""
        unique_email = f"test_company_nobulstat_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "name": "Фирма ООД",
            "password": "test123456",
            "user_type": "company",
            "phone": "+359888333333",
            "city": "Варна"
        })
        assert response.status_code == 400
        data = response.json()
        assert "bulstat" in data["detail"].lower() or "булстат" in data["detail"].lower()
        print(f"✅ Company without bulstat correctly rejected: {data['detail']}")
    
    def test_register_company_with_bulstat(self):
        """Test company registration with valid bulstat"""
        unique_email = f"test_company_{uuid.uuid4().hex[:8]}@test.com"
        unique_bulstat = str(100000000 + int(uuid.uuid4().hex[:7], 16) % 899999999)[:9]
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "name": "Строителна Фирма ЕООД",
            "password": "test123456",
            "user_type": "company",
            "phone": "+359888444444",
            "city": "Бургас",
            "bulstat": unique_bulstat
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["user_type"] == "company"
        print(f"✅ Company with bulstat registration: {unique_email}, bulstat={unique_bulstat}")
    
    def test_register_designer(self):
        """Test designer registration"""
        unique_email = f"test_designer_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "name": "Дизайнер Дизайнеров",
            "password": "test123456",
            "user_type": "designer",
            "phone": "+359888555555",
            "city": "Русе"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["user_type"] == "designer"
        print(f"✅ Designer registration: {unique_email}")


class TestDemoDataAndCompanies:
    """Test demo data and companies endpoints"""
    
    def test_demo_projects(self):
        """Test demo projects endpoint"""
        response = requests.get(f"{BASE_URL}/api/demo-projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        print(f"✅ Demo projects: {len(data['projects'])} projects")
    
    def test_top_companies(self):
        """Test top companies endpoint"""
        response = requests.get(f"{BASE_URL}/api/top-companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        print(f"✅ Top companies: {len(data['companies'])} companies")
    
    def test_companies_list(self):
        """Test companies list endpoint"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert "total" in data
        print(f"✅ Companies list: {data['total']} companies")
    
    def test_projects_list(self):
        """Test projects list endpoint"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert "total" in data
        print(f"✅ Projects list: {data['total']} projects")


class TestAdsEndpoint:
    """Test /api/ads endpoint"""
    
    def test_ads_list(self):
        """Test getting ads list"""
        response = requests.get(f"{BASE_URL}/api/ads")
        assert response.status_code == 200
        data = response.json()
        assert "ads" in data
        print(f"✅ Ads list: {len(data['ads'])} ads")


class TestAIDesignStatus:
    """Test /api/ai-design/status endpoint"""
    
    def test_ai_design_status(self):
        """Test AI design status (free uses)"""
        response = requests.get(f"{BASE_URL}/api/ai-design/status")
        assert response.status_code == 200
        data = response.json()
        assert "global_free_remaining" in data
        assert "global_limit" in data
        assert "test_mode" in data
        print(f"✅ AI Design status: {data['global_free_remaining']}/{data['global_limit']} free, test_mode={data['test_mode']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
