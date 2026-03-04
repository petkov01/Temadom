# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Marketplace app "TemaDom" for construction project leads. Connects clients with verified companies/masters.

## Current Phase: Phase 3 - Soft Launch (all features free for testing)

## Tech Stack
- Frontend: React.js, TailwindCSS, Shadcn/UI, Lucide React
- Backend: FastAPI, Python, MongoDB
- AI: OpenAI GPT-4o (analysis) + GPT Image 1 (generation) via Emergent LLM Key
- i18n: Custom LanguageContext (BG/EN)

## What's Been Implemented (March 4, 2026)

### Visual Identity
- Dark theme: #1E2A38, #2B2B2B, accents #FF8C42, #28A745, #DC3545, #4DA6FF, #8C56FF
- TemaDom logo 120px in navbar + logo in footer
- Gradient text, glass morphism effects

### AI Designer (COMPLETE)
- 3 photo upload from 3 different angles (Фронтален, Ляв/Десен, Обратен)
- Room type selection (9 types: баня, кухня, хол, спалня, etc.)
- Dimensions input (width, length, height)
- 5 styles (Modern, Scandinavian, Loft, Classic, Minimalist)
- 3 material classes (Economy, Standard, Premium)
- 1/3/5 variants generation
- GPT-4o room analysis → GPT Image 1 design generation
- Materials list with prices from 18 Bulgarian stores
- Before/After comparison
- 4 video instruction cards with expandable content
- Summary panel before generation
- Store links: Praktiker, Bauhaus, IKEA, Mr. Bricolage, Homemax, Bricoman, etc.

### Subscription Plans
- Base/Pro/Premium for companies (no AI Designer included)
- AI Designer as separate paid module (free in test mode)
- No prices shown during test period

### Feedback System
- Dedicated /feedback page with star rating form + reviews
- Floating feedback button (purple, bottom-left)
- POST/GET /api/feedback endpoints

### Other Features
- PageInstructions on all major pages (expandable, with video button)
- Registration: 3 tabs + Company/Master dropdown + dynamic Bulstat
- Price Calculator for 28 regions
- AI Chatbot (dark theme)
- Full BG/EN translation

## P0 Remaining
- Gallery of previous AI designs on homepage
- PDF Generator: blueprints with 95%+ accuracy (columns, beams, foundations, roofs)
- Telegram notifications for test period
- Product carousel from stores

## P1 Backlog
- Mobile app (React Native/Expo or PWA)
- Real payments (EasyPay Bulgaria)
- Admin dashboard
- server.py refactoring

## API Endpoints
- POST /api/ai-designer/generate - Generate AI design from 1-3 photos
- GET /api/ai-designer/gallery - Gallery of previous designs
- POST /api/feedback - Submit feedback (rating + text)
- GET /api/feedback - Get all feedback
- GET /api/subscriptions/plans - Subscription plans
- POST /api/subscriptions/activate - Activate plan
