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

### Phase 5 (Mar 2026)
- **AI Designer image_edit**: Switched to `litellm.aimage_edit` for 1:1 architectural preservation
- **Showcase overhaul**: All 6 showcase before/after pairs regenerated
- **Projects page split**: Ремонти/Строителство sections with tab navigation
- **AI Designer UX**: Estimated time display, live timer, camera capture
- **Mobile responsiveness**: Bottom bar centered, chatbot/feedback repositioned
- **Backend pricing fix**: design_2room corrected from 129 to 119 EUR

### Phase 6 (Mar 7, 2026)
- **Complete UI/UX Redesign**: Full dark/light theme with CSS variables
  - Replaced all hardcoded dark colors with CSS variables
  - Theme utility classes: .theme-text, .theme-text-muted, .theme-text-subtle, .theme-bg-surface etc.
  - Pages redesigned: LandingPage, LoginPage, RegisterPage, ClientDashboard, CompanyDashboard, ProjectsPage, SubscriptionsPage, AdsPage, AboutPage, ServicesPage, PriceCalculator, BlogPage, BlogArticle, RegionalPage, PricesByRegionPage, AIChartPage, AISketchPage, Scanner3DPage, PublishedGalleryPage, ReadyProjectsPage, PortfolioGallery, FeedbackButton, Chatbot, TermsPage, CommunityPage, ProfilePage
- **Logo enhancement**: Massive logo with golden glow drop-shadow effect
- **P1: Subscription Audit (DONE)**: Verified end-to-end flow
- **P1: Chat Enhancements (DONE)**: Online status, typing indicators, read receipts
- **P1: Scraping Expansion (DONE)**: 21 stores total
- **Editable Contract PDF**: Bulgarian Cyrillic, editable fields
- **Calculation PDF Redesign**: Logo-based header instead of orange
- **Content Cleanup**: Removed "TemaDom" from internal page titles

### Phase 7 (Mar 7, 2026) - AI Designer Speed Fix
- **CRITICAL FIX: AI Designer Performance**
  - Root cause: Sequential processing of photos + scraping + budget generation
  - Fix 1: `/photo-generate` — photos + product scraping now run IN PARALLEL via `asyncio.gather`
  - Fix 2: `/generate` — all 4 camera angles run IN PARALLEL instead of sequentially
  - Fix 3: Fixed `io` module scope bug in `process_single_photo`
  - **Result: Generation time reduced from 7+ minutes to ~41 seconds (90%+ improvement)**
- **Theme Context Fix**: Verified `useTheme` hook works correctly across all components in both light/dark modes
- **Testing**: 100% pass rate — 10/10 backend, all frontend tests passed (iteration_78)

## Architecture
```
/app/
backend/
  server.py          # Main FastAPI (5900+ lines)
  models/__init__.py # Pydantic models with construction fields
  routes/            # google_auth, telegram, payments, products
  services/          # scraper.py, ai_designer_service.py
frontend/
  src/
    App.js          # Main app (4260+ lines)
    index.css       # CSS variables for dark/light theme system
    components/     # AIDesignerPage, ChatPage, PriceCalculator, etc.
```

## Prioritized Backlog

### P1 (High) - ALL COMPLETED
- ~~Subscription feature audit~~ ✅
- ~~Chat enhancements~~ ✅
- ~~Scraping expansion (21 stores)~~ ✅
- ~~AI Designer speed fix~~ ✅ (41s from 7+ mins)

### P2 (Medium)
- Backend refactoring (break up server.py into route modules)
- Frontend refactoring (extract pages from App.js into separate files)
- SEO optimization
- Company catalog & portfolio pages

### P3 (Future)
- Job ads module
- Facebook login (when credentials available)
- Advanced analytics dashboard

## 3rd Party Integrations
- OpenAI GPT-4o-mini & gpt-image-1 (Emergent LLM Key) - image_edit for AI Designer
- Stripe (test keys) for subscriptions
- Playwright for web scraping
- Google OAuth (Emergent Auth) for social login
- Telegram Bot API for firm notifications
- litellm.aimage_edit for 1:1 architectural preservation
