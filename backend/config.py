"""Shared configuration, database, and auth helpers for TemaDom backend."""
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT
JWT_SECRET = os.environ.get('JWT_SECRET', 'maistori-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Telegram
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')

# AI
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Platform flags
PLATFORM_FREE = True
TEST_MODE = True

# AI limits
AI_DESIGN_GLOBAL_FREE_LIMIT = 10000
AI_DESIGN_PER_PROFILE_LIMIT = 100

# Bulgarian stores
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

# Subscription Plans
SUBSCRIPTION_PLANS = {
    "company": {
        "basic": {
            "name": "БАЗОВ",
            "price": "15 EUR/мес",
            "stars": 1,
            "features": [
                "Профил + портфолио",
                "До 10 снимки в профила",
                "5 оферти на месец",
                "Основен профил на фирмата",
                "Преглед на запитвания от клиенти"
            ],
            "limitations": [
                "Без PDF договори",
                "Без AI скици",
                "Без количествени сметки",
                "Без Telegram известия",
                "Търси обяви ръчно в сайта"
            ],
            "notification_delay": "Без известия — търси в сайта"
        },
        "pro": {
            "name": "ПРО",
            "price": "35 EUR/мес",
            "stars": 2,
            "popular": True,
            "features": [
                "Всичко от БАЗОВ",
                "Telegram известия (едновременно с всички ПРО)",
                "PDF договори",
                "AI скици",
                "Количествени сметки",
                "Неограничени оферти",
                "Приоритетно показване",
                "Разширена статистика"
            ],
            "limitations": [
                "Без 10-минутно предимство",
                "Без персонализирани PDF",
                "Без екипен достъп"
            ],
            "notification_delay": "Получава известие на 10-тата минута"
        },
        "premium": {
            "name": "PREMIUM",
            "price": "75 EUR/мес",
            "stars": 3,
            "features": [
                "ВСИЧКО от ПРО",
                "ПЪРВИ 10 МИНУТИ предимство!",
                "Персонализирани PDF договори",
                "Неограничени AI скици (профи)",
                "Професионални количествени сметки",
                "Екип до 5 души",
                "API достъп",
                "Персонален мениджър",
                "Топ позиция в търсачката"
            ],
            "limitations": [],
            "notification_delay": "Вижда обявата ПЪРВИ — 10 мин. преди ПРО!"
        }
    },
    "standalone": {
        "pdf_contract_calculator": {
            "name": "PDF договор + количествена сметка",
            "price": "6 EUR",
            "description": "PDF договор с количествена сметка, готов за подписване, по данни от калкулатора",
            "features": [
                "PDF договор с данни от калкулатора",
                "Количествена сметка с цени",
                "Готов за подписване",
                "Детайлна разбивка по материали",
                "Включва дати и условия"
            ]
        },
        "pdf_ai_blueprint": {
            "name": "AI анализ на чертежи + PDF договор",
            "price": "17 EUR",
            "description": "AI анализ на чертежи с количествена сметка (95-100% точност) + PDF договор за подписване",
            "features": [
                "AI анализ на скици/чертежи",
                "Количествена сметка с 95-100% точност",
                "PDF договор готов за подписване",
                "Структурен анализ: колони, греди, покрив",
                "Цени в EUR от водещи магазини",
                "2D план + 3D визуализация"
            ]
        }
    },
    "designer": {
        "designer_1": {
            "name": "1 помещение",
            "price": "69 EUR",
            "features": [
                "1 помещение",
                "4 снимки от ъглите",
                "Размери 2x4x2.6м",
                "10 стила за избор",
                "Пред/След рендер",
                "Реалистичен 1:1 проект"
            ]
        },
        "designer_3": {
            "name": "2-3 помещения",
            "price": "129 EUR",
            "features": [
                "До 3 помещения",
                "4 снимки на помещение",
                "10 стила за всяко",
                "Пред/След рендер",
                "Реалистичен 1:1 проект",
                "Приоритетна обработка"
            ]
        },
        "designer_5": {
            "name": "4-5 помещения",
            "price": "220 EUR",
            "features": [
                "До 5 помещения",
                "4 снимки на помещение",
                "Пълна калкулация",
                "Всички стилове",
                "Приоритетна обработка",
                "PDF експорт с количествена сметка"
            ]
        }
    }
}

# Auth helpers
security = HTTPBearer(auto_error=False)

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
