from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'maistori-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Telegram Config
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')

# AI Config
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# PLATFORM IS FREE - all payment gates disabled
PLATFORM_FREE = True
TEST_MODE = True  # All prices shown as "тестов режим"

# AI Designer limits - TEST MODE: all free
AI_DESIGN_GLOBAL_FREE_LIMIT = 10000
AI_DESIGN_PER_PROFILE_LIMIT = 100

# Bulgarian stores for materials
BG_STORES = [
    {"name": "Praktiker", "url": "https://www.praktiker.bg", "category": "Строителство и ремонт"},
    {"name": "Bauhaus", "url": "https://www.bauhaus.bg", "category": "Строителство и материали"},
    {"name": "Mr. Bricolage", "url": "https://www.mr-bricolage.bg", "category": "Дом и градина"},
    {"name": "Homemax", "url": "https://www.homemax.bg", "category": "Обзавеждане и интериор"},
    {"name": "IKEA", "url": "https://www.ikea.bg", "category": "Мебели и аксесоари"},
    {"name": "Bricoman", "url": "https://www.bricoman.bg", "category": "Строителни материали"},
    {"name": "Technopolis", "url": "https://www.technopolis.bg", "category": "Електроуреди и техника"},
    {"name": "Technomarket", "url": "https://www.technomarket.bg", "category": "Електроуреди"},
    {"name": "Emag", "url": "https://www.emag.bg", "category": "Електроника и дом"},
    {"name": "Jysk", "url": "https://www.jysk.bg", "category": "Мебели и текстил"},
    {"name": "Jumbo", "url": "https://www.jumbo.bg", "category": "Дом и декорация"},
    {"name": "Videnov", "url": "https://www.videnov.bg", "category": "Мебели"},
    {"name": "Masko", "url": "https://www.masko.bg", "category": "Мебели и обзавеждане"},
    {"name": "Forma Ideale", "url": "https://www.formaideale.bg", "category": "Мебели"},
    {"name": "Mebeli 1", "url": "https://www.mebeli1.bg", "category": "Мебели онлайн"},
    {"name": "Selion", "url": "https://www.selilon.bg", "category": "Осветление"},
    {"name": "Ceramica", "url": "https://www.ceramica.bg", "category": "Плочки и керамика"},
    {"name": "Leroy Merlin", "url": "https://www.leroymerlin.bg", "category": "Строителство и дом"},
]

# Subscription plans - with pricing for production launch
SUBSCRIPTION_PLANS = {
    "company": {
        "starter": {
            "name": "Starter / Basic",
            "price": "49 лв/мес",
            "price_eur": "25 EUR/мес",
            "features": [
                "До 2 активни проекта",
                "Основен профил на фирмата",
                "Обяви: до 3 снимки",
                "Преглед на запитвания от клиенти",
                "Email известия (до 10/мес)"
            ],
            "limitations": ["Ограничен брой проекти", "Без AI функции", "Без приоритетно показване"]
        },
        "pro": {
            "name": "Pro",
            "price": "99 лв/мес",
            "price_eur": "50 EUR/мес",
            "features": [
                "Всички функции от Starter",
                "Неограничени проекти",
                "AI Builder: скици/снимки (1-3) → визуализация (1 вариант)",
                "Multi-upload за визуализация",
                "Видео инструкции за 3D скенера",
                "Таблици с материали и разходи",
                "Email + Telegram известия",
                "Приоритетно показване",
                "Обяви: до 5 снимки",
                "Разширена статистика"
            ],
            "limitations": ["AI Designer: 1 вариант на генерация"]
        },
        "premium": {
            "name": "Premium",
            "price": "199 лв/мес",
            "price_eur": "102 EUR/мес",
            "features": [
                "Всички функции от Pro",
                "AI Designer: до 5 варианта на генерация",
                "Структурни чертежи (PDF/Excel, 95-100% точност)",
                "AI Sketch: анализ на чертежи и скици",
                "Таблици с колони, греди, покриви, фундаменти",
                "Видео инструкции за чертежите",
                "Персонален мениджър",
                "Топ позиция в търсачката",
                "Обяви: до 10 снимки",
                "Неограничени Email + Telegram известия"
            ],
            "limitations": []
        }
    },
    "designer": {
        "designer": {
            "name": "AI Дизайнер",
            "price": "29 лв/генерация",
            "price_eur": "15 EUR/генерация",
            "features": [
                "AI интериорен дизайн (1 вариант)",
                "Преди и след сравнение",
                "Списък материали с цени (BGN + EUR)",
                "Линкове към 18 магазина",
                "PDF експорт (изображения + количествена сметка)",
                "Публикуване в AI Галерия",
                "Споделяне в социални мрежи"
            ],
            "note": "За Pro абонати: включен 1 вариант. За Premium: до 5 варианта. Без абонамент: еднократна такса.",
            "bundle_prices": {
                "3_variants": "69 лв / 35 EUR",
                "5_variants": "99 лв / 50 EUR"
            }
        }
    }
}

# Analytics password
ANALYTICS_ADMIN_PASSWORD = os.environ.get("ANALYTICS_PASSWORD", "temadom2026")

# Payment packages (server-side only - security) - DISABLED while PLATFORM_FREE
PAYMENT_PACKAGES = {
    "subscription": {"amount": 100.00, "currency": "eur", "type": "subscription", "name": "Месечен абонамент"},
    "single_lead": {"amount": 25.00, "currency": "eur", "type": "one_time", "name": "Единичен контакт"}
}

# Create the main app
app = FastAPI(title="Maistori Marketplace API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

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

# ============== MODELS ==============

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    user_type: str  # "client", "company", "master", "admin"
    city: Optional[str] = None
    telegram_username: Optional[str] = None
    bulstat: Optional[str] = None  # Required for companies (9 digits)

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    subscription_active: bool = False
    subscription_expires: Optional[datetime] = None
    purchased_leads: List[str] = []  # List of project IDs
    free_leads_used: int = 0  # Track free leads (first 3 are free)

FREE_LEADS_LIMIT = 3  # First 3 contacts are free for companies
CALCULATOR_FREE_USES = 5  # Companies get 5 free calculator uses
CALCULATOR_PAY_AMOUNT = 10.0  # €10 per additional use

# Contact info patterns for chat filtering
import re
BLOCKED_PATTERNS = [
    re.compile(r'\+?\d[\d\s\-()]{7,}'),  # Phone numbers
    re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'),  # Emails
    re.compile(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}'),  # IP addresses
    re.compile(r'@[a-zA-Z0-9_]{3,}'),  # Social media handles
    re.compile(r'(viber|whatsapp|telegram|skype|facebook|messenger|instagram)\s*[:\-]?\s*\S+', re.IGNORECASE),  # Messenger refs
    re.compile(r'0\d{9}'),  # Bulgarian phone (0888123456)
    re.compile(r'\b\d{2,4}[\s\-\.]\d{3}[\s\-\.]\d{3,4}\b'),  # Formatted phones
]

def contains_contact_info(text: str) -> bool:
    """Check if text contains phone numbers, emails, or other contact info"""
    for pattern in BLOCKED_PATTERNS:
        if pattern.search(text):
            return True
    return False

def censor_contact_info(text: str) -> str:
    """Replace contact info with [***]"""
    result = text
    for pattern in BLOCKED_PATTERNS:
        result = pattern.sub('[*** контактна информация скрита ***]', result)
    return result

class CompanyProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    company_name: str
    description: Optional[str] = None
    categories: List[str] = []
    city: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    portfolio_images: List[str] = []
    rating: float = 0.0
    review_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    title: str
    description: str
    category: str
    city: str
    address: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[str] = None
    images: List[str] = []  # Up to 10 images (base64 or URLs)
    estimated_budget: Optional[float] = None  # Calculator estimate in EUR

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    client_name: str
    client_email: str
    client_phone: str
    title: str
    description: str
    category: str
    city: str
    address: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[str] = None
    images: List[str] = []  # Project images
    estimated_budget: Optional[float] = None  # Calculator estimate in EUR
    status: str = "active"  # active, closed, in_progress
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    views: int = 0
    purchases: int = 0

class ReviewCreate(BaseModel):
    company_id: str
    rating: int  # 1-5
    comment: str
    project_id: Optional[str] = None

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    client_id: str
    client_name: str
    rating: int
    comment: str
    project_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Reviews are immutable - no edit/delete for companies

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    package_type: str
    amount: float
    currency: str
    status: str = "pending"  # pending, completed, failed, expired
    payment_status: str = "pending"
    project_id: Optional[str] = None  # For single lead purchase
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PortfolioProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    before_images: List[str] = []  # Base64 or URLs
    after_images: List[str] = []

class PortfolioProject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    before_images: List[str] = []
    after_images: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, user_type: str) -> str:
    payload = {
        "user_id": user_id,
        "user_type": user_type,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Токенът е изтекъл")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Невалиден токен")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Необходима е автентикация")
    
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Потребителят не е намерен")
    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        return user
    except:
        return None

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
        "user_type": user["user_type"],
        "subscription_active": user.get("subscription_active", False),
        "subscription_expires": user.get("subscription_expires"),
        "purchased_leads": user.get("purchased_leads", []),
        "free_leads_used": user.get("free_leads_used", 0),
        "calculator_uses": user.get("calculator_uses", 0)
    }

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
    if user["user_type"] not in ("company", "master"):
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
    
    if package_type == "subscription":
        # Grant subscription for 30 days
        expires = datetime.now(timezone.utc) + timedelta(days=30)
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "subscription_active": True,
                "subscription_expires": expires.isoformat()
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

# ============== ROOT ROUTE ==============

@api_router.get("/")
async def root():
    return {"message": "Maistori Marketplace API", "version": "1.0.0"}

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

async def send_telegram_message(chat_id: int, text: str):
    """Send a message via Telegram Bot API"""
    if not TELEGRAM_BOT_TOKEN:
        return False
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        async with httpx.AsyncClient() as client_http:
            resp = await client_http.post(url, json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML"
            }, timeout=10)
            return resp.status_code == 200
    except Exception as e:
        logging.error(f"Telegram send error: {e}")
        return False

async def notify_companies_new_project(project_dict: dict):
    """Notify companies via Telegram about a new project in their area"""
    if not TELEGRAM_BOT_TOKEN:
        return
    
    project_city = project_dict.get("city", "").lower().strip()
    cat = next((c for c in CATEGORIES if c["id"] == project_dict.get("category")), None)
    cat_name = cat["name"] if cat else project_dict.get("category", "")
    
    # Find companies/masters with matching city and telegram_chat_id
    query = {"user_type": {"$in": ["company", "master"]}, "telegram_chat_id": {"$exists": True, "$ne": None}}
    if project_city:
        query["city"] = {"$regex": project_city, "$options": "i"}
    
    companies = await db.users.find(query, {"_id": 0}).to_list(500)
    
    message = (
        f"<b>Нов проект в TemaDom!</b>\n\n"
        f"<b>{project_dict.get('title', '')}</b>\n"
        f"Категория: {cat_name}\n"
        f"Град: {project_dict.get('city', '')}\n"
        f"Описание: {project_dict.get('description', '')[:200]}...\n\n"
        f"Влезте в платформата, за да видите детайлите и да се свържете с клиента."
    )
    
    for company in companies:
        chat_id = company.get("telegram_chat_id")
        if chat_id:
            await send_telegram_message(int(chat_id), message)

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
    return {"message": "Telegram акаунтът е свързан успешно"}

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
            # Extract user token from /start command if present
            parts = text.split()
            if len(parts) > 1:
                user_id = parts[1]
                # Link this chat_id to the user
                result = await db.users.update_one(
                    {"id": user_id},
                    {"$set": {"telegram_chat_id": str(chat_id)}}
                )
                if result.modified_count > 0:
                    await send_telegram_message(chat_id, 
                        "Акаунтът ви е свързан с TemaDom! "
                        "Ще получавате известия за нови проекти във вашата област."
                    )
                else:
                    await send_telegram_message(chat_id,
                        "Добре дошли в TemaDom бот!\n"
                        "За да свържете акаунта си, моля влезте в профила си на temadom.com "
                        "и натиснете бутона 'Свържи Telegram'."
                    )
            else:
                await send_telegram_message(chat_id,
                    "Добре дошли в TemaDom бот!\n\n"
                    "За да получавате известия за нови проекти:\n"
                    "1. Регистрирайте се на temadom.com\n"
                    "2. Влезте в профила си\n"
                    "3. Натиснете 'Свържи Telegram'\n\n"
                    "Платформата е БЕЗПЛАТНА за ограничен период!"
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
    "scandinavian": "скандинавски стил с бели стени, дърво, минимализъм и естествена светлина",
    "loft": "индустриален лофт стил с тухлени стени, метал, открити тръби и бетон",
    "classic": "класически стил с елегантни мебели, богати тъкани и декоративни елементи",
    "minimalist": "минималистичен стил с прости форми, бяло пространство и функционалност"
}

AI_MATERIAL_CLASS = {
    "economy": "икономичен клас материали - достъпни цени, основно качество",
    "standard": "стандартен клас материали - добро качество, средна ценова гама",
    "premium": "премиум клас материали - висококачествени, луксозни"
}

@api_router.post("/ai-designer/generate")
async def generate_ai_design(request: Request):
    """Generate AI interior design based on uploaded room photos (1-3 angles)"""
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
        # Step 1: Analyze ALL uploaded photos with GPT for comprehensive understanding
        analysis_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"ai-designer-{uuid.uuid4()}",
            system_message=f"""Ти си експерт интериорен дизайнер. Получаваш {len(cleaned_images)} снимки на {room_type_name} от различни ъгли.
Анализирай ВСИЧКИ снимки заедно и опиши ТОЧНО какво виждаш:
- Тип помещение и текущо състояние
- Конкретни елементи: плочки, стени, мебели, тоалетна, вана/душ, мивка, осветление
- Цветове, материали, пропорции
- Какво може да се подобри

Отговори в JSON формат:
{{"room_type": "{room_type_name}", "current_state": "детайлно описание", "elements": ["списък на всички елементи"], "lighting": "тип осветление", "colors": ["цветове"], "furniture": ["мебели/оборудване"], "layout": "описание на разпределението", "description": "detailed description in English of the exact room for image generation - include specific elements, materials, colors, layout, fixtures visible in the photos"}}"""
        ).with_model("openai", "gpt-4o")
        
        # Build message with all images
        image_contents = [ImageContent(image_base64=img) for img in cleaned_images]
        analysis_msg = UserMessage(
            text=f"Анализирай тези {len(cleaned_images)} снимки на {room_type_name}. Опиши ТОЧНО какво виждаш от всеки ъгъл.",
            file_contents=image_contents
        )
        
        analysis_response = await analysis_chat.send_message(analysis_msg)
        
        # Parse analysis
        room_analysis = {}
        try:
            json_match = re_module.search(r'```(?:json)?\s*([\s\S]*?)```', analysis_response)
            if json_match:
                room_analysis = json_module.loads(json_match.group(1))
            else:
                room_analysis = json_module.loads(analysis_response)
        except:
            room_analysis = {"room_type": room_type_name, "description": f"a {room_type_name} interior", "current_state": "needs renovation"}
        
        room_desc = room_analysis.get("description", f"a {room_type_name} interior")
        room_type = room_analysis.get("room_type", room_type_name)
        
        # Step 2: Generate design images using GPT Image 1
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        
        generated_images = []
        variants_count = min(int(variants), 5)
        
        variant_focuses = [
            "Focus on warm tones, cozy atmosphere, soft lighting",
            "Focus on light, airy, spacious feel with bright colors",
            "Focus on bold design choices, high contrast, statement pieces",
            "Focus on natural materials, wood, stone, organic textures",
            "Focus on luxury premium finishes, marble, brass, designer fixtures"
        ]
        
        # For 1 variant: 2 angles (frontal + side). For 3+ variants: 1 angle each to save time
        use_two_angles = variants_count == 1
        
        angles = [
            ("photographed from the entrance/door looking inward, showing the full room layout", "Фронтален"),
            ("photographed from the opposite corner at a diagonal angle, showing depth and side walls", "Страничен")
        ]
        
        for i in range(variants_count):
            variant_angles = []
            angles_to_gen = angles if use_two_angles else [angles[0]]
            
            for angle_idx, (angle_desc, angle_label) in enumerate(angles_to_gen):
                try:
                    variant_prompt = f"""Professional interior design photograph of {room_desc}, {angle_desc}.
This is a {room_type_name} with dimensions {room_width}m x {room_length}m, height {room_height}m.
Redesigned in {style_desc} with {material_desc}.
The design must show the SAME room layout and proportions but completely renovated.
Keep the same basic structure (walls, windows, doors in same positions).
{f'Special requirements: {notes}' if notes else ''}
{variant_focuses[i % len(variant_focuses)]}.
Ultra-realistic professional interior photography, 8K quality, perfect lighting, photorealistic materials and textures."""
                    
                    img_result = await image_gen.generate_images(
                        prompt=variant_prompt,
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
                    logger.error(f"Image generation error for variant {i+1} angle {angle_idx+1}: {img_err}")
                    continue
            
            if variant_angles:
                generated_images.append({
                    "variant": i + 1,
                    "angles": variant_angles,
                    "image_base64": variant_angles[0]["image_base64"] if variant_angles else "",
                    "prompt_used": variant_prompt[:200] if variant_angles else ""
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
            text=f"""Генерирай ПЪЛЕН списък с материали и оборудване за ремонт на {room_type} ({room_width}м x {room_length}м x {room_height}м).
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
            "room_type": room_type,
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
    """Get referral status (demo mode)"""
    referral_count = await db.referrals.count_documents({"referrer_id": user["id"]})
    return {
        "referral_count": referral_count,
        "referral_code": user["id"][:8],
        "test_mode": True,
        "rewards": {
            "client": {"required": 5, "bonus": "€3 кредит (демо)"},
            "company": {"tier1": {"required": 1, "bonus": "Бонус (демо)"}, "tier2": {"required": 10, "bonus": "Голям бонус (демо)"}}
        }
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
    """Get demo projects for homepage"""
    demos = [
        {"id": "demo1", "title": "Ремонт на апартамент 80 м²", "category": "general", "city": "София", "image": "/demo/apartment.jpg", "budget": "8,928 €"},
        {"id": "demo2", "title": "Вътрешен дизайн на дневна", "category": "design", "city": "Пловдив", "image": "/demo/living.jpg", "budget": "3,500 €"},
        {"id": "demo3", "title": "Баня от А до Я", "category": "plumbing", "city": "Варна", "image": "/demo/bathroom.jpg", "budget": "5,200 €"},
        {"id": "demo4", "title": "Кухня по поръчка", "category": "carpentry", "city": "Бургас", "image": "/demo/kitchen.jpg", "budget": "7,100 €"}
    ]
    return {"projects": demos}

# ============== REVIEW AI MODERATION ==============

@api_router.post("/reviews/check")
async def check_review_content(data: dict):
    """AI-moderate review content before posting"""
    comment = data.get("comment", "")
    if not comment:
        return {"approved": True, "reason": ""}
    
    # Simple profanity/abuse check
    abuse_patterns = [
        re.compile(r'\b(идиот|глупак|мамка|дебил|простак|измамник|крадец)\b', re.IGNORECASE),
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


# ============== AI SKETCH ANALYSIS ==============

@api_router.post("/ai-sketch/analyze")
async def analyze_sketch(request: Request):
    """Analyze uploaded sketches/blueprints and generate structural analysis + visualization"""
    data = await request.json()
    
    sketches = data.get("sketches", [])
    if not sketches:
        raise HTTPException(status_code=400, detail="Качете поне 1 скица или чертеж")
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI ключът не е конфигуриран")
    
    building_type = data.get("building_type", "residential")
    notes = data.get("notes", "")
    
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
        # Step 1: AI Analysis - identify structural elements
        analysis_chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"sketch-{uuid.uuid4()}",
            system_message="""Ти си експерт строителен инженер и архитект с 30 години опит. Анализираш скици, чертежи и снимки на сгради/помещения.

Трябва да разпознаеш и опишеш с 95-100% точност:
- Колони (размери, позиции, тип - стоманобетонни, метални)
- Греди (размери, натоварвания, тип)
- Стълби (ширина, стъпала, наклон, тип)
- Фундаменти (тип - ленточен, плочест, единични, размери)
- Покрив (тип - двускатен, четирискатен, плосък, наклон, материал)
- Стени (носещи/неносещи, дебелина, материал)
- Отвори (врати, прозорци - размери и позиции)
- Инсталации (ВиК, електро - ако са видими)

Отговори в JSON:
{
  "building_type": "тип сграда",
  "structural_elements": {
    "columns": [{"id": "C1", "type": "стоманобетонна", "dimensions": "30x30cm", "position": "описание", "height": "3.0m"}],
    "beams": [{"id": "B1", "type": "стоманобетонна", "dimensions": "30x50cm", "span": "6.0m", "load": "описание"}],
    "stairs": [{"type": "прав марш", "width": "1.2m", "steps": 18, "rise": "17cm", "tread": "28cm"}],
    "foundations": [{"type": "ленточен", "width": "0.6m", "depth": "1.2m", "material": "стоманобетон"}],
    "roof": {"type": "двускатен", "slope": "30 градуса", "material": "керемиди", "area": "120 m²"},
    "walls": [{"type": "носеща", "thickness": "25cm", "material": "тухла", "length": "6m"}],
    "openings": [{"type": "прозорец", "dimensions": "1.2x1.5m", "position": "южна стена"}]
  },
  "dimensions_summary": {"length": "12m", "width": "8m", "height": "6m", "floors": 2, "total_area": "192 m²"},
  "description_en": "detailed English description of the building structure for image generation",
  "materials_estimate": [
    {"name": "Бетон C25/30", "quantity": "15", "unit": "m³", "price_per_unit_bgn": "180", "price_per_unit_eur": "92", "total_bgn": "2700", "total_eur": "1380", "store": "Bricoman"},
    {"name": "Арматура B500", "quantity": "2000", "unit": "kg", "price_per_unit_bgn": "2.20", "price_per_unit_eur": "1.12", "total_bgn": "4400", "total_eur": "2250", "store": "Bauhaus"}
  ],
  "total_materials_bgn": "...",
  "total_materials_eur": "...",
  "labor_bgn": "...",
  "labor_eur": "...",
  "grand_total_bgn": "...",
  "grand_total_eur": "...",
  "accuracy_note": "95-100% точност за стандартни конструкции"
}"""
        ).with_model("openai", "gpt-4o")
        
        image_contents = [ImageContent(image_base64=img) for img in cleaned]
        analysis_msg = UserMessage(
            text=f"""Анализирай тези {len(cleaned)} скици/чертежи/снимки на {building_type} строеж.
Разпознай ВСИЧКИ структурни елементи: колони, греди, стълби, фундаменти, покрив.
Генерирай количествена сметка с цени в лева и евро.
{f'Допълнителни бележки: {notes}' if notes else ''}
Дай максимално точен анализ (95-100%).""",
            file_contents=image_contents
        )
        
        analysis_response = await analysis_chat.send_message(analysis_msg)
        
        # Parse analysis
        analysis_data = {}
        try:
            json_match = re_module.search(r'```(?:json)?\s*([\s\S]*?)```', analysis_response)
            if json_match:
                analysis_data = json_module.loads(json_match.group(1))
            else:
                # Try to find JSON object directly
                json_obj_match = re_module.search(r'\{[\s\S]*\}', analysis_response)
                if json_obj_match:
                    analysis_data = json_module.loads(json_obj_match.group(0))
                else:
                    analysis_data = {"raw_analysis": analysis_response[:3000], "note": "AI анализът е в текстов формат"}
        except Exception:
            analysis_data = {"raw_analysis": analysis_response[:3000], "note": "AI анализът е в текстов формат"}
        
        desc_en = analysis_data.get("description_en", "a building structure with columns, beams and foundations")
        
        # Step 2: Generate structural visualization
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        
        generated_views = []
        view_prompts = [
            f"Professional architectural blueprint drawing, clean technical 2D plan view from above showing: {desc_en}. Show all columns marked as dots, walls as thick lines, dimensions annotated, room labels. White background, precise engineering drawing style, CAD-quality.",
            f"Professional 3D architectural rendering of: {desc_en}. Cutaway isometric view showing structural elements - columns, beams, floors, roof structure. Clean visualization with labeled structural members, photorealistic materials. Architecture magazine quality."
        ]
        view_labels = ["План (2D чертеж)", "3D визуализация"]
        
        for i, prompt in enumerate(view_prompts):
            try:
                img_result = await image_gen.generate_images(
                    prompt=prompt,
                    model="gpt-image-1",
                    number_of_images=1
                )
                if img_result and len(img_result) > 0:
                    img_b64 = base64.b64encode(img_result[0]).decode('utf-8')
                    generated_views.append({
                        "label": view_labels[i],
                        "image_base64": img_b64
                    })
            except Exception as e:
                logger.error(f"Sketch image gen error: {e}")
        
        # Save to DB
        sketch_id = str(uuid.uuid4())
        await db.ai_sketches.insert_one({
            "id": sketch_id,
            "building_type": building_type,
            "notes": notes,
            "sketches_count": len(cleaned),
            "views_count": len(generated_views),
            "analysis_summary": analysis_data.get("dimensions_summary", {}),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "id": sketch_id,
            "analysis": analysis_data,
            "generated_views": generated_views,
            "test_mode": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Грешка при анализ: {str(e)}")


# Include router - MUST be after all route definitions
app.include_router(api_router)

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
