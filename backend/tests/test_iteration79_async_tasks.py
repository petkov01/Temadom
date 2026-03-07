"""
Test Suite for TemaDom AI Designer Async Task System (Iteration 79)
Tests the new async task system where:
- POST /api/ai-designer/photo-generate returns task_id immediately
- GET /api/ai-designer/task/{task_id} returns progress/status
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns ok"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("PASS: /api/health returns status=ok")
    
    def test_stats_live(self):
        """Test /api/stats/live returns clients, companies, free_slots"""
        response = requests.get(f"{BASE_URL}/api/stats/live", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "companies" in data
        assert "free_slots" in data
        print(f"PASS: /api/stats/live returns clients={data['clients']}, companies={data['companies']}")


class TestAuthFlow:
    """Authentication tests"""
    
    def test_login_valid_credentials(self):
        """Test login with valid test credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testp1c@test.bg", "password": "Test1234"},
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"PASS: Login successful for testp1c@test.bg, user_type={data['user'].get('user_type')}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpass"},
            timeout=10
        )
        assert response.status_code == 401
        print("PASS: Invalid credentials correctly return 401")


class TestAsyncTaskSystem:
    """Tests for the new async task system"""
    
    def test_task_endpoint_invalid_id_returns_404(self):
        """GET /api/ai-designer/task/invalid-id returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/ai-designer/task/invalid-task-id-12345",
            timeout=10
        )
        assert response.status_code == 404
        print("PASS: GET /api/ai-designer/task/invalid-id returns 404")
    
    def test_photo_generate_endpoint_exists(self):
        """POST /api/ai-designer/photo-generate endpoint exists (returns 422 without photo)"""
        response = requests.post(
            f"{BASE_URL}/api/ai-designer/photo-generate",
            data={},
            timeout=10
        )
        # Should return 422 for missing required photo
        assert response.status_code == 422
        print("PASS: /api/ai-designer/photo-generate endpoint exists (422 without photo)")
    
    def test_photo_generate_returns_task_id_quickly(self):
        """POST /api/ai-designer/photo-generate returns task_id immediately (<5 seconds)"""
        # Use the test image
        image_path = "/app/test_bathroom.jpg"
        if not os.path.exists(image_path):
            pytest.skip("Test image not found at /app/test_bathroom.jpg")
        
        # Get auth token first
        login_res = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testp1c@test.bg", "password": "Test1234"},
            timeout=10
        )
        if login_res.status_code != 200:
            pytest.skip("Could not authenticate")
        token = login_res.json()["token"]
        
        with open(image_path, "rb") as f:
            files = {"photo1": ("test_bathroom.jpg", f, "image/jpeg")}
            data = {
                "style": "modern",
                "room_type": "bathroom",
                "notes": "Test",
                "budget_eur": "2000",
                "width": "3.0",
                "length": "3.0",
                "height": "2.5",
                "authorization": f"Bearer {token}"
            }
            
            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/api/ai-designer/photo-generate",
                files=files,
                data=data,
                timeout=30
            )
            elapsed = time.time() - start_time
        
        # Should return 200 with task_id quickly
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "task_id" in data, f"Response should contain task_id: {data}"
        assert data.get("status") == "processing", f"Status should be 'processing': {data}"
        
        # Must return in less than 5 seconds (async design)
        assert elapsed < 5.0, f"Response took {elapsed:.1f}s, should be <5s for async design"
        
        print(f"PASS: photo-generate returns task_id immediately in {elapsed:.1f}s (async)")
        print(f"  task_id: {data['task_id']}")
        return data["task_id"]
    
    def test_task_polling_returns_progress(self):
        """Test that polling the task endpoint returns progress updates"""
        # First submit a task
        image_path = "/app/test_bathroom.jpg"
        if not os.path.exists(image_path):
            pytest.skip("Test image not found")
        
        # Get auth token
        login_res = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testp1c@test.bg", "password": "Test1234"},
            timeout=10
        )
        if login_res.status_code != 200:
            pytest.skip("Could not authenticate")
        token = login_res.json()["token"]
        
        # Submit task
        with open(image_path, "rb") as f:
            files = {"photo1": ("test_bathroom.jpg", f, "image/jpeg")}
            data = {
                "style": "modern",
                "room_type": "bathroom",
                "notes": "Poll test",
                "budget_eur": "2000",
                "width": "3.0",
                "length": "3.0",
                "height": "2.5",
                "authorization": f"Bearer {token}"
            }
            submit_res = requests.post(
                f"{BASE_URL}/api/ai-designer/photo-generate",
                files=files,
                data=data,
                timeout=30
            )
        
        if submit_res.status_code != 200:
            pytest.skip(f"Submit failed: {submit_res.text}")
        
        task_id = submit_res.json().get("task_id")
        if not task_id:
            pytest.fail("No task_id returned")
        
        # Poll for progress (just verify polling works, don't wait for completion)
        time.sleep(2)  # Small wait for task to start processing
        poll_res = requests.get(
            f"{BASE_URL}/api/ai-designer/task/{task_id}",
            timeout=10
        )
        
        assert poll_res.status_code == 200, f"Poll failed: {poll_res.text}"
        task_data = poll_res.json()
        
        # Verify response structure
        assert "task_id" in task_data
        assert "status" in task_data
        assert "progress" in task_data
        assert task_data["status"] in ["processing", "done", "error"]
        
        print(f"PASS: Task polling works - status={task_data['status']}, progress={task_data['progress']}%")
        print(f"  message: {task_data.get('message', 'N/A')}")


class TestCategories:
    """Test category endpoints"""
    
    def test_categories_returns_list(self):
        """Test /api/categories returns 20+ construction categories"""
        response = requests.get(f"{BASE_URL}/api/categories", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) >= 20
        print(f"PASS: /api/categories returns {len(data['categories'])} categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
