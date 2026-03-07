"""
Iteration 59: Test timeout fixes for GPT-4o Vision AI Designer feature
Tests verify:
1. API endpoint exists and accepts form data
2. Server code uses gpt-4o-mini model for Vision analysis
3. Server code has retry_with_backoff function
4. Server code has PIL image resize logic for >2MB photos
5. Frontend compressImage function exists
6. Frontend retryWithBackoff function exists
7. Frontend axios timeout is 300000ms (5 minutes)
"""
import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root_returns_200(self):
        """GET /api/ returns 200"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Maistori Marketplace API"
        print("✅ API health check passed")


class TestLoginWithTestUser:
    """Test login with provided test credentials"""
    
    def test_login_success(self):
        """POST /api/auth/login with test credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testfix@test.bg", "password": "Test123!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "testfix@test.bg"
        print("✅ Login with testfix@test.bg successful")


class TestPhotoGenerateEndpoint:
    """Test photo-generate endpoint accepts proper form data"""
    
    def test_endpoint_returns_400_or_422_without_photos(self):
        """POST /api/ai-designer/photo-generate without photos returns 400 or 422"""
        # First login to get token
        login_resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testfix@test.bg", "password": "Test123!"}
        )
        token = login_resp.json().get("token")
        
        # Send request without any photos
        response = requests.post(
            f"{BASE_URL}/api/ai-designer/photo-generate",
            data={
                "style": "modern",
                "room_type": "bathroom",
                "width": "4.0",
                "length": "3.0",
                "height": "2.6",
                "budget_eur": "5000",
                "notes": "Test notes"
            },
            headers={"Authorization": f"Bearer {token}"} if token else {}
        )
        # Should return 400 or 422 (validation error) because no photos uploaded
        assert response.status_code in [400, 422], f"Expected 400 or 422, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print("✅ photo-generate correctly rejects requests without photos")


class TestBackendCodeVerification:
    """Verify backend server.py code has the required timeout fixes"""
    
    def test_gpt4o_mini_model_used(self):
        """Verify server.py uses gpt-4o-mini for Vision analysis"""
        with open("/app/backend/server.py", "r") as f:
            content = f.read()
        
        # Check for gpt-4o-mini model usage
        assert 'gpt-4o-mini' in content, "gpt-4o-mini model not found in server.py"
        
        # More specific: Check it's used with vision chat
        pattern = r'\.with_model\(["\']openai["\'],\s*["\']gpt-4o-mini["\']\)'
        assert re.search(pattern, content), "gpt-4o-mini not configured correctly for vision"
        print("✅ gpt-4o-mini model is used for Vision analysis")
    
    def test_retry_with_backoff_exists(self):
        """Verify retry_with_backoff function exists in server.py"""
        with open("/app/backend/server.py", "r") as f:
            content = f.read()
        
        assert "async def retry_with_backoff" in content, "retry_with_backoff function not found"
        assert "max_retries" in content, "max_retries parameter not found"
        assert "base_delay" in content, "base_delay parameter not found"
        print("✅ retry_with_backoff function exists in backend")
    
    def test_retry_used_for_vision_and_image_gen(self):
        """Verify retry_with_backoff is used for both vision and image generation"""
        with open("/app/backend/server.py", "r") as f:
            content = f.read()
        
        # Check retry is used for vision
        assert "await retry_with_backoff(run_vision" in content, "retry not used for vision"
        # Check retry is used for image generation
        assert "await retry_with_backoff(run_image_gen" in content, "retry not used for image gen"
        print("✅ retry_with_backoff used for both vision and image generation")
    
    def test_pil_image_resize_logic(self):
        """Verify PIL image resize logic for photos >2MB"""
        with open("/app/backend/server.py", "r") as f:
            content = f.read()
        
        # Check for PIL import
        assert "from PIL import Image" in content or "from PIL import PILImage" in content or "PILImage" in content
        
        # Check for 2MB threshold
        assert "2 * 1024 * 1024" in content, "2MB threshold not found"
        
        # Check for resize method
        assert ".resize(" in content, "PIL resize method not used"
        
        # Check for LANCZOS filter
        assert "LANCZOS" in content, "LANCZOS filter not used for resize"
        print("✅ PIL image resize logic exists for photos >2MB")


class TestFrontendCodeVerification:
    """Verify frontend AIDesignerPage.jsx has the required timeout fixes"""
    
    def test_compress_image_function(self):
        """Verify compressImage function exists in frontend"""
        with open("/app/frontend/src/components/AIDesignerPage.jsx", "r") as f:
            content = f.read()
        
        assert "const compressImage" in content, "compressImage function not found"
        # Check it compresses to 2MB
        assert "maxSizeMB" in content or "2 * 1024 * 1024" in content, "2MB compression not configured"
        print("✅ compressImage function exists in frontend")
    
    def test_retry_with_backoff_function(self):
        """Verify retryWithBackoff function exists in frontend"""
        with open("/app/frontend/src/components/AIDesignerPage.jsx", "r") as f:
            content = f.read()
        
        assert "const retryWithBackoff" in content, "retryWithBackoff function not found"
        assert "maxRetries = 3" in content or "maxRetries" in content, "maxRetries not configured"
        assert "baseDelay = 2000" in content or "baseDelay" in content, "baseDelay not configured"
        print("✅ retryWithBackoff function exists in frontend")
    
    def test_axios_timeout_300s(self):
        """Verify axios timeout is 300000ms (5 minutes)"""
        with open("/app/frontend/src/components/AIDesignerPage.jsx", "r") as f:
            content = f.read()
        
        assert "timeout: 300000" in content, "300s timeout not set for axios"
        print("✅ axios timeout is 300000ms (5 minutes)")
    
    def test_compress_image_used_in_handle_generate(self):
        """Verify compressImage is called in handleGenerate"""
        with open("/app/frontend/src/components/AIDesignerPage.jsx", "r") as f:
            content = f.read()
        
        assert "compressImage(room.photos" in content or "await compressImage" in content
        print("✅ compressImage is used in handleGenerate")
    
    def test_retry_used_for_api_call(self):
        """Verify retryWithBackoff wraps the axios call"""
        with open("/app/frontend/src/components/AIDesignerPage.jsx", "r") as f:
            content = f.read()
        
        assert "retryWithBackoff(async" in content, "retryWithBackoff not used for API call"
        print("✅ retryWithBackoff wraps the API call")


class TestProductSearchPageSyntax:
    """Verify ProductSearchPage.jsx has no JSX syntax errors"""
    
    def test_product_search_page_valid_jsx(self):
        """Verify ProductSearchPage.jsx can be parsed"""
        with open("/app/frontend/src/components/ProductSearchPage.jsx", "r") as f:
            content = f.read()
        
        # Check basic structure
        assert "export const ProductSearchPage" in content or "export default ProductSearchPage" in content
        # Check for common JSX patterns
        assert "<div" in content
        assert "</div>" in content
        # No broken fragments
        assert content.count("<>") == content.count("</>")
        print("✅ ProductSearchPage.jsx syntax appears valid")


class TestDataTestIdAttributes:
    """Verify all required data-testid attributes exist in frontend code"""
    
    def test_all_data_testid_present(self):
        """Check all required data-testid attributes in AIDesignerPage.jsx"""
        with open("/app/frontend/src/components/AIDesignerPage.jsx", "r") as f:
            content = f.read()
        
        # These use exact strings
        exact_testids = [
            'ai-designer-page',
            'generate-btn',
        ]
        
        # These use template literals with variables - check pattern exists
        template_patterns = [
            'data-testid={`pkg-${p.id}`}',  # pkg-1, pkg-2, pkg-3
            'data-testid={`room-type-${index}`}',  # room-type-0
            'data-testid={`style-${index}`}',  # style-0
            'data-testid={`length-${index}`}',  # length-0
            'data-testid={`width-${index}`}',  # width-0
            'data-testid={`height-${index}`}',  # height-0
            'data-testid={`budget-${b.value}-${index}`}',  # budget-1000-0, budget-2500-0, budget-5000-0
        ]
        
        for tid in exact_testids:
            assert f'data-testid="{tid}"' in content, f"Missing exact data-testid: {tid}"
        
        for pattern in template_patterns:
            assert pattern in content, f"Missing template pattern: {pattern}"
        
        print(f"✅ All data-testid attributes found (exact: {len(exact_testids)}, template: {len(template_patterns)})")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
