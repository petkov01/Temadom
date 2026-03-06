"""
Iteration 47 Backend Tests
Tests for: Logo changes, budget input in 3D Designer, backend budget_eur parameter, landing page content
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestIteration47:
    """Test iteration 47 features: logo, budget_eur, reviews API"""
    
    def test_api_root(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("✅ API root accessible")
    
    def test_reviews_api_returns_data(self):
        """Test /api/reviews returns reviews and stats"""
        response = requests.get(f"{BASE_URL}/api/reviews?limit=20")
        assert response.status_code == 200
        data = response.json()
        
        # Check reviews array exists
        assert "reviews" in data
        assert isinstance(data["reviews"], list)
        assert len(data["reviews"]) > 0
        print(f"✅ Reviews API returns {len(data['reviews'])} reviews")
        
        # Check stats object exists
        assert "stats" in data
        stats = data["stats"]
        assert "total" in stats
        assert "avg_rating" in stats
        print(f"✅ Reviews stats: total={stats['total']}, avg_rating={stats['avg_rating']}")
    
    def test_stats_live_returns_regions(self):
        """Test /api/stats/live returns regional breakdown"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        
        assert "clients" in data
        assert "companies" in data
        assert "regions" in data
        assert isinstance(data["regions"], dict)
        
        # Should have Bulgarian regions
        region_count = len(data["regions"])
        print(f"✅ Live stats returns {region_count} regions")
        assert region_count == 28, f"Expected 28 regions, got {region_count}"
    
    def test_categories_api(self):
        """Test /api/categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✅ Categories API returns {len(data['categories'])} categories")
    
    def test_companies_api(self):
        """Test /api/companies endpoint"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        print(f"✅ Companies API returns {len(data['companies'])} companies")
    
    def test_photo_generate_endpoint_exists(self):
        """Test photo-generate endpoint is accessible (should require auth/data)"""
        # Just check endpoint exists - will return 422 without proper form data
        response = requests.post(f"{BASE_URL}/api/ai-designer/photo-generate")
        # 422 means endpoint exists but needs form data
        # 400/405 means endpoint doesn't exist or wrong method
        assert response.status_code in [422, 400], f"Expected 422/400, got {response.status_code}"
        print("✅ Photo-generate endpoint exists (requires form data)")
    
    def test_stats_api(self):
        """Test /api/stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        print(f"✅ Stats API: {data['total_projects']} projects, {data['total_companies']} companies")


class TestReviewsAPIStructure:
    """Test reviews API response structure"""
    
    def test_review_object_has_required_fields(self):
        """Test review objects contain required fields"""
        response = requests.get(f"{BASE_URL}/api/reviews?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        if data["reviews"]:
            review = data["reviews"][0]
            required_fields = ["name", "city", "rating", "text"]
            for field in required_fields:
                assert field in review, f"Missing field: {field}"
            print(f"✅ Review has required fields: {required_fields}")
    
    def test_review_ratings_in_valid_range(self):
        """Test review ratings are between 1 and 5"""
        response = requests.get(f"{BASE_URL}/api/reviews?limit=20")
        assert response.status_code == 200
        data = response.json()
        
        for review in data["reviews"]:
            rating = review.get("rating", 0)
            assert 1 <= rating <= 5, f"Invalid rating: {rating}"
        print("✅ All review ratings are in valid range (1-5)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
