"""
Backend tests for SEO Features (iteration 7)
- Sitemap endpoint
- Analytics tracking endpoints
- Analytics dashboard with password protection
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ANALYTICS_PASSWORD = "temadom2026"

class TestSitemap:
    """Test sitemap endpoint returns valid XML with 75+ URLs"""
    
    def test_sitemap_returns_xml(self):
        response = requests.get(f"{BASE_URL}/api/sitemap")
        assert response.status_code == 200
        assert "application/xml" in response.headers.get("content-type", "")
        print(f"✅ Sitemap returns XML content-type")
    
    def test_sitemap_has_correct_structure(self):
        response = requests.get(f"{BASE_URL}/api/sitemap")
        assert response.status_code == 200
        content = response.text
        assert '<?xml version="1.0" encoding="UTF-8"?>' in content
        assert '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' in content
        print(f"✅ Sitemap has correct XML structure")
    
    def test_sitemap_has_75_plus_urls(self):
        response = requests.get(f"{BASE_URL}/api/sitemap")
        assert response.status_code == 200
        url_count = response.text.count("<url>")
        assert url_count >= 75, f"Expected 75+ URLs, got {url_count}"
        print(f"✅ Sitemap has {url_count} URLs (expected 75+)")
    
    def test_sitemap_includes_blog_pages(self):
        response = requests.get(f"{BASE_URL}/api/sitemap")
        content = response.text
        assert "/blog" in content
        assert "ceni-boyadzhiya-2026" in content  # Profession article
        assert "stroitelstvo-sofia-2026" in content  # Region article
        print(f"✅ Sitemap includes blog pages")
    
    def test_sitemap_includes_regional_pages(self):
        response = requests.get(f"{BASE_URL}/api/sitemap")
        content = response.text
        assert "/region/sofia" in content
        assert "/region/plovdiv" in content
        assert "/region/varna" in content
        assert "/region/burgas" in content
        print(f"✅ Sitemap includes regional pages")
    
    def test_sitemap_includes_prices_page(self):
        response = requests.get(f"{BASE_URL}/api/sitemap")
        content = response.text
        assert "/prices" in content
        print(f"✅ Sitemap includes prices page")


class TestAnalyticsTracking:
    """Test analytics tracking endpoints"""
    
    def test_track_pageview(self):
        response = requests.post(
            f"{BASE_URL}/api/analytics/track",
            json={"path": "/test-path", "referrer": "https://google.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        print(f"✅ Pageview tracking works")
    
    def test_track_custom_event(self):
        response = requests.post(
            f"{BASE_URL}/api/analytics/event",
            json={
                "event_name": "calculator_submit",
                "metadata": {"region": "Sofia", "services_count": 3},
                "path": "/calculator"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        print(f"✅ Custom event tracking works")
    
    def test_track_pdf_event(self):
        response = requests.post(
            f"{BASE_URL}/api/analytics/event",
            json={
                "event_name": "pdf_generated",
                "metadata": {"total": 5000},
                "path": "/calculator"
            }
        )
        assert response.status_code == 200
        print(f"✅ PDF event tracking works")


class TestAnalyticsDashboard:
    """Test analytics dashboard with password protection"""
    
    def test_dashboard_requires_password(self):
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard")
        assert response.status_code == 403
        data = response.json()
        assert "парола" in data.get("detail", "").lower()
        print(f"✅ Dashboard rejects requests without password")
    
    def test_dashboard_rejects_wrong_password(self):
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboard",
            headers={"X-Admin-Password": "wrongpassword"}
        )
        assert response.status_code == 403
        print(f"✅ Dashboard rejects wrong password")
    
    def test_dashboard_accepts_correct_password(self):
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboard",
            headers={"X-Admin-Password": ANALYTICS_PASSWORD}
        )
        assert response.status_code == 200
        print(f"✅ Dashboard accepts correct password")
    
    def test_dashboard_returns_expected_data(self):
        response = requests.get(
            f"{BASE_URL}/api/analytics/dashboard",
            headers={"X-Admin-Password": ANALYTICS_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check all expected fields exist
        expected_fields = [
            "pageviews_today", "calculator_uses", "pdf_downloads",
            "payments", "total_users", "total_companies", "total_clients",
            "top_pages", "recent_events", "top_regions"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        # Validate data types
        assert isinstance(data["pageviews_today"], int)
        assert isinstance(data["total_users"], int)
        assert isinstance(data["top_pages"], list)
        assert isinstance(data["recent_events"], list)
        assert isinstance(data["top_regions"], list)
        
        print(f"✅ Dashboard returns all expected fields with correct types")


class TestExistingAPIs:
    """Quick smoke tests for existing APIs to ensure no regression"""
    
    def test_api_root(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API root endpoint works")
    
    def test_categories(self):
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✅ Categories endpoint works")
    
    def test_stats(self):
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_projects" in data
        assert "total_companies" in data
        print(f"✅ Stats endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
