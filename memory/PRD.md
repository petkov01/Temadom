# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
TemaDom е уеб платформа за строителство и ремонти в България. Целта е да свързва клиенти с фирми и майстори, предоставяйки AI-базирани инструменти за проектиране, калкулатор на цени, и подкрепа за абонаментни планове.

## Core Requirements
1. AI Designer (3D Photo Designer, CAD Sketch) with real product scraping
2. Subscription model (БАЗОВ/ПРО/PREMIUM) via Stripe
3. Firm/Master directory with search and filters
4. Community features (feedback, suggestions, blog)
5. Multi-language support (BG, EN)
6. Free chat between all users
7. AI-powered suggestion analysis
8. Google Social Login
9. Telegram bot notifications for firms

## What's Been Implemented

### Phase 1-2 (Complete)
- Full auth system (register, login, JWT)
- Company/Master profiles and portfolio
- Project posting and management
- Price calculator
- Subscription system with Stripe
- AI Designer with GPT-4o-mini and gpt-image-1
- Real product scraping from Videnov via Playwright
- CAD viewer with "Download as PNG"
- Blog, Community pages
- Multi-language, Theme toggle, ScrollToTop, Mobile layout

### Phase 3 (Feb 2026 - Session 1)
- Merged "Фирми и Майстори" page with tabs
- Removed dropdown duplicate
- Cleaned all fake data from MongoDB
- Beta notice on registration
- Suggestions system with voting
- Public pages (/companies, /feedback)

### Phase 3.5 (Feb 2026 - Session 2)
- **Free Chat System** with user search/discovery
- **AI Suggestion Analysis** via GPT-4o-mini
- **Enhanced Scraping** - Mr.Bricolage, Praktiker, eMAG with Playwright

### Phase 4 (Feb 2026 - Session 3 - Current)
- **Designer registration removed** - only Client/Company/Master
- **Google Social Login** via Emergent Auth (auth.emergentagent.com)
- **Telegram bot webhook configured** and bot-info endpoint
- **New kitchen showcase image** generated and replaced
- **Text contrast fixes** across all pages (slate colors → theme vars)
- **Registration Google button** for client accounts

## Architecture
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI (5700+ lines)
│   ├── routes/
│   │   ├── google_auth.py # Emergent Google Auth
│   │   ├── telegram.py    # Telegram bot routes
│   │   ├── payments.py    # Stripe
│   │   └── products.py    # Scraper API
│   └── services/
│       ├── scraper.py     # Playwright (Videnov, Mr.Bricolage, Praktiker, eMAG)
│       └── telegram.py    # Telegram service
└── frontend/
    └── src/
        ├── App.js          # Main app, all pages (3900+ lines)
        └── components/
            ├── ChatPage.jsx       # User search + chat
            └── FeedbackPage.jsx   # Feedback + Suggestions + AI Analysis
```

## Prioritized Backlog

### P1 (High)
- Full AI Designer flow test (multi-room, apartment)
- Mobile responsiveness polish
- Subscription feature verification

### P2 (Medium)
- Backend refactoring (break up server.py monolith)
- SEO optimization

### P3 (Low/Future)
- Company catalog & portfolios
- Job ads module

## 3rd Party Integrations
- OpenAI GPT-4o-mini & gpt-image-1 (Emergent LLM Key)
- Stripe (test keys)
- Playwright (web scraping)
- Google OAuth via Emergent Auth
- Telegram Bot API
