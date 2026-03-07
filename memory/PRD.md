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
- New showcase with 6 unique projects and correct pricing
- "Как работи" sections on Landing, Companies, AI Designer pages
- AI Designer accuracy: prompts for strict architectural preservation
- Designer registration removed (only Client/Company/Master)
- Text contrast fixes with theme CSS variables
- Deployment fixes: health endpoints, lazy loading, requirements.txt

### Phase 5 (Mar 2026 - Current)
- **AI Designer image_edit**: Switched from text-only generation to `litellm.aimage_edit` which passes the original photo as reference, ensuring 1:1 architectural preservation (walls, windows, doors stay identical)
- **Showcase overhaul**: All 6 showcase before/after pairs regenerated using image_edit API — each card now has unique images (no repetition)
- **Projects page split**: Ремонти/Строителство sections with tab navigation
  - Renovation tab: existing renovation categories
  - Construction tab: new categories (Основи, Конструкция, Фасади, Озеленяване, Инфраструктура, До ключ)
  - Property types: Къща, Кооперация, Хале/Склад, Офис сграда, Търговски обект, Вила
  - Construction-specific fields: property_type, land_area, building_area, floors
- **AI Designer UX improvements**: 
  - Estimated generation time display (2-3 min per room)
  - Live elapsed timer during generation
  - Camera capture button (capture="environment") for mobile
  - Gallery upload + direct camera buttons
- **Mobile responsiveness**: Bottom bar centered, chatbot/feedback repositioned
- **Backend pricing fix**: design_2room corrected from €129 to €119
- **Testing**: 100% pass rate (iteration 72 — 12/12 backend, all frontend flows)

## Architecture
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI (5900+ lines)
│   ├── models/__init__.py # Pydantic models with construction fields
│   ├── routes/            # google_auth, telegram, payments, products
│   └── services/          # scraper.py (Videnov, Mr.Bricolage, Praktiker, eMAG)
└── frontend/
    └── src/
        ├── App.js          # Main app (4200+ lines)
        └── components/     # AIDesignerPage, ChatPage, Chatbot, FeedbackButton, etc.
```

## Prioritized Backlog

### P1 (High)
- Add more e-commerce stores to scraping service
- Subscription feature audit (verify all plan features work)
- User-to-user messaging enhancements

### P2 (Medium)
- Backend refactoring (break up server.py into route modules)
- SEO optimization
- Company catalog & portfolio pages

### P3 (Future)
- Job ads module
- Facebook login (when credentials available)
- Advanced analytics dashboard

## 3rd Party Integrations
- OpenAI GPT-4o-mini & gpt-image-1 (Emergent LLM Key) — image_edit for AI Designer
- Stripe (test keys) for subscriptions
- Playwright for web scraping
- Google OAuth (Emergent Auth) for social login
- Telegram Bot API for firm notifications
- litellm.aimage_edit for 1:1 architectural preservation
