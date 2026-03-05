"""Leaderboard, Weekly Challenges & Referral routes for TemaDom platform."""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
import uuid

from config import db, get_current_user, get_optional_user

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
    "challenge_complete": 0,
}

# Weekly Challenges definitions (rotate weekly)
WEEKLY_CHALLENGES = [
    {
        "id": "publish_3_projects",
        "title": "Публикувай 3 проекта",
        "description": "Създай 3 нови проекта тази седмица",
        "action": "create_project",
        "target": 3,
        "bonus_points": 100,
        "icon": "Briefcase",
    },
    {
        "id": "leave_2_reviews",
        "title": "Остави 2 отзива",
        "description": "Напиши 2 отзива за фирми тази седмица",
        "action": "leave_review",
        "target": 2,
        "bonus_points": 50,
        "icon": "MessageSquare",
    },
    {
        "id": "add_3_portfolio",
        "title": "Добави 3 проекта в портфолиото",
        "description": "Покажи работата си с 3 нови портфолио проекта",
        "action": "portfolio_add",
        "target": 3,
        "bonus_points": 75,
        "icon": "Images",
    },
    {
        "id": "login_5_days",
        "title": "Влез 5 дни поред",
        "description": "Бъди активен — влез в платформата 5 дни тази седмица",
        "action": "daily_login",
        "target": 5,
        "bonus_points": 40,
        "icon": "Calendar",
    },
    {
        "id": "refer_2_friends",
        "title": "Покани 2 приятели",
        "description": "Препоръчай TemaDom на 2 приятели с твоя линк",
        "action": "referral",
        "target": 2,
        "bonus_points": 80,
        "icon": "UserPlus",
    },
]


def get_week_bounds():
    """Get ISO week start (Monday) and end (Sunday) in UTC."""
    now = datetime.now(timezone.utc)
    monday = now - timedelta(days=now.weekday())
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    sunday = monday + timedelta(days=6, hours=23, minutes=59, seconds=59)
    return monday.isoformat(), sunday.isoformat()


def get_active_challenges():
    """Pick 3 challenges for the current week based on week number."""
    now = datetime.now(timezone.utc)
    week_num = now.isocalendar()[1]
    indices = []
    for i in range(3):
        indices.append((week_num + i) % len(WEEKLY_CHALLENGES))
    return [WEEKLY_CHALLENGES[idx] for idx in indices]


# ============== LEADERBOARD ==============

@router.post("/leaderboard/award")
async def award_points(data: dict, user: dict = Depends(get_current_user)):
    action = data.get("action", "")
    points = LEADERBOARD_POINTS.get(action, 0)
    if points == 0:
        raise HTTPException(status_code=400, detail="Невалидно действие")

    entry = {
        "id": str(uuid.uuid4()),
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

    # Check weekly challenge completion
    await _check_challenge_completion(user["id"])

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


# ============== WEEKLY CHALLENGES ==============

@router.get("/challenges/active")
async def get_active_challenges_route():
    challenges = get_active_challenges()
    week_start, week_end = get_week_bounds()
    return {
        "challenges": challenges,
        "week_start": week_start,
        "week_end": week_end,
    }


@router.get("/challenges/my-progress")
async def get_my_challenge_progress(user: dict = Depends(get_current_user)):
    challenges = get_active_challenges()
    week_start, _ = get_week_bounds()

    progress = []
    for ch in challenges:
        # Count user actions of this type this week
        count = await db.leaderboard_log.count_documents({
            "user_id": user["id"],
            "action": ch["action"],
            "created_at": {"$gte": week_start}
        })

        # Check if already claimed
        claimed = await db.challenge_completions.find_one({
            "user_id": user["id"],
            "challenge_id": ch["id"],
            "week_start": week_start
        })

        completed = count >= ch["target"]
        progress.append({
            "challenge_id": ch["id"],
            "title": ch["title"],
            "description": ch["description"],
            "icon": ch["icon"],
            "action": ch["action"],
            "target": ch["target"],
            "current": min(count, ch["target"]),
            "completed": completed,
            "bonus_points": ch["bonus_points"],
            "claimed": bool(claimed),
        })

    return {"progress": progress}


@router.post("/challenges/claim")
async def claim_challenge_reward(data: dict, user: dict = Depends(get_current_user)):
    challenge_id = data.get("challenge_id", "")
    challenges = get_active_challenges()
    challenge = next((c for c in challenges if c["id"] == challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=400, detail="Невалидно предизвикателство")

    week_start, _ = get_week_bounds()

    # Check not already claimed
    already = await db.challenge_completions.find_one({
        "user_id": user["id"],
        "challenge_id": challenge_id,
        "week_start": week_start
    })
    if already:
        raise HTTPException(status_code=400, detail="Наградата вече е получена")

    # Verify completion
    count = await db.leaderboard_log.count_documents({
        "user_id": user["id"],
        "action": challenge["action"],
        "created_at": {"$gte": week_start}
    })
    if count < challenge["target"]:
        raise HTTPException(status_code=400, detail="Предизвикателството не е завършено")

    # Award bonus
    bonus = challenge["bonus_points"]
    await db.users.update_one({"id": user["id"]}, {"$inc": {"leaderboard_points": bonus}})
    await db.leaderboard_log.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_type": user.get("user_type", "client"),
        "action": "challenge_complete",
        "points": bonus,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.challenge_completions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "challenge_id": challenge_id,
        "bonus_points": bonus,
        "week_start": week_start,
        "claimed_at": datetime.now(timezone.utc).isoformat()
    })

    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "leaderboard_points": 1})
    return {
        "bonus_awarded": bonus,
        "total_points": updated.get("leaderboard_points", 0),
        "challenge_id": challenge_id
    }


async def _check_challenge_completion(user_id: str):
    """Background check — no-op, progress tracked client-side."""
    pass


# ============== REFERRAL SYSTEM ==============

@router.get("/referrals/my-link")
async def get_my_referral_link(request: Request, user: dict = Depends(get_current_user)):
    ref_code = user.get("referral_code")
    if not ref_code:
        ref_code = user["id"][:8]
        await db.users.update_one({"id": user["id"]}, {"$set": {"referral_code": ref_code}})

    base_url = str(request.base_url).rstrip("/")
    # Try to get frontend URL from referer or use base
    referer = request.headers.get("referer", "")
    if referer:
        from urllib.parse import urlparse
        parsed = urlparse(referer)
        frontend_url = f"{parsed.scheme}://{parsed.netloc}"
    else:
        frontend_url = base_url

    referral_link = f"{frontend_url}/register?ref={ref_code}"
    return {
        "referral_code": ref_code,
        "referral_link": referral_link,
        "points_per_referral": LEADERBOARD_POINTS["referral"]
    }


@router.get("/referrals/stats")
async def get_referral_stats(user: dict = Depends(get_current_user)):
    ref_code = user.get("referral_code", user["id"][:8])
    referral_count = await db.referrals.count_documents({"referrer_code": ref_code})
    total_points_earned = referral_count * LEADERBOARD_POINTS["referral"]

    recent = await db.referrals.find(
        {"referrer_code": ref_code},
        {"_id": 0, "referred_name": 1, "created_at": 1}
    ).sort("created_at", -1).limit(10).to_list(length=10)

    return {
        "referral_code": ref_code,
        "referral_count": referral_count,
        "total_points_earned": total_points_earned,
        "points_per_referral": LEADERBOARD_POINTS["referral"],
        "recent_referrals": recent
    }


@router.post("/referrals/apply")
async def apply_referral_code(data: dict):
    """Called during registration to award points to referrer."""
    ref_code = data.get("referral_code", "").strip()
    new_user_id = data.get("new_user_id", "")
    new_user_name = data.get("new_user_name", "")

    if not ref_code or not new_user_id:
        raise HTTPException(status_code=400, detail="Липсващи данни")

    # Find referrer by code
    referrer = await db.users.find_one({"referral_code": ref_code}, {"_id": 0})
    if not referrer:
        # Try matching first 8 chars of any user ID
        all_users = await db.users.find({}, {"_id": 0, "id": 1}).to_list(length=10000)
        referrer = None
        for u in all_users:
            if u["id"][:8] == ref_code:
                referrer = await db.users.find_one({"id": u["id"]}, {"_id": 0})
                break

    if not referrer:
        return {"applied": False, "reason": "Невалиден реферален код"}

    if referrer["id"] == new_user_id:
        return {"applied": False, "reason": "Не може да използвате собствения си код"}

    # Check not already referred
    existing = await db.referrals.find_one({
        "referrer_code": ref_code,
        "referred_user_id": new_user_id
    })
    if existing:
        return {"applied": False, "reason": "Вече сте били препоръчани"}

    # Record referral
    await db.referrals.insert_one({
        "id": str(uuid.uuid4()),
        "referrer_code": ref_code,
        "referrer_id": referrer["id"],
        "referred_user_id": new_user_id,
        "referred_name": new_user_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Award points to referrer
    points = LEADERBOARD_POINTS["referral"]
    await db.users.update_one({"id": referrer["id"]}, {"$inc": {"leaderboard_points": points}})
    await db.leaderboard_log.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": referrer["id"],
        "user_type": referrer.get("user_type", "client"),
        "action": "referral",
        "points": points,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"applied": True, "referrer_name": referrer.get("name", ""), "points_awarded_to_referrer": points}
