# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
TemaDom е уеб платформа за строителство и ремонти в България. Целта е да свързва клиенти с фирми и майстори, предоставяйки AI-базирани инструменти за проектиране, калкулатор на цени, и подкрепа за абонаментни планове.

## Pricing
- 1 помещение: 69 EUR
- 2 помещения: 119 EUR
- Цял апартамент: 199 EUR

## What's Been Implemented

### Phase 1-3 (Previous sessions)
- Full auth (JWT), Google Social Login (Emergent Auth)
- Company/Master profiles, portfolio, projects, reviews
- Subscription system (Stripe), Price calculator
- AI Designer (GPT-4o-mini + gpt-image-1), Real product scraping (Playwright)
- Free chat between users with search/discovery
- AI-powered suggestion analysis (GPT)
- Telegram bot, Blog, Community, Multi-language (BG/EN), Theme toggle

### Phase 4-5 (Feb-Mar 2026)
- AI Designer accuracy, showcase, projects page, mobile responsiveness
- Pricing fixes, deployment fixes

### Phase 6 (Mar 7, 2026)
- Complete UI/UX Redesign with CSS variables dark/light theme
- Logo enhancement with golden glow
- Subscription audit, Chat enhancements, Scraping expansion (21 stores)
- Editable Contract PDF (Bulgarian Cyrillic)
- Content cleanup

### Phase 7 (Mar 7, 2026) - AI Designer Speed & Reliability Fix
- **CRITICAL: Async Task System for AI Designer**
  - Backend returns `task_id` immediately (< 2 seconds response)
  - Frontend polls `/api/ai-designer/task/{id}` every 3s for real progress
  - Progress steps: 5% → 10% → 20% → 60% → 70% → 90% → 100%
  - Eliminates proxy timeouts, no more 5-7 minute hangs
  - Total generation: ~30-40 seconds
- **Parallel Processing**: Photos + product scraping run concurrently via `asyncio.gather`
- **Navbar Logo Fix**: Reduced from h-32/h-40 (squished) to h-12/h-16 with `object-contain`
- **Testing**: 100% pass (iterations 78-79)

## Architecture
```
/app/
backend/
  server.py          # Main FastAPI (6000+ lines)
  models/__init__.py # Pydantic models
  routes/            # google_auth, telegram, payments, products
  services/          # scraper.py, telegram.py
frontend/
  src/
    App.js          # Main app (4270+ lines)
    index.css       # CSS variables for dark/light theme
    components/     # AIDesignerPage, ChatPage, PriceCalculator, etc.
```

## Key API Endpoints
- `POST /api/ai-designer/photo-generate` → returns `{task_id}` immediately
- `GET /api/ai-designer/task/{task_id}` → poll for progress/result
- `POST /api/ai-designer/generate` → parallelized camera angles
- `POST /api/contract/generate` → editable contract PDF
- `GET /api/subscriptions/plans` → subscription plan data

## Prioritized Backlog

### P1 (High) - ALL COMPLETED
- ~~Subscription audit~~ ✅
- ~~Chat enhancements~~ ✅
- ~~Scraping expansion~~ ✅
- ~~AI Designer speed fix~~ ✅ (async + parallel)
- ~~Navbar logo fix~~ ✅

### P2 (Medium)
- Backend refactoring (break up server.py)
- Frontend refactoring (extract pages from App.js)
- SEO optimization
- Company catalog & portfolio pages

### P3 (Future)
- Job ads module
- Facebook login
- Advanced analytics dashboard

## 3rd Party Integrations
- OpenAI GPT-4o & gpt-image-1 (Emergent LLM Key)
- Stripe (test keys) for subscriptions
- Playwright for web scraping
- Google OAuth (Emergent Auth) for social login
- Telegram Bot API for notifications
- litellm.aimage_edit for AI Designer
