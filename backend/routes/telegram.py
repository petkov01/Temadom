"""Telegram bot connection and notification routes."""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from config import db, get_current_user
from services.telegram import send_telegram_message, get_bot_info, process_telegram_update
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/telegram", tags=["telegram"])


@router.post("/webhook")
async def telegram_webhook(request: Request):
    """Receive Telegram bot updates via webhook."""
    try:
        update = await request.json()
        await process_telegram_update(update)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
    return {"ok": True}


class ConnectTelegramRequest(BaseModel):
    chat_id: str


class TestNotificationRequest(BaseModel):
    pass


@router.get("/bot-info")
async def telegram_bot_info():
    """Get Telegram bot info for display to users."""
    info = await get_bot_info()
    if info:
        return {
            "bot_name": info.get("first_name", "TemaDom Notify"),
            "bot_username": info.get("username", "temadom_notify_bot"),
            "bot_link": f"https://t.me/{info.get('username', 'temadom_notify_bot')}",
        }
    return {
        "bot_name": "TemaDom Notify",
        "bot_username": "temadom_notify_bot",
        "bot_link": "https://t.me/temadom_notify_bot",
    }


@router.post("/connect")
async def connect_telegram(req: ConnectTelegramRequest, user: dict = Depends(get_current_user)):
    """Connect a Telegram chat ID to a firm account."""
    if user.get("user_type") != "company":
        raise HTTPException(status_code=403, detail="Само за фирмени акаунти")

    plan = user.get("subscription_plan", "basic")
    if plan == "basic":
        raise HTTPException(status_code=403, detail="Telegram известията са достъпни от план ПРО")

    # Verify the chat_id works by sending a test message
    success = await send_telegram_message(
        req.chat_id,
        "<b>TemaDom</b>\n\nУспешно свързахте Telegram акаунта си! Ще получавате известия за нови запитвания."
    )

    if not success:
        raise HTTPException(status_code=400, detail="Не можах да изпратя съобщение. Уверете се, че сте стартирали бота (@temadom_notify_bot) и сте натиснали /start")

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"telegram_chat_id": req.chat_id, "telegram_connected": True}}
    )

    return {"success": True, "message": "Telegram е свързан успешно!"}


@router.delete("/disconnect")
async def disconnect_telegram(user: dict = Depends(get_current_user)):
    """Disconnect Telegram from a firm account."""
    await db.users.update_one(
        {"id": user["id"]},
        {"$unset": {"telegram_chat_id": "", "telegram_connected": ""}}
    )
    return {"success": True, "message": "Telegram е прекъснат"}


@router.post("/test")
async def test_telegram_notification(user: dict = Depends(get_current_user)):
    """Send a test notification to the connected Telegram."""
    chat_id = user.get("telegram_chat_id")
    if not chat_id:
        raise HTTPException(status_code=400, detail="Telegram не е свързан")

    success = await send_telegram_message(
        chat_id,
        "<b>Тестово известие от TemaDom</b>\n\nВсичко работи! Ще получавате известия за нови запитвания от клиенти."
    )

    if not success:
        raise HTTPException(status_code=500, detail="Грешка при изпращане на тестово известие")

    return {"success": True, "message": "Тестовото известие е изпратено!"}
