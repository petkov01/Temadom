"""Leaderboard routes for TemaDom platform."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid

from config import db, get_current_user

router = APIRouter(prefix="/api")

LEADERBOARD_POINTS = {
    "register": 10,
    "create_project": 20,
    "complete_project": 50,
    "leave_review": 15,
    "receive_review": 10,
    "portfolio_add": 10,
    "daily_login": 2,
    "referral": 30,
}


@router.post("/leaderboard/award")
async def award_points(data: dict, user: dict = Depends(get_current_user)):
    action = data.get("action", "")
    points = LEADERBOARD_POINTS.get(action, 0)
    if points == 0:
        raise HTTPException(status_code=400, detail="Невалидно действие")

    entry_id = str(uuid.uuid4())
    entry = {
        "id": entry_id,
        "user_id": user["id"],
        "user_type": user.get("user_type", "client"),
        "action": action,
        "points": points,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.leaderboard_log.insert_one(entry)

    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"leaderboard_points": points}}
    )
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "leaderboard_points": 1})
    return {"points_awarded": points, "total_points": updated.get("leaderboard_points", points), "action": action}


@router.get("/leaderboard/clients")
async def get_client_leaderboard(limit: int = 20):
    pipeline = [
        {"$match": {"user_type": "client"}},
        {"$project": {"_id": 0, "id": 1, "name": 1, "city": 1, "leaderboard_points": {"$ifNull": ["$leaderboard_points", 0]}}},
        {"$sort": {"leaderboard_points": -1}},
        {"$limit": limit}
    ]
    results = await db.users.aggregate(pipeline).to_list(length=limit)
    for i, r in enumerate(results):
        r["rank"] = i + 1
    return {"leaderboard": results, "type": "clients"}


@router.get("/leaderboard/firms")
async def get_firms_leaderboard(limit: int = 20):
    pipeline = [
        {"$match": {"user_type": {"$in": ["company", "master"]}}},
        {"$project": {"_id": 0, "id": 1, "name": 1, "city": 1, "user_type": 1, "leaderboard_points": {"$ifNull": ["$leaderboard_points", 0]}}},
        {"$sort": {"leaderboard_points": -1}},
        {"$limit": limit}
    ]
    results = await db.users.aggregate(pipeline).to_list(length=limit)
    for i, r in enumerate(results):
        r["rank"] = i + 1
    return {"leaderboard": results, "type": "firms"}


@router.get("/leaderboard/my-rank")
async def get_my_rank(user: dict = Depends(get_current_user)):
    user_type = user.get("user_type", "client")
    my_points = user.get("leaderboard_points", 0)

    if user_type == "client":
        match_filter = {"user_type": "client"}
    else:
        match_filter = {"user_type": {"$in": ["company", "master"]}}

    higher_count = await db.users.count_documents({
        **match_filter,
        "leaderboard_points": {"$gt": my_points}
    })

    total_in_category = await db.users.count_documents(match_filter)

    return {
        "rank": higher_count + 1,
        "total_points": my_points,
        "total_participants": total_in_category,
        "user_type": user_type
    }


@router.get("/leaderboard/points-config")
async def get_points_config():
    return {"points": LEADERBOARD_POINTS, "test_mode": True}
