#!/usr/bin/env python3

import requests
import json

BASE_URL = "https://build-sketch-1.preview.emergentagent.com/api"

def test_portfolio_endpoints():
    # Login as company to get token
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "firma@test.bg",
        "password": "test123"
    })
    
    if login_response.status_code == 200:
        token = login_response.json()["token"]
        user_info = login_response.json()["user"]
        print(f"✅ Company login successful - User: {user_info['name']}")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get company profile to get company_id
        profile_response = requests.get(f"{BASE_URL}/my-company", headers=headers)
        if profile_response.status_code == 200:
            company_id = profile_response.json()["id"]
            print(f"✅ Got company profile - Company ID: {company_id}")
            
            # Test portfolio endpoints
            print("\n📁 Testing Portfolio Endpoints...")
            
            # 1. Get portfolio (should be empty initially)
            portfolio_response = requests.get(f"{BASE_URL}/portfolio/{company_id}")
            if portfolio_response.status_code == 200:
                projects = portfolio_response.json().get("projects", [])
                print(f"✅ GET /api/portfolio/{company_id} - Found {len(projects)} projects")
            else:
                print(f"❌ GET /api/portfolio/{company_id} failed - {portfolio_response.status_code}")
            
            # 2. Get my portfolio (authenticated)
            my_portfolio_response = requests.get(f"{BASE_URL}/my-portfolio", headers=headers)
            if my_portfolio_response.status_code == 200:
                my_projects = my_portfolio_response.json().get("projects", [])
                print(f"✅ GET /api/my-portfolio - Found {len(my_projects)} projects")
            else:
                print(f"❌ GET /api/my-portfolio failed - {my_portfolio_response.status_code}")
            
            # 3. Create a test portfolio project
            portfolio_data = {
                "title": "Тест ремонт на баня",
                "description": "Пълен ремонт на баня - от А до Я",
                "category": "Ремонт на бани",
                "location": "София",
                "before_images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gODUK/9sAQwAKBwcIBwYKCAgICwoKCw4YEA4NDQ4dFRYRGCMfJSQiHyIhJis3LyYpNCkhIjBBMTQ5Oz4+PiUuRElDPEg3PT47/9sAQwEKCwsODQ4cEBAcOygiKDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBkQgUobHwFcHR4fEjJjNS8BVictNTocKS8fHy8/T19vf4+fr/2gAMAwEAAhEDEQA/AP38ooooA//Z"],
                "after_images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gODUK/9sAQwAKBwcIBwYKCAgICwoKCw4YEA4NDQ4dFRYRGCMfJSQiHyIhJis3LyYpNCkhIjBBMTQ5Oz4+PiUuRElDPEg3PT47/9sAQwEKCwsODQ4cEBAcOygiKDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7/8AAEQgAAQABAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEERUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBkQgUobHwFcHR4fEjJjNS8BVictNTocKS8fHy8/T19vf4+fr/2gAMAwEAAhEDEQA/AP38ooooA//Z"]
            }
            
            create_response = requests.post(f"{BASE_URL}/portfolio", json=portfolio_data, headers=headers)
            if create_response.status_code == 200:
                project_id = create_response.json().get("project_id")
                print(f"✅ POST /api/portfolio - Created project ID: {project_id}")
                
                # 4. Test delete portfolio project (if created successfully)
                if project_id:
                    delete_response = requests.delete(f"{BASE_URL}/portfolio/{project_id}", headers=headers)
                    if delete_response.status_code == 200:
                        print(f"✅ DELETE /api/portfolio/{project_id} - Success")
                    else:
                        print(f"❌ DELETE /api/portfolio/{project_id} failed - {delete_response.status_code}")
            else:
                print(f"❌ POST /api/portfolio failed - {create_response.status_code}: {create_response.text}")
        else:
            print(f"❌ Failed to get company profile - {profile_response.status_code}")
    else:
        print(f"❌ Company login failed - {login_response.status_code}")

if __name__ == "__main__":
    test_portfolio_endpoints()
