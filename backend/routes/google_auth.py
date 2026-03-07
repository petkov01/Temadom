"""
Google OAuth via Emergent Auth
Handles Google social login flow using Emergent's managed OAuth service.
"""
import httpx
import uuid
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/auth/google", tags=["google-auth"])

# These will be set from server.py
JWT_SECRET = None
db = None


def init(jwt_secret, database):
    global JWT_SECRET, db
    JWT_SECRET = jwt_secret
    db = database


@router.post("/callback")
async def google_auth_callback(data: dict):
    """
    Exchange Emergent session_id for user data and create/login user.
    Frontend sends the session_id from the URL fragment.
    """
    session_id = data.get("session_id", "").strip()
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id е задължителен")

    # Call Emergent Auth to get user data
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Невалидна Google сесия")
            google_data = resp.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Грешка при връзка с Google Auth")

    email = google_data.get("email", "").strip().lower()
    name = google_data.get("name", "")
    picture = google_data.get("picture", "")
    google_id = google_data.get("id", "")

    if not email:
        raise HTTPException(status_code=400, detail="Не е получен email от Google")

    # Find or create user
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})

    if existing_user:
        # Update Google info if missing
        if not existing_user.get("google_id"):
            await db.users.update_one(
                {"email": email},
                {"$set": {"google_id": google_id, "picture": picture}}
            )
        user_id = existing_user["id"]
        user_name = existing_user.get("name", name)
        user_type = existing_user.get("user_type", "client")
        is_new = False
    else:
        # Create new user
        user_id = str(uuid.uuid4())
        new_user = {
            "id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "google_id": google_id,
            "user_type": "client",
            "city": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "subscription_plan": None,
            "subscription_active": False,
        }
        await db.users.insert_one(new_user)
        user_name = name
        user_type = "client"
        is_new = True

    # Generate JWT token
    token = jwt.encode(
        {
            "user_id": user_id,
            "user_type": user_type,
            "exp": datetime.now(timezone.utc) + timedelta(days=30)
        },
        JWT_SECRET,
        algorithm="HS256"
    )

    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": user_name,
            "user_type": user_type,
            "picture": picture,
            "subscription_active": existing_user.get("subscription_active", False) if existing_user else False,
        },
        "is_new": is_new
    }
