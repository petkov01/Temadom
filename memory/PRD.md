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

### Phase 6 (Mar 7, 2026 - Current)
- **Complete UI/UX Redesign**: Full dark/light theme with CSS variables
  - Replaced all hardcoded dark colors (#253545, #1E2A38, #0F1923, border-#3A4A5C) with CSS variables
  - Theme utility classes: .theme-text, .theme-text-muted, .theme-text-subtle, .theme-bg-surface etc.
  - Pages redesigned: LandingPage, LoginPage, RegisterPage, ClientDashboard, CompanyDashboard, ProjectsPage, SubscriptionsPage, AdsPage, AboutPage, ServicesPage, PriceCalculator, BlogPage, BlogArticle, RegionalPage, PricesByRegionPage, AIChartPage, AISketchPage, Scanner3DPage, PublishedGalleryPage, ReadyProjectsPage, PortfolioGallery, FeedbackButton, Chatbot, TermsPage, CommunityPage, ProfilePage
- **Logo enhancement**: Massive logo with golden glow drop-shadow effect
  - Navbar: h-32/h-40 with drop-shadow(0 0 18px rgba(246, 195, 106, 0.85))
  - Hero: h-[28rem]/h-[36rem] with intense glow
  - Footer/Login: h-14 with subtle glow
- **P1: Subscription Audit (DONE)**: Verified end-to-end flow - activate, status check, feature access, limits
- **P1: Chat Enhancements (DONE)**: 
  - Online status heartbeat (30s interval) with green dot in conversation list + chat header
  - Typing indicators (bouncing dots animation, 3s debounce)
  - Read receipts (Check/CheckCheck icons, blue for read)
  - is_online field added to conversations API response
- **P1: Scraping Expansion (DONE)**: 21 stores total including HomeMax, Bauhaus, Jysk, Technomarket, IKEA, etc.
- **Testing**: 100% pass rate - backend 19/19, frontend 100% (iteration_76)

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

### P1 (High) - COMPLETED
- ~~Subscription feature audit~~ ✅ Verified end-to-end
- ~~Chat enhancements (online status, typing, read receipts)~~ ✅
- ~~Scraping expansion (21 stores)~~ ✅

### P2 (Medium)
- Backend refactoring (break up server.py into route modules)
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
