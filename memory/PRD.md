# TEMADOM — Product Requirements Document

## Status: PRODUCTION READY (Scraping MVP Complete)

## Core Features — ALL WORKING

### 1. 3D Photo Designer v10 — Real Product Integration
- GPT-4o-mini Vision + gpt-image-1 renders
- **NEW: Real-time product scraping from Videnov.bg** (Playwright-based)
- 3 budget tiers with REAL product links (verified) + search URL fallbacks
- Products include exact names, EUR prices, and direct URLs
- Frontend shows "Реален" badge for verified products, "Купи от" buttons
- Room-type based category mapping (bathroom, kitchen, living_room, bedroom, etc.)
- 24h MongoDB caching with TTL for scraped products
- Free text budget (EUR), retry with backoff, image resize <2MB

### 2. Product Scraping Service
- **Scraped stores**: Videnov.bg (furniture, fixtures, bathroom, kitchen)
- **Search URL stores**: Praktiker, Mr.Bricolage, Bauhaus, Jysk, eMAG, IKEA, HomeMax, Praktis
- API endpoints:
  - `GET /api/products/search?q=&stores=&limit=` - Search real products
  - `GET /api/products/for-room/{room_type}?budget=` - Get products by room category
  - `GET /api/products/stores` - List available stores
  - `GET /api/products/categories/{room_type}` - Get categories for room type
- Playwright browser singleton with graceful shutdown
- Affiliate tracking applied to all product URLs

### 3. Landing Page Showcase — 5 REAL AI-generated projects
- Before/After photos (real AI renders)
- Materials with affiliate links

### 4. Affiliate Monetization — Auto-applied everywhere
- 9 stores with configurable ref IDs in AFFILIATE_CONFIG

### 5. Subscription Plan Enforcement
- БАЗОВ/ПРО/PREMIUM tiers with feature gating

### 6. Live Counter, Community Feed, AI Product Search, Leaderboard, Notifications, etc.

## Architecture
```
/app/backend/
  ├── server.py          # Main monolith (~5650 lines)
  ├── config.py          # Shared config, DB, auth helpers
  ├── services/
  │   └── scraper.py     # Playwright-based product scraper (NEW)
  ├── routes/
  │   ├── products.py    # Product search API (NEW)
  │   ├── notifications.py
  │   └── payments.py
  └── models/
      └── models.py

/app/frontend/src/
  ├── components/
  │   ├── AIDesignerPage.jsx  # Updated with verified badges
  │   └── ...
  └── pages/
      └── LandingPage.jsx
```

## Post-Launch Backlog
- P1: Backend refactoring (server.py monolith → modular routers)
- P1: Mobile responsiveness polish (all pages)
- P1: Add more scraped stores (currently only Videnov works reliably)
- P2: Company catalog & portfolios
- P2: Direct messaging
- P2: Job ads module
