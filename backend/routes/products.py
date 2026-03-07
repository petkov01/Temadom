"""Product search and scraping API routes."""

from fastapi import APIRouter, HTTPException, Request
from config import db, EMERGENT_LLM_KEY
from services.scraper import (
    search_real_products, get_products_for_room,
    STORE_CONFIGS, ROOM_CATEGORIES
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/search")
async def search_products_endpoint(q: str, stores: str = "mrbricolage,videnov", limit: int = 5):
    """Search for real products across Bulgarian stores."""
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Моля, въведете поне 2 символа")

    store_list = [s.strip() for s in stores.split(",")]
    products = await search_real_products(q, store_list, limit_per_store=limit)

    real_count = sum(1 for p in products if p.get("scraped"))
    return {
        "query": q,
        "total": len(products),
        "real_products": real_count,
        "search_links": len(products) - real_count,
        "products": products,
    }


@router.get("/for-room/{room_type}")
async def get_products_for_room_endpoint(room_type: str, budget: int = 2500):
    """Get real products for a specific room type, organized by category."""
    if room_type not in ROOM_CATEGORIES:
        room_type = "other"

    products_by_category = await get_products_for_room(room_type, budget, db=db)

    total_products = sum(len(prods) for prods in products_by_category.values())
    real_count = sum(
        1 for prods in products_by_category.values()
        for p in prods if p.get("scraped")
    )

    return {
        "room_type": room_type,
        "budget_eur": budget,
        "categories": list(products_by_category.keys()),
        "total_products": total_products,
        "real_products": real_count,
        "products_by_category": products_by_category,
    }


@router.get("/stores")
async def get_available_stores():
    """Get list of supported Bulgarian stores."""
    stores = []
    for key, config in STORE_CONFIGS.items():
        stores.append({
            "id": key,
            "name": config["name"],
            "url": config["base_url"],
            "scraping": config["type"] == "playwright",
        })
    return {"stores": stores}


@router.get("/categories/{room_type}")
async def get_room_categories(room_type: str):
    """Get product categories for a room type."""
    cats = ROOM_CATEGORIES.get(room_type, ROOM_CATEGORIES.get("other", []))
    return {
        "room_type": room_type,
        "categories": [c["category"] for c in cats],
        "details": cats,
    }
