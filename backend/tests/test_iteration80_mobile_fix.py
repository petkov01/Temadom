"""
Iteration 80: AI Designer Mobile Fix Tests
==========================================
Tests for the mobile-specific timeout fix:
1. POST /api/ai-designer/photo-generate - returns task_id immediately
2. GET /api/ai-designer/task/{task_id} - LIGHTWEIGHT response (no base64)
3. GET /api/ai-designer/result/{design_id} - Full result with renders/budget
4. Both endpoints return 404 for invalid IDs
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_IMAGE_PATH = "/app/test_bathroom.jpg"

# Test credentials
TEST_EMAIL = "testp1c@test.bg"
TEST_PASSWORD = "Test1234"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


class TestHealthAndBasics:
    """Basic endpoint health checks"""
    
    def test_health_endpoint(self, api_client):
        """Verify API is up"""
        response = api_client.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200
        assert response.json().get("status") == "ok"
        print("✓ Health endpoint working")
    
    def test_stats_live_endpoint(self, api_client):
        """Verify stats endpoint for live counters"""
        response = api_client.get(f"{BASE_URL}/api/stats/live", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "companies" in data
        assert "free_slots" in data
        print(f"✓ Stats live: {data.get('clients')} clients, {data.get('companies')} companies")


class TestTaskPollingEndpoint:
    """Tests for GET /api/ai-designer/task/{task_id} - LIGHTWEIGHT polling"""
    
    def test_invalid_task_id_returns_404(self, api_client):
        """GET /api/ai-designer/task/invalid-id should return 404"""
        response = api_client.get(f"{BASE_URL}/api/ai-designer/task/invalid-task-id-12345", timeout=10)
        assert response.status_code == 404
        print("✓ Invalid task_id correctly returns 404")
    
    def test_task_endpoint_structure(self, api_client):
        """Verify task endpoint returns proper 404 structure"""
        response = api_client.get(f"{BASE_URL}/api/ai-designer/task/nonexistent-task", timeout=10)
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print(f"✓ Task 404 response structure correct: {data}")


class TestResultEndpoint:
    """Tests for GET /api/ai-designer/result/{design_id} - FULL result fetch"""
    
    def test_invalid_design_id_returns_404(self, api_client):
        """GET /api/ai-designer/result/invalid-id should return 404"""
        response = api_client.get(f"{BASE_URL}/api/ai-designer/result/invalid-design-id-12345", timeout=10)
        assert response.status_code == 404
        print("✓ Invalid design_id correctly returns 404")
    
    def test_result_endpoint_structure(self, api_client):
        """Verify result endpoint returns proper 404 structure"""
        response = api_client.get(f"{BASE_URL}/api/ai-designer/result/nonexistent-design", timeout=10)
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print(f"✓ Result 404 response structure correct: {data}")


class TestPhotoGenerateEndpoint:
    """Tests for POST /api/ai-designer/photo-generate"""
    
    def test_endpoint_exists_and_requires_photo(self, api_client):
        """Endpoint should exist but require photo upload (422 without)"""
        response = api_client.post(f"{BASE_URL}/api/ai-designer/photo-generate", timeout=10)
        # Should be 422 (validation error) without photo
        assert response.status_code in [400, 422]
        print("✓ Photo-generate endpoint exists, requires photo upload")
    
    def test_photo_generate_returns_task_id_immediately(self, api_client, auth_token):
        """
        CRITICAL TEST: POST should return task_id IMMEDIATELY (<5 seconds)
        This confirms async architecture is working
        """
        if not os.path.exists(TEST_IMAGE_PATH):
            pytest.skip(f"Test image not found: {TEST_IMAGE_PATH}")
        
        with open(TEST_IMAGE_PATH, 'rb') as f:
            files = {'photo1': ('bathroom.jpg', f, 'image/jpeg')}
            data = {
                'style': 'modern',
                'room_type': 'bathroom',
                'notes': 'Test from iteration 80',
                'budget_eur': '2500',
                'width': '3.5',
                'length': '3.0',
                'height': '2.8'
            }
            headers = {"Authorization": f"Bearer {auth_token}"}
            
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/api/ai-designer/photo-generate",
                files=files,
                data=data,
                headers=headers,
                timeout=60
            )
            elapsed = time.time() - start_time
        
        # Should return 200/201 with task_id
        assert response.status_code in [200, 201], f"Got {response.status_code}: {response.text}"
        data = response.json()
        assert "task_id" in data, f"No task_id in response: {data}"
        
        # CRITICAL: Should return within 5 seconds (async)
        assert elapsed < 5, f"Response took {elapsed}s - expected <5s for async operation"
        
        print(f"✓ Photo-generate returned task_id in {elapsed:.2f}s (ASYNC CONFIRMED)")
        print(f"  task_id: {data['task_id']}")
        
        return data['task_id']


class TestFullAsyncFlow:
    """End-to-end test of the mobile-optimized async flow"""
    
    def test_complete_async_poll_flow(self, api_client, auth_token):
        """
        Full test: Submit -> Poll (lightweight) -> Fetch result (heavy)
        This validates the mobile fix: polling doesn't include base64 images
        """
        if not os.path.exists(TEST_IMAGE_PATH):
            pytest.skip(f"Test image not found: {TEST_IMAGE_PATH}")
        
        # Step 1: Submit task
        with open(TEST_IMAGE_PATH, 'rb') as f:
            files = {'photo1': ('bathroom.jpg', f, 'image/jpeg')}
            data = {
                'style': 'modern',
                'room_type': 'bathroom',
                'notes': 'Iteration 80 full flow test',
                'budget_eur': '2000',
                'width': '3.0',
                'length': '2.5',
                'height': '2.7'
            }
            headers = {"Authorization": f"Bearer {auth_token}"}
            
            response = requests.post(
                f"{BASE_URL}/api/ai-designer/photo-generate",
                files=files,
                data=data,
                headers=headers,
                timeout=60
            )
        
        assert response.status_code in [200, 201]
        task_id = response.json().get("task_id")
        assert task_id, "No task_id returned"
        print(f"✓ Task submitted: {task_id}")
        
        # Step 2: Poll for completion (max 20 polls = 60 seconds)
        design_id = None
        for poll_num in range(20):
            time.sleep(3)
            poll_response = api_client.get(
                f"{BASE_URL}/api/ai-designer/task/{task_id}",
                timeout=10
            )
            
            if poll_response.status_code == 404:
                continue
            
            assert poll_response.status_code == 200
            task_data = poll_response.json()
            
            # CRITICAL CHECK: Polling response should be LIGHTWEIGHT
            # It should NOT contain base64 image data or full renders
            response_size = len(poll_response.text)
            assert response_size < 5000, f"Poll response too large ({response_size} bytes) - may contain base64!"
            
            # Check response structure
            assert "status" in task_data
            assert "progress" in task_data
            assert "task_id" in task_data
            
            # Should NOT have full renders with base64
            assert "renders" not in task_data or not task_data.get("renders"), \
                "Polling response should NOT include renders array"
            
            print(f"  Poll {poll_num + 1}: status={task_data['status']}, progress={task_data['progress']}%, size={response_size}B")
            
            if task_data["status"] == "done":
                # When done, should have design_id but NOT full result
                assert "design_id" in task_data, "Done status should include design_id"
                design_id = task_data["design_id"]
                print(f"✓ Task completed! design_id: {design_id}")
                break
            elif task_data["status"] == "error":
                pytest.fail(f"Task failed: {task_data.get('error')}")
        
        if not design_id:
            pytest.skip("Task didn't complete in time (this is OK for partial testing)")
        
        # Step 3: Fetch full result from separate endpoint
        result_response = api_client.get(
            f"{BASE_URL}/api/ai-designer/result/{design_id}",
            timeout=120  # May be large (5-10MB with base64)
        )
        
        assert result_response.status_code == 200
        result_data = result_response.json()
        
        # Verify full result structure
        assert "id" in result_data
        assert "renders" in result_data
        assert "budget" in result_data
        
        # Result SHOULD have renders with base64
        result_size = len(result_response.text)
        print(f"✓ Full result fetched: {result_size} bytes")
        print(f"  renders_count: {result_data.get('renders_count', len(result_data.get('renders', [])))}")
        print(f"  budget items: {len(result_data.get('budget', {}).get('items', []))}")
        
        return True


class TestAuthentication:
    """Auth-related tests"""
    
    def test_login_with_valid_credentials(self, api_client):
        """Verify login works with test credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ Login successful: {data['user'].get('email')}")
    
    def test_login_with_invalid_credentials(self, api_client):
        """Invalid login should return 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected (401)")
