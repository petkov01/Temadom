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
- Telegram bot configured, Blog, Community
- Multi-language (BG/EN), Theme toggle, ScrollToTop
- Merged "Фирми и Майстори" with tabs, Public pages

### Phase 4 (Current - Feb 2026)
- **New showcase**: 6 projects (БАНЯ, ХОЛ, ХОЛ+КУХНЯ, СПАЛНЯ, ДЕТСКА, ЦЯЛ АПАРТАМЕНТ) with accurate ПРЕДИ/СЛЕД images
- **Correct pricing**: 69/119/199 EUR on all cards and pricing section
- **"Как работи" sections**: Landing page (3 steps) + Companies page (3 steps)
- **AI Designer accuracy**: Prompts completely rewritten for strict architectural preservation (room geometry, walls, windows, doors positions MUST match original)
- **Quality upgrade**: gpt-image-1 now uses quality="high" for better renders
- **Designer registration removed**: Only Client/Company/Master types
- **Text contrast fixes**: Replaced hardcoded slate colors with theme CSS variables
- **New kitchen image**: AI-generated high quality kitchen render

## Architecture
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI (5800+ lines)
│   ├── routes/google_auth.py, telegram.py, payments.py, products.py
│   └── services/scraper.py (Videnov, Mr.Bricolage, Praktiker, eMAG), telegram.py
└── frontend/
    └── src/
        ├── App.js          # Main app (4000+ lines)
        └── components/ChatPage.jsx, FeedbackPage.jsx, AIDesignerPage.jsx
```

## Prioritized Backlog

### P1 (High)
- Test AI Designer with real user photos (verify architectural accuracy)
- Mobile responsiveness polish
- Subscription feature verification

### P2 (Medium)
- Backend refactoring (break up server.py)
- SEO optimization

### P3 (Future)
- Company catalog & portfolios
- Job ads module
- Facebook login (when credentials available)

## 3rd Party Integrations
- OpenAI GPT-4o-mini & gpt-image-1 (Emergent LLM Key)
- Stripe (test keys), Playwright (scraping)
- Google OAuth (Emergent Auth), Telegram Bot API
