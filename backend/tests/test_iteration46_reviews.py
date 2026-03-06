"""
Iteration 46 Tests: Reviews/Testimonials API and Landing Page Features
Tests the new reviews section, stats, and photo guide updates.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test client fixture
@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestReviewsAPI:
    """Tests for GET /api/reviews endpoint"""
    
    def test_get_reviews_returns_array(self, api_client):
        """GET /api/reviews returns reviews array"""
        response = api_client.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200
        
        data = response.json()
        assert "reviews" in data
        assert isinstance(data["reviews"], list)
        print(f"✅ GET /api/reviews returns {len(data['reviews'])} reviews")
    
    def test_get_reviews_returns_stats(self, api_client):
        """GET /api/reviews returns stats object"""
        response = api_client.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200
        
        data = response.json()
        assert "stats" in data
        stats = data["stats"]
        
        # Check required stats fields
        assert "total" in stats
        assert "avg_rating" in stats
        assert "recommend_pct" in stats
        assert "avg_project_min" in stats
        assert "total_saved_eur" in stats
        
        print(f"✅ Stats: total={stats['total']}, avg_rating={stats['avg_rating']}, recommend_pct={stats['recommend_pct']}%")
    
    def test_reviews_have_required_fields(self, api_client):
        """Reviews contain name, city, rating, text fields"""
        response = api_client.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200
        
        data = response.json()
        reviews = data["reviews"]
        
        if reviews:
            review = reviews[0]
            assert "name" in review, "Review missing 'name' field"
            assert "city" in review, "Review missing 'city' field"
            assert "rating" in review, "Review missing 'rating' field"
            assert "text" in review, "Review missing 'text' field"
            
            # Validate rating is between 1-5
            assert 1 <= review["rating"] <= 5, f"Rating {review['rating']} out of range"
            
            print(f"✅ Review fields valid: {review['name']} from {review['city']}, rating={review['rating']}")
    
    def test_reviews_seeded_count(self, api_client):
        """Backend has 8 seeded initial reviews"""
        response = api_client.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200
        
        data = response.json()
        stats = data["stats"]
        
        # Should have at least 8 reviews (seeded)
        assert stats["total"] >= 8, f"Expected at least 8 reviews, got {stats['total']}"
        print(f"✅ Found {stats['total']} reviews (minimum 8 seeded)")


class TestReviewsAuthRequired:
    """Tests for POST /api/reviews requiring authentication"""
    
    def test_post_review_requires_auth(self, api_client):
        """POST /api/reviews requires authentication"""
        review_data = {
            "text": "Test review text",
            "rating": 5,
            "category": "platform"
        }
        
        response = api_client.post(f"{BASE_URL}/api/reviews", json=review_data)
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ POST /api/reviews correctly requires authentication")


class TestStatsAPI:
    """Tests for /api/stats and /api/stats/live endpoints"""
    
    def test_stats_returns_review_count(self, api_client):
        """GET /api/stats returns total_reviews"""
        response = api_client.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_reviews" in data
        assert data["total_reviews"] >= 8, f"Expected at least 8 reviews, got {data['total_reviews']}"
        print(f"✅ GET /api/stats shows total_reviews={data['total_reviews']}")
    
    def test_live_stats_returns_regions(self, api_client):
        """GET /api/stats/live returns 28 regions"""
        response = api_client.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200
        
        data = response.json()
        assert "regions" in data
        assert len(data["regions"]) == 28, f"Expected 28 regions, got {len(data['regions'])}"
        print(f"✅ GET /api/stats/live returns {len(data['regions'])} regions")


class TestAPIEndpoints:
    """Basic API endpoint tests"""
    
    def test_api_root(self, api_client):
        """GET /api/ returns API info"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("✅ GET /api/ accessible")
    
    def test_categories_endpoint(self, api_client):
        """GET /api/categories returns categories"""
        response = api_client.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ GET /api/categories returns {len(data['categories'])} categories")
    
    def test_companies_endpoint(self, api_client):
        """GET /api/companies returns company list"""
        response = api_client.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        
        data = response.json()
        assert "companies" in data
        print(f"✅ GET /api/companies returns {len(data['companies'])} companies")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
