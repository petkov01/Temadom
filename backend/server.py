from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
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
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

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

# Payment packages (server-side only - security)
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
    user_type: str  # "client", "company", "admin"

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
    
    # Create company profile if company
    if user_data.user_type == "company":
        profile = {
            "id": str(uuid.uuid4()),
            "user_id": user_dict["id"],
            "company_name": user_data.name,
            "description": None,
            "categories": [],
            "city": None,
            "address": None,
            "website": None,
            "logo_url": None,
            "portfolio_images": [],
            "rating": 0.0,
            "review_count": 0,
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
    
    # Determine which projects user has access to
    purchased_leads = []
    has_subscription = False
    if user and user.get("user_type") == "company":
        purchased_leads = user.get("purchased_leads", [])
        has_subscription = user.get("subscription_active", False)
        # Check subscription expiry
        if has_subscription and user.get("subscription_expires"):
            exp = user.get("subscription_expires")
            if isinstance(exp, str):
                exp = datetime.fromisoformat(exp.replace('Z', '+00:00'))
            if exp < datetime.now(timezone.utc):
                has_subscription = False
    
    # Process projects - hide contact info if not purchased/subscribed
    processed_projects = []
    for p in projects:
        project = dict(p)
        has_access = has_subscription or project["id"] in purchased_leads
        
        if not has_access:
            # Hide sensitive info
            project["client_email"] = None
            project["client_phone"] = None
            project["contact_locked"] = True
        else:
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
    
    # Check access
    has_access = False
    if user:
        if user.get("user_type") == "client" and user.get("id") == project.get("client_id"):
            has_access = True
        elif user.get("user_type") == "company":
            purchased_leads = user.get("purchased_leads", [])
            has_subscription = user.get("subscription_active", False)
            if has_subscription and user.get("subscription_expires"):
                exp = user.get("subscription_expires")
                if isinstance(exp, str):
                    exp = datetime.fromisoformat(exp.replace('Z', '+00:00'))
                if exp < datetime.now(timezone.utc):
                    has_subscription = False
            has_access = has_subscription or project_id in purchased_leads
    
    if not has_access:
        project["client_email"] = None
        project["client_phone"] = None
        project["contact_locked"] = True
    else:
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
    if user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Само фирми могат да редактират профила си")
    
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
    if user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Тази функция е само за фирми")
    
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
    """Add a new portfolio project (company only)"""
    if user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Само фирми могат да добавят проекти в портфолиото")
    
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
    if user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Само фирми могат да изтриват проекти")
    
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
    """Get portfolio for current company user"""
    if user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Тази функция е само за фирми")
    
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
    if user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Само фирми могат да закупуват контакти")
    
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
    if user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Тази функция е само за фирми")
    
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
    if user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Само фирми могат да вземат контакти")
    
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
    if user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Тази функция е само за фирми")
    
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
    """Log a calculator use for a company user. Returns remaining free uses."""
    if user["user_type"] != "company":
        return {"allowed": True, "remaining": -1}  # Clients have unlimited access
    
    if user.get("subscription_active"):
        return {"allowed": True, "remaining": -1}  # Subscribers have unlimited access
    
    uses = user.get("calculator_uses", 0)
    if uses >= CALCULATOR_FREE_USES:
        return {"allowed": False, "remaining": 0, "message": "Изчерпахте безплатните калкулации. Моля, платете €10 или се абонирайте."}
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"calculator_uses": 1}}
    )
    
    remaining = CALCULATOR_FREE_USES - uses - 1
    return {"allowed": True, "remaining": remaining}

@api_router.get("/calculator/status")
async def get_calculator_status(user: dict = Depends(get_current_user)):
    """Get calculator usage status for current user."""
    if user["user_type"] != "company":
        return {"unlimited": True, "uses": 0, "remaining": -1}
    
    if user.get("subscription_active"):
        return {"unlimited": True, "uses": 0, "remaining": -1}
    
    uses = user.get("calculator_uses", 0)
    remaining = max(0, CALCULATOR_FREE_USES - uses)
    return {"unlimited": False, "uses": uses, "limit": CALCULATOR_FREE_USES, "remaining": remaining}

@api_router.post("/calculator/pay")
async def pay_calculator_use(request: Request, user: dict = Depends(get_current_user)):
    """Create Stripe checkout for calculator usage payment (€10)"""
    if user["user_type"] != "company":
        raise HTTPException(status_code=403, detail="Само фирми")
    
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
    """Send a message. Contact info is filtered for companies without access."""
    receiver_id = data.get("receiver_id")
    content = data.get("content", "").strip()
    project_id = data.get("project_id")
    
    if not receiver_id or not content:
        raise HTTPException(status_code=400, detail="Получателят и съдържанието са задължителни")
    
    if len(content) > 2000:
        raise HTTPException(status_code=400, detail="Съобщението е прекалено дълго (макс. 2000 символа)")
    
    # Check if receiver exists
    receiver = await db.users.find_one({"id": receiver_id}, {"_id": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="Получателят не е намерен")
    
    # Determine if sender is a company that hasn't paid for this project's contact
    is_contact_filtered = False
    if user["user_type"] == "company" and not user.get("subscription_active"):
        purchased = user.get("purchased_leads", [])
        # If there's a project context, check if company has access
        if project_id and project_id not in purchased:
            is_contact_filtered = True
        # Even without project context, filter if company hasn't paid in general
        elif not project_id:
            is_contact_filtered = True
    
    # Filter contact info from company messages if they haven't paid
    filtered_content = content
    was_filtered = False
    if is_contact_filtered and contains_contact_info(content):
        filtered_content = censor_contact_info(content)
        was_filtered = True
    
    # Also filter client messages if they contain contact info and company hasn't paid
    # Actually, clients should be free to share - but companies shouldn't share their own contact info to bypass
    # The key rule: if EITHER party hasn't paid, contact info is blocked in messages
    if user["user_type"] == "client":
        # Check if the receiving company has paid
        if receiver.get("user_type") == "company" and not receiver.get("subscription_active"):
            recv_purchased = receiver.get("purchased_leads", [])
            # Check if the company has access to any project from this client
            client_projects = await db.projects.find({"client_id": user["id"]}, {"id": 1, "_id": 0}).to_list(100)
            client_project_ids = [p["id"] for p in client_projects]
            has_any_access = any(pid in recv_purchased for pid in client_project_ids)
            if not has_any_access and contains_contact_info(content):
                filtered_content = censor_contact_info(content)
                was_filtered = True
    
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
        "content": filtered_content,
        "original_content": content if was_filtered else None,
        "was_filtered": was_filtered,
        "project_id": project_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message)
    
    response = {
        "id": message["id"],
        "conversation_id": conv_id,
        "sender_id": message["sender_id"],
        "sender_name": message["sender_name"],
        "receiver_id": message["receiver_id"],
        "content": message["content"],
        "was_filtered": was_filtered,
        "project_id": message["project_id"],
        "read": message["read"],
        "created_at": message["created_at"]
    }
    
    if was_filtered:
        response["filter_notice"] = "Съобщението е филтрирано. Контактната информация е скрита, защото фирмата не е заплатила за достъп."
    
    return response

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
    
    # Table header
    pdf.set_fill_color(45, 55, 72)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(font_name, 'B', 10)
    pdf.cell(70, 8, "Услуга", 1, 0, 'L', True)
    pdf.cell(30, 8, "Количество", 1, 0, 'C', True)
    pdf.cell(30, 8, "Ед. цена", 1, 0, 'C', True)
    pdf.cell(30, 8, "Цена (EUR)", 1, 0, 'C', True)
    pdf.cell(30, 8, "Цена (BGN)", 1, 1, 'C', True)
    
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
        
        pdf.cell(70, 7, f"{name}", 1, 0, 'L', fill)
        pdf.cell(30, 7, f"{qty} {unit}", 1, 0, 'C', fill)
        pdf.cell(30, 7, f"{base_price:.2f} EUR", 1, 0, 'C', fill)
        pdf.cell(30, 7, f"{item_total:.2f} EUR", 1, 0, 'C', fill)
        pdf.cell(30, 7, f"{item_total * 1.9558:.2f} BGN", 1, 1, 'C', fill)
        fill = not fill
    
    # Total
    pdf.ln(3)
    pdf.set_fill_color(242, 109, 33)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font(font_name, 'B', 12)
    pdf.cell(130, 10, "ОБЩА СУМА:", 0, 0, 'R')
    pdf.cell(30, 10, f"{total:.2f} EUR", 0, 0, 'C')
    pdf.cell(30, 10, f"{total * 1.9558:.2f} BGN", 0, 1, 'C')
    
    # Footer note
    pdf.ln(15)
    pdf.set_text_color(120, 120, 120)
    pdf.set_font(font_name, '', 8)
    pdf.multi_cell(0, 5, 
        "* Тази оферта е ориентировъчна и базирана на средни пазарни цени за 2025-2026 г. "
        "Реалните цени могат да варират. За точна оферта, свържете се с фирмите чрез TemaDom.\n"
        "* Генерирано от калкулатора на TemaDom - https://temadom.bg"
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

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
