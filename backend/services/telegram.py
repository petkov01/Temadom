"""Telegram notification service for TemaDom firms."""

import httpx
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}" if BOT_TOKEN else None


async def send_telegram_message(chat_id: str, text: str, parse_mode: str = "HTML") -> bool:
    """Send a message via Telegram bot."""
    if not TELEGRAM_API or not chat_id:
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(f"{TELEGRAM_API}/sendMessage", json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode,
            })
            if resp.status_code == 200:
                return True
            logger.warning(f"Telegram send failed: {resp.status_code} {resp.text}")
            return False
    except Exception as e:
        logger.error(f"Telegram error: {e}")
        return False


async def process_telegram_update(update: dict) -> None:
    """Process incoming Telegram bot update (webhook)."""
    message = update.get("message", {})
    text = message.get("text", "")
    chat_id = message.get("chat", {}).get("id")
    first_name = message.get("from", {}).get("first_name", "")

    if not chat_id:
        return

    if text == "/start":
        await send_telegram_message(
            str(chat_id),
            f"<b>Добре дошли в TemaDom Notify!</b>\n\n"
            f"Здравейте, {first_name}!\n\n"
            f"Вашият <b>Chat ID</b> е:\n"
            f"<code>{chat_id}</code>\n\n"
            f"Копирайте го и го поставете в профила си в TemaDom за да получавате известия за нови запитвания от клиенти."
        )
    elif text == "/help":
        await send_telegram_message(
            str(chat_id),
            "<b>TemaDom Notify Bot</b>\n\n"
            "/start — Получете вашия Chat ID\n"
            "/help — Помощ\n"
            "/status — Проверка на статус\n\n"
            "Свържете бота с профила си в TemaDom за автоматични известия."
        )
    elif text == "/status":
        await send_telegram_message(
            str(chat_id),
            f"<b>Статус</b>\n\n"
            f"Chat ID: <code>{chat_id}</code>\n"
            f"Бот: Активен\n\n"
            f"Ако сте свързали бота с TemaDom профила си, ще получавате автоматични известия."
        )


async def notify_firm_new_inquiry(db, firm_id: str, client_name: str, inquiry_type: str, details: str = ""):
    """Send Telegram notification to a firm about a new client inquiry."""
    firm = await db.users.find_one({"id": firm_id}, {"_id": 0})
    if not firm:
        return False

    chat_id = firm.get("telegram_chat_id")
    plan = firm.get("subscription_plan", "basic")
    if not chat_id or plan == "basic":
        return False

    text = (
        f"<b>Ново запитване в TemaDom</b>\n\n"
        f"Клиент: <b>{client_name}</b>\n"
        f"Тип: {inquiry_type}\n"
    )
    if details:
        text += f"Детайли: {details}\n"
    text += f"\nВлезте в TemaDom за повече информация."

    return await send_telegram_message(chat_id, text)


async def notify_firm_new_offer(db, firm_id: str, offer_title: str):
    """Notify firm when their offer gets a response."""
    firm = await db.users.find_one({"id": firm_id}, {"_id": 0})
    if not firm:
        return False

    chat_id = firm.get("telegram_chat_id")
    plan = firm.get("subscription_plan", "basic")
    if not chat_id or plan == "basic":
        return False

    text = (
        f"<b>Нов отговор на оферта</b>\n\n"
        f"Оферта: <b>{offer_title}</b>\n"
        f"\nВлезте в TemaDom за детайли."
    )
    return await send_telegram_message(chat_id, text)


async def get_bot_info() -> Optional[dict]:
    """Get bot info for display."""
    if not TELEGRAM_API:
        return None
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{TELEGRAM_API}/getMe")
            if resp.status_code == 200:
                return resp.json().get("result")
    except Exception:
        pass
    return None
