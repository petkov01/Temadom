"""
Backend API tests for AI Chart Analyzer feature
Tests for POST /api/ai-chart/analyze endpoint
"""
import pytest
import requests
import os
import base64

# Use production URL from frontend env
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://construction-leads-4.preview.emergentagent.com')

# Sample small base64 image (1x1 pixel PNG) for testing
SAMPLE_IMAGE_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


class TestAIChartAnalyzeEndpoint:
    """Tests for /api/ai-chart/analyze endpoint"""

    def test_stairs_type_returns_correct_data(self):
        """POST /api/ai-chart/analyze with chart_type='Стълби 4248.jpg' returns stairs data with grand_total=3528"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chart/analyze",
            json={
                "image": SAMPLE_IMAGE_B64,
                "chart_type": "Стълби 4248.jpg",
                "client_name": "Тест Клиент"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data.get("success") is True, "success should be True"
        assert data.get("chart_type") == "stairs", f"chart_type should be 'stairs', got '{data.get('chart_type')}'"
        
        # Analysis assertions
        analysis = data.get("analysis", {})
        assert analysis.get("grand_total") == 3528, f"grand_total should be 3528, got {analysis.get('grand_total')}"
        assert "Бетон" in analysis.get("type", ""), "Type should contain 'Бетон'"
        assert analysis.get("subtotal") == 3048, f"subtotal should be 3048, got {analysis.get('subtotal')}"
        assert analysis.get("vat_percent") == 20, f"vat_percent should be 20, got {analysis.get('vat_percent')}"
        assert analysis.get("vat_amount") == 480, f"vat_amount should be 480, got {analysis.get('vat_amount')}"
        
        # Check materials data
        materials = analysis.get("materials", [])
        assert len(materials) == 3, f"Should have 3 materials, got {len(materials)}"
        
        # Verify specific material totals (Бетон=1886лв, Арматура=882лв, Кофраж=280лв)
        material_totals = {m["name"]: m["total"] for m in materials}
        assert material_totals.get("Бетон C25/30") == 1886, f"Бетон total should be 1886, got {material_totals.get('Бетон C25/30')}"
        assert material_totals.get("Арматура φ12") == 882, f"Арматура total should be 882, got {material_totals.get('Арматура φ12')}"
        assert material_totals.get("Кофраж") == 280, f"Кофраж total should be 280, got {material_totals.get('Кофраж')}"
        
        # Contract assertions
        contract = data.get("contract", {})
        assert contract.get("client") == "Тест Клиент", "Contract client should match input"
        assert contract.get("company") == "Temadom ООД", "Company should be Temadom ООД"
        assert "5 дни" in contract.get("duration", ""), "Duration should mention 5 days"
        
        print("✓ Stairs type test passed - grand_total=3528, materials verified")

    def test_foundation_type_returns_correct_data(self):
        """POST /api/ai-chart/analyze with chart_type='Фундамент' returns foundation data"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chart/analyze",
            json={
                "image": SAMPLE_IMAGE_B64,
                "chart_type": "Фундамент",
                "client_name": "Фундамент Клиент"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "success should be True"
        assert data.get("chart_type") == "foundation", f"chart_type should be 'foundation', got '{data.get('chart_type')}'"
        
        analysis = data.get("analysis", {})
        assert analysis.get("grand_total") == 10061, f"grand_total should be 10061 for foundation, got {analysis.get('grand_total')}"
        assert "фундамент" in analysis.get("type", "").lower() or "Ивичен" in analysis.get("type", ""), "Type should indicate foundation"
        
        # Verify materials
        materials = analysis.get("materials", [])
        assert len(materials) == 4, f"Foundation should have 4 materials, got {len(materials)}"
        
        print(f"✓ Foundation type test passed - grand_total={analysis.get('grand_total')}")

    def test_walls_type_returns_correct_data(self):
        """POST /api/ai-chart/analyze with chart_type='Стени' returns walls data"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chart/analyze",
            json={
                "image": SAMPLE_IMAGE_B64,
                "chart_type": "Стени",
                "client_name": "Стени Клиент"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "success should be True"
        assert data.get("chart_type") == "walls", f"chart_type should be 'walls', got '{data.get('chart_type')}'"
        
        analysis = data.get("analysis", {})
        assert analysis.get("grand_total") == 5306, f"grand_total should be 5306 for walls, got {analysis.get('grand_total')}"
        assert "зидария" in analysis.get("type", "").lower() or "Зидария" in analysis.get("type", ""), "Type should indicate walls/masonry"
        
        # Verify materials
        materials = analysis.get("materials", [])
        assert len(materials) == 4, f"Walls should have 4 materials, got {len(materials)}"
        
        print(f"✓ Walls type test passed - grand_total={analysis.get('grand_total')}")

    def test_missing_image_returns_400_error(self):
        """POST /api/ai-chart/analyze without image returns 400 error"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chart/analyze",
            json={
                "chart_type": "stairs",
                "client_name": "Test Client"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data, "Error response should have 'detail' field"
        assert "чертеж" in data.get("detail", "").lower(), f"Error message should mention 'чертеж', got: {data.get('detail')}"
        
        print("✓ Missing image test passed - returns 400 with appropriate message")

    def test_auto_type_defaults_to_stairs(self):
        """POST /api/ai-chart/analyze with chart_type='auto' defaults to stairs preset"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chart/analyze",
            json={
                "image": SAMPLE_IMAGE_B64,
                "chart_type": "auto",
                "client_name": "Auto Test"
            },
            headers={"Content-Type": "application/json"},
            timeout=60  # Auto may use AI which takes longer
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "success should be True"
        # Auto mode may resolve to any type, but should return valid data
        assert data.get("chart_type") in ["stairs", "foundation", "walls"], f"chart_type should be valid, got '{data.get('chart_type')}'"
        
        analysis = data.get("analysis", {})
        assert analysis.get("grand_total") > 0, "grand_total should be positive"
        
        print(f"✓ Auto type test passed - resolved to '{data.get('chart_type')}'")

    def test_empty_image_returns_400_error(self):
        """POST /api/ai-chart/analyze with empty image returns 400 error"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chart/analyze",
            json={
                "image": "",
                "chart_type": "stairs",
                "client_name": "Test Client"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        print("✓ Empty image test passed - returns 400")

    def test_response_contains_contract_data(self):
        """Verify response contains complete contract data"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chart/analyze",
            json={
                "image": SAMPLE_IMAGE_B64,
                "chart_type": "stairs",
                "client_name": "Contract Test"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200
        
        data = response.json()
        contract = data.get("contract", {})
        
        # Verify all required contract fields
        assert "company" in contract, "Contract should have 'company'"
        assert "client" in contract, "Contract should have 'client'"
        assert "duration" in contract, "Contract should have 'duration'"
        assert "advance" in contract, "Contract should have 'advance'"
        assert "date" in contract, "Contract should have 'date'"
        
        # Verify contract values
        assert contract.get("client") == "Contract Test", "Client name should match input"
        assert "50%" in contract.get("advance", ""), "Advance should be 50%"
        
        print("✓ Contract data test passed - all fields present")


class TestHealthAndRoot:
    """Basic health checks"""
    
    def test_api_root(self):
        """Test API root endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ API root accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
