from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
import json as json_module
import re as re_module
import base64
import cv2
import tempfile
import numpy as np

# Import shared config
from config import (
    db, client, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS,
    STRIPE_API_KEY, TELEGRAM_BOT_TOKEN, EMERGENT_LLM_KEY,
    PLATFORM_FREE, TEST_MODE, AI_DESIGN_GLOBAL_FREE_LIMIT, AI_DESIGN_PER_PROFILE_LIMIT,
    BG_STORES, SUBSCRIPTION_PLANS,
    security, hash_password, verify_password, create_token, decode_token,
    get_current_user, get_optional_user, ROOT_DIR
)

# Import models
from models import (
    UserBase, UserCreate, UserLogin, User,
    CompanyProfile, ProjectCreate, Project,
    ReviewCreate, Review, PaymentTransaction,
    PortfolioProjectCreate, PortfolioProject,
    Scanner3DPDFRequest, AIChartAnalyzeRequest, AIChartPDFRequest,
    Scanner3DProjectSave,
    FREE_LEADS_LIMIT, CALCULATOR_FREE_USES, CALCULATOR_PAY_AMOUNT,
    BLOCKED_PATTERNS, contains_contact_info, censor_contact_info
)

# App is configured via config.py imports above


# Analytics password
ANALYTICS_ADMIN_PASSWORD = os.environ.get("ANALYTICS_PASSWORD", "temadom2026")

# Payment packages (server-side only - security) - DISABLED while PLATFORM_FREE
PAYMENT_PACKAGES = {
    "subscription": {"amount": 100.00, "currency": "eur", "type": "subscription", "name": "Месечен абонамент"},
    "single_lead": {"amount": 25.00, "currency": "eur", "type": "one_time", "name": "Единичен контакт"},
    "basic_1": {"amount": 15.00, "currency": "eur", "type": "subscription", "name": "БАЗОВ — 1 месец", "months": 1},
    "basic_3": {"amount": 39.00, "currency": "eur", "type": "subscription", "name": "БАЗОВ — 3 месеца", "months": 3},
    "basic_6": {"amount": 69.00, "currency": "eur", "type": "subscription", "name": "БАЗОВ — 6 месеца", "months": 6},
    "basic_12": {"amount": 119.00, "currency": "eur", "type": "subscription", "name": "БАЗОВ — 12 месеца", "months": 12},
    "pro_1": {"amount": 35.00, "currency": "eur", "type": "subscription", "name": "ПРО — 1 месец", "months": 1},
    "pro_3": {"amount": 89.00, "currency": "eur", "type": "subscription", "name": "ПРО — 3 месеца", "months": 3},
    "pro_6": {"amount": 159.00, "currency": "eur", "type": "subscription", "name": "ПРО — 6 месеца", "months": 6},
    "pro_12": {"amount": 269.00, "currency": "eur", "type": "subscription", "name": "ПРО — 12 месеца", "months": 12},
    "premium_1": {"amount": 75.00, "currency": "eur", "type": "subscription", "name": "PREMIUM — 1 месец", "months": 1},
    "premium_3": {"amount": 189.00, "currency": "eur", "type": "subscription", "name": "PREMIUM — 3 месеца", "months": 3},
    "premium_6": {"amount": 339.00, "currency": "eur", "type": "subscription", "name": "PREMIUM — 6 месеца", "months": 6},
    "premium_12": {"amount": 569.00, "currency": "eur", "type": "subscription", "name": "PREMIUM — 12 месеца", "months": 12},
    "design_1room": {"amount": 69.00, "currency": "eur", "type": "one_time", "name": "3D Дизайн — 1 стая"},
    "design_2room": {"amount": 129.00, "currency": "eur", "type": "one_time", "name": "3D Дизайн — 2 стаи"},
    "design_5room": {"amount": 199.00, "currency": "eur", "type": "one_time", "name": "3D Дизайн — 5 стаи"},
}

# Create the main app
app = FastAPI(title="Maistori Marketplace API")
api_router = APIRouter(prefix="/api")

# ==================== AFFILIATE CONFIG ====================
# Affiliate ref parameters for each store (monetization)
AFFILIATE_CONFIG = {
    "ref_id": "temadom",  # Default affiliate/referral ID
    "stores": {
        "Praktiker":     {"param": "utm_source", "ref": "temadom", "extra": "&utm_medium=affiliate&utm_campaign=temadom"},
        "Mr.Bricolage":  {"param": "ref", "ref": "temadom"},
        "Jysk":          {"param": "utm_source", "ref": "temadom", "extra": "&utm_medium=affiliate"},
        "HomeMax":       {"param": "ref", "ref": "temadom"},
        "Bauhaus":       {"param": "utm_source", "ref": "temadom", "extra": "&utm_medium=affiliate"},
        "eMAG":          {"param": "ref", "ref": "temadom"},
        "IKEA":          {"param": "utm_source", "ref": "temadom", "extra": "&utm_medium=affiliate"},
        "Teknoimpex":    {"param": "ref", "ref": "temadom"},
        "Technomarket":  {"param": "ref", "ref": "temadom"},
    }
}

def make_affiliate_url(url: str, store_name: str = "") -> str:
    """Add affiliate tracking parameters to any store URL."""
    if not url or not url.startswith("http"):
        return url
    config = AFFILIATE_CONFIG["stores"].get(store_name, {})
    param = config.get("param", "ref")
    ref = config.get("ref", AFFILIATE_CONFIG["ref_id"])
    extra = config.get("extra", "")
    separator = "&" if "?" in url else "?"
    return f"{url}{separator}{param}={ref}{extra}"

# Categories for construction/renovation
CATEGORIES = [
    {"id": "electricity", "name": "Електричество", "icon": "Zap"},
    {"id": "plumbing", "name": "ВиК", "icon": "Droplets"},
    {"id": "painting", "name": "Боядисване", "icon": "Paintbrush"},
    {"id": "concrete", "name": "Бетон", "icon": "Boxes"},
    {"id": "reinforcement", "name": "Арматура", "icon": "Grid3x3"},
    {"id": "tiling", "name": "Фаянс и теракота", "icon": "LayoutGrid"},
    {"id": "flooring", "name": "Подови настилки", "icon": "Square"},
    {"id": "roofing", "name": "Покриви", "icon": "Home"},
    {"id": "windows", "name": "Дограма", "icon": "AppWindow"},
    {"id": "hvac", "name": "Отопление и климатизация", "icon": "Thermometer"},
    {"id": "insulation", "name": "Изолация", "icon": "Layers"},
    {"id": "demolition", "name": "Събаряне", "icon": "Hammer"},
    {"id": "masonry", "name": "Зидария", "icon": "BrickWall"},
    {"id": "carpentry", "name": "Дърводелство", "icon": "Axe"},
    {"id": "general", "name": "Общо строителство", "icon": "Building2"}
]

# Bulgaria's 28 regions (области) - 2 free firm slots each = 56 total
BULGARIA_REGIONS = {
    "Благоевград": "Благоевград", "Бургас": "Бургас", "Варна": "Варна",
    "Велико Търново": "Велико Търново", "Видин": "Видин", "Враца": "Враца",
    "Габрово": "Габрово", "Добрич": "Добрич", "Кърджали": "Кърджали",
    "Кюстендил": "Кюстендил", "Ловеч": "Ловеч", "Монтана": "Монтана",
    "Пазарджик": "Пазарджик", "Перник": "Перник", "Плевен": "Плевен",
    "Пловдив": "Пловдив", "Разград": "Разград", "Русе": "Русе",
    "Силистра": "Силистра", "Сливен": "Сливен", "Смолян": "Смолян",
    "София": "София", "София-град": "София-град", "Стара Загора": "Стара Загора",
    "Търговище": "Търговище", "Хасково": "Хасково", "Шумен": "Шумен",
    "Ямбол": "Ямбол"
}
FREE_FIRMS_PER_REGION = 2

def get_region_from_city(city: str) -> str:
    """Map a city name to its region. If exact match fails, check if city contains region name."""
    if not city:
        return "София-град"
    city_clean = city.strip()
    # Direct match
    if city_clean in BULGARIA_REGIONS:
        return BULGARIA_REGIONS[city_clean]
    # Check if any region name is contained in city
    for region in BULGARIA_REGIONS:
        if region.lower() in city_clean.lower() or city_clean.lower() in region.lower():
            return BULGARIA_REGIONS[region]
    # Default to Sofia
    return "София-град"


# ============== TEST AI ENDPOINT ==============

@api_router.post("/test-ai")
async def test_ai():
    """Diagnostic endpoint to check if AI (OpenAI) connection works."""
    if not EMERGENT_LLM_KEY:
        return {"error": "EMERGENT_LLM_KEY not configured", "code": "missing_key"}
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"test-ai-{uuid.uuid4()}",
            system_message="You are a test assistant."
        ).with_model("openai", "gpt-4o-mini")
        response = await chat.send_message(UserMessage(text="Say OK"))
        return {"status": "AI OK", "model": "gpt-4o-mini", "response": response[:100]}
    except Exception as e:
        error_str = str(e)
        code = None
        if hasattr(e, 'code'):
            code = e.code
        elif '401' in error_str or '403' in error_str:
            code = 'auth_error'
        elif '429' in error_str:
            code = 'rate_limit'
        elif 'timeout' in error_str.lower():
            code = 'timeout'
        return {"error": error_str, "code": code}


# ============== AUTH ROUTES ==============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Този имейл вече е регистриран")
    
    # Validate user_type
    if user_data.user_type not in ("client", "company", "master", "designer"):
        raise HTTPException(status_code=400, detail="Невалиден тип потребител")
    
    # Validate bulstat for companies
    if user_data.user_type == "company":
        if not user_data.bulstat or not user_data.bulstat.strip():
            raise HTTPException(status_code=400, detail="Булстатът е задължителен за фирми")
        bulstat = user_data.bulstat.strip()
        if not bulstat.isdigit() or len(bulstat) != 9:
            raise HTTPException(status_code=400, detail="Булстатът трябва да е точно 9 цифри")
        # Check if bulstat already registered
        existing_bulstat = await db.users.find_one({"bulstat": bulstat})
        if existing_bulstat:
            raise HTTPException(status_code=400, detail="Този Булстат вече е регистриран")
        
        # Check regional limit for free firms (2 per region)
        region = get_region_from_city(user_data.city)
        region_count = await db.company_profiles.count_documents({
            "city": {"$regex": f".*{region}.*", "$options": "i"},
            "user_type": "company"
        })
        if region_count >= FREE_FIRMS_PER_REGION:
            raise HTTPException(
                status_code=400, 
                detail=f"Лимитът от {FREE_FIRMS_PER_REGION} безплатни фирми за област {region} е достигнат. Моля, свържете се с нас за платен абонамент."
            )
    
    # Create user
    user_dict = user_data.model_dump()
    password = user_dict.pop("password")
    user_dict["password_hash"] = hash_password(password)
    user_dict["id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["is_active"] = True
    user_dict["subscription_active"] = False
    user_dict["subscription_expires"] = None
    user_dict["purchased_leads"] = []
    
    await db.users.insert_one(user_dict)
    
    # Create company/master/designer profile
    if user_data.user_type in ("company", "master", "designer"):
        profile = {
            "id": str(uuid.uuid4()),
            "user_id": user_dict["id"],
            "company_name": user_data.name,
            "description": None,
            "categories": [],
            "city": user_data.city,
            "region": get_region_from_city(user_data.city),
            "address": None,
            "website": None,
            "logo_url": None,
            "portfolio_images": [],
            "rating": 0.0,
            "review_count": 0,
            "bulstat": user_data.bulstat if user_data.user_type == "company" else None,
            "user_type": user_data.user_type,
            "subscription_plan": None,
            "subscription_active": False,
            "subscription_expires": None,
            "ai_designs_used": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.company_profiles.insert_one(profile)
    
    token = create_token(user_dict["id"], user_dict["user_type"])
    
    return {
        "token": token,
        "user": {
            "id": user_dict["id"],
            "email": user_dict["email"],
            "name": user_dict["name"],
            "user_type": user_dict["user_type"],
            "subscription_active": user_dict["subscription_active"]
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Грешен имейл или парола")
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Грешен имейл или парола")
    
    token = create_token(user["id"], user["user_type"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "user_type": user["user_type"],
            "subscription_active": user.get("subscription_active", False)
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "phone": user.get("phone"),
        "city": user.get("city"),
        "telegram_username": user.get("telegram_username"),
        "bulstat": user.get("bulstat"),
        "company_name": user.get("company_name"),
        "description": user.get("description"),
        "website": user.get("website"),
        "user_type": user["user_type"],
        "subscription_active": user.get("subscription_active", False),
        "subscription_expires": user.get("subscription_expires"),
        "purchased_leads": user.get("purchased_leads", []),
        "free_leads_used": user.get("free_leads_used", 0),
        "calculator_uses": user.get("calculator_uses", 0),
        "avatar": user.get("avatar_b64"),
        "created_at": user.get("created_at")
    }


@api_router.put("/auth/profile")
async def update_profile(request: Request, user: dict = Depends(get_current_user)):
    data = await request.json()
    allowed = {"name", "company_name", "bulstat", "city", "description", "website"}
    updates = {k: v for k, v in data.items() if k in allowed and v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Няма данни за обновяване")

    await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return {
        "id": updated["id"],
        "email": updated["email"],
        "name": updated.get("name"),
        "company_name": updated.get("company_name"),
        "bulstat": updated.get("bulstat"),
        "city": updated.get("city"),
        "description": updated.get("description"),
        "website": updated.get("website"),
        "user_type": updated["user_type"],
        "subscription_active": updated.get("subscription_active", False),
        "created_at": updated.get("created_at")
    }


@api_router.post("/auth/avatar")
async def upload_avatar(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload profile avatar image."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Само снимки (JPG/PNG)")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Макс. 5MB")
    avatar_b64 = base64.b64encode(contents).decode('utf-8')
    await db.users.update_one({"id": user["id"]}, {"$set": {"avatar_b64": avatar_b64}})
    return {"avatar": avatar_b64}


@api_router.get("/auth/avatar/{user_id}")
async def get_avatar(user_id: str):
    """Get user avatar by user_id."""
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "avatar_b64": 1})
    if not u or not u.get("avatar_b64"):
        raise HTTPException(status_code=404, detail="Няма аватар")
    return {"avatar": u["avatar_b64"]}



# ============== CATEGORIES ROUTES ==============

@api_router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}

# ============== PROJECTS ROUTES ==============

@api_router.post("/projects")
async def create_project(project_data: ProjectCreate, user: dict = Depends(get_current_user)):
    if user["user_type"] != "client":
        raise HTTPException(status_code=403, detail="Само клиенти могат да създават проекти")
    
    project_dict = project_data.model_dump()
    project_dict["id"] = str(uuid.uuid4())
    project_dict["client_id"] = user["id"]
    project_dict["client_name"] = user["name"]
    project_dict["client_email"] = user["email"]
    project_dict["client_phone"] = user.get("phone", "")
    project_dict["status"] = "active"
    project_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    project_dict["views"] = 0
    project_dict["purchases"] = 0
    # Limit images to 10
    project_dict["images"] = project_dict.get("images", [])[:10]
    
    await db.projects.insert_one(project_dict)
    
    # Notify companies via Telegram about new project
    try:
        await notify_companies_new_project(project_dict)
    except Exception as e:
        logging.error(f"Telegram notification error: {e}")
    
    return {"message": "Проектът е създаден успешно", "project_id": project_dict["id"]}

@api_router.get("/projects")
async def get_projects(
    category: Optional[str] = None,
    city: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 12,
    user: Optional[dict] = Depends(get_optional_user)
):
    query = {"status": "active"}
    
    if category:
        query["category"] = category
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    total = await db.projects.count_documents(query)
    
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Process projects - PLATFORM IS FREE, show all contacts
    processed_projects = []
    for p in projects:
        project = dict(p)
        # Free platform: all contacts are unlocked
        project["contact_locked"] = False
        
        # Get category name
        cat = next((c for c in CATEGORIES if c["id"] == project.get("category")), None)
        project["category_name"] = cat["name"] if cat else project.get("category")
        
        processed_projects.append(project)
    
    return {
        "projects": processed_projects,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, user: Optional[dict] = Depends(get_optional_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    
    # Increment views
    await db.projects.update_one({"id": project_id}, {"$inc": {"views": 1}})
    project["views"] = project.get("views", 0) + 1
    
    # PLATFORM IS FREE - all contacts are unlocked
    project["contact_locked"] = False
    
    # Get category name
    cat = next((c for c in CATEGORIES if c["id"] == project.get("category")), None)
    project["category_name"] = cat["name"] if cat else project.get("category")
    
    return project

@api_router.get("/my-projects")
async def get_my_projects(user: dict = Depends(get_current_user)):
    if user["user_type"] != "client":
        raise HTTPException(status_code=403, detail="Тази функция е само за клиенти")
    
    projects = await db.projects.find({"client_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for p in projects:
        cat = next((c for c in CATEGORIES if c["id"] == p.get("category")), None)
        p["category_name"] = cat["name"] if cat else p.get("category")
    
    return {"projects": projects}

# ============== COMPANY PROFILE ROUTES ==============

@api_router.get("/companies")
async def get_companies(
    category: Optional[str] = None,
    city: Optional[str] = None,
    min_rating: Optional[float] = None,
    user_type: Optional[str] = None,
    page: int = 1,
    limit: int = 12
):
    query = {}
    
    if category:
        query["categories"] = category
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    if user_type and user_type in ("company", "master"):
        query["user_type"] = user_type
    
    skip = (page - 1) * limit
    total = await db.company_profiles.count_documents(query)
    
    companies = await db.company_profiles.find(query, {"_id": 0}).sort("rating", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "companies": companies,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/companies/{company_id}")
async def get_company(company_id: str):
    company = await db.company_profiles.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Фирмата не е намерена")
    
    # Get reviews
    reviews = await db.reviews.find({"company_id": company_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    return {**company, "reviews": reviews}

@api_router.put("/companies/profile")
async def update_company_profile(
    profile_data: dict,
    user: dict = Depends(get_current_user)
):
    if user["user_type"] not in ("company", "master"):
        raise HTTPException(status_code=403, detail="Само фирми и майстори могат да редактират профила си")
    
    # Find existing profile
    profile = await db.company_profiles.find_one({"user_id": user["id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Профилът не е намерен")
    
    # Update allowed fields only
    allowed_fields = ["company_name", "description", "categories", "city", "address", "website", "logo_url", "portfolio_images"]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    await db.company_profiles.update_one(
        {"user_id": user["id"]},
        {"$set": update_data}
    )
    
    return {"message": "Профилът е актуализиран успешно"}

@api_router.get("/my-company")
async def get_my_company(user: dict = Depends(get_current_user)):
    if user["user_type"] not in ("company", "master"):
        raise HTTPException(status_code=403, detail="Тази функция е само за фирми и майстори")
    
    profile = await db.company_profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Профилът не е намерен")
    
    return profile

# ============== PORTFOLIO ROUTES ==============

@api_router.get("/portfolio/{company_id}")
async def get_company_portfolio(company_id: str):
    """Get all portfolio projects for a company"""
    projects = await db.portfolio_projects.find(
        {"company_id": company_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"projects": projects}

@api_router.post("/portfolio")
async def add_portfolio_project(
    project_data: PortfolioProjectCreate, 
    user: dict = Depends(get_current_user)
):
    """Add a new portfolio project (company/master only)"""
    if user["user_type"] not in ("company", "master"):
        raise HTTPException(status_code=403, detail="Само фирми и майстори могат да добавят проекти в портфолиото")
    
    # Get company profile
    profile = await db.company_profiles.find_one({"user_id": user["id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Профилът не е намерен")
    
    project_dict = {
        "id": str(uuid.uuid4()),
        "company_id": profile["id"],
        "title": project_data.title,
        "description": project_data.description,
        "category": project_data.category,
        "location": project_data.location,
        "before_images": project_data.before_images[:5],  # Limit to 5
        "after_images": project_data.after_images[:5],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.portfolio_projects.insert_one(project_dict)
    
    return {"message": "Проектът е добавен успешно", "project_id": project_dict["id"]}

@api_router.delete("/portfolio/{project_id}")
async def delete_portfolio_project(project_id: str, user: dict = Depends(get_current_user)):
    """Delete a portfolio project (owner only)"""
    if user["user_type"] not in ("company", "master"):
        raise HTTPException(status_code=403, detail="Само фирми и майстори могат да изтриват проекти")
    
    # Get company profile
    profile = await db.company_profiles.find_one({"user_id": user["id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Профилът не е намерен")
    
    # Check ownership
    project = await db.portfolio_projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    
    if project["company_id"] != profile["id"]:
        raise HTTPException(status_code=403, detail="Нямате права да изтривате този проект")
    
    await db.portfolio_projects.delete_one({"id": project_id})
    
    return {"message": "Проектът е изтрит успешно"}

@api_router.get("/my-portfolio")
async def get_my_portfolio(user: dict = Depends(get_current_user)):
    """Get portfolio for current company/master user"""
    if user["user_type"] not in ("company", "master"):
        raise HTTPException(status_code=403, detail="Тази функция е само за фирми и майстори")
    
    profile = await db.company_profiles.find_one({"user_id": user["id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Профилът не е намерен")
    
    projects = await db.portfolio_projects.find(
        {"company_id": profile["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"projects": projects}

# ============== REVIEWS ROUTES ==============

@api_router.post("/reviews")
async def create_review(review_data: ReviewCreate, user: dict = Depends(get_current_user)):
    if user["user_type"] != "client":
        raise HTTPException(status_code=403, detail="Само клиенти могат да оставят отзиви")
    
    # Validate rating
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Рейтингът трябва да е между 1 и 5")
    
    # Check company exists
    company = await db.company_profiles.find_one({"id": review_data.company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Фирмата не е намерена")
    
    # Create review
    review_dict = {
        "id": str(uuid.uuid4()),
        "company_id": review_data.company_id,
        "client_id": user["id"],
        "client_name": user["name"],
        "rating": review_data.rating,
        "comment": review_data.comment,
        "project_id": review_data.project_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_dict)
    
    # Update company rating
    all_reviews = await db.reviews.find({"company_id": review_data.company_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    
    await db.company_profiles.update_one(
        {"id": review_data.company_id},
        {"$set": {"rating": round(avg_rating, 1), "review_count": len(all_reviews)}}
    )
    
    return {"message": "Отзивът е добавен успешно"}

@api_router.get("/reviews/{company_id}")
async def get_company_reviews(company_id: str):
    reviews = await db.reviews.find({"company_id": company_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"reviews": reviews}

# ============== PAYMENT ROUTES ==============

@api_router.post("/payments/checkout")
async def create_checkout(
    request: Request,
    package_type: str,
    project_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    if user["user_type"] not in ("company", "master") and package_type in ("single_lead",):
        raise HTTPException(status_code=403, detail="Само фирми и майстори могат да закупуват контакти")
    
    if package_type not in PAYMENT_PACKAGES:
        raise HTTPException(status_code=400, detail="Невалиден пакет")
    
    package = PAYMENT_PACKAGES[package_type]
    
    # For single lead, verify project exists and not already purchased
    if package_type == "single_lead":
        if not project_id:
            raise HTTPException(status_code=400, detail="Необходим е проект за единичен контакт")
        
        project = await db.projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Проектът не е намерен")
        
        if project_id in user.get("purchased_leads", []):
            raise HTTPException(status_code=400, detail="Вече сте закупили този контакт")
    
    # Get origin from request
    origin = request.headers.get("origin", str(request.base_url).rstrip("/"))
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/payment/cancel"
    
    # Create Stripe checkout
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    metadata = {
        "user_id": user["id"],
        "package_type": package_type,
        "project_id": project_id or ""
    }
    
    checkout_request = CheckoutSessionRequest(
        amount=package["amount"],
        currency=package["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": session.session_id,
        "package_type": package_type,
        "amount": package["amount"],
        "currency": package["currency"],
        "status": "pending",
        "payment_status": "pending",
        "project_id": project_id,
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.payment_transactions.insert_one(transaction)
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, user: dict = Depends(get_current_user)):
    # Find transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Транзакцията не е намерена")
    
    if transaction["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Нямате достъп до тази транзакция")
    
    # If already processed, return cached status
    if transaction["status"] in ["completed", "failed", "expired"]:
        return transaction
    
    # Check with Stripe
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        new_status = "pending"
        if status.payment_status == "paid":
            new_status = "completed"
        elif status.status == "expired":
            new_status = "expired"
        
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": new_status,
                "payment_status": status.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # If payment successful, grant access
        if new_status == "completed" and transaction["status"] != "completed":
            await grant_access(transaction)
        
        transaction["status"] = new_status
        transaction["payment_status"] = status.payment_status
        
    except Exception as e:
        logging.error(f"Error checking payment status: {e}")
    
    return transaction

async def grant_access(transaction: dict):
    """Grant access after successful payment"""
    user_id = transaction["user_id"]
    package_type = transaction["package_type"]
    project_id = transaction.get("project_id")
    
    pkg = PAYMENT_PACKAGES.get(package_type, {})
    months = pkg.get("months", 0)

    if months > 0 or package_type == "subscription":
        # Grant subscription
        sub_days = months * 30 if months > 0 else 30
        expires = datetime.now(timezone.utc) + timedelta(days=sub_days)
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "subscription_active": True,
                "subscription_plan": package_type,
                "subscription_start": datetime.now(timezone.utc).isoformat(),
                "subscription_expires": expires.isoformat(),
            }}
        )
    elif package_type == "single_lead" and project_id:
        # Add project to purchased leads
        await db.users.update_one(
            {"id": user_id},
            {"$addToSet": {"purchased_leads": project_id}}
        )
        # Increment purchase count
        await db.projects.update_one(
            {"id": project_id},
            {"$inc": {"purchases": 1}}
        )
    elif package_type == "calculator_use":
        # Grant 5 more calculator uses
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"calculator_uses": -5}}  # Reset 5 uses
        )

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        event = await stripe_checkout.handle_webhook(body, signature)
        
        if event.payment_status == "paid":
            # Find and update transaction
            transaction = await db.payment_transactions.find_one(
                {"session_id": event.session_id},
                {"_id": 0}
            )
            
            if transaction and transaction["status"] != "completed":
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {
                        "status": "completed",
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                await grant_access(transaction)
        
        return {"received": True}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"received": True}

@api_router.get("/payments/history")
async def get_payment_history(user: dict = Depends(get_current_user)):
    transactions = await db.payment_transactions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"transactions": transactions}

# ============== PURCHASED LEADS ROUTES ==============

@api_router.get("/my-leads")
async def get_my_leads(user: dict = Depends(get_current_user)):
    if user["user_type"] not in ("company", "master"):
        raise HTTPException(status_code=403, detail="Тази функция е само за фирми и майстори")
    
    purchased_ids = user.get("purchased_leads", [])
    has_subscription = user.get("subscription_active", False)
    free_leads_used = user.get("free_leads_used", 0)
    free_leads_remaining = max(0, FREE_LEADS_LIMIT - free_leads_used)
    
    if has_subscription:
        # Return all active projects
        projects = await db.projects.find({"status": "active"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        # Return only purchased projects
        if not purchased_ids:
            return {
                "leads": [], 
                "subscription_active": False,
                "free_leads_used": free_leads_used,
                "free_leads_remaining": free_leads_remaining
            }
        projects = await db.projects.find({"id": {"$in": purchased_ids}}, {"_id": 0}).to_list(100)
    
    for p in projects:
        cat = next((c for c in CATEGORIES if c["id"] == p.get("category")), None)
        p["category_name"] = cat["name"] if cat else p.get("category")
        p["contact_locked"] = False
    
    return {
        "leads": projects,
        "subscription_active": has_subscription,
        "subscription_expires": user.get("subscription_expires"),
        "free_leads_used": free_leads_used,
        "free_leads_remaining": free_leads_remaining
    }

@api_router.post("/leads/claim-free/{project_id}")
async def claim_free_lead(project_id: str, user: dict = Depends(get_current_user)):
    """Claim a free lead (first 3 are free for new companies)"""
    if user["user_type"] not in ("company", "master"):
        raise HTTPException(status_code=403, detail="Само фирми и майстори могат да вземат контакти")
    
    # Check if already has this lead
    if project_id in user.get("purchased_leads", []):
        raise HTTPException(status_code=400, detail="Вече имате този контакт")
    
    # Check if has subscription
    if user.get("subscription_active"):
        raise HTTPException(status_code=400, detail="Имате активен абонамент - всички контакти са достъпни")
    
    # Check free leads limit
    free_leads_used = user.get("free_leads_used", 0)
    if free_leads_used >= FREE_LEADS_LIMIT:
        raise HTTPException(status_code=400, detail="Изчерпахте безплатните контакти. Моля, закупете абонамент или единичен контакт.")
    
    # Verify project exists
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    
    # Grant free lead
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$addToSet": {"purchased_leads": project_id},
            "$inc": {"free_leads_used": 1}
        }
    )
    
    # Increment purchase count on project
    await db.projects.update_one(
        {"id": project_id},
        {"$inc": {"purchases": 1}}
    )
    
    remaining = FREE_LEADS_LIMIT - free_leads_used - 1
    
    return {
        "message": f"Контактът е добавен безплатно! Остават ви {remaining} безплатни контакта.",
        "free_leads_remaining": remaining
    }

@api_router.get("/leads/free-status")
async def get_free_leads_status(user: dict = Depends(get_current_user)):
    """Get free leads status for current company"""
    if user["user_type"] not in ("company", "master"):
        raise HTTPException(status_code=403, detail="Тази функция е само за фирми и майстори")
    
    free_leads_used = user.get("free_leads_used", 0)
    free_leads_remaining = max(0, FREE_LEADS_LIMIT - free_leads_used)
    
    return {
        "free_leads_limit": FREE_LEADS_LIMIT,
        "free_leads_used": free_leads_used,
        "free_leads_remaining": free_leads_remaining,
        "subscription_active": user.get("subscription_active", False)
    }

# ============== STATS ROUTES ==============

# ============== CALCULATOR USAGE TRACKING ==============

@api_router.post("/calculator/log-use")
async def log_calculator_use(user: dict = Depends(get_current_user)):
    """Log a calculator use. PLATFORM IS FREE - always allowed."""
    return {"allowed": True, "remaining": -1}

@api_router.get("/calculator/status")
async def get_calculator_status(user: dict = Depends(get_current_user)):
    """Get calculator usage status. PLATFORM IS FREE - unlimited."""
    return {"unlimited": True, "uses": 0, "remaining": -1}

@api_router.post("/calculator/pay")
async def pay_calculator_use(request: Request, user: dict = Depends(get_current_user)):
    """Create Stripe checkout for calculator usage payment (€10)"""
    if user["user_type"] not in ("company", "master"):
        raise HTTPException(status_code=403, detail="Само фирми и майстори")
    
    origin = request.headers.get("origin", str(request.base_url).rstrip("/"))
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    success_url = f"{origin}/calculator?paid=true"
    cancel_url = f"{origin}/calculator?paid=false"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    metadata = {"user_id": user["id"], "package_type": "calculator_use"}
    
    checkout_request = CheckoutSessionRequest(
        amount=CALCULATOR_PAY_AMOUNT,
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": session.session_id,
        "package_type": "calculator_use",
        "amount": CALCULATOR_PAY_AMOUNT,
        "currency": "eur",
        "status": "pending",
        "payment_status": "pending",
        "project_id": None,
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)
    
    return {"checkout_url": session.url, "session_id": session.session_id}

# ============== CHAT / MESSAGING ROUTES ==============

@api_router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    """Get all conversations for the current user"""
    conversations = await db.messages.aggregate([
        {"$match": {"$or": [{"sender_id": user["id"]}, {"receiver_id": user["id"]}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$conversation_id",
            "last_message": {"$first": "$$ROOT"},
            "unread_count": {"$sum": {"$cond": [
                {"$and": [
                    {"$eq": ["$receiver_id", user["id"]]},
                    {"$eq": ["$read", False]}
                ]}, 1, 0
            ]}}
        }},
        {"$sort": {"last_message.created_at": -1}}
    ]).to_list(50)
    
    result = []
    for conv in conversations:
        msg = conv["last_message"]
        other_id = msg["receiver_id"] if msg["sender_id"] == user["id"] else msg["sender_id"]
        other_user = await db.users.find_one({"id": other_id}, {"_id": 0, "password_hash": 0})
        
        result.append({
            "conversation_id": conv["_id"],
            "other_user": {
                "id": other_user["id"] if other_user else other_id,
                "name": other_user.get("name", "Неизвестен") if other_user else "Неизвестен",
                "user_type": other_user.get("user_type", "") if other_user else ""
            },
            "last_message": msg.get("content", ""),
            "last_message_at": msg.get("created_at"),
            "unread_count": conv["unread_count"],
            "project_id": msg.get("project_id")
        })
    
    return {"conversations": result}

@api_router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str, user: dict = Depends(get_current_user)):
    """Get messages for a conversation"""
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    
    # Verify user is part of conversation
    if messages and messages[0]["sender_id"] != user["id"] and messages[0]["receiver_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Нямате достъп до тази кореспонденция")
    
    # Mark as read
    await db.messages.update_many(
        {"conversation_id": conversation_id, "receiver_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return {"messages": messages}

@api_router.post("/messages")
async def send_message(
    data: dict,
    user: dict = Depends(get_current_user)
):
    """Send a message. Platform is free - no filtering."""
    receiver_id = data.get("receiver_id")
    content = data.get("content", "").strip()
    project_id = data.get("project_id")
    image = data.get("image")  # base64 image support
    
    if not receiver_id or (not content and not image):
        raise HTTPException(status_code=400, detail="Получателят и съдържанието са задължителни")
    
    if content and len(content) > 2000:
        raise HTTPException(status_code=400, detail="Съобщението е прекалено дълго (макс. 2000 символа)")
    
    # Check if receiver exists
    receiver = await db.users.find_one({"id": receiver_id}, {"_id": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="Получателят не е намерен")
    
    # Generate conversation ID (sorted user IDs to ensure consistency)
    sorted_ids = sorted([user["id"], receiver_id])
    conv_id = f"{sorted_ids[0]}_{sorted_ids[1]}"
    if project_id:
        conv_id = f"{conv_id}_{project_id}"
    
    message = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "sender_id": user["id"],
        "sender_name": user["name"],
        "receiver_id": receiver_id,
        "content": content,
        "image": image,
        "was_filtered": False,
        "project_id": project_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message)
    
    return {
        "id": message["id"],
        "conversation_id": conv_id,
        "sender_id": message["sender_id"],
        "sender_name": message["sender_name"],
        "receiver_id": message["receiver_id"],
        "content": message["content"],
        "image": message["image"],
        "was_filtered": False,
        "project_id": message["project_id"],
        "read": message["read"],
        "created_at": message["created_at"]
    }

@api_router.get("/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    """Get total unread message count"""
    count = await db.messages.count_documents({
        "receiver_id": user["id"],
        "read": False
    })
    return {"unread_count": count}

@api_router.get("/user/{user_id}/basic")
async def get_user_basic(user_id: str):
    """Get basic user info for chat"""
    u = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not u:
        raise HTTPException(status_code=404, detail="Потребителят не е намерен")
    return {
        "id": u["id"],
        "name": u["name"],
        "user_type": u.get("user_type", "")
    }

# ============== PDF GENERATION ==============

@api_router.post("/calculator/pdf")
async def generate_calculator_pdf(data: dict):
    """Generate a PDF quote from calculator data"""
    from fpdf import FPDF
    import io
    
    items = data.get("items", [])
    region_name = data.get("regionName", "")
    region_multiplier = data.get("regionMultiplier", 1.0)
    pricing_type = data.get("pricingType", "laborAndMaterial")
    quality_level = data.get("qualityLevel", "standard")
    total = data.get("total", 0)
    
    quality_labels = {"economy": "Икономичен", "standard": "Стандартен", "premium": "Премиум"}
    type_labels = {"labor": "Само труд", "laborAndMaterial": "Труд + материали"}
    
    # Create PDF with Unicode support
    pdf = FPDF()
    pdf.add_page()
    
    # Add Unicode font
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    bold_font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    
    try:
        pdf.add_font("DejaVu", "", font_path, uni=True)
        pdf.add_font("DejaVu", "B", bold_font_path, uni=True)
        font_name = "DejaVu"
    except Exception:
        font_name = "Helvetica"
    
    # Header
    pdf.set_fill_color(242, 109, 33)  # Orange
    pdf.rect(0, 0, 210, 40, 'F')
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(font_name, 'B', 22)
    pdf.set_y(8)
    pdf.cell(0, 12, "TemaDom", ln=True, align='C')
    pdf.set_font(font_name, '', 10)
    pdf.cell(0, 8, "РЕМОНТИ И СТРОИТЕЛСТВО", ln=True, align='C')
    
    # Title
    pdf.set_text_color(0, 0, 0)
    pdf.set_y(50)
    pdf.set_font(font_name, 'B', 16)
    pdf.cell(0, 10, "Ценова оферта / Калкулация", ln=True, align='C')
    
    # Details
    pdf.set_font(font_name, '', 10)
    pdf.set_text_color(100, 100, 100)
    pdf.ln(5)
    from datetime import datetime, timezone
    pdf.cell(0, 6, f"Дата: {datetime.now(timezone.utc).strftime('%d.%m.%Y')}", ln=True)
    pdf.cell(0, 6, f"Регион: {region_name} (x{region_multiplier:.2f})", ln=True)
    pdf.cell(0, 6, f"Тип: {type_labels.get(pricing_type, pricing_type)}", ln=True)
    pdf.cell(0, 6, f"Качество: {quality_labels.get(quality_level, quality_level)}", ln=True)
    
    pdf.ln(8)
    
    # Column widths
    w_activity = 60
    w_qty = 25
    w_unit_price = 30
    w_eur = 35
    w_bgn = 40
    
    # Table header
    pdf.set_fill_color(45, 55, 72)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(font_name, 'B', 10)
    pdf.cell(w_activity, 8, "Вид дейност", 1, 0, 'L', True)
    pdf.cell(w_qty, 8, "Кол-во", 1, 0, 'C', True)
    pdf.cell(w_unit_price, 8, "Ед. цена", 1, 0, 'C', True)
    pdf.cell(w_eur, 8, "Цена (EUR)", 1, 0, 'C', True)
    pdf.cell(w_bgn, 8, "Цена (BGN)", 1, 1, 'C', True)
    
    # Table body
    pdf.set_text_color(0, 0, 0)
    pdf.set_font(font_name, '', 9)
    fill = False
    for item in items:
        if item.get("quantity", 0) <= 0:
            continue
        if fill:
            pdf.set_fill_color(245, 245, 245)
        else:
            pdf.set_fill_color(255, 255, 255)
        
        name = item.get("name", "")
        qty = item.get("quantity", 0)
        unit = item.get("unit", "")
        base_price = item.get("basePrice", 0)
        item_total = item.get("total", 0)
        bgn_total = item_total * 1.9558
        
        pdf.cell(w_activity, 7, f"{name}", 1, 0, 'L', fill)
        pdf.cell(w_qty, 7, f"{qty} {unit}", 1, 0, 'C', fill)
        pdf.cell(w_unit_price, 7, f"{base_price:.2f} \u20ac", 1, 0, 'C', fill)
        pdf.cell(w_eur, 7, f"{item_total:.2f} \u20ac", 1, 0, 'C', fill)
        pdf.cell(w_bgn, 7, f"{bgn_total:.2f} лв.", 1, 1, 'C', fill)
        fill = not fill
    
    # Total row
    pdf.ln(5)
    pdf.set_fill_color(242, 109, 33)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(font_name, 'B', 11)
    total_bgn = total * 1.9558
    pdf.cell(w_activity + w_qty + w_unit_price, 10, "ОБЩА ЦЕНА НА ПРОЕКТА:", 1, 0, 'R', True)
    pdf.cell(w_eur, 10, f"{total:.2f} \u20ac", 1, 0, 'C', True)
    pdf.cell(w_bgn, 10, f"{total_bgn:.2f} лв.", 1, 1, 'C', True)
    
    # Footer note
    pdf.ln(15)
    pdf.set_text_color(120, 120, 120)
    pdf.set_font(font_name, '', 8)
    pdf.multi_cell(0, 5, 
        "* Тази оферта е ориентировъчна и базирана на средни пазарни цени за 2025-2026 г. "
        "Реалните цени могат да варират. За точна оферта, свържете се с фирмите чрез TemaDom.\n"
        "* Генерирано от калкулатора на TemaDom - https://temadom.com"
    )
    
    # Output
    pdf_bytes = pdf.output()
    buffer = io.BytesIO(pdf_bytes)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=temadom_kalkulaciya.pdf"}
    )

@api_router.get("/stats")
async def get_stats():
    total_projects = await db.projects.count_documents({"status": "active"})
    total_companies = await db.company_profiles.count_documents({})
    total_reviews = await db.reviews.count_documents({})
    
    return {
        "total_projects": total_projects,
        "total_companies": total_companies,
        "total_reviews": total_reviews
    }

# Online users tracking (in-memory)
_online_sessions = {}

@api_router.post("/heartbeat")
async def heartbeat(request: Request):
    """Track online users via heartbeat."""
    data = await request.json()
    sid = data.get("session_id", "")
    if sid:
        _online_sessions[sid] = datetime.now(timezone.utc)
    # Cleanup stale sessions (>60s old)
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
    stale = [k for k, v in _online_sessions.items() if v < cutoff]
    for k in stale:
        del _online_sessions[k]
    return {"ok": True}

@api_router.get("/stats/live")
async def get_live_stats():
    """Live counter stats for the floating widget with per-region breakdown."""
    total_clients = await db.users.count_documents({})
    total_companies = await db.company_profiles.count_documents({})
    total_masters = await db.users.count_documents({"role": "company"})
    total_projects = await db.projects.count_documents({"status": "active"})
    free_used = min(total_companies, 56)
    # Count online users (sessions active in last 60s)
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
    online = sum(1 for v in _online_sessions.values() if v >= cutoff)
    
    # Per-region breakdown
    regions_data = {}
    for region_name in BULGARIA_REGIONS.values():
        count = await db.company_profiles.count_documents({
            "region": region_name
        })
        regions_data[region_name] = {"used": count, "total": FREE_FIRMS_PER_REGION}
    
    return {
        "clients": total_clients,
        "companies": total_companies,
        "masters": total_masters,
        "projects": total_projects,
        "free_slots": {"used": free_used, "total": 56},
        "regions": regions_data,
        "online": max(1, online)
    }

# ============== ROOT ROUTE ==============

@api_router.get("/")
async def root():
    return {"message": "Maistori Marketplace API", "version": "1.0.0"}

# ============== REVIEWS/TESTIMONIALS ==============

INITIAL_REVIEWS = [
    {"id": "r1", "name": "Иван Петров", "city": "София", "rating": 5, "text": "За 15 минути получих 3D дизайн + линкове към плочки от Praktiker! Спестих 1200€ от бюджета!", "category": "3d_designer", "created_at": "2025-12-15T10:00:00Z"},
    {"id": "r2", "name": "Мария Георгиева", "city": "Пловдив", "rating": 5, "text": "Бюджет €1800 — показа ми ТОЧНО какво мога да си позволя. Намерих всичко с 1 клик!", "category": "3d_designer", "created_at": "2026-01-10T14:30:00Z"},
    {"id": "r3", "name": "Димитър Иванов", "city": "Варна", "rating": 5, "text": "3D рендерите впечатлиха майстора — взе проекта веднага! Супер платформа!", "category": "3d_designer", "created_at": "2026-01-22T09:15:00Z"},
    {"id": "r4", "name": "Елена Стоянова", "city": "Бургас", "rating": 5, "text": "CAD скицата беше перфектна. Архитектът ми я одобри без корекции. Браво TemaDom!", "category": "cad_sketch", "created_at": "2026-02-01T11:00:00Z"},
    {"id": "r5", "name": "Георги Николов", "city": "Стара Загора", "rating": 4, "text": "Намерих 3 фирми за ремонт на банята за 1 ден. Преди търсех 2 седмици!", "category": "platform", "created_at": "2026-02-05T16:45:00Z"},
    {"id": "r6", "name": "Анна Димитрова", "city": "Русе", "rating": 5, "text": "Калкулаторът за цени ме спаси от надуване. Знаех точната цена преди да се обадя!", "category": "calculator", "created_at": "2026-02-10T08:20:00Z"},
    {"id": "r7", "name": "Петър Василев", "city": "Благоевград", "rating": 5, "text": "Като фирма — получихме 5 клиента за първия месец. Безплатният PREMIUM си заслужава!", "category": "platform", "created_at": "2026-02-15T13:00:00Z"},
    {"id": "r8", "name": "Светлана Колева", "city": "Велико Търново", "rating": 5, "text": "Директните линкове към продукти ми спестиха цял ден обикаляне по магазини!", "category": "3d_designer", "created_at": "2026-02-20T10:30:00Z"},
]

@api_router.get("/reviews")
async def get_reviews(limit: int = 20):
    """Get published reviews for the site."""
    reviews = await db.reviews.find(
        {"published": True},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    # If no reviews in DB yet, seed with initial ones
    if not reviews:
        for r in INITIAL_REVIEWS:
            r["published"] = True
            r["user_id"] = None
        await db.reviews.insert_many([{**r} for r in INITIAL_REVIEWS])
        reviews = INITIAL_REVIEWS
    
    # Compute stats
    all_reviews = await db.reviews.find({"published": True}, {"_id": 0, "rating": 1}).to_list(500)
    total = len(all_reviews)
    avg_rating = sum(r.get("rating", 5) for r in all_reviews) / max(total, 1)
    recommend_pct = round(sum(1 for r in all_reviews if r.get("rating", 0) >= 4) / max(total, 1) * 100)
    
    return {
        "reviews": reviews,
        "stats": {
            "total": total,
            "avg_rating": round(avg_rating, 1),
            "recommend_pct": recommend_pct,
            "avg_project_min": 14,
            "total_saved_eur": 24500
        }
    }

@api_router.post("/reviews")
async def submit_review(data: dict, user=Depends(get_current_user)):
    """Submit a review (any logged-in user)."""
    text = data.get("text", "").strip()
    rating = data.get("rating", 5)
    category = data.get("category", "platform")
    
    if not text or len(text) < 5:
        raise HTTPException(status_code=400, detail="Отзивът трябва да е поне 5 символа")
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Рейтингът трябва да е между 1 и 5")
    
    review = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": user.get("name", "Анонимен"),
        "city": user.get("city", ""),
        "rating": rating,
        "text": text[:500],
        "category": category,
        "published": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review)
    review.pop("_id", None)
    return {"review": review}



# Include router and middleware - MUST be after all route definitions
# (moved to end of file)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== ANALYTICS ROUTES ==============

@api_router.post("/analytics/track")
async def track_pageview(data: dict, request: Request):
    """Track a page view"""
    event = {
        "id": str(uuid.uuid4()),
        "event_type": "pageview",
        "path": data.get("path", "/"),
        "referrer": data.get("referrer", ""),
        "user_agent": request.headers.get("user-agent", ""),
        "ip": request.client.host if request.client else "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.analytics_events.insert_one(event)
    return {"ok": True}

@api_router.post("/analytics/event")
async def track_event(data: dict, request: Request):
    """Track a custom event (calculator_submit, pdf_generated, etc.)"""
    event = {
        "id": str(uuid.uuid4()),
        "event_type": "custom",
        "event_name": data.get("event_name", "unknown"),
        "metadata": data.get("metadata", {}),
        "path": data.get("path", "/"),
        "user_agent": request.headers.get("user-agent", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.analytics_events.insert_one(event)
    return {"ok": True}

@api_router.get("/analytics/dashboard")
async def analytics_dashboard(request: Request):
    """Admin analytics dashboard data"""
    pw = request.headers.get("X-Admin-Password", "")
    if pw != ANALYTICS_ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Грешна парола")
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Pageviews today
    pageviews_today = await db.analytics_events.count_documents({
        "event_type": "pageview",
        "created_at": {"$gte": today}
    })
    
    # Calculator uses
    calculator_uses = await db.analytics_events.count_documents({
        "event_name": "calculator_submit"
    })
    
    # PDF downloads
    pdf_downloads = await db.analytics_events.count_documents({
        "event_name": "pdf_generated"
    })
    
    # Payments
    payments = await db.payment_transactions.count_documents({
        "payment_status": "paid"
    })
    
    # Users
    total_users = await db.users.count_documents({})
    total_companies = await db.users.count_documents({"user_type": {"$in": ["company", "master"]}})
    total_clients = await db.users.count_documents({"user_type": "client"})
    
    # Top pages today
    top_pages = await db.analytics_events.aggregate([
        {"$match": {"event_type": "pageview", "created_at": {"$gte": today}}},
        {"$group": {"_id": "$path", "views": {"$sum": 1}}},
        {"$sort": {"views": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    # Recent events
    recent_events = await db.analytics_events.find(
        {"event_type": "custom"},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Top regions from calculator
    top_regions = await db.analytics_events.aggregate([
        {"$match": {"event_name": "calculator_submit"}},
        {"$group": {"_id": "$metadata.region", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 8}
    ]).to_list(8)
    
    return {
        "pageviews_today": pageviews_today,
        "calculator_uses": calculator_uses,
        "pdf_downloads": pdf_downloads,
        "payments": payments,
        "total_users": total_users,
        "total_companies": total_companies,
        "total_clients": total_clients,
        "top_pages": [{"path": p["_id"] or "/", "views": p["views"]} for p in top_pages],
        "recent_events": recent_events,
        "top_regions": [{"region": r["_id"] or "N/A", "count": r["count"]} for r in top_regions]
    }

# ============== AI BLUEPRINT ANALYSIS ==============

BLUEPRINT_SYSTEM_PROMPT = """Ти си експерт по анализ на строителни чертежи и архитектурни планове. Анализирай внимателно качения чертеж и извлечи ВСИЧКИ измерения и количества.

ЗАДАЧА: Извлечи от чертежа следната информация:

1. РАЗМЕРИ: Всички коти (дължини, ширини, височини) в метри
2. ПЛОЩИ: Изчисли площта на всяко помещение/зона в кв.м
3. ОБЕМИ: Ако има височини, изчисли обемите в куб.м
4. СТРОИТЕЛНИ ЕЛЕМЕНТИ: Идентифицирай колони, шайби, стени, плочи, греди
5. КОТИ: Разпознай всички коти (кота 0.00, кота +2.70, кота +3.50 и т.н.)
6. МАТЕРИАЛИ: Ако са посочени, опиши материалите

ОТГОВОРИ ЗАДЪЛЖИТЕЛНО в JSON формат:
{
  "description": "Кратко описание на чертежа",
  "floor_levels": [{"level": "+0.00", "description": "Кота нула - приземен етаж"}],
  "rooms": [{"name": "Хол", "length_m": 5.2, "width_m": 4.0, "area_sqm": 20.8, "height_m": 2.7}],
  "total_area_sqm": 85.5,
  "structural_elements": {
    "columns": [{"id": "К1", "dimensions": "40x40 см", "count": 4}],
    "walls": [{"type": "Носеща стена", "thickness_cm": 25, "length_m": 12, "area_sqm": 32.4}],
    "beams": [{"id": "Г1", "dimensions": "25x50 см", "length_m": 5.2}],
    "slabs": [{"type": "Плоча", "area_sqm": 85.5, "thickness_cm": 16}]
  },
  "calculator_suggestions": [
    {"category": "concrete", "description": "Бетон за плоча", "quantity": 13.7, "unit": "м³"},
    {"category": "reinforcement", "description": "Арматура за плоча", "quantity": 1370, "unit": "кг"},
    {"category": "formwork", "description": "Кофраж за плоча", "quantity": 85.5, "unit": "м²"},
    {"category": "masonry", "description": "Зидария стени", "quantity": 120, "unit": "м²"},
    {"category": "foundations", "description": "Основи", "quantity": 8.5, "unit": "м³"},
    {"category": "roofing", "description": "Покрив", "quantity": 95, "unit": "м²"},
    {"category": "electrical", "description": "Ел. точки", "quantity": 45, "unit": "точки"},
    {"category": "insulation", "description": "Топлоизолация", "quantity": 120, "unit": "м²"},
    {"category": "waterproofing", "description": "Хидроизолация", "quantity": 15, "unit": "м²"},
    {"category": "tiling", "description": "Плочки баня/кухня", "quantity": 25, "unit": "м²"},
    {"category": "render", "description": "Вътрешна мазилка", "quantity": 200, "unit": "м²"},
    {"category": "painting", "description": "Боядисване", "quantity": 200, "unit": "м²"},
    {"category": "drywall", "description": "Гипсокартон", "quantity": 30, "unit": "м²"},
    {"category": "flooring", "description": "Подова настилка", "quantity": 65, "unit": "м²"},
    {"category": "plumbing", "description": "ВиК точки", "quantity": 15, "unit": "точки"},
    {"category": "windows", "description": "Прозорци", "quantity": 12, "unit": "м²"}
  ],
  "notes": ["Допълнителни забележки за чертежа"]
}

ВАЖНО:
- Бъди максимално ТОЧЕН с размерите - чети котите внимателно
- Ако не можеш да разчетеш нещо, кажи го в notes
- calculator_suggestions трябва да включва САМО категории от тези: concrete, reinforcement, formwork, masonry, foundations, roofing, electrical, insulation, waterproofing, tiling, render, painting, drywall, flooring, plumbing, windows, demolition, excavation, screed
- Изчислявай количествата реалистично на база размерите
- За арматура: 100 кг/м³ бетон за плочи, 120 кг/м³ за колони
- За кофраж: площта на повърхността на бетонните елементи
- ВИНАГИ отговаряй на БЪЛГАРСКИ"""

@api_router.post("/blueprint/analyze")
async def analyze_blueprint(data: dict):
    """Analyze a construction blueprint using AI vision"""
    image_base64 = data.get("image")
    if not image_base64:
        raise HTTPException(status_code=400, detail="Изображението е задължително")
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI ключът не е конфигуриран")
    
    # Clean base64 - remove data:image prefix if present
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"blueprint-{uuid.uuid4()}",
            system_message=BLUEPRINT_SYSTEM_PROMPT
        ).with_model("openai", "gpt-4o")
        
        image_content = ImageContent(image_base64=image_base64)
        
        user_message = UserMessage(
            text="Анализирай този строителен чертеж. Извлечи ВСИЧКИ размери, площи, коти, конструктивни елементи. Отговори в JSON формат с calculator_suggestions за автоматично попълване на калкулатора.",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Try to parse JSON from response
        response_text = response.strip()
        
        # Extract JSON from markdown code block if present
        json_match = re_module.search(r'```(?:json)?\s*([\s\S]*?)```', response_text)
        if json_match:
            response_text = json_match.group(1).strip()
        
        try:
            result = json_module.loads(response_text)
        except json_module.JSONDecodeError:
            # If parsing fails, return raw text
            result = {
                "description": "Анализът завърши, но не може да бъде структуриран автоматично.",
                "raw_analysis": response_text,
                "calculator_suggestions": [],
                "notes": ["AI анализът не върна структуриран отговор. Моля, прегледайте ръчно."]
            }
        
        return result
        
    except Exception as e:
        logging.error(f"Blueprint analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Грешка при анализ: {str(e)}")

# ============== TELEGRAM BOT ROUTES ==============
import asyncio as aio

async def send_telegram_message(chat_id: int, text: str, photo_url: str = None):
    """Send a message or photo via Telegram Bot API"""
    if not TELEGRAM_BOT_TOKEN:
        return False
    try:
        async with httpx.AsyncClient() as client_http:
            if photo_url:
                url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
                resp = await client_http.post(url, json={
                    "chat_id": chat_id,
                    "photo": photo_url,
                    "caption": text,
                    "parse_mode": "HTML"
                }, timeout=15)
            else:
                url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
                resp = await client_http.post(url, json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML"
                }, timeout=10)
            return resp.status_code == 200
    except Exception as e:
        logging.error(f"Telegram send error: {e}")
        return False


async def _send_notifications_to_tier(users, message, photo_url):
    """Send notifications to a list of users"""
    sent = 0
    for u in users:
        chat_id = u.get("telegram_chat_id")
        if chat_id:
            try:
                success = await send_telegram_message(int(chat_id), message, photo_url)
                if success:
                    sent += 1
            except Exception:
                pass
    return sent


async def notify_companies_new_project(project_dict: dict):
    """Notify companies via Telegram with priority-based timing:
    - PREMIUM: instant (0 min)
    - PRO: after 10 minutes
    - BASIC: no notification (search manually)
    """
    if not TELEGRAM_BOT_TOKEN:
        return

    project_city = project_dict.get("city", "").lower().strip()
    cat = next((c for c in CATEGORIES if c["id"] == project_dict.get("category")), None)
    cat_name = cat["name"] if cat else project_dict.get("category", "")

    # Budget info
    budget_min = project_dict.get("budget_min")
    budget_max = project_dict.get("budget_max")
    estimated = project_dict.get("estimated_budget")
    budget_text = ""
    if budget_min and budget_max:
        budget_text = f"Бюджет: {budget_min:.0f} - {budget_max:.0f} EUR"
    elif estimated:
        budget_text = f"Бюджет (ориент.): {estimated:.0f} EUR"

    # First image as photo
    images = project_dict.get("images", [])
    photo_url = None
    if images:
        first_img = images[0]
        if first_img.startswith("http"):
            photo_url = first_img

    # Rich notification message
    description = project_dict.get("description", "")
    if len(description) > 250:
        description = description[:250] + "..."

    message = (
        f"<b>Нов проект в TemaDom!</b>\n\n"
        f"<b>{project_dict.get('title', '')}</b>\n"
        f"Категория: {cat_name}\n"
        f"Град: {project_dict.get('city', '')}\n"
    )
    if budget_text:
        message += f"{budget_text}\n"
    if project_dict.get("deadline"):
        message += f"Срок: {project_dict.get('deadline')}\n"
    message += (
        f"\n{description}\n\n"
        f"<a href='https://temadom.com/projects/{project_dict.get('id', '')}'>Виж проекта</a>"
    )

    # City filter
    city_query = {}
    if project_city:
        city_query = {"$or": [
            {"city": {"$regex": project_city, "$options": "i"}},
            {"city": {"$exists": False}},
            {"city": ""}
        ]}

    base_query = {
        "user_type": {"$in": ["company", "master"]},
        "telegram_chat_id": {"$exists": True, "$ne": None}
    }

    # --- PREMIUM: Send INSTANTLY ---
    premium_query = {**base_query, "subscription_plan": "premium"}
    if city_query:
        premium_query.update(city_query)
    premium_users = await db.users.find(premium_query, {"_id": 0}).to_list(500)

    premium_msg = f"<b>PREMIUM ПРЕДИМСТВО</b>\n\n{message}"
    premium_sent = await _send_notifications_to_tier(premium_users, premium_msg, photo_url)

    logging.info(f"Telegram: PREMIUM notified {premium_sent} users instantly")

    # --- PRO: Send after 10 minutes (background task) ---
    pro_query = {**base_query, "subscription_plan": "pro"}
    if city_query:
        pro_query.update(city_query)

    async def _delayed_pro_notification():
        await aio.sleep(600)  # 10 minutes
        pro_users = await db.users.find(pro_query, {"_id": 0}).to_list(500)
        pro_msg = f"<b>ПРО ИЗВЕСТИЕ</b>\n\n{message}"
        pro_sent = await _send_notifications_to_tier(pro_users, pro_msg, photo_url)
        logging.info(f"Telegram: PRO notified {pro_sent} users after 10 min delay")

    aio.create_task(_delayed_pro_notification())

@api_router.post("/telegram/link")
async def link_telegram(data: dict, user: dict = Depends(get_current_user)):
    """Link a Telegram chat ID to user account"""
    chat_id = data.get("chat_id")
    if not chat_id:
        raise HTTPException(status_code=400, detail="Chat ID е задължителен")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"telegram_chat_id": str(chat_id)}}
    )
    
    # Send confirmation based on subscription tier
    sub = await db.subscriptions.find_one({"user_id": user["id"], "status": "active"}, {"_id": 0})
    plan = sub.get("plan", "basic") if sub else "basic"
    
    tier_msg = {
        "premium": "PREMIUM: Ще получавате известия ПЪРВИ — 10 мин. преди ПРО!",
        "pro": "ПРО: Ще получавате известия за нови проекти (с 10 мин. закъснение след PREMIUM).",
        "basic": "БАЗОВ план: За да получавате Telegram известия, надградете до ПРО или PREMIUM."
    }
    
    await send_telegram_message(int(chat_id),
        f"Telegram е свързан с TemaDom!\n\n{tier_msg.get(plan, tier_msg['basic'])}"
    )
    
    return {"message": "Telegram акаунтът е свързан успешно", "plan": plan}


@api_router.get("/telegram/status")
async def telegram_status(user: dict = Depends(get_current_user)):
    """Check if user has linked Telegram"""
    u = await db.users.find_one({"id": user["id"]}, {"_id": 0, "telegram_chat_id": 1, "id": 1})
    linked = bool(u and u.get("telegram_chat_id"))
    return {"linked": linked, "chat_id": u.get("telegram_chat_id") if linked else None}

@api_router.post("/telegram/broadcast")
async def broadcast_telegram(data: dict, request: Request):
    """Send mass Telegram message to all companies/craftsmen. Admin only."""
    pw = request.headers.get("X-Admin-Password", "")
    if pw != ANALYTICS_ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Грешна парола")
    
    message_text = data.get("message", "")
    if not message_text:
        raise HTTPException(status_code=400, detail="Съобщението е задължително")
    
    # Get all users with telegram_chat_id
    target = data.get("target", "companies")  # "companies", "all"
    query = {"telegram_chat_id": {"$exists": True, "$ne": None}}
    if target == "companies":
        query["user_type"] = "company"
    
    users = await db.users.find(query, {"_id": 0}).to_list(5000)
    
    sent = 0
    failed = 0
    for u in users:
        chat_id = u.get("telegram_chat_id")
        if chat_id:
            success = await send_telegram_message(int(chat_id), message_text)
            if success:
                sent += 1
            else:
                failed += 1
    
    return {"sent": sent, "failed": failed, "total": len(users)}

@api_router.post("/telegram/webhook")
async def telegram_webhook(request: Request):
    """Handle incoming Telegram messages (for /start command)"""
    try:
        data = await request.json()
        message = data.get("message", {})
        chat = message.get("chat", {})
        text = message.get("text", "")
        chat_id = chat.get("id")
        
        if not chat_id:
            return {"ok": True}
        
        if text.startswith("/start"):
            parts = text.split()
            if len(parts) > 1:
                user_id = parts[1]
                result = await db.users.update_one(
                    {"id": user_id},
                    {"$set": {"telegram_chat_id": str(chat_id)}}
                )
                if result.modified_count > 0:
                    # Check subscription tier
                    sub = await db.subscriptions.find_one({"user_id": user_id, "status": "active"}, {"_id": 0})
                    plan = sub.get("plan", "basic") if sub else "basic"
                    
                    tier_info = {
                        "premium": "\nВашият план: PREMIUM\nЩе получавате известия ПЪРВИ — 10 мин. преди всички!",
                        "pro": "\nВашият план: ПРО\nЩе получавате известия за нови проекти (10 мин. след PREMIUM).",
                        "basic": "\nВашият план: БАЗОВ\nНадградете до ПРО или PREMIUM за Telegram известия."
                    }
                    
                    await send_telegram_message(chat_id,
                        f"Акаунтът ви е свързан с TemaDom!"
                        f"{tier_info.get(plan, tier_info['basic'])}"
                    )
                else:
                    await send_telegram_message(chat_id,
                        "Добре дошли в TemaDom бот!\n"
                        "За да свържете акаунта си, моля влезте в профила си на temadom.com "
                        "и натиснете бутона 'Свържи Telegram'."
                    )
            else:
                await send_telegram_message(chat_id,
                    "Добре дошли в <b>TemaDom</b> бот!\n\n"
                    "Известия за нови строителни проекти:\n\n"
                    "<b>PREMIUM</b>: Получавате ПЪРВИ (10 мин. преди ПРО)\n"
                    "<b>ПРО</b>: Получавате известия (след 10 мин.)\n"
                    "<b>БАЗОВ</b>: Без автоматични известия\n\n"
                    "За да се свържете:\n"
                    "1. Регистрирайте се на temadom.com\n"
                    "2. Влезте в профила си\n"
                    "3. Натиснете 'Свържи Telegram'"
                )
        
        return {"ok": True}
    except Exception as e:
        logging.error(f"Telegram webhook error: {e}")
        return {"ok": True}

# ============== SITEMAP ==============

@api_router.get("/sitemap")
async def sitemap():
    """Generate dynamic sitemap.xml"""
    base = "https://temadom.com"
    
    # Static pages
    urls = [
        (f"{base}/", "1.0", "daily"),
        (f"{base}/calculator", "0.9", "weekly"),
        (f"{base}/services", "0.8", "weekly"),
        (f"{base}/professions", "0.8", "weekly"),
        (f"{base}/about", "0.7", "monthly"),
        (f"{base}/terms", "0.5", "monthly"),
        (f"{base}/blog", "0.9", "daily"),
        (f"{base}/prices", "0.9", "weekly"),
        (f"{base}/projects", "0.8", "daily"),
        (f"{base}/companies", "0.7", "daily"),
    ]
    
    # Regional pages
    regions = [
        "sofia", "sofiyska-oblast", "plovdiv", "varna", "burgas",
        "stara-zagora", "ruse", "pleven", "blagoevgrad", "veliko-tarnovo",
        "dobrich", "vidin", "montana", "vratsa", "lovech", "gabrovo",
        "targovishte", "razgrad", "shumen", "silistra", "pazardzhik",
        "smolyan", "kardzhali", "haskovo", "yambol", "sliven", "pernik", "kyustendil"
    ]
    for r in regions:
        urls.append((f"{base}/region/{r}", "0.8", "weekly"))
    
    # Blog articles
    professions = [
        "boyadzhiya", "shpaklovchik", "fayansdzhiya", "elektrotehnik",
        "vodoprovodchik", "klimatik-montazh", "pokrivdzhiya", "zidar",
        "zamazchik", "izolator", "hidroizolator", "gipskartонist",
        "podovi-nastilki", "dogramdzhiya", "demontazh", "betondzhiya",
        "izkopni-raboti", "fasaden-rabotnik", "mebelist", "alarmena-sistema",
        "solarni-sistemi", "interiorni-vrati", "dekorativni-pokritiya",
        "kamenodelets", "zavarchik-metal", "ozelenyavane", "shumoizolatsiya", "baseyni"
    ]
    
    urls.append((f"{base}/blog/kalkulator-ceni-stroitelstvo-2026", "0.9", "weekly"))
    urls.append((f"{base}/blog/grub-stroezh-ceni-2026", "0.8", "weekly"))
    urls.append((f"{base}/blog/dovarshitelni-raboti-ceni-2026", "0.8", "weekly"))
    
    for p in professions:
        urls.append((f"{base}/blog/ceni-{p}-2026", "0.7", "weekly"))
    
    for r in ["sofia", "plovdiv", "varna", "burgas", "stara-zagora", "ruse"]:
        urls.append((f"{base}/blog/stroitelstvo-{r}-2026", "0.7", "weekly"))
    
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for loc, priority, freq in urls:
        xml += f'  <url>\n    <loc>{loc}</loc>\n    <priority>{priority}</priority>\n    <changefreq>{freq}</changefreq>\n  </url>\n'
    xml += '</urlset>'
    
    return Response(content=xml, media_type="application/xml")

# ============== CHATBOT ROUTES ==============

CHATBOT_SYSTEM_PROMPT = """Ти си виртуален асистент на TemaDom - платформа за строителни услуги в България.

Основна информация за платформата:
- TemaDom свързва клиенти с майстори и строителни фирми
- Платформата е НАПЪЛНО БЕЗПЛАТНА за всички потребители
- Има 3 типа потребители: Клиент, Фирма, Майстор
- Функции: публикуване на проекти, калкулатор за цени, директен чат, портфолио
- Калкулаторът покрива 28 строителни услуги в 28 области на България
- Има AI анализ на чертежи за автоматично попълване на калкулатора

Ти трябва да:
1. Отговаряш учтиво на въпроси за платформата
2. Помагаш с навигация и използване на функциите
3. Когато получиш ОПЛАКВАНЕ от потребител, ЗАДЪЛЖИТЕЛНО:
   - Изслушай внимателно
   - Поискай конкретни детайли (име на фирма/майстор, какъв е проблемът)
   - Увери потребителя, че оплакването е регистрирано
   - Ако оплакването е за конкретна фирма/майстор, кажи че ще бъде прегледано от администратор
   - Включи в отговора маркер [COMPLAINT] в началото ако е оплакване

4. Ако потребител е агресивен или нарушава правилата, включи маркер [WARNING] в отговора

Отговаряй КРАТКО и ПОЛЕЗНО. Максимум 2-3 изречения за прости въпроси.
Ако въпросът е на друг език, отговаряй на СЪЩИЯ ЕЗИК.
"""

@api_router.post("/chatbot/message")
async def chatbot_message(data: dict):
    """Handle chatbot messages with AI"""
    message = data.get("message", "").strip()
    session_id = data.get("session_id", str(uuid.uuid4()))
    user_id = data.get("user_id")
    user_name = data.get("user_name", "Гост")
    user_type = data.get("user_type", "guest")
    lang = data.get("lang", "bg")
    
    if not message:
        raise HTTPException(status_code=400, detail="Съобщението е задължително")
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI ключът не е конфигуриран")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"chatbot-{session_id}",
            system_message=CHATBOT_SYSTEM_PROMPT
        ).with_model("openai", "gpt-4o")
        
        lang_hint = f" (Потребителят пише на език с код: {lang}. Отговори на същия език.)" if lang != 'bg' else ""
        full_message = f"[Потребител: {user_name}, Тип: {user_type}]{lang_hint}\n{message}"
        
        user_msg = UserMessage(text=full_message)
        response = await chat.send_message(user_msg)
        reply = response.strip()
        
        # Check for complaint markers and log
        is_complaint = "[COMPLAINT]" in reply
        is_warning = "[WARNING]" in reply
        
        # Clean markers from the reply shown to user
        clean_reply = reply.replace("[COMPLAINT]", "").replace("[WARNING]", "").strip()
        
        # Store conversation in DB
        await db.chatbot_conversations.insert_one({
            "session_id": session_id,
            "user_id": user_id,
            "user_name": user_name,
            "user_type": user_type,
            "message": message,
            "reply": clean_reply,
            "is_complaint": is_complaint,
            "is_warning": is_warning,
            "lang": lang,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # If complaint detected, create a complaint record
        if is_complaint and user_id:
            await db.complaints.insert_one({
                "id": str(uuid.uuid4()),
                "reporter_id": user_id,
                "reporter_name": user_name,
                "reporter_type": user_type,
                "message": message,
                "bot_reply": clean_reply,
                "status": "new",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Check warnings count for the reporter (if they are being warned themselves)
            if is_warning:
                warnings_count = await db.user_warnings.count_documents({"user_id": user_id})
                if warnings_count >= 2:
                    # Auto-block after 3rd warning
                    await db.users.update_one(
                        {"id": user_id},
                        {"$set": {"blocked": True, "blocked_reason": "Множество нарушения, автоматично блокиране след 3 предупреждения"}}
                    )
                else:
                    await db.user_warnings.insert_one({
                        "id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "user_name": user_name,
                        "reason": message,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
        
        return {"reply": clean_reply, "session_id": session_id}
        
    except Exception as e:
        logging.error(f"Chatbot error: {e}")
        raise HTTPException(status_code=500, detail=f"Грешка: {str(e)}")

@api_router.get("/chatbot/complaints")
async def get_complaints(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Admin endpoint to view complaints"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user or user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Само администратори имат достъп")
    
    complaints = await db.complaints.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"complaints": complaints}

@api_router.post("/chatbot/warn-user/{user_id}")
async def warn_user(user_id: str, data: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Admin: warn a user"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    admin = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not admin or admin.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Само администратори")
    
    reason = data.get("reason", "Предупреждение от администратор")
    
    warnings_count = await db.user_warnings.count_documents({"user_id": user_id})
    
    await db.user_warnings.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "admin_id": payload["user_id"],
        "reason": reason,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    if warnings_count >= 2:
        # 3rd warning = auto block
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"blocked": True, "blocked_reason": f"Блокиран след 3 предупреждения. Последно: {reason}"}}
        )
        return {"message": "Потребителят е блокиран автоматично след 3 предупреждения", "blocked": True}
    
    return {"message": f"Предупреждение #{warnings_count + 1} е изпратено", "warnings": warnings_count + 1, "blocked": False}

@api_router.post("/chatbot/block-user/{user_id}")
async def block_user(user_id: str, data: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Admin: block a user immediately"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    admin = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not admin or admin.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Само администратори")
    
    reason = data.get("reason", "Блокиран от администратор")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"blocked": True, "blocked_reason": reason}}
    )
    
    return {"message": "Потребителят е блокиран", "blocked": True}

# ============== SUBSCRIPTION PLANS ==============

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    """Get available subscription plans (test mode)"""
    return {"plans": SUBSCRIPTION_PLANS, "test_mode": TEST_MODE}

@api_router.post("/subscriptions/activate")
async def activate_subscription(data: dict, user: dict = Depends(get_current_user)):
    """Activate subscription (test mode - always succeeds)"""
    plan = data.get("plan", "basic")
    if user["user_type"] not in ("company", "master", "designer"):
        raise HTTPException(status_code=400, detail="Само фирми, майстори и дизайнери могат да имат абонамент")
    
    expires = datetime.now(timezone.utc) + timedelta(days=30)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "subscription_active": True,
            "subscription_plan": plan,
            "subscription_expires": expires.isoformat()
        }}
    )
    await db.company_profiles.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "subscription_active": True,
            "subscription_plan": plan,
            "subscription_expires": expires.isoformat()
        }}
    )
    return {"message": "Абонаментът е активиран (тестов режим)", "plan": plan, "expires": expires.isoformat()}

@api_router.get("/subscriptions/my")
async def get_my_subscription(user: dict = Depends(get_current_user)):
    """Get current user's subscription status"""
    u = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    if not u:
        raise HTTPException(status_code=404)
    
    expires_str = u.get("subscription_expires")
    days_remaining = 0
    if expires_str:
        try:
            expires_dt = datetime.fromisoformat(expires_str)
            days_remaining = max(0, (expires_dt - datetime.now(timezone.utc)).days)
        except Exception:
            pass
    
    # Count user's active ads
    active_ads = await db.ads.count_documents({"user_id": user["id"], "status": "active"})
    
    return {
        "subscription_active": u.get("subscription_active", False),
        "subscription_plan": u.get("subscription_plan"),
        "subscription_expires": expires_str,
        "days_remaining": days_remaining,
        "active_ads": active_ads,
        "test_mode": TEST_MODE
    }

@api_router.post("/subscriptions/simulate-expiry")
async def simulate_subscription_expiry(user: dict = Depends(get_current_user)):
    """TEST ONLY: Simulate subscription expiry for testing auto-deactivation"""
    if not TEST_MODE:
        raise HTTPException(status_code=403, detail="Достъпно само в тестов режим")
    
    expired_time = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"subscription_expires": expired_time, "subscription_reminded": False}}
    )
    await db.company_profiles.update_one(
        {"user_id": user["id"]},
        {"$set": {"subscription_expires": expired_time}}
    )
    return {"message": "Абонаментът е симулиран като изтекъл. Изчакайте до 1 час за автоматично деактивиране, или извикайте /api/subscriptions/run-check."}

@api_router.post("/subscriptions/run-check")
async def run_subscription_check():
    """TEST ONLY: Manually trigger subscription expiry check"""
    if not TEST_MODE:
        raise HTTPException(status_code=403, detail="Достъпно само в тестов режим")
    
    now = datetime.now(timezone.utc)
    reminder_threshold = now + timedelta(days=7)
    
    # Reminders
    reminded = 0
    expiring_soon = await db.users.find({
        "subscription_active": True,
        "subscription_expires": {"$lte": reminder_threshold.isoformat(), "$gt": now.isoformat()},
        "subscription_reminded": {"$ne": True}
    }, {"_id": 0}).to_list(100)
    for u in expiring_soon:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "user_id": u["id"], "type": "subscription_reminder",
            "title": "Абонаментът ви изтича скоро",
            "message": f"Вашият абонамент ({u.get('subscription_plan', 'basic')}) изтича на {u.get('subscription_expires', '')[:10]}.",
            "read": False, "created_at": now.isoformat()
        })
        await db.users.update_one({"id": u["id"]}, {"$set": {"subscription_reminded": True}})
        reminded += 1
    
    # Deactivations
    deactivated = 0
    ads_removed = 0
    expired = await db.users.find({
        "subscription_active": True,
        "subscription_expires": {"$lte": now.isoformat()}
    }, {"_id": 0}).to_list(100)
    for u in expired:
        await db.users.update_one({"id": u["id"]}, {"$set": {"subscription_active": False, "subscription_reminded": False}})
        await db.company_profiles.update_one({"user_id": u["id"]}, {"$set": {"subscription_active": False}})
        res = await db.ads.update_many({"user_id": u["id"], "status": "active"}, {"$set": {"status": "expired"}})
        ads_removed += res.modified_count
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()), "user_id": u["id"], "type": "subscription_expired",
            "title": "Абонаментът ви е изтекъл",
            "message": f"Вашият абонамент е деактивиран. {res.modified_count} обяви са спрени.",
            "read": False, "created_at": now.isoformat()
        })
        deactivated += 1
    
    return {"reminded": reminded, "deactivated": deactivated, "ads_removed": ads_removed}

# ============== NOTIFICATIONS ==============

@api_router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    """Get user's notifications"""
    notifs = await db.notifications.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    unread = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"notifications": notifs, "unread_count": unread}

@api_router.post("/notifications/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return {"message": "Всички известия са маркирани като прочетени"}

# ============== ADS / LISTINGS ==============

@api_router.get("/ads")
async def get_ads(category: str = None, city: str = None, page: int = 1, limit: int = 20):
    """Get active ads/listings"""
    query = {"status": "active"}
    if category:
        query["category"] = category
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    skip = (page - 1) * limit
    ads = await db.ads.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.ads.count_documents(query)
    return {"ads": ads, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.post("/ads")
async def create_ad(data: dict, user: dict = Depends(get_current_user)):
    """Create a new ad/listing"""
    ad = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "user_type": user["user_type"],
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "category": data.get("category", "general"),
        "city": data.get("city", ""),
        "images": data.get("images", [])[:5],
        "status": "active",
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ads.insert_one(ad)
    ad.pop("_id", None)
    return ad

@api_router.delete("/ads/{ad_id}")
async def delete_ad(ad_id: str, user: dict = Depends(get_current_user)):
    """Delete own ad"""
    result = await db.ads.delete_one({"id": ad_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Обявата не е намерена")
    return {"message": "Обявата е изтрита"}

# ============== AI DESIGN COUNTER ==============

@api_router.get("/ai-design/status")
async def get_ai_design_status(user: dict = Depends(get_optional_user)):
    """Get AI design availability status"""
    global_count = await db.ai_designs.count_documents({})
    free_remaining = max(0, AI_DESIGN_GLOBAL_FREE_LIMIT - global_count)
    
    user_used = 0
    if user:
        user_used = await db.ai_designs.count_documents({"user_id": user["id"]})
    
    return {
        "global_free_remaining": free_remaining,
        "global_total_used": global_count,
        "global_limit": AI_DESIGN_GLOBAL_FREE_LIMIT,
        "user_designs_used": user_used,
        "user_free_limit": AI_DESIGN_PER_PROFILE_LIMIT,
        "can_use_free": True,
        "test_mode": TEST_MODE
    }

# ============== AI DESIGNER - GENERATE ==============

AI_STYLES = {
    "modern": "съвременен модерен стил с чисти линии, неутрални цветове и минимализъм",
    "minimalist": "минималистичен стил с прости форми, бяло пространство и функционалност",
    "classic": "класически стил с елегантни мебели, богати тъкани и декоративни елементи",
    "boho": "бохо стил с естествени материали, ярки цветове и текстури",
    "hitech": "хай-тек стил с метал, стъкло, LED осветление и технологични елементи",
    "industrial": "индустриален стил с тухлени стени, метал, открити тръби и бетон",
    "scandinavian": "скандинавски стил с бели стени, дърво, минимализъм и естествена светлина",
    "loft": "индустриален лофт стил с открити тръби, бетон и метални акценти",
    "neoclassic": "неокласически стил с мрамор, позлата, симетрия и елегантни детайли",
    "artdeco": "арт деко стил с геометрични шарки, злато, черно и луксозни материали"
}

AI_MATERIAL_CLASS = {
    "economy": "икономичен клас материали - достъпни цени, основно качество",
    "standard": "стандартен клас материали - добро качество, средна ценова гама",
    "premium": "премиум клас материали - висококачествени, луксозни"
}

@api_router.post("/ai-designer/video-generate")
async def generate_video_design(
    video: UploadFile = File(...),
    width: str = Form("4"),
    length: str = Form("5"),
    height: str = Form("2.6"),
    style: str = Form("modern"),
    room_type: str = Form("living_room"),
    notes: str = Form("")
):
    """Video Designer v6.1: Upload 60s video → AI extracts 12 keyframes → 360° renovation."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI ключът не е конфигуриран")

    # Validate video
    if not video.content_type or not video.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Моля, качете видео файл (MP4)")

    # Save video to temp file
    video_bytes = await video.read()
    if len(video_bytes) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=400, detail="Видеото е твърде голямо (макс. 50MB)")

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    try:
        # Extract key frames using OpenCV
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Невалиден видео файл")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0

        if duration > 65:
            cap.release()
            raise HTTPException(status_code=400, detail="Видеото е твърде дълго (макс. 60 секунди)")

        # Extract 12 keyframes (every ~5 seconds)
        num_frames = min(12, max(4, int(duration / 5)))
        frame_indices = [int(total_frames * i / num_frames) for i in range(num_frames)] if total_frames > num_frames else list(range(total_frames))
        extracted_frames = []
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                # Resize if too large
                h, w = frame.shape[:2]
                if max(h, w) > 1280:
                    scale_factor = 1280 / max(h, w)
                    frame = cv2.resize(frame, (int(w * scale_factor), int(h * scale_factor)))
                _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                extracted_frames.append(base64.b64encode(buf).decode('utf-8'))
        cap.release()

        if not extracted_frames:
            raise HTTPException(status_code=400, detail="Не можаха да се извлекат кадри от видеото")

        logging.info(f"Video Designer: extracted {len(extracted_frames)} frames from {duration:.1f}s video")

        style_desc = AI_STYLES.get(style, AI_STYLES.get("modern", "modern style"))
        ROOM_TYPE_NAMES = {
            "bathroom": "баня", "kitchen": "кухня", "living_room": "хол",
            "bedroom": "спалня", "corridor": "коридор", "balcony": "балкон",
            "stairs": "стълбище", "facade": "фасада", "other": "помещение"
        }
        room_type_name = ROOM_TYPE_NAMES.get(room_type, "помещение")

        # Step 1: Analyze video frames
        analysis_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"video-designer-{uuid.uuid4()}",
            system_message=f"""Ти си експерт интериорен дизайнер. Получаваш {len(extracted_frames)} кадъра от видео на {room_type_name}.

СТРИКТЕН РЕЖИМ 1:1 — анализирай ТОЧНО какво виждаш:
- САМО елементи от кадрите (плочки, стени, мебели, осветление, прозорци, врати)
- НЕ добавяй нови елементи
- Опиши ТОЧНАТА геометрия, пропорции и позиции

Отговори в JSON:
{{"room_type": "{room_type_name}", "current_state": "детайлно описание", "elements": ["списък"], "lighting": "тип", "colors": ["цветове"], "furniture": ["мебели"], "layout": "разпределение", "description": "VERY DETAILED English description of the EXACT room visible — include every fixture, wall position, floor area, window/door positions, lighting."}}"""
        ).with_model("openai", "gpt-4o")

        image_contents = [ImageContent(image_base64=f) for f in extracted_frames]
        analysis_msg = UserMessage(
            text=f"Анализирай ТОЧНО тези {len(extracted_frames)} кадъра от видео на {room_type_name}. Размери: {width}м x {length}м x {height}м. Опиши 1:1 какво виждаш.",
            file_contents=image_contents
        )
        analysis_response = await analysis_chat.send_message(analysis_msg)

        room_analysis = {}
        try:
            json_match = re_module.search(r'```(?:json)?\s*([\s\S]*?)```', analysis_response)
            if json_match:
                room_analysis = json_module.loads(json_match.group(1))
            else:
                room_analysis = json_module.loads(analysis_response)
        except Exception:
            room_analysis = {"room_type": room_type_name, "description": f"a {room_type_name} interior", "current_state": "needs renovation"}

        room_desc = room_analysis.get("description", f"a {room_type_name} interior")

        # Step 2: Generate 4 angles of renovated room
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        reno_instruction = notes or "complete renovation with modern finishes"

        camera_angles = [
            ("photographed from the entrance/door looking inward, full room visible", "Фронтален"),
            ("photographed from the left wall at 45 degrees showing depth", "Ляв ъгъл"),
            ("photographed from the right wall at 45 degrees showing depth", "Десен ъгъл"),
            ("photographed from the far corner looking back towards entrance", "Обратен ъгъл"),
        ]

        generated_images = []
        variant_angles = []
        for angle_idx, (angle_desc, angle_label) in enumerate(camera_angles):
            try:
                strict_prompt = f"""STRICT 1:1 RENOVATION of the EXACT room described below. {angle_desc}.

ROOM DESCRIPTION (keep EXACT layout): {room_desc}
Dimensions: {width}m x {length}m, height {height}m.

RENOVATION REQUEST: {reno_instruction}

STRICT RULES:
1. Keep the EXACT same room geometry, proportions, and layout
2. Do NOT add new objects/elements that aren't in the original
3. Apply ONLY the requested renovation changes
4. Preserve 1:1 scale and proportions

Style: {style_desc}.
Ultra-realistic professional interior photography, 8K quality, perfect lighting."""

                img_result = await image_gen.generate_images(
                    prompt=strict_prompt,
                    model="gpt-image-1",
                    number_of_images=1
                )

                if img_result and len(img_result) > 0:
                    img_b64 = base64.b64encode(img_result[0]).decode('utf-8')
                    variant_angles.append({
                        "angle": angle_idx + 1,
                        "label": angle_label,
                        "image_base64": img_b64
                    })
            except Exception as img_err:
                logging.error(f"Video Designer image gen error angle {angle_idx+1}: {img_err}")
                continue

        if variant_angles:
            generated_images.append({
                "variant": 1,
                "angles": variant_angles,
                "image_base64": variant_angles[0]["image_base64"] if variant_angles else "",
            })

        # Step 3: Materials list
        materials_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"video-materials-{uuid.uuid4()}",
            system_message="""Ти си експерт по строителни материали и интериорен дизайн в България.
Генерирай ДЕТАЙЛЕН списък с материали и цени за ремонт.

Отговори САМО в JSON формат:
{
  "materials": [
    {"name": "...", "quantity": "...", "unit": "...", "price_per_unit_eur": "...", "total_price_eur": "..."}
  ],
  "total_estimate_eur": "...",
  "labor_estimate_eur": "...",
  "grand_total_eur": "..."
}"""
        ).with_model("openai", "gpt-4o")

        materials_msg = UserMessage(
            text=f"""Материали за ремонт на {room_type_name} ({width}м x {length}м x {height}м).
Стил: {style_desc}
{f'Бележки: {notes}' if notes else ''}
Състояние: {room_analysis.get('current_state', 'нуждае се от ремонт')}"""
        )
        materials_response = await materials_chat.send_message(materials_msg)

        materials_data = {}
        try:
            json_match = re_module.search(r'```(?:json)?\s*([\s\S]*?)```', materials_response)
            if json_match:
                materials_data = json_module.loads(json_match.group(1))
            else:
                materials_data = json_module.loads(materials_response)
        except:
            materials_data = {"materials": [], "grand_total_eur": "N/A"}

        # Save to DB
        design_id = str(uuid.uuid4())
        design_record = {
            "id": design_id,
            "type": "video",
            "room_type": room_type_name,
            "room_type_id": room_type,
            "room_analysis": room_analysis,
            "style": style,
            "dimensions": {"width": width, "length": length, "height": height},
            "video_duration": round(duration, 1),
            "frames_extracted": len(extracted_frames),
            "generated_count": len(variant_angles),
            "materials_count": len(materials_data.get("materials", [])),
            "notes": notes,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.ai_designs.insert_one(design_record)

        # Return first frame as "before" for comparison
        before_frame = extracted_frames[0] if extracted_frames else None

        return {
            "id": design_id,
            "room_analysis": room_analysis,
            "generated_images": generated_images,
            "materials": materials_data,
            "before_frame": before_frame,
            "style": style,
            "dimensions": {"width": width, "length": length, "height": height},
            "video_duration": round(duration, 1),
            "frames_extracted": len(extracted_frames),
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Video Designer error: {e}")
        raise HTTPException(status_code=500, detail=f"Грешка при обработка: {str(e)}")
    finally:
        # Cleanup temp file
        try:
            os.unlink(tmp_path)
        except:
            pass



# ============== ENHANCED 3D DESIGNER (v7.0) ==============

# Bulgarian store product catalog for direct links
BG_STORE_CATALOG = {
    "praktiker": {"name": "Praktiker", "base_url": "https://praktiker.bg", "categories": ["плочки", "бояджийство", "настилки", "инструменти", "осветление"]},
    "jysk": {"name": "Jysk", "base_url": "https://jysk.bg", "categories": ["мебели", "осветление", "декорация", "текстил"]},
    "mrbricolage": {"name": "Mr.Bricolage", "base_url": "https://mrbricolage.bg", "categories": ["боя", "плочки", "ВиК", "електричество", "инструменти"]},
    "ikea": {"name": "IKEA", "base_url": "https://ikea.bg", "categories": ["мебели", "осветление", "кухня", "баня", "декорация"]},
    "teknoimpex": {"name": "Teknoimpex", "base_url": "https://teknoimpex.bg", "categories": ["бойлери", "радиатори", "ВиК", "котли", "помпи"]},
    "bauhaus": {"name": "Bauhaus", "base_url": "https://bauhaus.bg", "categories": ["плочки", "боя", "настилки", "дограма", "изолация"]},
    "homemax": {"name": "HomeMax", "base_url": "https://homemax.bg", "categories": ["мебели", "осветление", "декорация", "текстил"]}
}


@api_router.post("/ai-designer/photo-generate")
async def generate_photo_design(
    photo1: UploadFile = File(...),
    photo2: UploadFile = File(None),
    photo3: UploadFile = File(None),
    width: str = Form("4"),
    length: str = Form("5"),
    height: str = Form("2.7"),
    style: str = Form("modern"),
    room_type: str = Form("living_room"),
    notes: str = Form(""),
    budget_eur: str = Form("2500"),
    budget_tier: str = Form("medium"),
    authorization: str = Form(None)
):
    """3D Designer v8: 3 photos -> 3 separate 3D renders + budget with direct product links. NO 360."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI ключът не е конфигуриран")

    user_id = None
    if authorization:
        try:
            token = authorization.replace("Bearer ", "")
            payload = decode_token(token)
            user_id = payload.get("user_id")
        except Exception:
            pass

    photos_b64 = []
    photo_labels = ["Общ план", "Ъгъл 1", "Ъгъл 2"]
    for photo in [photo1, photo2, photo3]:
        if photo and photo.filename:
            photo_bytes = await photo.read()
            if len(photo_bytes) > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="Снимката е твърде голяма (макс. 10MB)")
            # Resize to <2MB for faster Vision API processing
            if len(photo_bytes) > 2 * 1024 * 1024:
                try:
                    from PIL import Image as PILImage
                    import io
                    img = PILImage.open(io.BytesIO(photo_bytes))
                    # Resize keeping aspect ratio, max 1920px
                    max_dim = 1920
                    if img.width > max_dim or img.height > max_dim:
                        ratio = min(max_dim / img.width, max_dim / img.height)
                        new_size = (int(img.width * ratio), int(img.height * ratio))
                        img = img.resize(new_size, PILImage.LANCZOS)
                    # Compress as JPEG with quality reduction
                    buf = io.BytesIO()
                    quality = 70
                    if img.mode == 'RGBA':
                        img = img.convert('RGB')
                    img.save(buf, format='JPEG', quality=quality)
                    photo_bytes = buf.getvalue()
                    logging.info(f"Photo resized: {len(photo_bytes)} bytes")
                except Exception as resize_err:
                    logging.warning(f"Photo resize failed, using original: {resize_err}")
            photos_b64.append(base64.b64encode(photo_bytes).decode('utf-8'))

    if not photos_b64:
        raise HTTPException(status_code=400, detail="Качете поне една снимка")

    style_desc = AI_STYLES.get(style, AI_STYLES.get("modern", "modern style"))
    ROOM_TYPE_NAMES = {
        "bathroom": "баня", "kitchen": "кухня", "living_room": "хол",
        "bedroom": "спалня", "corridor": "коридор", "balcony": "балкон",
        "stairs": "стълбище", "facade": "фасада", "other": "помещение"
    }
    room_type_name = ROOM_TYPE_NAMES.get(room_type, "помещение")
    reno_instruction = notes or "complete renovation with modern finishes"

    try:
        # Step 1: Use GPT-4o-mini Vision to analyze EACH photo — identify room, elements, layout
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        renders = []

        ROOM_ELEMENT_MAP = {
            "bathroom": "вана, душ кабина, тоалетна, мивка, огледало, плочки, бойлер",
            "kitchen": "шкафове, плот, хладилник, печка, мивка, аспиратор, гранитогрес",
            "living_room": "диван, маса, TV, килим, лампа, библиотека",
            "bedroom": "легло, гардероб, нощно шкафче, матрак, килим",
            "corridor": "закачалка, шкаф, огледало, осветление",
            "balcony": "парапет, настилка, мебели, растения",
            "stairs": "стъпала, парапет, осветление",
            "facade": "мазилка, дограма, покрив",
            "other": "мебели, декор, осветление"
        }
        expected_elements = ROOM_ELEMENT_MAP.get(room_type, "мебели, декор")

        # Helper: retry with exponential backoff
        async def retry_with_backoff(coro_fn, max_retries=3, base_delay=2):
            for attempt in range(max_retries):
                try:
                    return await coro_fn()
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    delay = base_delay * (2 ** attempt)
                    logging.warning(f"Retry {attempt+1}/{max_retries} after error: {e}. Waiting {delay}s...")
                    await aio.sleep(delay)

        for idx, photo_b64 in enumerate(photos_b64):
            label = photo_labels[idx] if idx < len(photo_labels) else f"Снимка {idx+1}"
            try:
                # Step 1a: Vision analysis of the uploaded photo (gpt-4o-mini — faster!)
                async def run_vision(photo_data=photo_b64, room_type_n=room_type_name, exp_elem=expected_elements):
                    vision_chat = LlmChat(
                        api_key=EMERGENT_LLM_KEY,
                        session_id=f"photo-vision-{uuid.uuid4()}",
                        system_message=f"""Ти си експерт по интериорен дизайн. Анализирай ТОЧНО какво виждаш на снимката.

ЗАДАЧА: Опиши подробно помещението на снимката.
Клиентът казва, че това е: {room_type_n}
Очаквани елементи за {room_type_n}: {exp_elem}

Отговори САМО в JSON:
{{"room_type": "bathroom/kitchen/living_room/bedroom/...",
"room_type_bg": "баня/кухня/хол/спалня/...",
"confirmed_match": true/false,
"elements_visible": ["вана", "мивка", "плочки", ...],
"colors": ["бял", "сив", ...],
"layout_description": "Правоъгълно помещение с вана вляво, мивка вдясно...",
"dimensions_estimate": "приблизително 3x2 метра",
"condition": "стара/нова/за ремонт",
"camera_angle": "от вратата/от ъгъла/фронтално"}}"""
                    ).with_model("openai", "gpt-4o-mini")

                    vision_msg = UserMessage(
                        text=f"Анализирай тази снимка. Клиентът твърди, че е {room_type_n}. Потвърди или коригирай. Опиши ВСИЧКИ видими елементи.",
                        file_contents=[ImageContent(image_base64=photo_data)]
                    )
                    return await vision_chat.send_message(vision_msg)

                vision_response = await retry_with_backoff(run_vision, max_retries=3, base_delay=2)

                # Parse vision analysis
                room_analysis = {}
                try:
                    json_match = re_module.search(r'\{[\s\S]*\}', vision_response)
                    if json_match:
                        room_analysis = json_module.loads(json_match.group(0))
                except Exception:
                    room_analysis = {"room_type_bg": room_type_name, "elements_visible": [], "layout_description": ""}

                detected_room = room_analysis.get("room_type_bg", room_type_name)
                elements = ", ".join(room_analysis.get("elements_visible", [expected_elements]))
                layout_desc = room_analysis.get("layout_description", "")
                colors = ", ".join(room_analysis.get("colors", []))
                camera_angle = room_analysis.get("camera_angle", "")

                logging.info(f"Photo Designer: Vision detected '{detected_room}' for photo {idx+1} (user said: {room_type_name})")

                # Step 1b: Generate 3D render with PRECISE room-aware prompt
                render_prompt = f"""Photorealistic 3D interior design render of a {detected_room} ({room_type_name}).

CRITICAL — THIS IS A {detected_room.upper()}! Generate ONLY a {detected_room}!
Visible elements: {elements}
{f"Layout: {layout_desc}" if layout_desc else ""}
{f"Current colors: {colors}" if colors else ""}
{f"Camera angle: {camera_angle}" if camera_angle else ""}

Room dimensions: {width}m x {length}m, ceiling height {height}m.
KEEP the EXACT same room shape, proportions and camera perspective.

RENOVATION STYLE: {style_desc}
{f"Notes: {reno_instruction}" if notes else "Apply modern renovation with high-quality finishes."}

IMPORTANT RULES:
- This MUST be a {detected_room}, NOT any other room type
- Keep all structural elements (walls, doors, windows) in same positions
- Replace old finishes with new modern materials matching {style_desc} style
- Professional interior photography, natural lighting, 8K quality"""

                async def run_image_gen(prompt=render_prompt):
                    return await image_gen.generate_images(
                        prompt=prompt,
                        model="gpt-image-1",
                        number_of_images=1
                    )

                img_result = await retry_with_backoff(run_image_gen, max_retries=3, base_delay=3)
                if img_result and len(img_result) > 0:
                    img_b64 = base64.b64encode(img_result[0]).decode('utf-8')
                    renders.append({
                        "index": idx,
                        "label": label,
                        "image_base64": img_b64,
                        "original_base64": photo_b64
                    })
                    logging.info(f"Photo Designer: render {idx+1} ({label}) generated as '{detected_room}' OK")
            except Exception as img_err:
                logging.error(f"Photo Designer render {idx+1} error: {img_err}")
                continue

        # Step 2: Generate budget with 3 tiers and REAL search links to stores
        # Store search URL patterns (verified working)
        STORE_SEARCH_URLS = {
            "Praktiker": "https://praktiker.bg/search?q=",
            "Mr.Bricolage": "https://mr-bricolage.bg/search?q=",
            "Jysk": "https://jysk.bg/search?q=",
            "HomeMax": "https://www.home-max.bg/search/?q=",
            "Bauhaus": "https://bauhaus.bg/search/",
            "eMAG": "https://www.emag.bg/search/",
            "IKEA": "https://www.ikea.bg/search/?q=",
            "Teknoimpex": "https://teknoimpex.bg/search?q=",
        }

        budget_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"photo-budget-{uuid.uuid4()}",
            system_message=f"""Ти си експерт по строителни материали в България. Клиентът има бюджет от {budget_eur}€.

Генерирай БЮДЖЕТ с 3 варианта (Иконом, Среден, Премиум) СПРЯМО БЮДЖЕТА на клиента:
- Иконом: до {int(int(budget_eur)*0.6)}€ (60% от бюджета)
- Среден: до {budget_eur}€ (100% от бюджета)  
- Премиум: до {int(int(budget_eur)*1.5)}€ (150% от бюджета)

За всеки материал задай КОНКРЕТНА КЛЮЧОВА ДУМА ЗА ТЪРСЕНЕ (search_query), по която клиентът може да го намери в магазина.

МАГАЗИНИ (избери 1 за всеки материал):
- Praktiker, Mr.Bricolage, Jysk, HomeMax, Bauhaus, eMAG

Отговори САМО в JSON:
{{
  "budget_tiers": [
    {{
      "tier": "economy",
      "tier_name": "Иконом",
      "total_eur": 0,
      "materials": [
        {{
          "name": "Гранитогрес 60x60 сив",
          "category": "Настилки",
          "quantity": "15 m²",
          "price_eur": 0,
          "store": "Praktiker",
          "search_query": "гранитогрес 60x60 сив"
        }}
      ]
    }},
    {{"tier": "medium", "tier_name": "Среден", "total_eur": 0, "materials": [...]}},
    {{"tier": "premium", "tier_name": "Премиум", "total_eur": 0, "materials": [...]}}
  ],
  "labor_estimate_eur": 0,
  "client_budget_eur": {budget_eur},
  "summary": "Кратко описание"
}}"""
        ).with_model("openai", "gpt-4o")

        budget_msg = UserMessage(
            text=f"""Генерирай бюджет за ремонт на {room_type_name} ({width}м x {length}м x {height}м).
БЮДЖЕТ: {budget_eur}€. Стил: {style_desc}. {f'Бележки: {notes}' if notes else ''}
3 ВАРИАНТА: Иконом до {int(int(budget_eur)*0.6)}€, Среден до {budget_eur}€, Премиум до {int(int(budget_eur)*1.5)}€.
Всеки с 8-12 материала. За всеки материал задай search_query за магазина."""
        )
        budget_response = await budget_chat.send_message(budget_msg)

        budget_data = {}
        try:
            json_match = re_module.search(r'```(?:json)?\s*([\s\S]*?)```', budget_response)
            if json_match:
                budget_data = json_module.loads(json_match.group(1))
            else:
                budget_data = json_module.loads(budget_response)
        except Exception:
            budget_data = {"budget_tiers": [], "labor_estimate_eur": 0}

        # Post-process: Generate REAL search URLs with AFFILIATE tracking
        from urllib.parse import quote as url_quote
        for tier in budget_data.get("budget_tiers", []):
            for mat in tier.get("materials", []):
                store = mat.get("store", "")
                search_q = mat.get("search_query", mat.get("name", ""))
                encoded_q = url_quote(search_q, safe='')
                real_url = STORE_SEARCH_URLS.get(store, "")
                if real_url:
                    base_url = f"{real_url}{encoded_q}"
                else:
                    base_url = f"https://www.emag.bg/search/{encoded_q}"
                    if not store:
                        mat["store"] = "eMAG"
                # Apply affiliate tracking
                mat["product_url"] = make_affiliate_url(base_url, mat.get("store", store))
                # Remove any AI-hallucinated fields
                for key in ["product_id", "available"]:
                    mat.pop(key, None)
        logging.info(f"Photo Designer: Budget with affiliate search URLs")

        # Save project to DB
        design_id = str(uuid.uuid4())
        design_record = {
            "id": design_id,
            "type": "photo",
            "user_id": user_id,
            "room_type": room_type_name,
            "room_type_id": room_type,
            "style": style,
            "dimensions": {"width": width, "length": length, "height": height},
            "photos_count": len(photos_b64),
            "renders_count": len(renders),
            "budget_data": budget_data,
            "notes": notes,
            "budget_eur": int(budget_eur),
            "budget_tier": budget_tier,
            "shared": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        for i, r in enumerate(renders):
            design_record[f"render_{i}_b64"] = r["image_base64"]
            design_record[f"original_{i}_b64"] = r["original_base64"]

        await db.ai_designs.insert_one(design_record)

        return {
            "id": design_id,
            "renders": [{"index": r["index"], "label": r["label"], "image_base64": r["image_base64"], "original_base64": r["original_base64"]} for r in renders],
            "budget": budget_data,
            "style": style,
            "dimensions": {"width": width, "length": length, "height": height},
            "photos_count": len(photos_b64),
            "renders_count": len(renders),
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Photo Designer error: {e}")
        raise HTTPException(status_code=500, detail=f"Грешка при обработка: {str(e)}")


@api_router.get("/ai-designer/my-projects")
async def get_my_projects(user=Depends(get_current_user)):
    """Get all projects for the current user."""
    exclude = {"_id": 0, "angle_0_b64": 0, "angle_1_b64": 0, "angle_2_b64": 0,
               "before_photo_b64": 0, "render_0_b64": 0, "render_1_b64": 0, "render_2_b64": 0,
               "original_0_b64": 0, "original_1_b64": 0, "original_2_b64": 0}
    projects = await db.ai_designs.find(
        {"user_id": user["id"]}, exclude
    ).sort("created_at", -1).to_list(100)
    return {"projects": projects}


@api_router.get("/ai-designer/project/{project_id}")
async def get_project(project_id: str):
    """Get a single project by ID (for sharing)."""
    project = await db.ai_designs.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")

    # New v8 format: renders
    renders = []
    labels = ["Общ план", "Ъгъл 1", "Ъгъл 2"]
    for i in range(3):
        render_key = f"render_{i}_b64"
        orig_key = f"original_{i}_b64"
        if render_key in project and project[render_key]:
            renders.append({
                "index": i,
                "label": labels[i] if i < len(labels) else f"Снимка {i+1}",
                "image_base64": project[render_key],
                "original_base64": project.get(orig_key, "")
            })
        # Also check old format (angle_X_b64)
        angle_key = f"angle_{i}_b64"
        if not renders and angle_key in project and project[angle_key]:
            renders.append({
                "index": i,
                "label": labels[i] if i < len(labels) else f"Ъгъл {i+1}",
                "image_base64": project[angle_key],
                "original_base64": project.get("before_photo_b64", "") if i == 0 else ""
            })

    # Clean up large fields from response
    for key in list(project.keys()):
        if key.endswith("_b64"):
            del project[key]

    project["renders"] = renders
    project["budget"] = project.get("budget_data", {})
    
    return project


@api_router.post("/ai-designer/project/{project_id}/share")
async def share_project(project_id: str, user=Depends(get_current_user)):
    """Enable sharing for a project."""
    result = await db.ai_designs.update_one(
        {"id": project_id, "user_id": user["id"]},
        {"$set": {"shared": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    return {"shared": True, "share_url": f"/projects/{project_id}"}


@api_router.delete("/ai-designer/project/{project_id}")
async def delete_project(project_id: str, user=Depends(get_current_user)):
    """Delete a project."""
    result = await db.ai_designs.delete_one({"id": project_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    return {"deleted": True}


@api_router.post("/ai-designer/photo-pdf")
async def generate_photo_pdf(request: Request):
    """Generate PDF for 3D Photo Designer result — logo, renders, budget, region-based labor."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib import colors
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    import io

    FONT = 'FreeSans'
    FONT_B = 'FreeSansBold'
    try:
        pdfmetrics.registerFont(TTFont(FONT, '/usr/share/fonts/truetype/freefont/FreeSans.ttf'))
        pdfmetrics.registerFont(TTFont(FONT_B, '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf'))
    except Exception:
        FONT = 'Helvetica'
        FONT_B = 'Helvetica-Bold'

    data = await request.json()
    renders = data.get("renders", [])
    budget = data.get("budget", {})
    dimensions = data.get("dimensions", {})
    style_name = data.get("style", "modern")
    budget_eur = data.get("budget_eur", 0)
    user_name = data.get("user_name", "")
    project_id = data.get("project_id", "")
    active_tier = data.get("active_tier", "medium")
    user_region = data.get("user_region", "")

    STYLE_NAMES = {"modern": "Модерен", "minimalist": "Минималист", "classic": "Класически",
                   "boho": "Бохо", "hitech": "Хай-тек", "industrial": "Индустриален",
                   "scandinavian": "Скандинавски", "loft": "Лофт", "neoclassic": "Неокласически", "artdeco": "Арт Деко"}
    style_bg = STYLE_NAMES.get(style_name, style_name)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=15*mm, bottomMargin=15*mm, leftMargin=15*mm, rightMargin=15*mm)

    subtitle_s = ParagraphStyle('SubBG', fontName=FONT, fontSize=11, spaceAfter=10, textColor=colors.HexColor('#666666'), alignment=1)
    heading_s = ParagraphStyle('HeadBG', fontName=FONT_B, fontSize=14, spaceBefore=14, spaceAfter=6, textColor=colors.HexColor('#1E2A38'))
    body_s = ParagraphStyle('BodyBG', fontName=FONT, fontSize=10, spaceAfter=4)
    body_c = ParagraphStyle('BodyCenter', fontName=FONT, fontSize=10, spaceAfter=4, alignment=1)
    small_s = ParagraphStyle('SmallBG', fontName=FONT, fontSize=8, textColor=colors.HexColor('#999999'), alignment=1)
    total_s = ParagraphStyle('TotalBG', fontName=FONT_B, fontSize=16, spaceAfter=4, textColor=colors.HexColor('#F97316'), alignment=2)
    labor_s = ParagraphStyle('LaborBG', fontName=FONT_B, fontSize=11, spaceAfter=4, textColor=colors.HexColor('#1E2A38'))

    story = []

    # Logo centered
    logo_path = '/app/frontend/public/temadom-logo.png'
    try:
        logo = RLImage(logo_path, width=60*mm, height=60*mm, kind='proportional')
        logo.hAlign = 'CENTER'
        story.append(logo)
        story.append(Spacer(1, 4))
    except Exception:
        pass

    story.append(Paragraph(f"Проект: {style_bg} | {dimensions.get('width','?')}м x {dimensions.get('length','?')}м x {dimensions.get('height','?')}м | Бюджет: {budget_eur} EUR", subtitle_s))
    if user_name:
        story.append(Paragraph(f"Клиент: {user_name} | Дата: {datetime.now().strftime('%d.%m.%Y')}", body_c))
    story.append(Spacer(1, 6))

    # Render images
    for r in renders[:3]:
        img_b64 = r.get("image_base64", "")
        label = r.get("label", "")
        if img_b64:
            try:
                img_data = base64.b64decode(img_b64)
                img_io = io.BytesIO(img_data)
                img = RLImage(img_io, width=170*mm, height=105*mm)
                story.append(Paragraph(f"3D Рендер: {label}", heading_s))
                story.append(img)
                story.append(Spacer(1, 8))
            except Exception:
                pass

    # Budget table
    tiers = budget.get("budget_tiers", [])
    active = next((t for t in tiers if t.get("tier") == active_tier), tiers[0] if tiers else None)
    if active:
        story.append(Paragraph(f"БЮДЖЕТ МАТЕРИАЛИ — {active.get('tier_name', active_tier)}", heading_s))
        table_data = [["Материал", "Количество", "Цена EUR", "Магазин", "Линк"]]
        for m in active.get("materials", []):
            url = m.get("product_url", "")
            link_text = url[:40] + "..." if len(url) > 40 else url
            table_data.append([
                str(m.get("name", "")),
                str(m.get("quantity", "")),
                str(m.get("price_eur", "")),
                str(m.get("store", "")),
                link_text
            ])
        table_data.append(["ОБЩО", "", str(active.get("total_eur", 0)), "", ""])

        t = Table(table_data, colWidths=[45*mm, 25*mm, 22*mm, 28*mm, 55*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E2A38')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), FONT_B),
            ('FONTNAME', (0, 1), (-1, -2), FONT),
            ('FONTNAME', (0, -1), (-1, -1), FONT_B),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#F97316')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#F8F8F8')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t)

    # Labor — region-based
    labor = budget.get("labor_estimate_eur", 0)
    if labor:
        story.append(Spacer(1, 8))
        region_text = f" за обл. {user_region}" if user_region else ""
        story.append(Paragraph(f"Труд (ориентировъчно{region_text}): {labor} EUR", labor_s))
        story.append(Paragraph(f"* Цената за труд е ориентировъчна{region_text}. Може да варира в зависимост от сложността.", small_s))

    if active:
        total = (active.get("total_eur", 0) or 0) + (labor or 0)
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"ОБЩА СУМА: {total} EUR", total_s))

    story.append(Spacer(1, 16))
    story.append(Paragraph(f"temadom.com | {datetime.now().strftime('%d.%m.%Y')}", small_s))
    if project_id:
        site_url = os.environ.get("REACT_APP_BACKEND_URL", "https://temadom.com")
        story.append(Paragraph(f"Линк: {site_url}/projects/{project_id}", small_s))

    doc.build(story)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=temadom_3D_projekt_{project_id[:8] if project_id else 'new'}.pdf"}
    )




    data = await request.json()
    materials = data.get("materials", {})
    dimensions = data.get("dimensions", {})
    style_name = data.get("style", "modern")
    room_analysis = data.get("room_analysis", {})
    image_b64 = data.get("image_base64", "")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title_BG', parent=styles['Title'], fontSize=18, spaceAfter=12)
    body_style = ParagraphStyle('Body_BG', parent=styles['Normal'], fontSize=10, spaceAfter=6)

    story = []
    story.append(Paragraph("TEMADOM 3D VIDEO DESIGNER - PROEKT", title_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"Razmeri: {dimensions.get('width','?')}m x {dimensions.get('length','?')}m x {dimensions.get('height','?')}m", body_style))
    story.append(Paragraph(f"Stil: {style_name}", body_style))
    story.append(Spacer(1, 8))

    # Add image if available
    if image_b64:
        try:
            img_data = base64.b64decode(image_b64)
            img_io = io.BytesIO(img_data)
            img = RLImage(img_io, width=160*mm, height=100*mm)
            story.append(img)
            story.append(Spacer(1, 10))
        except Exception:
            pass

    # Materials table
    mat_list = materials.get("materials", [])
    if mat_list:
        story.append(Paragraph("MATERIALI I CENI", title_style))
        table_data = [["Poziciya", "Kolichestvo", "Cena/ed.", "Obshto EUR"]]
        for m in mat_list:
            table_data.append([
                str(m.get("name", "")),
                f"{m.get('quantity', '')} {m.get('unit', '')}",
                str(m.get("price_per_unit_eur", "")),
                str(m.get("total_price_eur", ""))
            ])

        total_row = ["OBSHTO", "", "", str(materials.get("grand_total_eur", "N/A"))]
        table_data.append(total_row)

        t = Table(table_data, colWidths=[70*mm, 35*mm, 30*mm, 35*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E2A38')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#3A4A5C')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#F97316')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
            ('FONTWEIGHT', (0, -1), (-1, -1), 'BOLD'),
        ]))
        story.append(t)

    story.append(Spacer(1, 15))
    story.append(Paragraph(f"Trud: {materials.get('labor_estimate_eur', 'N/A')} EUR", body_style))
    story.append(Paragraph(f"OBSHTA SUMA: {materials.get('grand_total_eur', 'N/A')} EUR", ParagraphStyle('Total', parent=styles['Title'], fontSize=14)))

    doc.build(story)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=temadom-video-project.pdf"}
    )


@api_router.post("/ai-sketch/export-pdf")
async def export_cad_pdf(request: Request):
    """Generate PDF plan with cost estimate from CAD elements."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    import io

    data = await request.json()
    els = data.get("elements", [])
    scale = data.get("scale", 1)
    costs = data.get("costs", {})
    region_name = data.get("region_name", "Plovdiv")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title_BG', parent=styles['Title'], fontSize=18, spaceAfter=12)
    body_style = ParagraphStyle('Body_BG', parent=styles['Normal'], fontSize=10, spaceAfter=6)

    story = []
    story.append(Paragraph("TEMADOM - IA CAD PLAN", title_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Mashab: 1:{scale}m | Region: {region_name}", body_style))
    story.append(Paragraph(f"Elementi: {len(els)}", body_style))
    story.append(Spacer(1, 8))

    # Element summary
    type_counts = {}
    for el in els:
        t = el.get("_type", el.get("tool", "unknown"))
        type_counts[t] = type_counts.get(t, 0) + 1

    if type_counts:
        summary_data = [["Tip element", "Broi"]]
        for t, c in type_counts.items():
            summary_data.append([t.capitalize(), str(c)])
        st = Table(summary_data, colWidths=[80*mm, 40*mm])
        st.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#253545')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#3A4A5C')),
        ]))
        story.append(st)
        story.append(Spacer(1, 12))

    # Cost table
    cost_items = costs.get("items", [])
    if cost_items:
        story.append(Paragraph("KOLICHESTVENA SMETKA", title_style))
        table_data = [["Poziciya", "Kol.", "Ed.", "Cena EUR", "Suma EUR"]]
        for it in cost_items:
            table_data.append([
                str(it.get("label", "")),
                str(it.get("qty", "")),
                str(it.get("unit", "")),
                str(it.get("price", "")),
                str(it.get("total", ""))
            ])
        table_data.append(["OBSHTO", "", "", "", f"{costs.get('totalEur', 0)} EUR"])

        t = Table(table_data, colWidths=[55*mm, 20*mm, 15*mm, 30*mm, 35*mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E2A38')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#3A4A5C')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#FF8C42')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
        ]))
        story.append(t)

    story.append(Spacer(1, 15))
    total_eur = costs.get("totalEur", 0)
    total_bgn = costs.get("totalBgn", 0)
    story.append(Paragraph(f"OBSHTO: {total_eur} EUR / {total_bgn} BGN", ParagraphStyle('Tot', parent=styles['Title'], fontSize=14)))

    doc.build(story)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=temadom-cad-plan.pdf"}
    )


@api_router.post("/ai-sketch/export-contract")
async def export_cad_contract(request: Request):
    """Generate a contract PDF between company and client."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    import io

    data = await request.json()
    company_name = data.get("company_name", "_____________________")
    company_bulstat = data.get("company_bulstat", "_____________________")
    client_name = data.get("client_name", "_____________________")
    client_egn = data.get("client_egn", "_____________________")
    address = data.get("address", "_____________________")
    total_eur = data.get("total_eur", "___________")
    total_bgn = data.get("total_bgn", "___________")
    description = data.get("description", "Izpalnenie na stroitelno-montazhni raboti soglasno prilozhena kolichestvena smetka.")
    today = datetime.now().strftime("%d.%m.%Y")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=25*mm, bottomMargin=25*mm, leftMargin=25*mm, rightMargin=25*mm)
    styles = getSampleStyleSheet()
    title_s = ParagraphStyle('CTitle', parent=styles['Title'], fontSize=16, spaceAfter=12)
    h2_s = ParagraphStyle('CH2', parent=styles['Heading2'], fontSize=12, spaceAfter=8, spaceBefore=12)
    body_s = ParagraphStyle('CBody', parent=styles['Normal'], fontSize=10, spaceAfter=4, leading=14)

    story = []
    story.append(Paragraph("DOGOVOR ZA STROITELSTVO", title_s))
    story.append(Paragraph(f"Dnes, {today} g., mezhdu:", body_s))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"<b>IZPALNITEL:</b> {company_name}, BULSTAT: {company_bulstat}", body_s))
    story.append(Paragraph(f"<b>VAZLOZHITEL:</b> {client_name}, EGN/BULSTAT: {client_egn}", body_s))
    story.append(Paragraph(f"<b>Adres na obekta:</b> {address}", body_s))
    story.append(Spacer(1, 8))
    story.append(Paragraph("se skluchi nastoyashtiyat dogovor za slednoeto:", body_s))

    story.append(Paragraph("I. PREDMET NA DOGOVORA", h2_s))
    story.append(Paragraph(f"1. Izpalnitelyat se zadulzhava da izvurshi: {description}", body_s))
    story.append(Paragraph("2. Rabotite se izvurshvat soglasno prilozhena kolichestvena smetka (Prilozhenie 1).", body_s))

    story.append(Paragraph("II. CENA I PLASHTANE", h2_s))
    story.append(Paragraph(f"3. Obshta stoinost: <b>{total_eur} EUR ({total_bgn} BGN)</b>.", body_s))
    story.append(Paragraph("4. Plashtaneto se izvurshva na tri chasti: 30% avans, 40% pri 50% gotovnost, 30% pri priemane.", body_s))

    story.append(Paragraph("III. SROK", h2_s))
    story.append(Paragraph("5. Srokut za izpulnenie e ____________ rabotni dni ot datata na podpisvane.", body_s))
    story.append(Paragraph("6. Srokut mozhe da bude udulzhen pri loshi vremenni usloviya ili forsmazzhorni obstoyatelstva.", body_s))

    story.append(Paragraph("IV. GARANTSIYA", h2_s))
    story.append(Paragraph("7. Izpalnitelyat predostavya garantsiya za izvurshenite raboti v srok ot 5 (pet) godini.", body_s))

    story.append(Paragraph("V. OTGOVORNOSTI", h2_s))
    story.append(Paragraph("8. Izpalnitelyat otgovarya za kachestvoto na materialie i izvurshenite raboti.", body_s))
    story.append(Paragraph("9. Vazlozhitelyat osiguryava dostap do obekta i neobhodimite razreshitelni.", body_s))

    story.append(Paragraph("VI. PREKLATIAVANE", h2_s))
    story.append(Paragraph("10. Dogovorat mozhe da bude preklaten ot vsyaka strana s 14-dnevno pismenno uvedomlenie.", body_s))

    story.append(Spacer(1, 25))
    story.append(Paragraph("IZPALNITEL: ________________________       VAZLOZHITEL: ________________________", body_s))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"Data: {today}", body_s))

    doc.build(story)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=temadom-contract.pdf"}
    )


@api_router.post("/ai-designer/generate")
async def generate_ai_design(request: Request):
    """IA Designer: 1:1 renovation — strict geometry preservation.
    Takes a photo + renovation text and generates the SAME space renovated."""
    data = await request.json()

    # Support both single image and multiple images
    images_list = data.get("images", [])
    single_image = data.get("image")
    if not images_list and single_image:
        images_list = [single_image]

    style = data.get("style", "modern")
    material_class = data.get("material_class", "standard")
    room_type_id = data.get("room_type", "bathroom")
    room_width = data.get("width", "4")
    room_length = data.get("length", "5")
    room_height = data.get("height", "2.6")
    variants = data.get("variants", 1)
    notes = data.get("notes", "")
    renovation_text = data.get("renovation_text", notes)
    
    if not images_list:
        raise HTTPException(status_code=400, detail="Качете поне 1 снимка")
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI ключът не е конфигуриран")
    
    # Clean base64 for all images
    cleaned_images = []
    for img in images_list:
        if img and "," in img:
            cleaned_images.append(img.split(",")[1])
        elif img:
            cleaned_images.append(img)
    
    if not cleaned_images:
        raise HTTPException(status_code=400, detail="Невалидни снимки")
    
    style_desc = AI_STYLES.get(style, AI_STYLES["modern"])
    material_desc = AI_MATERIAL_CLASS.get(material_class, AI_MATERIAL_CLASS["standard"])
    
    ROOM_TYPE_NAMES = {
        "bathroom": "баня", "kitchen": "кухня", "living_room": "хол",
        "bedroom": "спалня", "kids_room": "детска стая", "office": "офис",
        "corridor": "коридор", "balcony": "балкон/тераса", "other": "помещение"
    }
    room_type_name = ROOM_TYPE_NAMES.get(room_type_id, "помещение")
    
    try:
        # Step 1: Analyze photos — strict 1:1 description
        analysis_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ai-designer-{uuid.uuid4()}",
            system_message=f"""Ти си експерт интериорен дизайнер. Получаваш {len(cleaned_images)} снимки на {room_type_name}.

СТРИКТЕН РЕЖИМ 1:1 — анализирай ТОЧНО какво виждаш:
- САМО елементи от снимката (плочки, стени, мебели, вана/душ, мивка, тоалетна, осветление)
- НЕ добавяй нови елементи
- Опиши ТОЧНАТА геометрия, пропорции и позиции

Отговори в JSON:
{{"room_type": "{room_type_name}", "current_state": "детайлно описание", "elements": ["списък"], "lighting": "тип", "colors": ["цветове"], "furniture": ["мебели"], "layout": "разпределение", "description": "VERY DETAILED English description of the EXACT room visible — include every fixture, wall position, floor area, window/door positions, lighting. This must be precise enough to recreate the SAME room."}}"""
        ).with_model("openai", "gpt-4o")

        image_contents = [ImageContent(image_base64=img) for img in cleaned_images]
        analysis_msg = UserMessage(
            text=f"Анализирай ТОЧНО тези {len(cleaned_images)} снимки на {room_type_name}. Опиши 1:1 какво виждаш.",
            file_contents=image_contents
        )

        analysis_response = await analysis_chat.send_message(analysis_msg)

        room_analysis = {}
        try:
            json_match = re_module.search(r'```(?:json)?\s*([\s\S]*?)```', analysis_response)
            if json_match:
                room_analysis = json_module.loads(json_match.group(1))
            else:
                room_analysis = json_module.loads(analysis_response)
        except Exception:
            room_analysis = {"room_type": room_type_name, "description": f"a {room_type_name} interior", "current_state": "needs renovation"}

        room_desc = room_analysis.get("description", f"a {room_type_name} interior")

        # Step 2: Generate 4 angles of renovated room — STRICT 1:1
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)

        generated_images = []
        variants_count = min(int(variants), 5)

        # 4 camera angles for each variant
        camera_angles = [
            ("photographed from the entrance/door looking inward, full room visible", "Фронтален"),
            ("photographed from the left wall at 45 degrees showing depth", "Ляв ъгъл"),
            ("photographed from the right wall at 45 degrees showing depth", "Десен ъгъл"),
            ("photographed from the far corner looking back towards entrance", "Обратен ъгъл"),
        ]

        # Build strict renovation prompt
        reno_instruction = renovation_text or notes or "обновяване на покрития и осветление"

        for i in range(variants_count):
            variant_angles = []
            for angle_idx, (angle_desc, angle_label) in enumerate(camera_angles):
                try:
                    strict_prompt = f"""STRICT 1:1 RENOVATION of the EXACT room described below. {angle_desc}.

ROOM DESCRIPTION (keep EXACT layout): {room_desc}
Dimensions: {room_width}m x {room_length}m, height {room_height}m.

RENOVATION REQUEST: {reno_instruction}

STRICT RULES:
1. Keep the EXACT same room geometry, proportions, and layout
2. Do NOT add new objects/elements that aren't in the original
3. Do NOT use Pinterest/stock images — generate THIS specific room
4. Apply ONLY the requested renovation changes
5. Preserve 1:1 scale and proportions

Style: {style_desc}. Materials: {material_desc}.
Ultra-realistic professional interior photography, 8K quality, perfect lighting."""

                    img_result = await image_gen.generate_images(
                        prompt=strict_prompt,
                        model="gpt-image-1",
                        number_of_images=1
                    )

                    if img_result and len(img_result) > 0:
                        img_b64 = base64.b64encode(img_result[0]).decode('utf-8')
                        variant_angles.append({
                            "angle": angle_idx + 1,
                            "angle_label": angle_label,
                            "image_base64": img_b64
                        })
                except Exception as img_err:
                    logging.error(f"IA Designer image gen error variant {i+1} angle {angle_idx+1}: {img_err}")
                    continue

            if variant_angles:
                generated_images.append({
                    "variant": i + 1,
                    "angles": variant_angles,
                    "image_base64": variant_angles[0]["image_base64"] if variant_angles else "",
                })
        
        # Step 3: Generate materials list with prices using GPT
        materials_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"materials-{uuid.uuid4()}",
            system_message="""Ти си експерт по строителни материали и интериорен дизайн в България.
Генерирай ДЕТАЙЛЕН списък с всички материали, оборудване и цени за ремонт.
Включи ВСИЧКО: подови настилки, стенни покрития, мебели, осветление, санитарно оборудване, аксесоари, електроуреди.

ВАЖНО: Всички цени трябва да са в ЛЕВА (BGN) И ЕВРО (EUR). Курс: 1 EUR = 1.9558 BGN.

Отговори САМО в JSON формат:
{
  "materials": [
    {"name": "...", "quantity": "...", "unit": "...", "price_per_unit_bgn": "...", "price_per_unit_eur": "...", "total_price_bgn": "...", "total_price_eur": "...", "store": "...", "store_url": "..."}
  ],
  "total_estimate_bgn": "...",
  "total_estimate_eur": "...",
  "labor_estimate_bgn": "...",
  "labor_estimate_eur": "...",
  "grand_total_bgn": "...",
  "grand_total_eur": "..."
}
Използвай РЕАЛНИ цени от: Praktiker, Bauhaus, Mr. Bricolage, IKEA, Homemax, Bricoman, Jysk, Emag, Technopolis, Technomarket, Videnov, Ceramica, Leroy Merlin, Jumbo."""
        ).with_model("openai", "gpt-4o")
        
        materials_msg = UserMessage(
            text=f"""Генерирай ПЪЛЕН списък с материали и оборудване за ремонт на {room_type_name} ({room_width}м x {room_length}м x {room_height}м).
Стил: {style_desc}
Клас материали: {material_desc}
{f'Специални изисквания: {notes}' if notes else ''}
Текущо състояние: {room_analysis.get('current_state', 'нуждае се от ремонт')}
Включи ВСИЧКО необходимо за цялостен ремонт."""
        )
        
        materials_response = await materials_chat.send_message(materials_msg)
        
        materials_data = {}
        try:
            json_match = re_module.search(r'```(?:json)?\s*([\s\S]*?)```', materials_response)
            if json_match:
                materials_data = json_module.loads(json_match.group(1))
            else:
                materials_data = json_module.loads(materials_response)
        except:
            materials_data = {"materials": [], "total_estimate": "Не може да се изчисли", "grand_total": "N/A"}
        
        # Save design to DB
        design_id = str(uuid.uuid4())
        design_record = {
            "id": design_id,
            "room_type": room_type_name,
            "room_type_id": room_type_id,
            "room_analysis": room_analysis,
            "style": style,
            "material_class": material_class,
            "dimensions": {"width": room_width, "length": room_length, "height": room_height},
            "variants_count": variants_count,
            "images_count": len(cleaned_images),
            "generated_count": len(generated_images),
            "materials_count": len(materials_data.get("materials", [])),
            "notes": notes,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.ai_designs.insert_one(design_record)
        
        return {
            "id": design_id,
            "room_analysis": room_analysis,
            "generated_images": generated_images,
            "materials": materials_data,
            "stores": BG_STORES,
            "style": style,
            "material_class": material_class,
            "dimensions": {"width": room_width, "length": room_length, "height": room_height},
            "test_mode": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при генерация: {str(e)}")

@api_router.get("/ai-designer/gallery")
async def get_ai_design_gallery():
    """Get gallery of previous AI designs"""
    designs = await db.ai_designs.find(
        {},
        {"_id": 0, "id": 1, "room_type": 1, "style": 1, "material_class": 1, "dimensions": 1, "generated_count": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(20)
    return {"designs": designs}

# ============== REFERRAL SYSTEM (DEMO) ==============

@api_router.get("/referrals/status")
async def get_referral_status(user: dict = Depends(get_current_user)):
    """Get referral status with rewards tracking"""
    referral_code = user["id"][:8].upper()
    referral_count = await db.referrals.count_documents({"referrer_id": user["id"]})
    total_reward = referral_count * 3  # €3 per referral

    # Get list of referred users
    referrals = await db.referrals.find(
        {"referrer_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)

    return {
        "referral_code": referral_code,
        "referral_count": referral_count,
        "total_reward_eur": total_reward,
        "referral_link": f"https://temadom.com/register?ref={referral_code}",
        "rewards_table": [
            {"count": 1, "reward": "3 EUR кредит", "unlocked": referral_count >= 1},
            {"count": 3, "reward": "10 EUR кредит", "unlocked": referral_count >= 3},
            {"count": 5, "reward": "Безплатен 3D рендер", "unlocked": referral_count >= 5},
            {"count": 10, "reward": "1 месец PRO абонамент", "unlocked": referral_count >= 10},
        ],
        "referrals": referrals,
    }


@api_router.post("/referrals/apply")
async def apply_referral(request: Request, user: dict = Depends(get_current_user)):
    """Apply a referral code during or after registration"""
    data = await request.json()
    code = data.get("code", "").strip().upper()
    if not code or len(code) < 6:
        raise HTTPException(status_code=400, detail="Невалиден реферален код")

    # Check if user already used a referral
    existing = await db.referrals.find_one({"referred_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Вече сте използвали реферален код")

    # Find referrer by code (first 8 chars of user ID)
    referrer = await db.users.find_one({"id": {"$regex": f"^{code}", "$options": "i"}}, {"_id": 0, "id": 1, "name": 1})
    if not referrer:
        raise HTTPException(status_code=404, detail="Реферален код не е намерен")
    if referrer["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="Не може да използвате собствен код")

    referral = {
        "id": str(uuid.uuid4()),
        "referrer_id": referrer["id"],
        "referrer_name": referrer.get("name", ""),
        "referred_id": user["id"],
        "referred_name": user.get("name", ""),
        "reward_eur": 3,
        "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.referrals.insert_one(referral)

    # Count total referrals for bonus milestones
    total = await db.referrals.count_documents({"referrer_id": referrer["id"]})
    bonus_msg = ""
    if total == 5:
        bonus_msg = " + Безплатен 3D рендер!"
    elif total == 10:
        bonus_msg = " + 1 месец PRO абонамент!"

    return {
        "applied": True,
        "referrer_name": referrer.get("name", "Потребител"),
        "reward": f"€3 кредит за вас и реферера{bonus_msg}",
    }

@api_router.get("/top-companies")
async def get_top_companies(limit: int = 10):
    """Get top-rated companies for homepage"""
    companies = await db.company_profiles.find(
        {"rating": {"$gt": 0}}, {"_id": 0}
    ).sort("rating", -1).limit(limit).to_list(limit)
    return {"companies": companies}

@api_router.get("/demo-projects")
async def get_demo_projects():
    """Returns empty - no demo projects in production"""
    return {"projects": []}

# ============== REVIEW AI MODERATION ==============

@api_router.post("/reviews/check")
async def check_review_content(data: dict):
    """AI-moderate review content before posting"""
    comment = data.get("comment", "")
    if not comment:
        return {"approved": True, "reason": ""}
    
    # Simple profanity/abuse check
    abuse_patterns = [
        re_module.compile(r'\b(идиот|глупак|мамка|дебил|простак|измамник|крадец)\b', re_module.IGNORECASE),
    ]
    for pattern in abuse_patterns:
        if pattern.search(comment):
            return {"approved": False, "reason": "Коментарът съдържа обидни думи. Моля, преформулирайте."}
    
    return {"approved": True, "reason": ""}

# ============== FEEDBACK SYSTEM ==============
@api_router.post("/feedback")
async def submit_feedback(data: dict):
    """Submit user feedback with rating"""
    rating = data.get("rating", 0)
    text = data.get("text", "")
    name = data.get("name", "Анонимен")
    
    if not rating or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Оценката трябва да е между 1 и 5")
    
    feedback = {
        "id": str(uuid.uuid4()),
        "rating": rating,
        "text": text,
        "name": name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.feedback.insert_one(feedback)
    return {"status": "ok", "message": "Благодарим за обратната връзка!"}

@api_router.get("/feedback")
async def get_feedback():
    """Get all feedback (admin view)"""
    feedback_list = await db.feedback.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    avg_rating = 0
    if feedback_list:
        avg_rating = sum(f["rating"] for f in feedback_list) / len(feedback_list)
    return {"feedback": feedback_list, "avg_rating": round(avg_rating, 1), "total": len(feedback_list)}

# ============== ADMIN: CLEAN TEST DATA ==============

@api_router.post("/admin/clean-test-data")
async def clean_test_data(data: dict):
    """Delete all test/demo companies, users, and associated data for production readiness"""
    admin_key = data.get("admin_key", "")
    if admin_key != "temadom-clean-2026":
        raise HTTPException(status_code=403, detail="Невалиден ключ")
    
    results = {}
    
    # Delete test users (keep real registered users if any)
    deleted_users = await db.users.delete_many({"$or": [
        {"email": {"$regex": "^test"}},
        {"email": {"$regex": "^demo"}},
        {"name": {"$regex": "^Test"}},
        {"name": {"$regex": "^Demo"}},
        {"is_test": True}
    ]})
    results["deleted_users"] = deleted_users.deleted_count
    
    # Delete test companies
    deleted_companies = await db.companies.delete_many({"$or": [
        {"name": {"$regex": "^Тест"}},
        {"name": {"$regex": "^Demo"}},
        {"is_test": True}
    ]})
    results["deleted_companies"] = deleted_companies.deleted_count
    
    # Delete test published projects
    deleted_projects = await db.published_projects.delete_many({"$or": [
        {"author_name": "TemaDom потребител"},
        {"design_id": "test-123"}
    ]})
    results["deleted_published_projects"] = deleted_projects.deleted_count
    
    # Delete old AI designs that were just tests
    deleted_designs = await db.ai_designs.delete_many({"notes": ""})
    results["deleted_ai_designs"] = deleted_designs.deleted_count
    
    # Delete test referrals
    deleted_referrals = await db.referrals.delete_many({})
    results["deleted_referrals"] = deleted_referrals.deleted_count
    
    results["message"] = "Тестовите данни са изтрити. Системата е готова за продукция."
    return results


# ============== PUBLISH AI PROJECT + GALLERY + PDF ==============

@api_router.post("/ai-designer/publish")
async def publish_ai_project(data: dict):
    """Publish an AI design project to the public gallery"""
    design_id = data.get("design_id", str(uuid.uuid4()))
    before_images = data.get("before_images", [])  # base64 list
    generated_images = data.get("generated_images", [])
    materials = data.get("materials", {})
    room_type = data.get("room_type", "")
    style = data.get("style", "")
    material_class = data.get("material_class", "")
    dimensions = data.get("dimensions", {})
    room_analysis = data.get("room_analysis", {})
    author_name = data.get("author_name", "Анонимен")
    
    if not generated_images:
        raise HTTPException(status_code=400, detail="Няма генерирани изображения за публикуване")
    
    project = {
        "id": str(uuid.uuid4()),
        "design_id": design_id,
        "before_images": before_images[:3],
        "generated_images": generated_images,
        "materials": materials,
        "room_type": room_type,
        "style": style,
        "material_class": material_class,
        "dimensions": dimensions,
        "room_analysis": room_analysis,
        "author_name": author_name,
        "views": 0,
        "status": "published",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.published_projects.insert_one(project)
    return {"status": "ok", "project_id": project["id"], "message": "Проектът е публикуван успешно!"}


@api_router.get("/ai-designer/published")
async def get_published_projects(page: int = 1, limit: int = 12):
    """Get all published AI design projects for the public gallery"""
    skip = (page - 1) * limit
    total = await db.published_projects.count_documents({"status": "published"})
    projects = await db.published_projects.find(
        {"status": "published"},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Strip large base64 for listing (keep only first image thumbnail)
    for p in projects:
        # Keep only first before image for thumbnail
        if p.get("before_images"):
            p["before_thumb"] = p["before_images"][0][:200] + "..." if len(p["before_images"][0]) > 200 else p["before_images"][0]
        # Keep only first generated image for thumbnail
        if p.get("generated_images") and len(p["generated_images"]) > 0:
            first_gen = p["generated_images"][0]
            if isinstance(first_gen, dict) and first_gen.get("image_base64"):
                p["gen_thumb"] = first_gen["image_base64"][:200] + "..."
    
    return {"projects": projects, "total": total, "pages": max(1, (total + limit - 1) // limit)}


@api_router.get("/ai-designer/published/{project_id}")
async def get_published_project(project_id: str):
    """Get a single published project with full data"""
    project = await db.published_projects.find_one(
        {"id": project_id, "status": "published"}, {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    
    # Increment views
    await db.published_projects.update_one({"id": project_id}, {"$inc": {"views": 1}})
    project["views"] = project.get("views", 0) + 1
    return project


@api_router.get("/ai-designer/published/{project_id}/pdf/images")
async def download_project_images_pdf(project_id: str):
    """Generate PDF with only the project images (before/after)"""
    from fpdf import FPDF
    import io
    
    project = await db.published_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    
    pdf = FPDF()
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    bold_font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    
    try:
        pdf.add_font("DejaVu", "", font_path, uni=True)
        pdf.add_font("DejaVu", "B", bold_font_path, uni=True)
        fn = "DejaVu"
    except Exception:
        fn = "Helvetica"
    
    # Cover page
    pdf.add_page()
    pdf.set_fill_color(30, 42, 56)
    pdf.rect(0, 0, 210, 297, 'F')
    pdf.set_text_color(255, 140, 66)
    pdf.set_font(fn, 'B', 28)
    pdf.set_y(60)
    pdf.cell(0, 15, "TemaDom AI Designer", ln=True, align='C')
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(fn, '', 14)
    pdf.cell(0, 10, "Визуализации на проект", ln=True, align='C')
    pdf.ln(10)
    pdf.set_font(fn, '', 11)
    room_type = project.get("room_type", "Помещение")
    style_name = project.get("style", "")
    dims = project.get("dimensions", {})
    pdf.cell(0, 8, f"Помещение: {room_type}", ln=True, align='C')
    pdf.cell(0, 8, f"Стил: {style_name}", ln=True, align='C')
    if dims:
        pdf.cell(0, 8, f"Размери: {dims.get('width','')}m x {dims.get('length','')}m x {dims.get('height','')}m", ln=True, align='C')
    pdf.cell(0, 8, f"Дата: {datetime.now(timezone.utc).strftime('%d.%m.%Y')}", ln=True, align='C')
    
    import tempfile
    
    # Before images
    before_images = project.get("before_images", [])
    if before_images:
        pdf.add_page()
        pdf.set_fill_color(255, 255, 255)
        pdf.rect(0, 0, 210, 297, 'F')
        pdf.set_text_color(30, 42, 56)
        pdf.set_font(fn, 'B', 18)
        pdf.cell(0, 12, "ПРЕДИ (Оригинални снимки)", ln=True, align='C')
        pdf.ln(5)
        
        for idx, b64_img in enumerate(before_images):
            try:
                if "," in b64_img:
                    b64_img = b64_img.split(",")[1]
                img_data = base64.b64decode(b64_img)
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                    tmp.write(img_data)
                    tmp_path = tmp.name
                y_pos = pdf.get_y()
                if y_pos > 220:
                    pdf.add_page()
                    pdf.set_fill_color(255, 255, 255)
                    pdf.rect(0, 0, 210, 297, 'F')
                pdf.set_font(fn, '', 10)
                pdf.set_text_color(100, 100, 100)
                pdf.cell(0, 6, f"Ъгъл {idx+1}", ln=True, align='C')
                pdf.image(tmp_path, x=25, w=160)
                pdf.ln(5)
                os.unlink(tmp_path)
            except Exception:
                pass
    
    # Generated images (after)
    gen_images = project.get("generated_images", [])
    for v_idx, variant in enumerate(gen_images):
        pdf.add_page()
        pdf.set_fill_color(255, 255, 255)
        pdf.rect(0, 0, 210, 297, 'F')
        pdf.set_text_color(255, 140, 66)
        pdf.set_font(fn, 'B', 18)
        pdf.cell(0, 12, f"СЛЕД - Вариант {v_idx + 1}", ln=True, align='C')
        pdf.ln(5)
        
        angles = variant.get("angles", [])
        if angles:
            for ang in angles:
                try:
                    b64 = ang.get("image_base64", "")
                    if not b64:
                        continue
                    img_data = base64.b64decode(b64)
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                        tmp.write(img_data)
                        tmp_path = tmp.name
                    pdf.set_font(fn, '', 10)
                    pdf.set_text_color(100, 100, 100)
                    pdf.cell(0, 6, ang.get("angle_label", ""), ln=True, align='C')
                    y_pos = pdf.get_y()
                    if y_pos > 180:
                        pdf.add_page()
                        pdf.set_fill_color(255, 255, 255)
                        pdf.rect(0, 0, 210, 297, 'F')
                    pdf.image(tmp_path, x=15, w=180)
                    pdf.ln(5)
                    os.unlink(tmp_path)
                except Exception:
                    pass
        elif variant.get("image_base64"):
            try:
                img_data = base64.b64decode(variant["image_base64"])
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                    tmp.write(img_data)
                    tmp_path = tmp.name
                pdf.image(tmp_path, x=15, w=180)
                pdf.ln(5)
                os.unlink(tmp_path)
            except Exception:
                pass
    
    # Footer
    pdf.add_page()
    pdf.set_fill_color(30, 42, 56)
    pdf.rect(0, 0, 210, 297, 'F')
    pdf.set_text_color(255, 140, 66)
    pdf.set_font(fn, 'B', 16)
    pdf.set_y(120)
    pdf.cell(0, 10, "Генерирано от TemaDom AI Designer", ln=True, align='C')
    pdf.set_text_color(200, 200, 200)
    pdf.set_font(fn, '', 10)
    pdf.cell(0, 8, "https://temadom.com", ln=True, align='C')
    
    pdf_bytes = pdf.output()
    buf = io.BytesIO(pdf_bytes)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=temadom_project_{project_id}_images.pdf"})


@api_router.get("/ai-designer/published/{project_id}/pdf/materials")
async def download_project_materials_pdf(project_id: str):
    """Generate PDF with only the quantity survey (materials list)"""
    from fpdf import FPDF
    import io
    
    project = await db.published_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    
    materials_data = project.get("materials", {})
    materials_list = materials_data.get("materials", [])
    
    pdf = FPDF()
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    bold_font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    
    try:
        pdf.add_font("DejaVu", "", font_path, uni=True)
        pdf.add_font("DejaVu", "B", bold_font_path, uni=True)
        fn = "DejaVu"
    except Exception:
        fn = "Helvetica"
    
    pdf.add_page()
    
    # Header
    pdf.set_fill_color(255, 140, 66)
    pdf.rect(0, 0, 210, 35, 'F')
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(fn, 'B', 20)
    pdf.set_y(6)
    pdf.cell(0, 12, "TemaDom - Количествена сметка", ln=True, align='C')
    pdf.set_font(fn, '', 9)
    pdf.cell(0, 7, "AI Designer - Списък с материали и цени", ln=True, align='C')
    
    # Project info
    pdf.set_text_color(0, 0, 0)
    pdf.set_y(42)
    pdf.set_font(fn, '', 10)
    room_type = project.get("room_type", "")
    style_name = project.get("style", "")
    dims = project.get("dimensions", {})
    mat_class = project.get("material_class", "")
    pdf.cell(0, 6, f"Помещение: {room_type}   |   Стил: {style_name}   |   Клас: {mat_class}", ln=True)
    if dims:
        pdf.cell(0, 6, f"Размери: {dims.get('width','')}m x {dims.get('length','')}m x {dims.get('height','')}m   |   Дата: {datetime.now(timezone.utc).strftime('%d.%m.%Y')}", ln=True)
    pdf.ln(5)
    
    # Table
    w = [55, 18, 25, 30, 30, 32]  # name, qty, unit_price, total_bgn, total_eur, store
    
    pdf.set_fill_color(30, 42, 56)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(fn, 'B', 8)
    pdf.cell(w[0], 7, "Материал", 1, 0, 'L', True)
    pdf.cell(w[1], 7, "Кол-во", 1, 0, 'C', True)
    pdf.cell(w[2], 7, "Ед. цена", 1, 0, 'C', True)
    pdf.cell(w[3], 7, "Общо (лв)", 1, 0, 'C', True)
    pdf.cell(w[4], 7, "Общо (EUR)", 1, 0, 'C', True)
    pdf.cell(w[5], 7, "Магазин", 1, 1, 'C', True)
    
    pdf.set_text_color(0, 0, 0)
    pdf.set_font(fn, '', 7)
    fill = False
    for m in materials_list:
        if fill:
            pdf.set_fill_color(245, 245, 245)
        else:
            pdf.set_fill_color(255, 255, 255)
        
        name = str(m.get("name", ""))[:30]
        qty = f"{m.get('quantity', '')} {m.get('unit', '')}"
        unit_p = str(m.get("price_per_unit_bgn", m.get("price_per_unit", "-")))
        total_bgn = str(m.get("total_price_bgn", m.get("total_price", "-")))
        total_eur = str(m.get("total_price_eur", "-"))
        store = str(m.get("store", "-"))[:18]
        
        pdf.cell(w[0], 6, name, 1, 0, 'L', fill)
        pdf.cell(w[1], 6, qty[:12], 1, 0, 'C', fill)
        pdf.cell(w[2], 6, unit_p[:10], 1, 0, 'C', fill)
        pdf.cell(w[3], 6, total_bgn[:12], 1, 0, 'C', fill)
        pdf.cell(w[4], 6, total_eur[:12], 1, 0, 'C', fill)
        pdf.cell(w[5], 6, store, 1, 1, 'C', fill)
        fill = not fill
        
        if pdf.get_y() > 270:
            pdf.add_page()
            pdf.set_fill_color(30, 42, 56)
            pdf.set_text_color(255, 255, 255)
            pdf.set_font(fn, 'B', 8)
            pdf.cell(w[0], 7, "Материал", 1, 0, 'L', True)
            pdf.cell(w[1], 7, "Кол-во", 1, 0, 'C', True)
            pdf.cell(w[2], 7, "Ед. цена", 1, 0, 'C', True)
            pdf.cell(w[3], 7, "Общо (лв)", 1, 0, 'C', True)
            pdf.cell(w[4], 7, "Общо (EUR)", 1, 0, 'C', True)
            pdf.cell(w[5], 7, "Магазин", 1, 1, 'C', True)
            pdf.set_text_color(0, 0, 0)
            pdf.set_font(fn, '', 7)
    
    # Totals
    pdf.ln(3)
    pdf.set_font(fn, 'B', 9)
    tot_bgn = materials_data.get("total_estimate_bgn", materials_data.get("total_estimate", "N/A"))
    tot_eur = materials_data.get("total_estimate_eur", "N/A")
    labor_bgn = materials_data.get("labor_estimate_bgn", materials_data.get("labor_estimate", ""))
    labor_eur = materials_data.get("labor_estimate_eur", "")
    grand_bgn = materials_data.get("grand_total_bgn", materials_data.get("grand_total", "N/A"))
    grand_eur = materials_data.get("grand_total_eur", "N/A")
    
    pdf.cell(0, 7, f"Материали: {tot_bgn} лв / {tot_eur} EUR", ln=True)
    if labor_bgn:
        pdf.cell(0, 7, f"Труд: {labor_bgn} лв / {labor_eur} EUR", ln=True)
    
    pdf.ln(2)
    pdf.set_fill_color(255, 140, 66)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(fn, 'B', 12)
    pdf.cell(0, 10, f"ОБЩА СТОЙНОСТ: {grand_bgn} лв / {grand_eur} EUR", 0, 1, 'C', True)
    
    # Footer
    pdf.ln(10)
    pdf.set_text_color(120, 120, 120)
    pdf.set_font(fn, '', 7)
    pdf.multi_cell(0, 4,
        "* Цените са ориентировъчни, базирани на средни пазарни цени за 2025-2026 г.\n"
        "* Генерирано от TemaDom AI Designer - https://temadom.com")
    
    pdf_bytes = pdf.output()
    buf = io.BytesIO(pdf_bytes)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=temadom_project_{project_id}_materials.pdf"})


# ============== AI SKETCH ANALYSIS (CV/OCR Pipeline) ==============

from cv_pipeline import process_sketch

@api_router.post("/ai-sketch/analyze")
async def analyze_sketch(request: Request):
    """Analyze sketches using OpenCV line detection + Tesseract OCR → .glb 3D model.
    STRICT MODE: Only geometry present in the drawing. No hallucination."""
    data = await request.json()

    sketches = data.get("sketches", [])
    if not sketches:
        raise HTTPException(status_code=400, detail="Качете поне 1 скица или чертеж")

    # Clean base64
    cleaned = []
    for s in sketches[:3]:
        if s and "," in s:
            cleaned.append(s.split(",")[1])
        elif s:
            cleaned.append(s)

    if not cleaned:
        raise HTTPException(status_code=400, detail="Невалидни файлове")

    try:
        # Process primary sketch through CV/OCR pipeline
        result = process_sketch(cleaned[0])

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        # Save to DB
        sketch_id = str(uuid.uuid4())
        await db.ai_sketches.insert_one({
            "id": sketch_id,
            "building_type": data.get("building_type", "residential"),
            "notes": data.get("notes", ""),
            "sketches_count": len(cleaned),
            "summary": result["summary"],
            "geometry": result["geometry"],
            "glb_base64": result["glb_base64"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return {
            "id": sketch_id,
            "geometry": result["geometry"],
            "glb_base64": result["glb_base64"],
            "summary": result["summary"],
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"CV Pipeline error: {e}")
        raise HTTPException(status_code=500, detail=f"Грешка при анализ: {str(e)}")


@api_router.get("/ai-sketch/{sketch_id}")
async def get_sketch_project(sketch_id: str):
    """Load a saved AI Sketch project by ID (shareable link)."""
    project = await db.ai_sketches.find_one({"id": sketch_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    return project


# ============== AI CHART ANALYZER ==============
AI_CHART_SYSTEM_PROMPT = """Ти си експертен строителен инженер с 30+ години опит в количествени сметки и остойностяване на строителни проекти.

Анализирай техническия чертеж/скица и извлечи ВСИЧКИ конструктивни елементи с ТОЧНИ размери и количества.

ОТГОВОРИ ЗАДЪЛЖИТЕЛНО в JSON формат:
{
  "title": "Кратко заглавие на обекта",
  "description": "Описание какво виждаш на чертежа",
  "structural_elements": [
    {"name": "елемент", "type": "тип", "dimensions": "размери", "quantity": "брой/м²/м³", "notes": "бележки"}
  ],
  "materials": [
    {"name": "материал", "unit": "единица (м², м³, бр., кг, м.л.)", "quantity": число, "price_per_unit": число, "total": число, "notes": "бележки"}
  ],
  "labor": [
    {"name": "вид работа", "unit": "единица", "quantity": число, "price_per_unit": число, "total": число}
  ],
  "summary": {
    "materials_total": число,
    "labor_total": число,
    "overhead_percent": 10,
    "overhead_total": число,
    "grand_total": число,
    "currency": "EUR"
  },
  "dimensions": {"length": "м", "width": "м", "height": "м", "area": "м²"},
  "accuracy_note": "Точност на анализа: 95-100%. Бележки за допълнителна проверка."
}

ПРАВИЛА:
- Цените са в EUR за българския пазар (2025-2026)
- Включи ВСИЧКИ необходими материали (бетон, арматура, кофраж, тухли, мазилка, хидроизолация и т.н.)
- Включи труд за всяка дейност
- Добави 10% за непредвидени разходи
- Количествата трябва да са РЕАЛИСТИЧНИ за показаните размери
- Ако не виждаш ясно определен елемент, НЕ го добавяй"""

# AIChartAnalyzeRequest imported from models

@api_router.post("/ai-chart/analyze")
async def analyze_chart(req: AIChartAnalyzeRequest):
    """Analyze a technical drawing/blueprint using AI vision and generate quantity survey"""
    if not req.image:
        raise HTTPException(status_code=400, detail="Изображението е задължително")
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI ключът не е конфигуриран")
    
    image_base64 = req.image
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"chart-{uuid.uuid4()}",
            system_message=AI_CHART_SYSTEM_PROMPT
        ).with_model("openai", "gpt-4o")
        
        image_content = ImageContent(image_base64=image_base64)
        
        user_text = "Анализирай ВНИМАТЕЛНО този технически чертеж/скица. Извлечи ВСИЧКИ конструктивни елементи, размери и количества. Генерирай ПЪЛНА количествена сметка с материали, труд и общо. Отговори в JSON формат."
        if req.notes:
            user_text += f"\nДопълнителни бележки: {req.notes}"
        
        user_message = UserMessage(text=user_text, file_contents=[image_content])
        response = await chat.send_message(user_message)
        
        # Parse JSON from response
        response_text = response.strip()
        json_match = re_module.search(r'```(?:json)?\s*([\s\S]*?)```', response_text)
        if json_match:
            response_text = json_match.group(1).strip()
        else:
            json_obj_match = re_module.search(r'\{[\s\S]*\}', response_text)
            if json_obj_match:
                response_text = json_obj_match.group(0)
        
        try:
            result = json_module.loads(response_text)
        except json_module.JSONDecodeError:
            result = {
                "title": "Анализ на чертеж",
                "description": response[:500],
                "materials": [],
                "labor": [],
                "summary": {"materials_total": 0, "labor_total": 0, "overhead_percent": 10, "overhead_total": 0, "grand_total": 0, "currency": "EUR"},
                "accuracy_note": "AI анализът не върна структуриран отговор. Моля, опитайте отново."
            }
        
        # Save to DB
        chart_id = str(uuid.uuid4())
        await db.ai_charts.insert_one({
            "id": chart_id,
            "title": result.get("title", ""),
            "materials_count": len(result.get("materials", [])),
            "grand_total": result.get("summary", {}).get("grand_total", 0),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        result["id"] = chart_id
        return result
        
    except Exception as e:
        logging.error(f"AI Chart analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Грешка при AI анализ: {str(e)}")


# AIChartPDFRequest imported from models

@api_router.post("/ai-chart/pdf-contract")
async def generate_chart_pdf_contract(req: AIChartPDFRequest):
    """Generate a formal PDF contract with quantity survey from AI chart analysis"""
    from fpdf import FPDF
    import io

    pdf = FPDF()
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    bold_font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

    try:
        pdf.add_font("DejaVu", "", font_path, uni=True)
        pdf.add_font("DejaVu", "B", bold_font_path, uni=True)
        fn = "DejaVu"
    except Exception:
        fn = "Helvetica"

    # --- Page 1: Contract ---
    pdf.add_page()
    
    # Header
    pdf.set_fill_color(140, 86, 255)
    pdf.rect(0, 0, 210, 30, 'F')
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(fn, 'B', 18)
    pdf.set_y(5)
    pdf.cell(0, 10, "ДОГОВОР ЗА СТРОИТЕЛНО-РЕМОНТНИ ДЕЙНОСТИ", ln=True, align='C')
    pdf.set_font(fn, '', 9)
    pdf.cell(0, 8, "TemaDom | AI Анализатор на чертежи", ln=True, align='C')
    
    # Contract info
    pdf.set_text_color(0, 0, 0)
    pdf.set_y(38)
    pdf.set_font(fn, '', 10)
    today = datetime.now(timezone.utc).strftime('%d.%m.%Y')
    pdf.cell(0, 7, f"Дата: {today}", ln=True)
    pdf.cell(0, 7, f"Договор No: TD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}", ln=True)
    pdf.ln(3)
    
    # Parties
    pdf.set_font(fn, 'B', 11)
    pdf.cell(0, 8, "СТРАНИ ПО ДОГОВОРА:", ln=True)
    pdf.set_font(fn, '', 10)
    pdf.cell(0, 7, f"ВЪЗЛОЖИТЕЛ: {req.client_name or '____________________________'}", ln=True)
    pdf.cell(0, 7, f"Адрес: {req.client_address or '____________________________'}", ln=True)
    pdf.ln(2)
    pdf.cell(0, 7, f"ИЗПЪЛНИТЕЛ: {req.contractor_name or '____________________________'}", ln=True)
    pdf.ln(3)
    
    # Object
    pdf.set_font(fn, 'B', 11)
    pdf.cell(0, 8, "ПРЕДМЕТ НА ДОГОВОРА:", ln=True)
    pdf.set_font(fn, '', 10)
    pdf.multi_cell(0, 6, f"{req.title}. {req.description[:300]}" if req.description else req.title)
    pdf.ln(3)
    
    # Summary
    summary = req.summary or {}
    grand_total = summary.get("grand_total", 0)
    pdf.set_font(fn, 'B', 11)
    pdf.cell(0, 8, f"ОБЩА СТОЙНОСТ: {grand_total} EUR (с ДДС)", ln=True)
    pdf.ln(3)
    
    # Terms
    pdf.set_font(fn, 'B', 10)
    pdf.cell(0, 7, "УСЛОВИЯ:", ln=True)
    pdf.set_font(fn, '', 9)
    terms = [
        "1. Изпълнителят се задължава да извърши дейностите по количествената сметка (Приложение 1).",
        "2. Срок за изпълнение: ______ работни дни от датата на подписване.",
        "3. Плащане: 30% аванс при подписване, 70% при приемане на работата.",
        "4. Гаранционен срок: 24 месеца от датата на приемане.",
        "5. Промени в обема на работите се извършват само с писмено допълнение.",
        "6. При спор страните се обръщат към компетентния съд по седалище на Възложителя."
    ]
    for t in terms:
        pdf.multi_cell(0, 5.5, t)
        pdf.ln(1)
    
    # Signatures
    pdf.ln(8)
    pdf.set_font(fn, 'B', 10)
    pdf.cell(95, 7, "ВЪЗЛОЖИТЕЛ:", 0, 0)
    pdf.cell(95, 7, "ИЗПЪЛНИТЕЛ:", 0, 1)
    pdf.ln(12)
    pdf.set_font(fn, '', 9)
    pdf.cell(95, 5, "Подпис: ________________", 0, 0)
    pdf.cell(95, 5, "Подпис: ________________", 0, 1)
    pdf.cell(95, 5, f"Дата: {today}", 0, 0)
    pdf.cell(95, 5, f"Дата: {today}", 0, 1)
    
    # --- Page 2: Quantity Survey (Materials) ---
    pdf.add_page()
    
    pdf.set_fill_color(255, 140, 66)
    pdf.rect(0, 0, 210, 25, 'F')
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(fn, 'B', 16)
    pdf.set_y(4)
    pdf.cell(0, 10, "ПРИЛОЖЕНИЕ 1: КОЛИЧЕСТВЕНА СМЕТКА", ln=True, align='C')
    pdf.set_font(fn, '', 8)
    pdf.cell(0, 6, f"{req.title}", ln=True, align='C')
    
    # Materials table
    pdf.set_y(30)
    pdf.set_font(fn, 'B', 9)
    pdf.set_fill_color(50, 60, 80)
    pdf.set_text_color(255, 255, 255)
    col_w = [8, 58, 18, 18, 22, 22, 44]
    headers = ["#", "Материал", "Ед.", "Кол.", "Цена/ед.", "Общо EUR", "Бележки"]
    for i, h in enumerate(headers):
        pdf.cell(col_w[i], 8, h, 1, 0, 'C', True)
    pdf.ln()
    
    pdf.set_text_color(0, 0, 0)
    pdf.set_font(fn, '', 8)
    mat_total = 0
    for i, m in enumerate(req.materials, 1):
        total = m.get("total", 0)
        mat_total += total if isinstance(total, (int, float)) else 0
        fill = i % 2 == 0
        if fill:
            pdf.set_fill_color(245, 245, 250)
        pdf.cell(col_w[0], 7, str(i), 1, 0, 'C', fill)
        name = str(m.get("name", ""))[:30]
        pdf.cell(col_w[1], 7, name, 1, 0, 'L', fill)
        pdf.cell(col_w[2], 7, str(m.get("unit", ""))[:8], 1, 0, 'C', fill)
        pdf.cell(col_w[3], 7, str(m.get("quantity", "")), 1, 0, 'C', fill)
        pdf.cell(col_w[4], 7, str(m.get("price_per_unit", "")), 1, 0, 'R', fill)
        pdf.cell(col_w[5], 7, str(total), 1, 0, 'R', fill)
        notes_text = str(m.get("notes", ""))[:22]
        pdf.cell(col_w[6], 7, notes_text, 1, 0, 'L', fill)
        pdf.ln()
    
    # Materials subtotal
    pdf.set_font(fn, 'B', 9)
    pdf.set_fill_color(255, 140, 66)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(sum(col_w[:5]), 8, "МАТЕРИАЛИ ОБЩО:", 1, 0, 'R', True)
    pdf.cell(col_w[5], 8, f"{mat_total:.0f}", 1, 0, 'R', True)
    pdf.cell(col_w[6], 8, "EUR", 1, 1, 'L', True)
    
    # Labor table
    if req.labor:
        pdf.ln(5)
        pdf.set_font(fn, 'B', 11)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 8, "ТРУД:", ln=True)
        
        pdf.set_font(fn, 'B', 9)
        pdf.set_fill_color(50, 60, 80)
        pdf.set_text_color(255, 255, 255)
        labor_w = [8, 82, 18, 18, 22, 42]
        labor_h = ["#", "Вид работа", "Ед.", "Кол.", "Цена/ед.", "Общо EUR"]
        for i, h in enumerate(labor_h):
            pdf.cell(labor_w[i], 8, h, 1, 0, 'C', True)
        pdf.ln()
        
        pdf.set_text_color(0, 0, 0)
        pdf.set_font(fn, '', 8)
        labor_total = 0
        for i, l in enumerate(req.labor, 1):
            total = l.get("total", 0)
            labor_total += total if isinstance(total, (int, float)) else 0
            fill = i % 2 == 0
            if fill:
                pdf.set_fill_color(245, 245, 250)
            pdf.cell(labor_w[0], 7, str(i), 1, 0, 'C', fill)
            pdf.cell(labor_w[1], 7, str(l.get("name", ""))[:42], 1, 0, 'L', fill)
            pdf.cell(labor_w[2], 7, str(l.get("unit", ""))[:8], 1, 0, 'C', fill)
            pdf.cell(labor_w[3], 7, str(l.get("quantity", "")), 1, 0, 'C', fill)
            pdf.cell(labor_w[4], 7, str(l.get("price_per_unit", "")), 1, 0, 'R', fill)
            pdf.cell(labor_w[5], 7, str(total), 1, 0, 'R', fill)
            pdf.ln()
        
        pdf.set_font(fn, 'B', 9)
        pdf.set_fill_color(255, 140, 66)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(sum(labor_w[:4]), 8, "ТРУД ОБЩО:", 1, 0, 'R', True)
        pdf.cell(labor_w[4], 8, "", 1, 0, 'C', True)
        pdf.cell(labor_w[5], 8, f"{labor_total:.0f} EUR", 1, 1, 'R', True)
    
    # Grand total
    pdf.ln(5)
    pdf.set_font(fn, 'B', 12)
    pdf.set_fill_color(140, 86, 255)
    pdf.set_text_color(255, 255, 255)
    overhead = summary.get("overhead_total", 0)
    pdf.cell(130, 10, f"Непредвидени ({summary.get('overhead_percent', 10)}%):", 1, 0, 'R', True)
    pdf.cell(60, 10, f"{overhead} EUR", 1, 1, 'R', True)
    pdf.cell(130, 12, "ОБЩА СТОЙНОСТ:", 1, 0, 'R', True)
    pdf.cell(60, 12, f"{grand_total} EUR", 1, 1, 'R', True)
    
    # Footer
    pdf.set_text_color(120, 120, 120)
    pdf.set_font(fn, '', 7)
    pdf.ln(6)
    pdf.cell(0, 5, "Генерирано от TemaDom AI Анализатор | temadom.com", ln=True, align='C')
    pdf.cell(0, 5, "Цените са ориентировъчни за българския пазар 2025-2026. Моля, потвърдете с изпълнителя.", ln=True, align='C')

    pdf_bytes = pdf.output()
    buf = io.BytesIO(pdf_bytes)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=temadom-dogovor-smetka.pdf"})


# ============== 3D Scanner PDF ==============
# Scanner3DPDFRequest imported from models

@api_router.post("/scanner3d/pdf")
async def generate_scanner3d_pdf(req: Scanner3DPDFRequest):
    from fpdf import FPDF
    import io

    pdf = FPDF()
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    bold_font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

    try:
        pdf.add_font("DejaVu", "", font_path, uni=True)
        pdf.add_font("DejaVu", "B", bold_font_path, uni=True)
        fn = "DejaVu"
    except Exception:
        fn = "Helvetica"

    pdf.add_page()

    # Header
    pdf.set_fill_color(140, 86, 255)
    pdf.rect(0, 0, 210, 35, 'F')
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(fn, 'B', 20)
    pdf.set_y(6)
    pdf.cell(0, 12, "TemaDom - 3D Скенер", ln=True, align='C')
    pdf.set_font(fn, '', 9)
    pdf.cell(0, 7, "Количествена сметка за избрани елементи", ln=True, align='C')

    # Date
    pdf.set_text_color(0, 0, 0)
    pdf.set_y(42)
    pdf.set_font(fn, '', 10)
    pdf.cell(0, 8, f"Дата: {datetime.now(timezone.utc).strftime('%d.%m.%Y')}", ln=True)
    pdf.ln(4)

    # Table header
    pdf.set_fill_color(50, 60, 80)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(fn, 'B', 10)
    pdf.cell(15, 10, "#", 1, 0, 'C', True)
    pdf.cell(65, 10, "Категория", 1, 0, 'C', True)
    pdf.cell(70, 10, "Избран модел", 1, 0, 'C', True)
    pdf.cell(40, 10, "Цена (лв.)", 1, 1, 'C', True)

    # Table rows
    pdf.set_text_color(0, 0, 0)
    pdf.set_font(fn, '', 10)
    total = 0
    for i, item in enumerate(req.items, 1):
        price = item.get("price", 0)
        total += price
        fill = i % 2 == 0
        if fill:
            pdf.set_fill_color(240, 240, 245)
        pdf.cell(15, 9, str(i), 1, 0, 'C', fill)
        pdf.cell(65, 9, str(item.get("category", "")), 1, 0, 'L', fill)
        pdf.cell(70, 9, str(item.get("name", "")), 1, 0, 'L', fill)
        pdf.cell(40, 9, f"{price:.2f}", 1, 1, 'R', fill)

    # Total
    pdf.set_font(fn, 'B', 11)
    pdf.set_fill_color(140, 86, 255)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(150, 10, "ОБЩО:", 1, 0, 'R', True)
    pdf.cell(40, 10, f"{total:.2f} лв.", 1, 1, 'R', True)

    # Footer
    pdf.set_text_color(120, 120, 120)
    pdf.set_font(fn, '', 8)
    pdf.ln(10)
    pdf.cell(0, 6, "Генерирано от TemaDom 3D Скенер | temadom.com", ln=True, align='C')
    pdf.cell(0, 6, "Цените са ориентировъчни и могат да варират.", ln=True, align='C')

    pdf_bytes = pdf.output()
    buf = io.BytesIO(pdf_bytes)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=temadom-3d-smetka.pdf"})


# ============== READY PROJECTS (Social Zone) ==============
@api_router.get("/ready-projects")
async def get_ready_projects(request: Request):
    """Get all published ready projects with likes/comments"""
    projects = await db.ready_projects.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    # Check if current user liked
    token_str = None
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token_str = auth_header[7:]
    user_id = None
    if token_str:
        try:
            payload = decode_token(token_str)
            user_id = payload.get("user_id")
        except:
            pass
    for p in projects:
        p["liked_by_user"] = user_id in (p.get("liked_by", []) or []) if user_id else False
        p["likes"] = len(p.get("liked_by", []) or [])
        p.pop("liked_by", None)
    return projects

@api_router.post("/ready-projects")
async def create_ready_project(data: dict, user: dict = Depends(get_current_user)):
    """Create a ready project for the social feed"""
    project_id = str(uuid.uuid4())[:8]
    doc = {
        "id": project_id,
        "user_id": user["id"],
        "author_name": user.get("name", "Анонимен"),
        "title": data.get("title", "Проект"),
        "description": data.get("description", ""),
        "images": data.get("images", [])[:10],
        "source": data.get("source", "Ръчно"),
        "liked_by": [],
        "comments": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ready_projects.insert_one(doc)
    return {"id": project_id, "message": "Проектът е публикуван"}

@api_router.post("/ready-projects/{project_id}/like")
async def toggle_like(project_id: str, user: dict = Depends(get_current_user)):
    project = await db.ready_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    liked_by = project.get("liked_by", []) or []
    if user["id"] in liked_by:
        liked_by.remove(user["id"])
        liked = False
    else:
        liked_by.append(user["id"])
        liked = True
    await db.ready_projects.update_one({"id": project_id}, {"$set": {"liked_by": liked_by}})
    return {"likes": len(liked_by), "liked": liked}

@api_router.post("/ready-projects/{project_id}/comment")
async def add_comment(project_id: str, data: dict, user: dict = Depends(get_current_user)):
    project = await db.ready_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    comment = {
        "author": user.get("name", "Анонимен"),
        "user_id": user["id"],
        "text": data.get("text", "")[:500],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    comments = project.get("comments", []) or []
    comments.append(comment)
    await db.ready_projects.update_one({"id": project_id}, {"$set": {"comments": comments}})
    return {"comments": comments}


# ============== 3D Scanner Project Save/Load ==============
@api_router.post("/scanner3d/projects")
async def save_scanner3d_project(req: Scanner3DProjectSave, user: dict = Depends(get_current_user)):
    project_id = str(uuid.uuid4())[:8]
    doc = {
        "id": project_id,
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "title": req.title,
        "selections": req.selections,
        "photo_count": len(req.photos),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.scanner3d_projects.insert_one(doc)
    return {"id": project_id, "message": "Проектът е запазен"}

@api_router.get("/scanner3d/projects")
async def list_scanner3d_projects(user: dict = Depends(get_current_user)):
    projects = await db.scanner3d_projects.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return projects

@api_router.get("/scanner3d/projects/{project_id}")
async def get_scanner3d_project(project_id: str):
    project = await db.scanner3d_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    return project

@api_router.delete("/scanner3d/projects/{project_id}")
async def delete_scanner3d_project(project_id: str, user: dict = Depends(get_current_user)):
    result = await db.scanner3d_projects.delete_one({"id": project_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Проектът не е намерен")
    return {"message": "Проектът е изтрит"}


# ============== BACKGROUND TASKS: SUBSCRIPTION MANAGEMENT ==============
import asyncio

async def check_subscriptions_background():
    """Background task: check expired subscriptions, send reminders, auto-deactivate"""
    while True:
        try:
            now = datetime.now(timezone.utc)
            reminder_threshold = now + timedelta(days=7)
            
            # 1. Send reminders for subscriptions expiring in 7 days
            expiring_soon = await db.users.find({
                "subscription_active": True,
                "subscription_expires": {"$lte": reminder_threshold.isoformat(), "$gt": now.isoformat()},
                "subscription_reminded": {"$ne": True}
            }, {"_id": 0}).to_list(100)
            
            for user in expiring_soon:
                # Create in-platform notification
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": user["id"],
                    "type": "subscription_reminder",
                    "title": "Абонаментът ви изтича скоро",
                    "message": f"Вашият абонамент ({user.get('subscription_plan', 'basic')}) изтича на {user.get('subscription_expires', '')[:10]}. Подновете го, за да запазите достъпа си.",
                    "read": False,
                    "created_at": now.isoformat()
                })
                await db.users.update_one({"id": user["id"]}, {"$set": {"subscription_reminded": True}})
                logger.info(f"Subscription reminder sent to user {user['id']}")
            
            # 2. Auto-deactivate expired subscriptions
            expired_users = await db.users.find({
                "subscription_active": True,
                "subscription_expires": {"$lte": now.isoformat()}
            }, {"_id": 0}).to_list(100)
            
            for user in expired_users:
                # Deactivate user subscription
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"subscription_active": False, "subscription_reminded": False}}
                )
                # Deactivate company profile subscription
                await db.company_profiles.update_one(
                    {"user_id": user["id"]},
                    {"$set": {"subscription_active": False}}
                )
                # Deactivate all ads from this user
                deactivated = await db.ads.update_many(
                    {"user_id": user["id"], "status": "active"},
                    {"$set": {"status": "expired"}}
                )
                # Create notification
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": user["id"],
                    "type": "subscription_expired",
                    "title": "Абонаментът ви е изтекъл",
                    "message": f"Вашият абонамент е деактивиран. {deactivated.modified_count} обяви са спрени. Подновете абонамента си за да ги възстановите.",
                    "read": False,
                    "created_at": now.isoformat()
                })
                logger.info(f"Subscription expired for user {user['id']}, {deactivated.modified_count} ads deactivated")
            
        except Exception as e:
            logger.error(f"Subscription check error: {e}")
        
        await asyncio.sleep(3600)  # Check every hour


# ==================== WEB SCRAPING — Product Search ====================

import httpx
from bs4 import BeautifulSoup

STORE_SEARCH_URLS = {
    "praktiker": {"name": "Praktiker", "base": "https://praktiker.bg", "search": "https://praktiker.bg/bg/search?q={query}"},
    "jysk": {"name": "Jysk", "base": "https://jysk.bg", "search": "https://jysk.bg/catalogsearch/result/?q={query}"},
    "mrbricolage": {"name": "Mr.Bricolage", "base": "https://www.mrbricolage.bg", "search": "https://www.mrbricolage.bg/search?q={query}"},
    "bauhaus": {"name": "Bauhaus", "base": "https://www.bauhaus.bg", "search": "https://www.bauhaus.bg/catalogsearch/result/?q={query}"},
    "homemax": {"name": "HomeMax", "base": "https://www.homemax.bg", "search": "https://www.homemax.bg/catalogsearch/result/?q={query}"},
    "technomarket": {"name": "Technomarket", "base": "https://www.technomarket.bg", "search": "https://www.technomarket.bg/search?q={query}", "priority": ["бойлер", "климатик", "осветление", "хладилник", "готварска", "пералня", "съдомиялна", "вентилатор", "аспиратор"]},
    "teknoimpex": {"name": "Teknoimpex", "base": "https://teknoimpex.bg", "search": "https://teknoimpex.bg/search?q={query}"},
    "ikea": {"name": "IKEA", "base": "https://www.ikea.bg", "search": "https://www.ikea.bg/search/?q={query}"},
    "temax": {"name": "Temax", "base": "https://www.temax.bg", "search": "https://www.temax.bg/search/?q={query}"},
    "maximarket": {"name": "Maximarket", "base": "https://www.maximarket.bg", "search": "https://www.maximarket.bg/catalogsearch/result/?q={query}"},
    "toplivo": {"name": "Toplivo", "base": "https://www.toplivo.bg", "search": "https://www.toplivo.bg/search?q={query}"},
    "marmag": {"name": "Marmag", "base": "https://marmag.bg", "search": "https://marmag.bg/search?q={query}"},
    "paros": {"name": "Paros", "base": "https://www.paros.bg", "search": "https://www.paros.bg/search?q={query}"},
    "praktis": {"name": "Praktis", "base": "https://praktis.bg", "search": "https://praktis.bg/search?q={query}"},
    "angro": {"name": "Angro", "base": "https://angro.bg", "search": "https://angro.bg/search?q={query}"},
    "rilaonline": {"name": "Rila Online", "base": "https://rilaonline.com", "search": "https://rilaonline.com/search?q={query}"},
    "baustoff": {"name": "Baustoff Metall", "base": "https://baustoff-metall.bg", "search": "https://baustoff-metall.bg/search?q={query}"},
    "atek": {"name": "Atek", "base": "https://atek.bg", "search": "https://atek.bg/search?q={query}"},
    "vako": {"name": "Vako", "base": "https://vako.bg", "search": "https://vako.bg/search?q={query}"},
    "buildmark": {"name": "Buildmark", "base": "https://buildmark.bg", "search": "https://buildmark.bg/search?q={query}"},
    "obijavki": {"name": "Obijavki", "base": "https://obijavki.com", "search": "https://obijavki.com/search?q={query}"},
}

async def scrape_store(store_key: str, query: str) -> list:
    """Try to scrape product results from a Bulgarian store. Returns list of products or fallback."""
    store = STORE_SEARCH_URLS.get(store_key)
    if not store:
        return []

    url = store["search"].format(query=query.replace(" ", "+"))
    products = []

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client_http:
            headers_req = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "bg-BG,bg;q=0.9,en;q=0.8",
            }
            resp = await client_http.get(url, headers=headers_req)

            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")

                # Generic product extraction patterns
                for selector in [
                    "div.product-item", "div.product-card", "li.product-item",
                    "div.product", "article.product", "div[data-product]",
                    "div.search-result-item", "div.item-product",
                ]:
                    items = soup.select(selector)
                    if items:
                        for item in items[:5]:
                            name_el = item.select_one("h2, h3, .product-name, .product-title, a.product-name, .name")
                            price_el = item.select_one(".price, .product-price, .current-price, span.price")
                            link_el = item.select_one("a[href]")

                            name = name_el.get_text(strip=True) if name_el else None
                            price_text = price_el.get_text(strip=True) if price_el else ""
                            link = link_el.get("href", "") if link_el else ""

                            if name:
                                # Parse price
                                price_num = 0
                                import re as re_local
                                price_match = re_local.search(r'([\d.,]+)', price_text.replace(" ", ""))
                                if price_match:
                                    try:
                                        price_num = float(price_match.group(1).replace(",", "."))
                                    except ValueError:
                                        pass

                                full_link = link if link.startswith("http") else store["base"] + link

                                products.append({
                                    "name": name[:100],
                                    "price_bgn": price_num,
                                    "price_eur": round(price_num / 1.96, 2) if price_num > 0 else 0,
                                    "url": make_affiliate_url(full_link, store["name"]),
                                    "store": store["name"],
                                    "available": True,
                                    "scraped": True,
                                })
                        break
    except Exception as e:
        logging.warning(f"Scrape {store_key} failed: {e}")

    return products


@api_router.get("/scrape/search")
async def search_products(q: str, store: str = "all"):
    """Search for real products across Bulgarian stores."""
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Моля, въведете поне 2 символа")

    results = {}
    stores_to_search = [store] if store != "all" else list(STORE_SEARCH_URLS.keys())

    tasks = [scrape_store(s, q) for s in stores_to_search]
    store_results = await asyncio.gather(*tasks)

    for s_key, prods in zip(stores_to_search, store_results):
        if prods:
            results[s_key] = prods

    all_products = []
    for prods in results.values():
        all_products.extend(prods)

    return {
        "query": q,
        "total": len(all_products),
        "stores_searched": len(stores_to_search),
        "stores_with_results": len(results),
        "products": all_products[:20],
        "by_store": results,
    }


@api_router.get("/scrape/stores")
async def get_stores():
    """Get list of supported Bulgarian stores."""
    return {
        "stores": [
            {"id": k, "name": v["name"], "url": v["base"]}
            for k, v in STORE_SEARCH_URLS.items()
        ]
    }


@api_router.post("/scrape/ai-search")
async def ai_product_search(request: Request):
    """AI-powered product search: analyze photo → identify products → search 21 stores."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI ключът не е конфигуриран")

    data = await request.json()
    image_b64 = data.get("image_base64", "")
    room_type = data.get("room_type", "")
    user_query = data.get("query", "")

    if not image_b64 and not user_query:
        raise HTTPException(status_code=400, detail="Добавете снимка или заявка")

    try:
        # Step 1: AI analyzes the photo to identify products
        search_queries = []
        if image_b64:
            analysis_chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"ai-search-{uuid.uuid4()}",
                system_message="""Ти си експерт по строителни материали и интериор в България.
Анализирай снимката и идентифицирай конкретни продукти/материали, които виждаш.

Отговори САМО с JSON списък от търсещи заявки (на български):
{"queries": ["бойлер 80 литра", "LED лампа таванна", "плочки 60x60 сиви", "смесител за мивка хром"]}

ПРАВИЛА:
- 3-8 заявки, конкретни и кратки
- Приоритет: електроуреди (Technomarket), настилки (Praktiker), мебели (IKEA/Jysk)
- Включвай размери/цветове ако са видими"""
            ).with_model("openai", "gpt-4o")

            img_msg = UserMessage(
                text=f"Анализирай тази снимка{f' на {room_type}' if room_type else ''} и идентифицирай продукти за покупка.",
                file_contents=[ImageContent(image_base64=image_b64)]
            )
            ai_response = await analysis_chat.send_message(img_msg)

            try:
                json_match = re_module.search(r'\{[\s\S]*\}', ai_response)
                if json_match:
                    parsed = json_module.loads(json_match.group(0))
                    search_queries = parsed.get("queries", [])[:8]
            except Exception:
                pass

        if user_query:
            search_queries.insert(0, user_query)

        if not search_queries:
            search_queries = ["плочки за баня", "бойлер", "LED осветление"]

        # Step 2: Search all 21 stores in parallel for each query
        all_results = {}
        for query in search_queries[:5]:
            stores_to_search = list(STORE_SEARCH_URLS.keys())

            # Prioritize Technomarket for appliances
            appliance_keywords = ["бойлер", "климатик", "хладилник", "пералн", "съдомиялн", "аспиратор", "вентилатор", "готварск", "лампа", "осветлен"]
            is_appliance = any(kw in query.lower() for kw in appliance_keywords)
            if is_appliance:
                stores_to_search = ["technomarket"] + [s for s in stores_to_search if s != "technomarket"]

            tasks = [scrape_store(s, query) for s in stores_to_search[:10]]
            store_results = await asyncio.gather(*tasks)

            query_products = []
            for prods in store_results:
                query_products.extend(prods)

            # Sort by price (cheapest first), take top 5
            query_products.sort(key=lambda p: p.get("price_eur", 99999) if p.get("price_eur", 0) > 0 else 99999)
            all_results[query] = query_products[:5]

        # Flatten top results
        top_products = []
        for query, prods in all_results.items():
            for p in prods:
                p["search_query"] = query
                top_products.append(p)

        return {
            "queries": search_queries,
            "total_products": len(top_products),
            "results_by_query": all_results,
            "top_products": top_products[:20],
            "stores_count": len(STORE_SEARCH_URLS),
        }

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"AI Product Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Грешка: {str(e)}")


# ==================== COMMUNITY FEED ====================

@api_router.post("/community/posts")
async def create_post(request: Request, user: dict = Depends(get_current_user)):
    """Create a community post."""
    data = await request.json()
    text = data.get("text", "").strip()
    post_type = data.get("type", "text")  # text, project, question, before_after
    project_id = data.get("project_id")
    images_b64 = data.get("images", [])

    if not text and not project_id and not images_b64:
        raise HTTPException(status_code=400, detail="Добавете текст, снимка или проект")

    # Auto-detect product/store mentions → generate affiliate links
    affiliate_links = []
    text_lower = text.lower()
    # Product keywords that indicate a potential product mention
    PRODUCT_KEYWORDS = {
        "плочки": "плочки", "фаянс": "фаянс", "теракот": "теракота", "гранитогрес": "гранитогрес",
        "мивка": "мивка", "тоалетна": "тоалетна", "душ": "душ кабина", "вана": "вана",
        "батерия": "батерия за баня", "смесител": "смесител", "бойлер": "бойлер",
        "ламинат": "ламинат", "паркет": "паркет", "боя": "боя за стени",
        "шкаф": "шкаф", "мебели": "мебели", "осветление": "LED осветление",
        "лампа": "лампа", "огледало": "огледало", "кухня": "кухня обзавеждане",
        "климатик": "климатик", "радиатор": "радиатор",
    }
    STORE_NAMES_MAP = {
        "praktiker": "Praktiker", "jysk": "Jysk", "mr.bricolage": "Mr.Bricolage",
        "мр бриколаж": "Mr.Bricolage", "homemax": "HomeMax", "хоум макс": "HomeMax",
        "bauhaus": "Bauhaus", "баухаус": "Bauhaus", "ikea": "IKEA", "икеа": "IKEA",
        "emag": "eMAG", "имаг": "eMAG", "teknoimpex": "Teknoimpex",
        "technomarket": "Technomarket", "техномаркет": "Technomarket",
    }
    from urllib.parse import quote as url_quote_comm
    # Detect store mentions
    mentioned_store = None
    for key, store_name in STORE_NAMES_MAP.items():
        if key in text_lower:
            mentioned_store = store_name
            break
    # Detect product mentions → create affiliate search links
    for keyword, search_term in PRODUCT_KEYWORDS.items():
        if keyword in text_lower:
            target_stores = [mentioned_store] if mentioned_store else ["Praktiker", "eMAG", "Mr.Bricolage"]
            for store in target_stores[:2]:
                store_search_base = {
                    "Praktiker": "https://praktiker.bg/search?q=",
                    "Mr.Bricolage": "https://mr-bricolage.bg/search?q=",
                    "Jysk": "https://jysk.bg/search?q=",
                    "HomeMax": "https://www.home-max.bg/search/?q=",
                    "Bauhaus": "https://bauhaus.bg/search/",
                    "eMAG": "https://www.emag.bg/search/",
                    "IKEA": "https://www.ikea.bg/search/?q=",
                }.get(store, f"https://www.emag.bg/search/")
                encoded = url_quote_comm(search_term, safe='')
                aff_url = make_affiliate_url(f"{store_search_base}{encoded}", store)
                affiliate_links.append({
                    "keyword": keyword,
                    "search_term": search_term,
                    "store": store,
                    "url": aff_url,
                })
            break  # Only first matched keyword to keep it non-intrusive

    post = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user.get("name", "Потребител"),
        "user_type": user.get("user_type", "client"),
        "user_avatar": user.get("avatar_b64", ""),
        "text": text[:2000],
        "type": post_type,
        "project_id": project_id,
        "images": images_b64[:5],
        "likes": [],
        "comments": [],
        "likes_count": 0,
        "comments_count": 0,
        "affiliate_links": affiliate_links,  # Auto-detected product links
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    # If linking a project, fetch its data
    if project_id:
        proj = await db.ai_designs.find_one({"id": project_id}, {"_id": 0, "room_type": 1, "style": 1, "budget_eur": 1, "dimensions": 1})
        if proj:
            post["project_data"] = proj

    await db.community_posts.insert_one(post)
    post.pop("_id", None)
    return post


@api_router.get("/community/posts")
async def get_posts(page: int = 1, limit: int = 20, post_type: str = "all"):
    """Get community feed posts with pagination."""
    query = {}
    if post_type != "all":
        query["type"] = post_type

    skip = (page - 1) * limit
    posts = await db.community_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.community_posts.count_documents(query)

    return {
        "posts": posts,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@api_router.post("/community/posts/{post_id}/like")
async def toggle_like(post_id: str, user: dict = Depends(get_current_user)):
    """Toggle like on a post."""
    post = await db.community_posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Публикацията не е намерена")

    likes = post.get("likes", [])
    if user["id"] in likes:
        likes.remove(user["id"])
    else:
        likes.append(user["id"])
        # Notify post author about the like
        if post.get("user_id") and post["user_id"] != user["id"]:
            from routes.notifications import create_notification
            await create_notification(
                user_id=post["user_id"],
                notif_type="like",
                title="Нов лайк!",
                message=f"{user.get('name', 'Потребител')} хареса вашата публикация",
                link="/community",
            )

    await db.community_posts.update_one({"id": post_id}, {"$set": {"likes": likes, "likes_count": len(likes)}})
    return {"liked": user["id"] in likes, "likes_count": len(likes)}


@api_router.post("/community/posts/{post_id}/comment")
async def add_comment(post_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Add a comment to a post."""
    data = await request.json()
    text = data.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Добавете текст")

    comment = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user.get("name", "Потребител"),
        "user_type": user.get("user_type", "client"),
        "user_avatar": user.get("avatar_b64", ""),
        "text": text[:500],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.community_posts.update_one(
        {"id": post_id},
        {"$push": {"comments": comment}, "$inc": {"comments_count": 1}}
    )
    return comment


@api_router.delete("/community/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    """Delete own post."""
    result = await db.community_posts.delete_one({"id": post_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Публикацията не е намерена или нямате права")
    return {"deleted": True}


# ============== LEADERBOARD ==============

@api_router.get("/leaderboard/clients")
async def leaderboard_clients(period: str = "all"):
    """Top clients by published projects, likes received, and activity"""
    match_stage = {}
    if period == "month":
        cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        match_stage = {"created_at": {"$gte": cutoff}}

    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {"$group": {
            "_id": "$user_id",
            "projects_count": {"$sum": 1},
            "total_views": {"$sum": {"$ifNull": ["$views", 0]}},
            "user_name": {"$first": "$user_name"},
            "user_avatar": {"$first": "$user_avatar"},
        }},
        {"$sort": {"projects_count": -1, "total_views": -1}},
        {"$limit": 20},
    ]
    results = await db.published_projects.aggregate(pipeline).to_list(20)

    leaderboard = []
    for idx, r in enumerate(results):
        uid = r["_id"]
        posts_count = await db.community_posts.count_documents({"user_id": uid})
        likes_received = 0
        async for post in db.community_posts.find({"user_id": uid}, {"likes_count": 1, "_id": 0}):
            likes_received += post.get("likes_count", 0)

        leaderboard.append({
            "rank": idx + 1,
            "user_id": uid,
            "user_name": r.get("user_name", "Потребител"),
            "user_avatar": r.get("user_avatar", ""),
            "projects_count": r.get("projects_count", 0),
            "posts_count": posts_count,
            "likes_received": likes_received,
            "views": r.get("total_views", 0),
            "score": r.get("projects_count", 0) * 10 + likes_received * 3 + posts_count * 2,
        })

    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1

    return {"period": period, "type": "clients", "entries": leaderboard}


@api_router.get("/leaderboard/companies")
async def leaderboard_companies(period: str = "all"):
    """Top firms by reviews, completed projects, and rating"""
    companies = await db.users.find(
        {"user_type": {"$in": ["company", "firm"]}},
        {"_id": 0, "id": 1, "name": 1, "avatar_b64": 1, "region": 1}
    ).to_list(100)

    leaderboard = []
    for comp in companies:
        cid = comp["id"]
        reviews = await db.reviews.find({"company_id": cid}, {"_id": 0, "rating": 1}).to_list(500)
        review_count = len(reviews)
        avg_rating = round(sum(r.get("rating", 0) for r in reviews) / review_count, 1) if review_count > 0 else 0
        offers_count = await db.community_offers.count_documents({"company_id": cid})
        projects_done = await db.published_projects.count_documents({"company_id": cid})

        score = avg_rating * 20 + review_count * 5 + offers_count * 3 + projects_done * 10
        leaderboard.append({
            "rank": 0,
            "company_id": cid,
            "company_name": comp.get("name", "Фирма"),
            "company_avatar": comp.get("avatar_b64", ""),
            "region": comp.get("region", ""),
            "avg_rating": avg_rating,
            "review_count": review_count,
            "offers_count": offers_count,
            "projects_done": projects_done,
            "score": round(score, 1),
        })

    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1

    return {"period": period, "type": "companies", "entries": leaderboard[:20]}


# ============== COMMUNITY v3: OFFERS ==============

@api_router.post("/community/offers")
async def create_offer(request: Request, user: dict = Depends(get_current_user)):
    """A company creates an offer on a project post"""
    if user.get("user_type") not in ("company", "firm"):
        raise HTTPException(status_code=403, detail="Само фирми могат да правят оферти")

    data = await request.json()
    post_id = data.get("post_id", "")
    price_eur = data.get("price_eur", 0)
    message = data.get("message", "").strip()
    timeline_days = data.get("timeline_days", 0)

    if not post_id or not message:
        raise HTTPException(status_code=400, detail="Посочете публикация и съобщение")

    post = await db.community_posts.find_one({"id": post_id}, {"_id": 0, "id": 1, "user_id": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Публикацията не е намерена")

    offer = {
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "company_id": user["id"],
        "company_name": user.get("name", ""),
        "company_avatar": user.get("avatar_b64", ""),
        "company_region": user.get("region", ""),
        "price_eur": price_eur,
        "message": message[:500],
        "timeline_days": timeline_days,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.community_offers.insert_one(offer)
    offer.pop("_id", None)

    # Send notification to post author
    from routes.notifications import create_notification
    await create_notification(
        user_id=post.get("user_id", ""),
        notif_type="offer",
        title="Нова оферта!",
        message=f"{user.get('name', 'Фирма')} направи оферта{f' за {price_eur} EUR' if price_eur else ''} на вашата публикация",
        link=f"/community",
        data={"post_id": post_id, "offer_id": offer["id"]}
    )

    return offer


@api_router.get("/community/offers/{post_id}")
async def get_post_offers(post_id: str):
    """Get all offers for a specific post"""
    offers = await db.community_offers.find(
        {"post_id": post_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"offers": offers}


@api_router.get("/community/public-projects")
async def get_public_projects(page: int = 1, limit: int = 12):
    """Get published projects for the community gallery"""
    skip = (page - 1) * limit
    total = await db.published_projects.count_documents({})
    projects = await db.published_projects.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    for p in projects:
        for key in ["before_images", "generated_images"]:
            imgs = p.get(key, [])
            if isinstance(imgs, list):
                for i, img_obj in enumerate(imgs):
                    if isinstance(img_obj, dict):
                        for k in list(img_obj.keys()):
                            if "base64" in k and len(str(img_obj.get(k, ""))) > 200:
                                img_obj[k] = img_obj[k][:100] + "..."
                    elif isinstance(img_obj, str) and len(img_obj) > 200:
                        imgs[i] = img_obj[:100] + "..."

    return {"projects": projects, "total": total, "page": page}


# Include router - MUST be after all route definitions
app.include_router(api_router)

# Include modular routers
from routes.notifications import router as notifications_router
app.include_router(notifications_router)

@app.on_event("startup")
async def start_background_tasks():
    asyncio.create_task(check_subscriptions_background())

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
