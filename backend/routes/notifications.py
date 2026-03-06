"""Notifications routes for TemaDom"""
from fastapi import APIRouter, Depends, Request, HTTPException
from datetime import datetime, timezone
import uuid

from config import db, get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
async def get_notifications(page: int = 1, limit: int = 20, user: dict = Depends(get_current_user)):
    """Get user notifications"""
    skip = (page - 1) * limit
    total = await db.notifications.count_documents({"user_id": user["id"]})
    unread = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    notifs = await db.notifications.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    return {"notifications": notifs, "total": total, "unread": unread, "page": page}


@router.get("/unread-count")
async def unread_count(user: dict = Depends(get_current_user)):
    """Get unread notification count"""
    count = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"unread": count}


@router.post("/mark-read")
async def mark_all_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    result = await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"marked": result.modified_count}


@router.post("/mark-read/{notif_id}")
async def mark_one_read(notif_id: str, user: dict = Depends(get_current_user)):
    """Mark single notification as read"""
    await db.notifications.update_one(
        {"id": notif_id, "user_id": user["id"]},
        {"$set": {"read": True}}
    )
    return {"ok": True}


@router.delete("/{notif_id}")
async def delete_notification(notif_id: str, user: dict = Depends(get_current_user)):
    """Delete a notification"""
    await db.notifications.delete_one({"id": notif_id, "user_id": user["id"]})
    return {"deleted": True}


async def create_notification(user_id: str, notif_type: str, title: str, message: str, link: str = "", data: dict = None):
    """Helper: Create a notification for a user"""
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "link": link,
        "data": data or {},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.notifications.insert_one(notif)
    return notif
