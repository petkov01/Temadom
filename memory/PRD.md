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

### Phase 4 (Feb 2026)
- **New showcase**: 6 projects with accurate ПРЕДИ/СЛЕД images
- **Correct pricing**: 69/119/199 EUR on all cards and pricing section
- **"Как работи" sections**: Landing page + Companies page + AI Designer page
- **AI Designer accuracy**: Prompts rewritten for strict architectural preservation
- **Designer registration removed**: Only Client/Company/Master types
- **Text contrast fixes**: Theme CSS variables throughout
- **Deployment fixes**: Health endpoints, lazy loading, requirements.txt

### Phase 5 (Mar 2026 - Current)
- **AI Designer verified**: Tested with real bathroom photo → generates renders + 3-tier budget with real products from Bulgarian stores (4-6 verified products per tier)
- **Mobile responsiveness confirmed**: Hamburger menu works on mobile (lg: breakpoint), all navigation links accessible
- **Bottom element overlap fixed**: Chatbot, feedback button, live counter repositioned on mobile to avoid stacking
- **Pricing fix**: Backend design_2room corrected from €129 to €119 to match frontend
- **Testing**: 100% pass rate (13/13 backend, all frontend UI flows)

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
        └── components/ChatPage.jsx, FeedbackPage.jsx, AIDesignerPage.jsx, Chatbot.jsx
```

## Prioritized Backlog

### P1 (High)
- Add more e-commerce stores to scraping service
- Subscription feature audit (verify all plan features work)
- User-to-user messaging enhancements

### P2 (Medium)
- Backend refactoring (break up server.py)
- SEO optimization
- Company catalog & portfolios

### P3 (Future)
- Job ads module
- Facebook login (when credentials available)
- Advanced analytics dashboard

## 3rd Party Integrations
- OpenAI GPT-4o-mini & gpt-image-1 (Emergent LLM Key)
- Stripe (test keys), Playwright (scraping)
- Google OAuth (Emergent Auth), Telegram Bot API
