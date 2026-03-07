"""Google OAuth authentication routes."""

from fastapi import APIRouter, HTTPException, Request
from config import db
import jwt as pyjwt
from datetime import datetime, timezone, timedelta
import os
import logging
import httpx
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["google-auth"])

JWT_SECRET = os.environ.get("JWT_SECRET", "temadom_jwt_secret_key_2024")

# Google OAuth is configured via Emergent platform
# The frontend redirects to the backend which handles the flow
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")


@router.get("/google/login")
async def google_login(request: Request):
    """Redirect user to Google OAuth login."""
    origin = request.headers.get("origin") or request.headers.get("referer", "")
    if origin:
        origin = origin.split("/api")[0].rstrip("/")

    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth не е конфигуриран. Моля свържете се с администратор.")

    callback_url = f"{origin}/auth/callback" if origin else ""
    scope = "openid email profile"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={callback_url}"
        f"&response_type=code"
        f"&scope={scope}"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    return {"auth_url": auth_url}


@router.get("/google/callback")
async def google_callback(code: str, request: Request):
    """Handle Google OAuth callback, create/login user."""
    origin = request.headers.get("origin") or request.headers.get("referer", "")
    if origin:
        origin = origin.split("/auth")[0].split("/api")[0].rstrip("/")

    callback_url = f"{origin}/auth/callback" if origin else ""

    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth не е конфигуриран")

    # Exchange code for tokens
    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": callback_url,
            "grant_type": "authorization_code",
        })
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Google автентикацията се провали")
        tokens = token_resp.json()

        # Get user info
        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Не успях да получа данни от Google")
        user_info = user_resp.json()

    email = user_info.get("email", "")
    name = user_info.get("name", email.split("@")[0])
    picture = user_info.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Не бе получен имейл от Google")

    # Check if user exists
    existing = await db.users.find_one({"email": email}, {"_id": 0})

    if existing:
        token = pyjwt.encode(
            {"user_id": existing["id"], "exp": datetime.now(timezone.utc) + timedelta(days=30)},
            JWT_SECRET, algorithm="HS256"
        )
        return {"token": token, "user": existing, "is_new": False}
    else:
        user_id = str(uuid.uuid4())
        new_user = {
            "id": user_id,
            "name": name,
            "email": email,
            "password_hash": "",
            "user_type": "individual",
            "avatar": picture,
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "subscription_active": False,
            "subscription_plan": "basic",
        }
        await db.users.insert_one({**new_user, "_id": user_id})
        new_user.pop("password_hash", None)

        token = pyjwt.encode(
            {"user_id": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=30)},
            JWT_SECRET, algorithm="HS256"
        )
        return {"token": token, "user": new_user, "is_new": True}
