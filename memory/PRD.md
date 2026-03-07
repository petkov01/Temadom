# TEMADOM — Product Requirements Document

## Status: LAUNCH READY

## Core Features — ALL WORKING

### 1. 3D Photo Designer v10 — Real Product Integration
- GPT-4o-mini Vision + gpt-image-1 renders
- Real-time product scraping from Videnov.bg (Playwright)
- 3 budget tiers with REAL product links (verified) + search URL fallbacks
- Products include exact names, EUR prices, and direct URLs
- Frontend shows "Реален" badge for verified products, "Купи от" buttons
- 3 packages: 1 room (69€), 2 rooms (129€), Apartment up to 5 rooms (199€)
- Room-type category mapping, 24h MongoDB caching, image compression

### 2. Product Scraping Service
- **Scraped**: Videnov.bg (furniture, fixtures, bathroom, kitchen)
- **Search URL**: Praktiker, Mr.Bricolage, Bauhaus, Jysk, eMAG, IKEA, HomeMax, Praktis
- API: `/api/products/search`, `/api/products/for-room/{type}`, `/api/products/stores`
- Playwright browser singleton, affiliate tracking on all URLs

### 3. Subscription System — FULLY FUNCTIONAL
- Plans: БАЗОВ (15€/мес), ПРО (35€/мес), PREMIUM (75€/мес)
- Feature gating: PDF contracts, AI sketches, quantitative estimates, Telegram notifications, priority display, team members
- Profile dashboard: plan display, offers usage bar, feature lock indicators
- Subscriptions page: current plan indicator ("ТЕКУЩ ПЛАН"), upgrade flow
- Backend endpoints: activate, my, my-limits, check-feature, plans
- Stripe payment (test mode)

### 4. CAD System — with PNG Download
- Full 2D CAD editor with walls, doors, windows, furniture
- 3D live preview
- PDF plan + contract export
- **NEW: Download as PNG image** (works on mobile)

### 5. Calculator (AI Blueprint Removed)
- Full renovation cost calculator with services/materials
- Regional pricing (Sofia, cities, villages)
- Quality levels, PDF export
- AI blueprint analysis REMOVED per user request

### 6. Affiliate Monetization
- 9 stores with configurable ref IDs
- Auto-applied to all product/search URLs

### 7. Landing Page Showcase
- 5 real AI-generated Before/After projects
- Material lists with affiliate links

### 8. Other Features
- Community feed, AI product search, leaderboard, notifications
- Live statistics counter (desktop + mobile)
- Multi-language (BG/EN)

## Architecture
```
/app/backend/
  ├── server.py          # Main (~5650 lines)
  ├── config.py          # Config, DB, auth
  ├── services/
  │   └── scraper.py     # Playwright product scraper
  ├── routes/
  │   ├── products.py    # Product search API
  │   ├── notifications.py
  │   └── payments.py
  └── models/models.py

/app/frontend/src/
  ├── components/
  │   ├── AIDesignerPage.jsx  # 3D designer with verified badges
  │   ├── AISketchPage.jsx    # CAD with PNG download
  │   ├── PriceCalculator.jsx # Calculator (no AI blueprint)
  │   ├── ProfilePage.jsx     # Subscription dashboard
  │   └── ...
  └── App.js                  # Subscriptions page with current plan
```

## Backlog
- P1: Backend refactoring (server.py monolith → modular routers)
- P1: Mobile responsiveness polish
- P1: Add more scraped stores
- P2: Company catalog & portfolios
- P2: Direct messaging
- P2: Job ads module
