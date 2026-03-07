"""
Product scraper service for Bulgarian e-commerce stores.
Uses Playwright for JS-heavy sites, httpx+BS4 for lighter ones.
Caches results in MongoDB with 24h TTL.
"""

import asyncio
import logging
import re
from datetime import datetime, timezone, timedelta
from urllib.parse import quote as url_quote
from typing import Optional

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

logger = logging.getLogger(__name__)

# ---- Browser singleton ----
_browser = None
_playwright = None
_browser_lock = asyncio.Lock()


async def get_browser():
    global _browser, _playwright
    if not PLAYWRIGHT_AVAILABLE:
        logger.warning("Playwright not available, scraping disabled")
        return None
    async with _browser_lock:
        if _browser and _browser.is_connected():
            return _browser
        try:
            _playwright = await async_playwright().start()
            _browser = await _playwright.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
            )
            logger.info("Playwright browser launched")
            return _browser
        except Exception as e:
            logger.error(f"Failed to launch Playwright: {e}")
            return None


async def close_browser():
    global _browser, _playwright
    if _browser:
        await _browser.close()
        _browser = None
    if _playwright:
        await _playwright.stop()
        _playwright = None


# ---- Store configurations ----
STORE_CONFIGS = {
    "mrbricolage": {
        "name": "Mr.Bricolage",
        "base_url": "https://www.mr-bricolage.bg",
        "search_url": "https://www.mr-bricolage.bg/search?q={query}",
        "type": "playwright",
        "extract_fn": "_extract_mrbricolage",
        "wait_selector": ".product, .product-card",
    },
    "videnov": {
        "name": "Videnov",
        "base_url": "https://videnov.bg",
        "search_url": "https://videnov.bg/search?keyword={query}",
        "type": "playwright",
        "extract_fn": "_extract_videnov",
        "wait_selector": ".node-product, .product-link",
    },
    "praktiker": {
        "name": "Praktiker",
        "base_url": "https://praktiker.bg",
        "search_url": "https://praktiker.bg/bg/search?q={query}",
        "type": "playwright",
        "extract_fn": "_extract_praktiker",
        "wait_selector": ".product-box, .product-item",
    },
    "jysk": {
        "name": "Jysk",
        "base_url": "https://jysk.bg",
        "search_url": "https://jysk.bg/catalogsearch/result/?q={query}",
        "type": "search_url",
    },
    "bauhaus": {
        "name": "Bauhaus",
        "base_url": "https://www.bauhaus.bg",
        "search_url": "https://www.bauhaus.bg/catalogsearch/result/?q={query}",
        "type": "search_url",
    },
    "emag": {
        "name": "eMAG",
        "base_url": "https://www.emag.bg",
        "search_url": "https://www.emag.bg/search/{query}",
        "type": "playwright",
        "extract_fn": "_extract_emag",
        "wait_selector": ".card-item, .card-v2",
    },
    "ikea": {
        "name": "IKEA",
        "base_url": "https://www.ikea.bg",
        "search_url": "https://www.ikea.bg/search/?q={query}",
        "type": "search_url",
    },
    "homemax": {
        "name": "HomeMax",
        "base_url": "https://www.homemax.bg",
        "search_url": "https://www.homemax.bg/catalogsearch/result/?q={query}",
        "type": "playwright",
        "extract_fn": "_extract_homemax",
        "wait_selector": ".product-item, .product-card, li.item",
    },
    "praktis": {
        "name": "Praktis",
        "base_url": "https://praktis.bg",
        "search_url": "https://praktis.bg/search?q={query}",
        "type": "playwright",
        "extract_fn": "_extract_praktis",
        "wait_selector": ".product-card, .product, .product-item",
    },
    "bauhaus": {
        "name": "Bauhaus",
        "base_url": "https://www.bauhaus.bg",
        "search_url": "https://www.bauhaus.bg/catalogsearch/result/?q={query}",
        "type": "playwright",
        "extract_fn": "_extract_bauhaus",
        "wait_selector": ".product-item, .product-card, li.item",
    },
    "jysk": {
        "name": "Jysk",
        "base_url": "https://jysk.bg",
        "search_url": "https://jysk.bg/catalogsearch/result/?q={query}",
        "type": "playwright",
        "extract_fn": "_extract_jysk",
        "wait_selector": ".product-card, .product, .productlist-item",
    },
}

# ---- Room type to search categories mapping ----
# Videnov (scraped) for furniture/fixtures; search URL stores for building materials
ROOM_CATEGORIES = {
    "bathroom": [
        {"query": "плочки баня", "category": "Плочки", "stores": ["praktiker", "mrbricolage", "bauhaus", "praktis"]},
        {"query": "мебели баня шкаф", "category": "Мебели за баня", "stores": ["videnov", "homemax", "jysk"]},
        {"query": "смесител баня", "category": "Смесители", "stores": ["videnov", "praktiker", "homemax"]},
        {"query": "душ кабина", "category": "Душ кабини", "stores": ["videnov", "praktiker", "homemax"]},
        {"query": "LED осветление баня", "category": "Осветление", "stores": ["praktiker", "emag", "bauhaus"]},
        {"query": "мивка баня", "category": "Мивки", "stores": ["videnov", "homemax"]},
        {"query": "огледало баня LED", "category": "Огледала", "stores": ["videnov", "emag"]},
        {"query": "тоалетна чиния", "category": "Санитария", "stores": ["videnov", "praktiker", "homemax"]},
    ],
    "kitchen": [
        {"query": "кухня модулна", "category": "Кухненски мебели", "stores": ["videnov", "homemax"]},
        {"query": "кухненски плот", "category": "Плотове", "stores": ["praktiker", "mrbricolage", "bauhaus"]},
        {"query": "смесител кухня", "category": "Смесители", "stores": ["videnov", "homemax"]},
        {"query": "кухненска мивка вграждане", "category": "Мивки", "stores": ["videnov", "homemax"]},
        {"query": "LED осветление кухня", "category": "Осветление", "stores": ["praktiker", "emag", "bauhaus"]},
        {"query": "гранитогрес 60x60", "category": "Настилки", "stores": ["praktiker", "mrbricolage", "bauhaus", "praktis"]},
        {"query": "аспиратор кухня", "category": "Уреди", "stores": ["emag", "praktiker", "homemax"]},
    ],
    "living_room": [
        {"query": "диван ъглов", "category": "Мека мебел", "stores": ["videnov", "jysk", "homemax"]},
        {"query": "маса хол холна", "category": "Маси", "stores": ["videnov", "jysk"]},
        {"query": "килим хол", "category": "Килими", "stores": ["videnov", "jysk", "homemax"]},
        {"query": "LED лампа полилей", "category": "Осветление", "stores": ["videnov", "emag", "homemax"]},
        {"query": "ламиниран паркет", "category": "Настилки", "stores": ["praktiker", "mrbricolage", "bauhaus", "praktis"]},
        {"query": "латексова боя стена", "category": "Бои", "stores": ["praktiker", "mrbricolage", "bauhaus", "praktis"]},
        {"query": "TV шкаф мебел", "category": "ТВ мебели", "stores": ["videnov", "jysk", "homemax"]},
    ],
    "bedroom": [
        {"query": "легло спалня", "category": "Легла", "stores": ["videnov", "jysk", "homemax"]},
        {"query": "гардероб", "category": "Гардероби", "stores": ["videnov", "jysk", "homemax"]},
        {"query": "матрак двоен", "category": "Матраци", "stores": ["videnov", "jysk"]},
        {"query": "нощно шкафче", "category": "Нощни шкафчета", "stores": ["videnov", "jysk"]},
        {"query": "LED осветление спалня", "category": "Осветление", "stores": ["videnov", "emag", "homemax"]},
        {"query": "ламиниран паркет", "category": "Настилки", "stores": ["praktiker", "mrbricolage", "bauhaus", "praktis"]},
        {"query": "латексова боя стена", "category": "Бои", "stores": ["praktiker", "mrbricolage", "praktis"]},
    ],
    "corridor": [
        {"query": "шкаф антре", "category": "Мебели за антре", "stores": ["videnov"]},
        {"query": "огледало стенно", "category": "Огледала", "stores": ["videnov"]},
        {"query": "LED осветление коридор", "category": "Осветление", "stores": ["videnov", "emag"]},
        {"query": "ламиниран паркет", "category": "Настилки", "stores": ["praktiker", "mrbricolage"]},
        {"query": "латексова боя стена", "category": "Бои", "stores": ["praktiker", "mrbricolage"]},
    ],
    "balcony": [
        {"query": "балконска настилка плочки", "category": "Настилки", "stores": ["praktiker", "mrbricolage"]},
        {"query": "градински мебели", "category": "Мебели", "stores": ["videnov", "jysk"]},
        {"query": "LED градинско осветление", "category": "Осветление", "stores": ["praktiker", "emag"]},
    ],
}

# Fallback for unknown room types
ROOM_CATEGORIES["stairs"] = [
    {"query": "стълбищно осветление", "category": "Осветление", "stores": ["mrbricolage"]},
    {"query": "парапет стълбище", "category": "Парапети", "stores": ["mrbricolage", "praktiker"]},
]
ROOM_CATEGORIES["facade"] = [
    {"query": "фасадна мазилка", "category": "Мазилки", "stores": ["mrbricolage", "praktiker"]},
    {"query": "топлоизолация", "category": "Изолация", "stores": ["mrbricolage", "praktiker"]},
    {"query": "фасадна боя", "category": "Бои", "stores": ["mrbricolage", "praktiker"]},
]
ROOM_CATEGORIES["other"] = ROOM_CATEGORIES["living_room"]


def _parse_price(text: str) -> float:
    """Extract numeric price from text like '3,32 €' or '269 € / 526.12 лв.'"""
    if not text:
        return 0.0
    # Try EUR first
    eur_match = re.search(r'([\d\s]+[.,]\d{2})\s*€', text.replace("\xa0", " "))
    if eur_match:
        num = eur_match.group(1).replace(" ", "").replace(",", ".")
        try:
            return float(num)
        except ValueError:
            pass
    # Try BGN/лв
    bgn_match = re.search(r'([\d\s]+[.,]\d{2})\s*(лв|BGN)', text.replace("\xa0", " "))
    if bgn_match:
        num = bgn_match.group(1).replace(" ", "").replace(",", ".")
        try:
            return round(float(num) / 1.96, 2)
        except ValueError:
            pass
    # Try plain number
    plain = re.search(r'([\d]+[.,]?\d*)', text.replace(" ", ""))
    if plain:
        num = plain.group(1).replace(",", ".")
        try:
            return float(num)
        except ValueError:
            pass
    return 0.0


# ---- Store-specific extraction ----

async def _extract_mrbricolage(page) -> list:
    """Extract products from Mr.Bricolage search results page."""
    return await page.evaluate('''() => {
        const results = [];
        const items = document.querySelectorAll('.product');
        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const el = items[i];
            const title = el.querySelector('.product__title');
            const priceNew = el.querySelector('.product__price--new');
            const price = el.querySelector('.product__price');
            const link = el.querySelector('a[href*="/p/"]');
            const img = el.querySelector('img');

            const name = (title ? title.textContent.trim() : '');
            const href = link ? link.href : '';
            if (name && href) {
                results.push({
                    name: name.substring(0, 120),
                    price_text: (priceNew || price || {}).textContent?.trim() || '',
                    url: href,
                    image: img ? (img.src || img.dataset?.src || '') : '',
                    store: 'Mr.Bricolage'
                });
            }
        }
        return results;
    }''')


async def _extract_videnov(page) -> list:
    """Extract products from Videnov search results page."""
    return await page.evaluate('''() => {
        const results = [];
        const items = document.querySelectorAll('.node-product');
        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const el = items[i];
            const link = el.querySelector('a.product-link');
            const priceEl = el.querySelector('.field-name-commerce-price, [class*=price]');
            const img = el.querySelector('img');
            // Get name from title attribute or GTM data
            const favBtn = el.querySelector('[data-gtm-datalayer-name]');
            const gtmName = favBtn ? favBtn.getAttribute('data-gtm-datalayer-name') : '';
            const gtmPrice = favBtn ? favBtn.getAttribute('data-gtm-datalayer-price') : '';
            const linkTitle = link ? (link.getAttribute('title') || '') : '';
            const imgAlt = img ? (img.getAttribute('alt') || '') : '';
            const name = gtmName || linkTitle || imgAlt;

            const href = link ? link.href : '';
            if (href && name) {
                results.push({
                    name: name.substring(0, 120),
                    price_text: gtmPrice ? (gtmPrice + ' €') : (priceEl ? priceEl.textContent.trim().substring(0, 60) : ''),
                    url: href,
                    image: img ? (img.dataset?.src || img.src || '') : '',
                    store: 'Videnov'
                });
            }
        }
        return results;
    }''')


async def _extract_praktiker(page) -> list:
    """Extract products from Praktiker search results page."""
    return await page.evaluate('''() => {
        const results = [];
        const items = document.querySelectorAll('.product-box, .product-item, [class*=product-card]');
        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const el = items[i];
            const title = el.querySelector('[class*=title], [class*=name], h3, h4');
            const priceEl = el.querySelector('[class*=price], .price');
            const link = el.querySelector('a[href*="/bg/"]');
            const img = el.querySelector('img');
            const name = (title ? title.textContent.trim() : '');
            const href = link ? link.href : '';
            if (name && href) {
                results.push({
                    name: name.substring(0, 120),
                    price_text: priceEl ? priceEl.textContent.trim().substring(0, 60) : '',
                    url: href.startsWith('http') ? href : 'https://praktiker.bg' + href,
                    image: img ? (img.src || img.dataset?.src || '') : '',
                    store: 'Praktiker'
                });
            }
        }
        return results;
    }''')


async def _extract_emag(page) -> list:
    """Extract products from eMAG search results page."""
    return await page.evaluate('''() => {
        const results = [];
        const items = document.querySelectorAll('.card-item, .card-v2, [class*=card-standard]');
        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const el = items[i];
            const title = el.querySelector('[class*=product-title], [class*=card-v2-title], h2 a, .pad-hrz-xs a');
            const priceEl = el.querySelector('[class*=product-new-price], .product-new-price, [class*=price]');
            const link = el.querySelector('a[href*="/pd/"]') || el.querySelector('a[href*=".html"]');
            const img = el.querySelector('img');
            const name = (title ? title.textContent.trim() : '');
            const href = link ? link.href : '';
            if (name && href) {
                results.push({
                    name: name.substring(0, 120),
                    price_text: priceEl ? priceEl.textContent.trim().substring(0, 60) : '',
                    url: href.startsWith('http') ? href : 'https://www.emag.bg' + href,
                    image: img ? (img.src || img.dataset?.src || '') : '',
                    store: 'eMAG'
                });
            }
        }
        return results;
    }''')


async def _extract_homemax(page) -> list:
    """Extract products from HomeMax search results page (Magento-based)."""
    return await page.evaluate('''() => {
        const results = [];
        const items = document.querySelectorAll('.product-item, li.item.product, .product-card');
        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const el = items[i];
            const link = el.querySelector('a.product-item-link, a[class*=product-link], a[href*="/"]');
            const priceEl = el.querySelector('.price, [data-price-amount], .special-price .price, .regular-price .price');
            const img = el.querySelector('img.product-image-photo, img[class*=product]');
            const name = link ? link.textContent.trim() : '';
            const href = link ? link.href : '';
            if (name && href) {
                results.push({
                    name: name.substring(0, 120),
                    price_text: priceEl ? priceEl.textContent.trim().substring(0, 60) : '',
                    url: href.startsWith('http') ? href : 'https://www.homemax.bg' + href,
                    image: img ? (img.src || img.dataset?.src || '') : '',
                    store: 'HomeMax'
                });
            }
        }
        return results;
    }''')


async def _extract_praktis(page) -> list:
    """Extract products from Praktis search results page."""
    return await page.evaluate('''() => {
        const results = [];
        const items = document.querySelectorAll('.product-card, .product, .product-item, [class*=product-box]');
        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const el = items[i];
            const link = el.querySelector('a[href*="/p/"], a[href*="product"], a.product-link, a:first-of-type');
            const title = el.querySelector('[class*=title], [class*=name], h3, h4, .product-name');
            const priceEl = el.querySelector('[class*=price], .price');
            const img = el.querySelector('img');
            const name = title ? title.textContent.trim() : (link ? link.textContent.trim() : '');
            const href = link ? link.href : '';
            if (name && href && name.length > 3) {
                results.push({
                    name: name.substring(0, 120),
                    price_text: priceEl ? priceEl.textContent.trim().substring(0, 60) : '',
                    url: href.startsWith('http') ? href : 'https://praktis.bg' + href,
                    image: img ? (img.src || img.dataset?.src || '') : '',
                    store: 'Praktis'
                });
            }
        }
        return results;
    }''')


async def _extract_bauhaus(page) -> list:
    """Extract products from Bauhaus search results page (Magento-based)."""
    return await page.evaluate('''() => {
        const results = [];
        const items = document.querySelectorAll('.product-item, li.item.product, .product-card, [class*=product-item]');
        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const el = items[i];
            const link = el.querySelector('a.product-item-link, a[class*=product-link], a[href]');
            const priceEl = el.querySelector('.price, [data-price-amount], .special-price .price, .regular-price .price');
            const img = el.querySelector('img.product-image-photo, img[class*=product], img');
            const name = link ? link.textContent.trim() : '';
            const href = link ? link.href : '';
            if (name && href && name.length > 3) {
                results.push({
                    name: name.substring(0, 120),
                    price_text: priceEl ? priceEl.textContent.trim().substring(0, 60) : '',
                    url: href.startsWith('http') ? href : 'https://www.bauhaus.bg' + href,
                    image: img ? (img.src || img.dataset?.src || '') : '',
                    store: 'Bauhaus'
                });
            }
        }
        return results;
    }''')


async def _extract_jysk(page) -> list:
    """Extract products from Jysk search results page."""
    return await page.evaluate('''() => {
        const results = [];
        const items = document.querySelectorAll('.product-card, .productlist-item, .product, [class*=product-tile]');
        for (let i = 0; i < Math.min(items.length, 10); i++) {
            const el = items[i];
            const link = el.querySelector('a[href*="/p/"], a[href*="product"], a.product-link, a:first-of-type');
            const title = el.querySelector('[class*=title], [class*=name], h3, h4, .product-name');
            const priceEl = el.querySelector('[class*=price], .price, [class*=amount]');
            const img = el.querySelector('img');
            const name = title ? title.textContent.trim() : (link ? link.textContent.trim() : '');
            const href = link ? link.href : '';
            if (name && href && name.length > 3) {
                results.push({
                    name: name.substring(0, 120),
                    price_text: priceEl ? priceEl.textContent.trim().substring(0, 60) : '',
                    url: href.startsWith('http') ? href : 'https://jysk.bg' + href,
                    image: img ? (img.src || img.dataset?.src || '') : '',
                    store: 'Jysk'
                });
            }
        }
        return results;
    }''')


EXTRACT_FNS = {
    "_extract_mrbricolage": _extract_mrbricolage,
    "_extract_videnov": _extract_videnov,
    "_extract_praktiker": _extract_praktiker,
    "_extract_emag": _extract_emag,
    "_extract_homemax": _extract_homemax,
    "_extract_praktis": _extract_praktis,
    "_extract_bauhaus": _extract_bauhaus,
    "_extract_jysk": _extract_jysk,
}


# ---- Main scraping functions ----

async def scrape_store_products(store_key: str, query: str, limit: int = 5) -> list:
    """Scrape products from a single store. Returns list of product dicts."""
    config = STORE_CONFIGS.get(store_key)
    if not config:
        return []

    encoded_query = url_quote(query, safe="")
    search_url = config["search_url"].format(query=encoded_query)

    # For search_url type stores, return a single "search link" product
    if config["type"] == "search_url":
        return [{
            "name": f"Търси '{query}' в {config['name']}",
            "price_eur": 0,
            "url": search_url,
            "image": "",
            "store": config["name"],
            "scraped": False,
            "search_link": True,
        }]

    # For playwright-scraped stores
    try:
        browser = await get_browser()
        page = await browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        try:
            await page.goto(search_url, timeout=15000, wait_until="domcontentloaded")
            # Wait for JS redirects and dynamic content
            await page.wait_for_timeout(4000)
            # Try to wait for product elements to appear
            try:
                wait_sel = config.get("wait_selector", ".product")
                await page.wait_for_selector(wait_sel, timeout=5000)
            except Exception:
                pass

            extract_fn = EXTRACT_FNS.get(config["extract_fn"])
            if not extract_fn:
                return []

            raw_products = await extract_fn(page)

            products = []
            for p in raw_products[:limit]:
                price_eur = _parse_price(p.get("price_text", ""))
                products.append({
                    "name": p["name"],
                    "price_eur": price_eur,
                    "url": p["url"],
                    "image": p.get("image", ""),
                    "store": p.get("store", config["name"]),
                    "scraped": True,
                    "search_link": False,
                })
            return products
        finally:
            await page.close()
    except Exception as e:
        logger.warning(f"Scrape {store_key} for '{query}' failed: {e}")
        # Fallback to search URL
        return [{
            "name": f"Търси '{query}' в {config['name']}",
            "price_eur": 0,
            "url": search_url,
            "image": "",
            "store": config["name"],
            "scraped": False,
            "search_link": True,
        }]


async def search_real_products(query: str, stores: list = None, limit_per_store: int = 5) -> list:
    """Search for real products across multiple stores in parallel."""
    if stores is None:
        stores = ["mrbricolage", "videnov"]

    tasks = [scrape_store_products(s, query, limit_per_store) for s in stores]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_products = []
    for r in results:
        if isinstance(r, list):
            all_products.extend(r)
    return all_products


async def get_products_for_room(room_type: str, budget_eur: int, db=None) -> dict:
    """
    Get real products for a room type, organized by category.
    Checks MongoDB cache first, scrapes if needed.
    Returns: {category: [products]}
    """
    categories = ROOM_CATEGORIES.get(room_type, ROOM_CATEGORIES["other"])
    cache_ttl = timedelta(hours=24)

    result = {}

    async def fetch_category(cat_info):
        query = cat_info["query"]
        category = cat_info["category"]
        stores = cat_info["stores"]

        # Check cache first
        if db is not None:
            cached = await db.product_cache.find_one(
                {"query": query, "expires_at": {"$gt": datetime.now(timezone.utc)}},
                {"_id": 0}
            )
            if cached and cached.get("products"):
                return category, cached["products"]

        # Scrape
        products = await search_real_products(query, stores, limit_per_store=5)

        # Cache results
        if db is not None and products:
            await db.product_cache.update_one(
                {"query": query},
                {"$set": {
                    "query": query,
                    "products": products,
                    "category": category,
                    "room_type": room_type,
                    "expires_at": datetime.now(timezone.utc) + cache_ttl,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }},
                upsert=True
            )

        return category, products

    # Fetch all categories in parallel (but limit concurrency to avoid overload)
    sem = asyncio.Semaphore(3)

    async def fetch_with_sem(cat_info):
        async with sem:
            try:
                return await fetch_category(cat_info)
            except Exception as e:
                logger.error(f"fetch_category error for {cat_info.get('category')}: {e}")
                return None

    tasks = [fetch_with_sem(c) for c in categories]
    cat_results = await asyncio.gather(*tasks)

    for r in cat_results:
        if isinstance(r, tuple):
            category, products = r
            if products:
                result[category] = products

    return result


def format_products_for_prompt(products_by_category: dict, budget_eur: int) -> str:
    """Format scraped products as JSON context for the GPT prompt."""
    lines = []
    lines.append(f"РЕАЛНИ ПРОДУКТИ ОТ БЪЛГАРСКИ МАГАЗИНИ (бюджет: {budget_eur}€):")
    lines.append("=" * 60)

    for category, products in products_by_category.items():
        real_products = [p for p in products if p.get("scraped")]
        if not real_products:
            continue
        lines.append(f"\n### {category}:")
        for p in real_products:
            price_str = f"{p['price_eur']}€" if p['price_eur'] > 0 else "цена при запитване"
            lines.append(f"  - {p['name']} | {price_str} | {p['store']} | URL: {p['url']}")

    lines.append("\n" + "=" * 60)
    lines.append("ИЗПОЛЗВАЙ САМО горните реални продукти в бюджета!")
    lines.append("За всеки материал ЗАДЪЛЖИТЕЛНО включи точното име, цена и URL от списъка.")

    return "\n".join(lines)
