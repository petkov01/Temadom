"""
Iteration 55: P1 Features Testing
Tests for:
1. Referrals API (GET /api/referrals/status, POST /api/referrals/apply)
2. FB Pixel presence check (index.html)
3. Share buttons data-testids in ProductSearchPage
4. Download/Fullscreen buttons data-testids in AIDesignerPage
5. Profile page 4 tabs structure
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ui-polish-52.preview.emergentagent.com').rstrip('/')

# ===== Auth Fixtures =====

@pytest.fixture(scope="module")
def test_users():
    """Create two test users for referral testing"""
    timestamp = int(time.time())
    user1_email = f"reftest1_{timestamp}@test.bg"
    user2_email = f"reftest2_{timestamp}@test.bg"
    password = "Test123!"
    
    users = {}
    
    # Register user 1
    resp1 = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": f"Test User 1 {timestamp}",
        "email": user1_email,
        "password": password,
        "user_type": "client",
        "region": "София"
    })
    if resp1.status_code == 201 or resp1.status_code == 200:
        data = resp1.json()
        users["user1"] = {
            "token": data["token"],
            "id": data["user"]["id"],
            "email": user1_email
        }
    else:
        # User may already exist, try login
        login1 = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": user1_email,
            "password": password
        })
        if login1.status_code == 200:
            data = login1.json()
            users["user1"] = {
                "token": data["token"],
                "id": data["user"]["id"],
                "email": user1_email
            }
    
    # Register user 2
    resp2 = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": f"Test User 2 {timestamp}",
        "email": user2_email,
        "password": password,
        "user_type": "client",
        "region": "Пловдив"
    })
    if resp2.status_code == 201 or resp2.status_code == 200:
        data = resp2.json()
        users["user2"] = {
            "token": data["token"],
            "id": data["user"]["id"],
            "email": user2_email
        }
    else:
        # User may already exist, try login  
        login2 = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": user2_email,
            "password": password
        })
        if login2.status_code == 200:
            data = login2.json()
            users["user2"] = {
                "token": data["token"],
                "id": data["user"]["id"],
                "email": user2_email
            }
    
    return users


class TestAPIBasics:
    """Basic API health checks"""
    
    def test_api_root_accessible(self):
        """Test that API root is accessible"""
        resp = requests.get(f"{BASE_URL}/api/")
        assert resp.status_code == 200, f"API root not accessible: {resp.status_code}"
        print("✅ API root accessible")


class TestReferralsAPI:
    """Test referrals endpoints"""
    
    def test_referrals_status_requires_auth(self):
        """GET /api/referrals/status requires authentication"""
        resp = requests.get(f"{BASE_URL}/api/referrals/status")
        assert resp.status_code == 401 or resp.status_code == 403, f"Expected 401/403 without auth, got {resp.status_code}"
        print("✅ GET /api/referrals/status requires auth (401/403)")
    
    def test_referrals_status_returns_correct_structure(self, test_users):
        """GET /api/referrals/status returns proper structure"""
        if "user1" not in test_users:
            pytest.skip("User1 not created")
        
        headers = {"Authorization": f"Bearer {test_users['user1']['token']}"}
        resp = requests.get(f"{BASE_URL}/api/referrals/status", headers=headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        
        data = resp.json()
        # Check required fields
        assert "referral_code" in data, "Missing referral_code"
        assert "referral_count" in data, "Missing referral_count"
        assert "total_reward_eur" in data, "Missing total_reward_eur"
        assert "rewards_table" in data, "Missing rewards_table"
        
        # Validate referral_code format (first 8 chars of user ID, uppercase)
        expected_code = test_users["user1"]["id"][:8].upper()
        assert data["referral_code"] == expected_code, f"Expected code {expected_code}, got {data['referral_code']}"
        
        # Validate rewards_table structure
        assert len(data["rewards_table"]) >= 4, "Expected at least 4 reward milestones"
        for reward in data["rewards_table"]:
            assert "count" in reward, "Missing count in reward"
            assert "reward" in reward, "Missing reward text"
            assert "unlocked" in reward, "Missing unlocked status"
        
        print(f"✅ GET /api/referrals/status returns correct structure: {data['referral_code']}")
    
    def test_referrals_apply_requires_auth(self):
        """POST /api/referrals/apply requires authentication"""
        resp = requests.post(f"{BASE_URL}/api/referrals/apply", json={"code": "TESTCODE"})
        assert resp.status_code == 401 or resp.status_code == 403, f"Expected 401/403 without auth, got {resp.status_code}"
        print("✅ POST /api/referrals/apply requires auth (401/403)")
    
    def test_referrals_apply_rejects_empty_code(self, test_users):
        """POST /api/referrals/apply rejects empty/short code with 400"""
        if "user2" not in test_users:
            pytest.skip("User2 not created")
        
        headers = {"Authorization": f"Bearer {test_users['user2']['token']}"}
        
        # Test empty code
        resp = requests.post(f"{BASE_URL}/api/referrals/apply", json={"code": ""}, headers=headers)
        assert resp.status_code == 400, f"Expected 400 for empty code, got {resp.status_code}"
        
        # Test short code
        resp2 = requests.post(f"{BASE_URL}/api/referrals/apply", json={"code": "ABC"}, headers=headers)
        assert resp2.status_code == 400, f"Expected 400 for short code, got {resp2.status_code}"
        
        print("✅ POST /api/referrals/apply rejects empty/short code (400)")
    
    def test_referrals_apply_rejects_self_referral(self, test_users):
        """POST /api/referrals/apply rejects self-referral"""
        if "user1" not in test_users:
            pytest.skip("User1 not created")
        
        headers = {"Authorization": f"Bearer {test_users['user1']['token']}"}
        own_code = test_users["user1"]["id"][:8].upper()
        
        resp = requests.post(f"{BASE_URL}/api/referrals/apply", json={"code": own_code}, headers=headers)
        # Should reject with 400 (can't use own code)
        assert resp.status_code == 400, f"Expected 400 for self-referral, got {resp.status_code}: {resp.text}"
        
        print("✅ POST /api/referrals/apply rejects self-referral (400)")
    
    def test_referrals_apply_rejects_invalid_code(self, test_users):
        """POST /api/referrals/apply rejects invalid/non-existent code"""
        if "user2" not in test_users:
            pytest.skip("User2 not created")
        
        headers = {"Authorization": f"Bearer {test_users['user2']['token']}"}
        
        # Use a code that doesn't exist
        resp = requests.post(f"{BASE_URL}/api/referrals/apply", json={"code": "ZZZZZZZZ"}, headers=headers)
        # Should reject with 404 (code not found)
        assert resp.status_code == 404, f"Expected 404 for invalid code, got {resp.status_code}: {resp.text}"
        
        print("✅ POST /api/referrals/apply rejects invalid code (404)")


class TestFBPixelPresence:
    """Test FB Pixel script in index.html"""
    
    def test_fb_pixel_script_in_index_html(self):
        """Check FB Pixel script is present in index.html"""
        # Read the index.html file directly
        index_path = "/app/frontend/public/index.html"
        try:
            with open(index_path, "r") as f:
                content = f.read()
            
            # Check for FB Pixel markers
            assert "fbq('init'" in content or "fbq('init'," in content or 'fbq("init"' in content, "FB Pixel fbq init not found"
            assert "fbq('track', 'PageView')" in content or 'fbq("track", "PageView")' in content, "FB Pixel PageView track not found"
            assert "connect.facebook.net" in content, "Facebook script source not found"
            assert "PLACEHOLDER_FB_PIXEL_ID" in content or "facebook.com/tr?id=" in content, "FB Pixel ID placeholder or tracking URL not found"
            
            print("✅ FB Pixel script present in index.html")
        except FileNotFoundError:
            pytest.fail(f"index.html not found at {index_path}")


class TestProductSearchShareButtons:
    """Test share buttons in ProductSearchPage"""
    
    def test_share_buttons_data_testids_in_code(self):
        """Verify share buttons have correct data-testid attributes in ProductSearchPage code"""
        code_path = "/app/frontend/src/components/ProductSearchPage.jsx"
        try:
            with open(code_path, "r") as f:
                content = f.read()
            
            # Check for share button data-testids (template literal or direct)
            # Template literal format: data-testid={`share-${l.name.toLowerCase()}`}
            assert 'data-testid={`share-${' in content or 'data-testid="share-whatsapp"' in content, "share button data-testid pattern not found"
            assert 'data-testid="share-copy"' in content, "share-copy data-testid not found"
            assert 'data-testid="share-results"' in content, "share-results container not found"
            
            # Check the share links array includes WhatsApp, Viber, Facebook
            assert "WhatsApp" in content, "WhatsApp share option not found"
            assert "Viber" in content, "Viber share option not found"
            assert "Facebook" in content, "Facebook share option not found"
            
            print("✅ ProductSearchPage has all share button data-testids")
        except FileNotFoundError:
            pytest.fail(f"ProductSearchPage.jsx not found at {code_path}")


class TestAIDesignerDownloadFullscreen:
    """Test download and fullscreen buttons in AIDesignerPage"""
    
    def test_download_fullscreen_buttons_data_testids_in_code(self):
        """Verify download and fullscreen buttons have correct data-testid in AIDesignerPage code"""
        code_path = "/app/frontend/src/components/AIDesignerPage.jsx"
        try:
            with open(code_path, "r") as f:
                content = f.read()
            
            # Check for download button data-testid pattern
            assert 'data-testid={`download-render-' in content or 'data-testid="download-render-' in content, "download-render data-testid not found"
            
            # Check for fullscreen button data-testid pattern
            assert 'data-testid={`fullscreen-render-' in content or 'data-testid="fullscreen-render-' in content, "fullscreen-render data-testid not found"
            
            # Check for Download and Maximize2 icons (Lucide)
            assert "Download" in content, "Download icon not imported/used"
            assert "Maximize2" in content, "Maximize2 icon not imported/used"
            
            print("✅ AIDesignerPage has download and fullscreen button data-testids")
        except FileNotFoundError:
            pytest.fail(f"AIDesignerPage.jsx not found at {code_path}")


class TestProfilePageTabs:
    """Test Profile page has 4 tabs"""
    
    def test_profile_page_tabs_in_code(self):
        """Verify ProfilePage has 4 tabs with correct data-testids"""
        code_path = "/app/frontend/src/components/ProfilePage.jsx"
        try:
            with open(code_path, "r") as f:
                content = f.read()
            
            # Check for 4 tab data-testids
            assert 'data-testid="tab-info"' in content, "tab-info data-testid not found"
            assert 'data-testid="tab-projects"' in content, "tab-projects data-testid not found"
            assert 'data-testid="tab-referrals"' in content, "tab-referrals data-testid not found"
            assert 'data-testid="tab-settings"' in content, "tab-settings data-testid not found"
            
            # Check for Bulgarian tab labels
            assert "Профил" in content, "Профил tab label not found"
            assert "Проекти" in content, "Проекти tab label not found"
            assert "Реферали" in content, "Реферали tab label not found"
            assert "Настройки" in content, "Настройки tab label not found"
            
            print("✅ ProfilePage has 4 tabs with correct data-testids")
        except FileNotFoundError:
            pytest.fail(f"ProfilePage.jsx not found at {code_path}")


class TestReferralsTabUI:
    """Test Referrals tab UI elements in ProfilePage"""
    
    def test_referrals_tab_elements_in_code(self):
        """Verify Referrals tab has required UI elements"""
        code_path = "/app/frontend/src/components/ProfilePage.jsx"
        try:
            with open(code_path, "r") as f:
                content = f.read()
            
            # Check for referral-related data-testids
            assert 'data-testid="referral-code"' in content, "referral-code data-testid not found"
            assert 'data-testid="copy-referral-btn"' in content, "copy-referral-btn data-testid not found"
            assert 'data-testid="apply-ref-input"' in content, "apply-ref-input data-testid not found"
            assert 'data-testid="apply-ref-btn"' in content, "apply-ref-btn data-testid not found"
            
            # Check for share buttons in referrals tab
            assert 'data-testid="share-ref-whatsapp"' in content, "share-ref-whatsapp data-testid not found"
            assert 'data-testid="share-ref-viber"' in content, "share-ref-viber data-testid not found"
            
            print("✅ ProfilePage Referrals tab has all required UI elements")
        except FileNotFoundError:
            pytest.fail(f"ProfilePage.jsx not found at {code_path}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
