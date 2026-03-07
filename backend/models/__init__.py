"""Pydantic models for TemaDom backend."""
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import re

# Constants
FREE_LEADS_LIMIT = 3
CALCULATOR_FREE_USES = 5
CALCULATOR_PAY_AMOUNT = 10.0

# Contact info patterns for chat filtering
BLOCKED_PATTERNS = [
    re.compile(r'\+?\d[\d\s\-()]{7,}'),
    re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'),
    re.compile(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}'),
    re.compile(r'@[a-zA-Z0-9_]{3,}'),
    re.compile(r'(viber|whatsapp|telegram|skype|facebook|messenger|instagram)\s*[:\-]?\s*\S+', re.IGNORECASE),
    re.compile(r'0\d{9}'),
    re.compile(r'\b\d{2,4}[\s\-\.]\d{3}[\s\-\.]\d{3,4}\b'),
]

def contains_contact_info(text: str) -> bool:
    for pattern in BLOCKED_PATTERNS:
        if pattern.search(text):
            return True
    return False

def censor_contact_info(text: str) -> str:
    result = text
    for pattern in BLOCKED_PATTERNS:
        result = pattern.sub('[*** контактна информация скрита ***]', result)
    return result


class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    user_type: str
    city: Optional[str] = None
    telegram_username: Optional[str] = None
    bulstat: Optional[str] = None

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
    purchased_leads: List[str] = []
    free_leads_used: int = 0

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
    section_type: str = "renovation"  # "renovation" or "construction"
    address: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[str] = None
    images: List[str] = []
    estimated_budget: Optional[float] = None
    # Construction-specific fields
    property_type: Optional[str] = None  # house, apartment_building, warehouse, office, commercial
    land_area: Optional[float] = None  # sq meters
    building_area: Optional[float] = None  # sq meters
    floors: Optional[int] = None
    construction_notes: Optional[str] = None

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
    section_type: str = "renovation"
    address: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[str] = None
    images: List[str] = []
    estimated_budget: Optional[float] = None
    property_type: Optional[str] = None
    land_area: Optional[float] = None
    building_area: Optional[float] = None
    floors: Optional[int] = None
    construction_notes: Optional[str] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    views: int = 0
    purchases: int = 0

class ReviewCreate(BaseModel):
    company_id: str
    rating: int
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

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    package_type: str
    amount: float
    currency: str
    status: str = "pending"
    payment_status: str = "pending"
    project_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PortfolioProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    before_images: List[str] = []
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

class Scanner3DPDFRequest(BaseModel):
    items: List[Dict[str, Any]]

class AIChartAnalyzeRequest(BaseModel):
    image: str
    notes: Optional[str] = ""

class AIChartPDFRequest(BaseModel):
    title: str = "Количествена сметка"
    description: str = ""
    materials: List[Dict[str, Any]] = []
    labor: List[Dict[str, Any]] = []
    summary: Dict[str, Any] = {}
    client_name: str = ""
    client_address: str = ""
    contractor_name: str = ""

class Scanner3DProjectSave(BaseModel):
    photos: List[str] = []
    panorama_url: Optional[str] = None
    selections: Dict[str, Any] = {}
    title: str = "3D Проект"
