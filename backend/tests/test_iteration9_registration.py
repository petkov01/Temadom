"""
Iteration 9 Tests: 3-Tab Registration (Клиент/Фирма/Майстор) with Булстат Validation

Features tested:
1. Registration has 3 tabs: Клиент, Фирма, Майстор
2. Фирма tab shows mandatory 'Булстат (ЕИК)' field with 9-digit validation
3. Майстор tab shows 'Име на майстор' placeholder and Telegram info box, but NO Булстат field
4. Клиент tab does NOT show Булстат or Telegram fields
5. API rejects company registration without Булстат
6. API rejects company registration with non-9-digit Булстат  
7. API accepts company registration with valid 9-digit Булстат
8. API accepts master registration without Булстат
9. Master user can access /api/my-company, /api/my-leads, /api/my-portfolio
10. Master user can login and gets redirected to /dashboard
11. /api/auth/me returns bulstat field for company users
12. Company dashboard accessible by both company and master user types
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Generate unique test identifiers
TEST_ID = str(uuid.uuid4())[:8]
TEST_COMPANY_EMAIL = f"test_company_{TEST_ID}@test.bg"
TEST_MASTER_EMAIL = f"test_master_{TEST_ID}@test.bg"
TEST_CLIENT_EMAIL = f"test_client_{TEST_ID}@test.bg"
TEST_PASSWORD = "test12345"
# Use unique bulstat based on test ID to avoid duplicates (9 digits only)
import time
VALID_BULSTAT = f"9{int(time.time()) % 100000000:08d}"  # 9 digits, unique per test run


class TestCompanyRegistrationBulstat:
    """Test company registration with Булстат validation"""
    
    def test_reject_company_without_bulstat(self):
        """API should reject company registration without Булстат"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"no_bulstat_{TEST_ID}@test.bg",
            "name": "Тест Фирма без Булстат",
            "password": TEST_PASSWORD,
            "user_type": "company",
            "phone": "+359888123456"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        # Check that message mentions "булстат" (case-insensitive)
        assert "булстат" in data["detail"].lower(), f"Expected 'булстат' in error message, got: {data['detail']}"
        print(f"✅ Company registration without Булстат correctly rejected: {data['detail']}")
    
    def test_reject_company_with_empty_bulstat(self):
        """API should reject company registration with empty Булстат"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"empty_bulstat_{TEST_ID}@test.bg",
            "name": "Тест Фирма празен Булстат",
            "password": TEST_PASSWORD,
            "user_type": "company",
            "phone": "+359888123456",
            "bulstat": ""
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✅ Company registration with empty Булстат correctly rejected: {data['detail']}")
    
    def test_reject_company_with_short_bulstat(self):
        """API should reject company registration with less than 9 digits"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"short_bulstat_{TEST_ID}@test.bg",
            "name": "Тест Фирма къс Булстат",
            "password": TEST_PASSWORD,
            "user_type": "company",
            "phone": "+359888123456",
            "bulstat": "12345678"  # Only 8 digits
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "9" in data["detail"]  # Should mention 9 digits
        print(f"✅ Company registration with 8-digit Булстат correctly rejected: {data['detail']}")
    
    def test_reject_company_with_long_bulstat(self):
        """API should reject company registration with more than 9 digits"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"long_bulstat_{TEST_ID}@test.bg",
            "name": "Тест Фирма дълъг Булстат",
            "password": TEST_PASSWORD,
            "user_type": "company",
            "phone": "+359888123456",
            "bulstat": "1234567890"  # 10 digits
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "9" in data["detail"]  # Should mention 9 digits
        print(f"✅ Company registration with 10-digit Булстат correctly rejected: {data['detail']}")
    
    def test_reject_company_with_nonnumeric_bulstat(self):
        """API should reject company registration with non-numeric Булстат"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"alpha_bulstat_{TEST_ID}@test.bg",
            "name": "Тест Фирма буквен Булстат",
            "password": TEST_PASSWORD,
            "user_type": "company",
            "phone": "+359888123456",
            "bulstat": "12345678A"  # Contains letter
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✅ Company registration with non-numeric Булстат correctly rejected: {data['detail']}")
    
    def test_accept_company_with_valid_bulstat(self):
        """API should accept company registration with valid 9-digit Булстат"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_COMPANY_EMAIL,
            "name": "Тест Строителна Фирма ЕООД",
            "password": TEST_PASSWORD,
            "user_type": "company",
            "phone": "+359888123456",
            "city": "София",
            "bulstat": VALID_BULSTAT
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "company"
        print(f"✅ Company registration with valid 9-digit Булстат accepted: {data['user']['email']}")
        return data["token"]


class TestMasterRegistrationNoBulstat:
    """Test master registration (no Булстат required)"""
    
    def test_accept_master_without_bulstat(self):
        """API should accept master registration without Булстат"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_MASTER_EMAIL,
            "name": "Иван Иванов - Електротехник",
            "password": TEST_PASSWORD,
            "user_type": "master",
            "phone": "+359888654321",
            "city": "Пловдив",
            "telegram_username": "@ivan_elektro"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "master"
        print(f"✅ Master registration without Булстат accepted: {data['user']['email']}")
        return data["token"]
    
    def test_master_ignores_bulstat_if_provided(self):
        """API should accept master registration and ignore Булстат even if provided"""
        extra_id = str(uuid.uuid4())[:8]
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"master_with_bulstat_{extra_id}@test.bg",
            "name": "Петър Петров - Водопроводчик",
            "password": TEST_PASSWORD,
            "user_type": "master",
            "phone": "+359888111222",
            "bulstat": "999888777"  # Should be ignored for masters
        })
        
        # Should succeed because bulstat is optional/ignored for masters
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        print(f"✅ Master registration accepted (Булстат ignored): {data['user']['email']}")


class TestClientRegistrationNoBulstat:
    """Test client registration (no Булстат at all)"""
    
    def test_accept_client_without_bulstat(self):
        """API should accept client registration without Булстат"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_CLIENT_EMAIL,
            "name": "Мария Маркова",
            "password": TEST_PASSWORD,
            "user_type": "client",
            "phone": "+359888999888",
            "city": "Варна"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "client"
        print(f"✅ Client registration accepted: {data['user']['email']}")


class TestMasterAccess:
    """Test that masters have same access as companies"""
    
    @pytest.fixture(scope="class")
    def master_token(self):
        """Get token for master user"""
        # First try login with existing test master
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "master@test.bg",
            "password": "test12345"
        })
        if login_resp.status_code == 200:
            return login_resp.json()["token"]
        
        # Otherwise create new master
        register_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"master_access_{TEST_ID}@test.bg",
            "name": "Тест Майстор Достъп",
            "password": TEST_PASSWORD,
            "user_type": "master",
            "city": "Бургас"
        })
        if register_resp.status_code == 200:
            return register_resp.json()["token"]
        pytest.skip("Cannot create master user for access tests")
    
    def test_master_can_access_my_company(self, master_token):
        """Master user should access /api/my-company endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/my-company",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        # Should return 200 or 404 (if no profile), but NOT 403
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"
        print(f"✅ Master can access /api/my-company (status: {response.status_code})")
    
    def test_master_can_access_my_leads(self, master_token):
        """Master user should access /api/my-leads endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/my-leads",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "leads" in data
        print(f"✅ Master can access /api/my-leads")
    
    def test_master_can_access_my_portfolio(self, master_token):
        """Master user should access /api/my-portfolio endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/my-portfolio",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"
        print(f"✅ Master can access /api/my-portfolio (status: {response.status_code})")
    
    def test_master_can_access_free_leads_status(self, master_token):
        """Master user should access /api/leads/free-status endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/leads/free-status",
            headers={"Authorization": f"Bearer {master_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "free_leads_remaining" in data
        print(f"✅ Master can access /api/leads/free-status")


class TestAuthMeReturnsBulstat:
    """Test /api/auth/me returns bulstat for company users"""
    
    def test_auth_me_returns_bulstat_for_company(self):
        """Login as company and check /auth/me returns bulstat field"""
        # Login with existing test company
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "stroi@test.bg",
            "password": "test12345"
        })
        
        if login_resp.status_code != 200:
            # Try creating a new company
            register_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": f"auth_me_test_{TEST_ID}@test.bg",
                "name": "Тест АутМе Фирма",
                "password": TEST_PASSWORD,
                "user_type": "company",
                "bulstat": "987654321"
            })
            if register_resp.status_code != 200:
                pytest.skip("Cannot login or create company for auth/me test")
            token = register_resp.json()["token"]
        else:
            token = login_resp.json()["token"]
        
        # Call /auth/me
        me_resp = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert me_resp.status_code == 200
        data = me_resp.json()
        
        # Check bulstat field exists in response
        assert "bulstat" in data, f"bulstat field not found in /auth/me response: {data}"
        print(f"✅ /api/auth/me returns bulstat field: {data.get('bulstat')}")


class TestDuplicateBulstat:
    """Test that duplicate Булстат is rejected"""
    
    def test_reject_duplicate_bulstat(self):
        """API should reject registration with already-used Булстат"""
        unique_bulstat = f"555{TEST_ID[:6]}"[:9].ljust(9, '0')
        
        # First registration
        first_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"first_dup_{TEST_ID}@test.bg",
            "name": "Първа Фирма",
            "password": TEST_PASSWORD,
            "user_type": "company",
            "bulstat": unique_bulstat
        })
        
        if first_resp.status_code != 200:
            pytest.skip(f"Cannot create first company: {first_resp.text}")
        
        # Second registration with same bulstat
        second_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"second_dup_{TEST_ID}@test.bg",
            "name": "Втора Фирма",
            "password": TEST_PASSWORD,
            "user_type": "company",
            "bulstat": unique_bulstat  # Same bulstat
        })
        
        assert second_resp.status_code == 400, f"Expected 400 for duplicate bulstat, got {second_resp.status_code}"
        data = second_resp.json()
        assert "detail" in data
        print(f"✅ Duplicate Булстат correctly rejected: {data['detail']}")


class TestExistingUserLogin:
    """Test login with provided test credentials"""
    
    def test_company_login(self):
        """Test login as company user stroi@test.bg"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "stroi@test.bg",
            "password": "test12345"
        })
        
        if response.status_code != 200:
            print(f"⚠️ Company login failed (user may not exist): {response.status_code}")
            pytest.skip("Company test user doesn't exist")
        
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "company"
        print(f"✅ Company user stroi@test.bg logged in successfully")
    
    def test_master_login(self):
        """Test login as master user master@test.bg"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "master@test.bg",
            "password": "test12345"
        })
        
        if response.status_code != 200:
            print(f"⚠️ Master login failed (user may not exist): {response.status_code}")
            pytest.skip("Master test user doesn't exist")
        
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "master"
        print(f"✅ Master user master@test.bg logged in successfully")
    
    def test_client_login(self):
        """Test login as client user ivan_client@test.bg"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ivan_client@test.bg",
            "password": "test12345"
        })
        
        if response.status_code != 200:
            print(f"⚠️ Client login failed (user may not exist): {response.status_code}")
            pytest.skip("Client test user doesn't exist")
        
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "client"
        print(f"✅ Client user ivan_client@test.bg logged in successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
