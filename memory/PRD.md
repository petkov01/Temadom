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
- TemaDom logo 120px height in navbar, logo in footer
- Gradient text effects, glass morphism, noise overlays

### Key Features
1. **Price Calculator** - Construction cost calculator for 28 regions
2. **AI Designer** - Interior design from uploaded photo with GPT Image 1, materials list, store links
3. **PDF Generator** - Contracts, Quantity Surveys, Charters
4. **Ads System** - Up to 5 images, search by category/city
5. **Subscription Plans** - Base/Pro/Premium (companies), AI Designer (separate module)
6. **Feedback System** - Dedicated /feedback page + floating button, 1-5 stars + text
7. **AI Chatbot** - Assistant for construction questions
8. **Company Profiles** - Ratings, reviews, portfolio
9. **18 Bulgarian Stores** - Praktiker, Bauhaus, IKEA, Mr. Bricolage, Homemax, Bricoman, Technopolis, Technomarket, Emag, Jysk, Jumbo, Videnov, Masko, Forma Ideale, Mebeli 1, Selion, Ceramica, Leroy Merlin

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, Lucide React
- **Backend:** FastAPI, Python, MongoDB
- **AI:** OpenAI GPT-5.2 (text analysis) + GPT Image 1 (design generation) via Emergent LLM Key
- **i18n:** Custom LanguageContext (BG/EN)

## Architecture
```
/app/
├── backend/
│   ├── server.py      # FastAPI server with all endpoints
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.js     # Main app with routes
    │   ├── components/
    │   │   ├── AIDesignerPage.jsx    # Complete AI Designer
    │   │   ├── FeedbackPage.jsx      # Feedback page with ratings
    │   │   ├── FeedbackButton.jsx    # Floating feedback button
    │   │   ├── PageInstructions.jsx  # Expandable instructions
    │   │   ├── Chatbot.jsx           # Dark theme chatbot
    │   │   └── ...
    │   ├── i18n/       # Language context
    │   └── data/       # Translation strings
    └── public/
        └── logo-temadom.png
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

### Phase 3 - Soft Launch (IN PROGRESS - March 4, 2026)
#### COMPLETED:
- ✅ Dark theme applied site-wide (#1E2A38)
- ✅ Logo 2x bigger (120px) in navbar + footer
- ✅ Complete AI Designer with GPT Image 1 generation from uploaded photos
- ✅ Room analysis (GPT-4o) + design generation + materials list with prices
- ✅ 18 Bulgarian stores with links
- ✅ PageInstructions component on all major pages
- ✅ Feedback page (/feedback) with star rating form + reviews list
- ✅ Floating feedback button (purple, bottom-left)
- ✅ Updated subscription plans: Base/Pro/Premium (companies) + AI Designer (separate)
- ✅ Registration: 3 tabs + Company/Master dropdown + dynamic Bulstat
- ✅ Chatbot with dark theme
- ✅ Video instruction buttons (placeholder)
- ✅ All backend endpoints working and tested

## P0 Remaining (Phase 3)
- Gallery of previous AI designs on homepage
- Video instructions with real content
- PDF Generator improvements (full blueprints, 95%+ accuracy)
- Telegram notifications for test period
- Product carousel from stores (IKEA, Praktiker, Bauhaus)

## P1 Backlog
- Mobile app (React Native/Expo or PWA)
- Real payment integration (EasyPay Bulgaria)
- Admin dashboard for feedback review
- Server.py refactoring into routers

## P2 Future
- Advanced analytics dashboard
- SEO optimization
- Performance optimization

## API Endpoints
- POST /api/ai-designer/generate - Generate AI design from photo
- GET /api/ai-designer/gallery - Gallery of previous designs
- POST /api/feedback - Submit feedback
- GET /api/feedback - Get all feedback with avg rating
- GET /api/subscriptions/plans - Get subscription plans
- POST /api/subscriptions/activate - Activate plan
