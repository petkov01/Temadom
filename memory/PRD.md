# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Build a marketplace application named "TemaDom" for selling construction project leads. The platform connects clients seeking construction/renovation services with verified companies and masters.

## Current Phase: Phase 3 - Soft Launch
All features are active and FREE for testing. The UI presents the structure of future paid plans.

## Core Requirements

### User Types
- **Client** - Posts projects, uses calculator, contacts companies
- **Company** - Business entity with Bulstat (EIK), receives project leads
- **Master** - Individual craftsman/professional
- **Designer** - Interior designer with AI design capabilities

### Visual Identity (Phase 3) - COMPLETED
- Dark theme: Main (#1E2A38), Dark Gray (#2B2B2B), White (#FFFFFF)
- Accents: Orange (#FF8C42), Green (#28A745), Red (#DC3545)
- Secondary: Light Blue (#4DA6FF), Purple (#8C56FF)
- New TemaDom logo (large in navbar, footer)
- Gradient text effects, glass morphism, noise overlays

### Key Features
1. **Price Calculator** - Construction cost calculator for 28 regions
2. **AI Designer** - Interior design visualization with AI (1/3/5 variants)
3. **PDF Generator** - Contracts, Quantity Surveys, Charters
4. **Ads System** - Up to 5 images, search by category/city
5. **Subscription Plans** - Base, Pro, Premium (companies), Designer
6. **Feedback System** - Star rating (1-5) + text feedback
7. **AI Chatbot** - Assistant for construction questions
8. **Company Profiles** - Ratings, reviews, portfolio
9. **Notifications** - Telegram + Email for subscriptions

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, Lucide React
- **Backend:** FastAPI, Python, MongoDB
- **AI:** OpenAI GPT-5.2 via Emergent LLM Key
- **i18n:** Custom LanguageContext (BG/EN)

## Architecture
```
/app/
├── backend/
│   ├── server.py      # Monolithic FastAPI server
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.js     # Main app with routes and inline components
    │   ├── components/ # Reusable components
    │   ├── i18n/       # Language context and translations
    │   └── data/       # Translation strings
    └── public/
        └── logo-temadom.png  # New Phase 3 logo
```

## What's Been Implemented

### Phase 1 - Foundation (Completed)
- User registration/login with JWT auth
- Price calculator with 28 regions
- Company profiles with ratings
- AI chatbot integration
- Basic project CRUD

### Phase 2 - Translation & v10.8 (Completed)
- Full BG/EN translation system
- Designer user type
- Homepage v10.8 design
- Subscription stubs
- Ads system stubs

### Phase 3 - Soft Launch (IN PROGRESS - March 4, 2026)
- ✅ Dark theme applied site-wide
- ✅ New logo (large in navbar + footer)
- ✅ PageInstructions component on all major pages
- ✅ Feedback button with star rating modal
- ✅ Registration form: 3 tabs + Company/Master dropdown + Bulstat
- ✅ Subscriptions page with 4 plans
- ✅ AI Designer page styling
- ✅ Ads page dark theme
- ✅ Chatbot dark theme
- ✅ All backend endpoints working

## P0 Remaining (Phase 3)
- Gallery of previous AI designs
- Video instruction popups (real video content)
- PDF Generator improvements (Contracts, Quantity Surveys)
- Notification system (Telegram/Email for subscriptions)

## P1 Backlog
- Mobile app (React Native/Expo or PWA)
- Real payment integration (EasyPay Bulgaria)
- Admin dashboard for feedback review
- Server.py refactoring into routers

## P2 Future
- Advanced analytics dashboard
- SEO optimization
- Performance optimization
