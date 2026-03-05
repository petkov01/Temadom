# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Marketplace app "TemaDom" for construction project leads. Connects clients with verified companies/masters.

## Current Phase: Phase 3 - Soft Launch (all features free for testing)

## Tech Stack
- Frontend: React.js, TailwindCSS, Shadcn/UI, Lucide React
- Backend: FastAPI, Python, MongoDB
- AI: OpenAI GPT-4o (analysis) + GPT Image 1 (generation) via Emergent LLM Key
- i18n: Custom LanguageContext (BG/EN)

## What's Been Implemented

### Visual Identity
- Dark theme: #1E2A38, #2B2B2B, accents #FF8C42, #28A745, #DC3545, #4DA6FF, #8C56FF
- TemaDom logo 120px in navbar + logo in footer
- Gradient text, glass morphism effects

### AI Designer (COMPLETE)
- 3 photo upload from 3 different angles
- Room type selection (9 types)
- Dimensions input (width, length, height)
- 5 styles + 3 material classes + 1/3/5 variants
- GPT-4o room analysis + GPT Image 1 design generation
- Materials list with prices from 18 Bulgarian stores (BGN + EUR)
- Before/After comparison, 2 angles per variant
- **Publish button** to share designs to public gallery

### Published Projects Gallery (NEW - March 5, 2026)
- **`/gallery` page** - Public gallery of published AI designs
- Filters by room type, style; sort by newest/popular/top rated
- **`/gallery/{id}` detail page** with:
  - Before/After/Compare tabs for image viewing
  - Like system (toggle, count)
  - Rating system (1-5 stars, average calculation)
  - Comments system (with user info, role badge)
  - Materials/quantity survey table
  - **Two PDF downloads**: Design images PDF + Quantity survey PDF
- Visible to ALL users (clients, masters, companies)
- Navbar + Footer + "More" dropdown links to Gallery

### Subscription Plans
- Base/Pro/Premium for companies (no AI Designer included)
- AI Designer as separate paid module (free in test mode)

### Feedback System
- Dedicated /feedback page with star rating form + reviews
- Floating feedback button

### Other Features
- PageInstructions on all major pages
- Registration: 3 tabs + Company/Master dropdown + dynamic Bulstat
- Price Calculator for 28 regions
- AI Chatbot (dark theme)
- Full BG/EN translation
- Messaging system
- Portfolio system
- Analytics dashboard

## P0 Remaining
- Video instruction player (replace placeholders)
- Gallery of AI designs on homepage
- Telegram notifications for test period

## P1 Backlog
- AI Blueprint Analysis (95%+ accuracy)
- Mobile app (React Native/Expo or PWA)
- Real payments (EasyPay Bulgaria)
- Admin dashboard
- server.py refactoring into modules

## API Endpoints
- POST /api/ai-designer/generate - Generate AI design
- GET /api/ai-designer/gallery - Gallery of previous designs
- POST /api/published-projects - Publish project to gallery (auth)
- GET /api/published-projects - List published projects (public)
- GET /api/published-projects/{id} - Project detail (public)
- POST /api/published-projects/{id}/like - Toggle like (auth)
- POST /api/published-projects/{id}/comment - Add comment (auth)
- POST /api/published-projects/{id}/rate - Rate 1-5 (auth)
- GET /api/published-projects/{id}/pdf/design - Download design PDF
- GET /api/published-projects/{id}/pdf/survey - Download survey PDF
- POST /api/feedback - Submit feedback
- GET /api/feedback - Get all feedback
- GET /api/subscriptions/plans - Subscription plans

## DB Collections
- `users`, `company_profiles`, `projects`, `reviews`, `feedback`
- `ai_designs` - AI design generation records
- `published_projects` - Published gallery projects with likes/comments/ratings
- `messages`, `ads`, `analytics_events`, `payment_transactions`
