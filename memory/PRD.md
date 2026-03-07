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

### Phase 3 (Feb 2026)
- Merged "Фирми и Майстори" page with tabs (Всички/Фирми/Майстори)
- Removed duplicate "Фирми" from dropdown menu
- Cleaned all fake data from MongoDB
- Beta notice on registration "Платформата е нова!"
- Suggestions system with voting (API + UI)
- Public pages (/companies, /feedback) - no login required
- Fixed broken BULGARIA_REGIONS_LIST duplicate

### Phase 3.5 (Feb 2026)
- **Free Chat System** - user search/discovery, new conversation, message polling
- **AI Suggestion Analysis** - GPT-4o-mini analyzes suggestions, generates recommendations
- **Enhanced Scraping** - Mr.Bricolage, Praktiker, eMAG now with Playwright scrapers
- Added extraction functions for Praktiker and eMAG stores

## Architecture
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI (conversations, messages, suggestions/analyze, users/search)
│   ├── config.py
│   ├── routes/             # google_auth.py, telegram.py, payments.py, products.py
│   └── services/
│       ├── scraper.py      # Playwright scraping (Videnov, Mr.Bricolage, Praktiker, eMAG + search URLs)
│       └── telegram.py
└── frontend/
    └── src/
        ├── App.js          # Main app, all pages
        ├── components/
        │   ├── ChatPage.jsx       # Enhanced with user search & new conversation
        │   ├── FeedbackPage.jsx   # Feedback + Suggestions + AI Analysis
        │   └── ScrollToTop.jsx
        └── i18n/
```

## Prioritized Backlog

### P0 (Critical) - None

### P1 (High)
- Google Social Login (needs OAuth Client ID/Secret)
- Telegram Notifications end-to-end testing
- Landing page showcase slider improvements
- Text contrast fixes across all pages
- Full AI Designer flow test
- Login bug investigation

### P2 (Medium)
- Mobile responsiveness polish
- Backend refactoring (break up server.py)
- Subscription feature verification

### P3 (Low/Future)
- Company catalog & portfolios
- Job ads module
- SEO optimization

## Key API Endpoints
- GET /api/users/search?q= - Search users (auth required)
- POST/GET /api/messages - Send/get messages
- GET /api/conversations - List conversations
- POST /api/suggestions/analyze - AI analysis
- GET /api/suggestions/analysis - Get latest analysis
- POST/GET /api/feedback, /api/suggestions
- GET /api/companies - Firms & Masters directory

## 3rd Party Integrations
- OpenAI GPT-4o-mini & gpt-image-1 (Emergent LLM Key)
- Stripe (test keys)
- Playwright (web scraping)
- Google OAuth (needs credentials)
- Telegram Bot API (configured)
