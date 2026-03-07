# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
TemaDom е уеб платформа за строителство и ремонти в България. Целта е да свързва клиенти с фирми и майстори, предоставяйки AI-базирани инструменти за проектиране, калкулатор на цени, и подкрепа за абонаментни планове.

## Core Requirements
1. AI Designer (3D Photo Designer, CAD Sketch) with real product scraping
2. Subscription model (БАЗОВ/ПРО/PREMIUM) via Stripe
3. Firm/Master directory with search and filters
4. Community features (feedback, suggestions, blog)
5. Multi-language support (BG, EN, etc.)

## What's Been Implemented
### Phase 1-2 (Complete)
- Full auth system (register, login, JWT)
- Company/Master profiles and portfolio
- Project posting and management
- Price calculator with AI analysis
- Subscription system with Stripe integration
- AI Designer with GPT-4o-mini and gpt-image-1
- Real product scraping from Videnov via Playwright
- CAD viewer with "Download as PNG"
- Blog, Community pages
- Multi-language support
- Theme toggle (dark/light)
- Live counter and regional stats
- ScrollToTop component
- Mobile responsive layout

### Phase 3 (Current Session - Feb 2026)
- **Merged Firms & Masters page** - /companies now shows unified view with tabs (Всички/Фирми/Майстори)
- **Removed duplicate "Фирми"** from dropdown navigation menu
- **Cleaned all fake data** from MongoDB (test users, companies, profiles)
- **Beta notice on registration** - "Платформата е нова!" with link to feedback
- **Suggestions system** - New API endpoints + UI tab on /feedback page
- **Public pages** - /companies and /feedback accessible without login
- **Fixed broken BULGARIA_REGIONS_LIST** duplicate declaration
- **Google OAuth** backend routes (needs client ID/secret to activate)
- **Telegram bot** integration setup (bot token configured)

## Architecture
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI monolith
│   ├── config.py          # Shared config
│   ├── routes/
│   │   ├── google_auth.py # Google OAuth (needs credentials)
│   │   ├── telegram.py    # Telegram bot routes
│   │   ├── notifications.py
│   │   ├── payments.py
│   │   └── products.py    # Product scraper API
│   └── services/
│       ├── scraper.py     # Playwright scraping
│       └── telegram.py    # Telegram service
└── frontend/
    └── src/
        ├── App.js         # Main app with all pages
        ├── components/    # Feature pages
        └── i18n/          # Translations
```

## Prioritized Backlog

### P0 (Critical)
- None currently

### P1 (High Priority)
- Google Social Login activation (needs client credentials)
- Telegram Notifications testing (end-to-end flow)
- Landing page showcase slider improvements
- Text contrast fixes across all pages
- Full AI Designer flow test (multi-room, apartment)
- Login bug investigation

### P2 (Medium)
- Add new Bulgarian stores to scraping service
- Mobile responsiveness polish
- Backend refactoring (break up server.py monolith)
- Subscription feature verification (all plan features working)

### P3 (Low/Future)
- Company catalog & portfolios
- Direct user-to-user messaging
- Job ads module
- SEO optimization

## Key API Endpoints
- POST/GET /api/feedback - User feedback with ratings
- POST/GET /api/suggestions - Platform improvement suggestions
- POST /api/suggestions/{id}/vote - Upvote suggestions
- GET /api/companies - List firms/masters with filters
- POST /api/auth/register, /api/auth/login - Authentication
- GET /api/stats/live - Real-time platform statistics

## Database
- MongoDB at localhost:27017, DB: test_database
- Collections: users, company_profiles, feedback, suggestions, projects, etc.

## 3rd Party Integrations
- OpenAI (GPT-4o-mini, gpt-image-1) via Emergent LLM Key
- Stripe (test keys) for subscriptions
- Playwright for web scraping
- Google OAuth (configured, needs credentials)
- Telegram Bot API (token configured)
