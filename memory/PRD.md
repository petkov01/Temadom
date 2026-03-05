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

### AI Designer (COMPLETE)
- 3 photo upload from 3 different angles
- Room type selection (9 types), 5 styles + 3 material classes
- GPT-4o analysis + GPT Image 1 generation, 2 angles per variant
- Materials list with prices in BGN + EUR from 18 Bulgarian stores
- **Publish button** to share designs to public gallery

### Published Projects Gallery (March 5, 2026 - REDESIGNED)
- **Gallery cards redesigned** to match user HTML template:
  - Header: TemaDom logo + company/user name
  - Image section with "Преди / Ъгъл / След" label + image count badges
  - Project info grid: Стил, Площ (м²), Бюджет (лв.), Рейтинг (stars)
  - Materials preview table with Материал, Кол-во, Цена, Линк (магазин)
  - CTA buttons: "Генерирай подобен" (green) + "Свали PDF" (orange)
  - Stats footer: Харесвания, Коментара, Rating/5
- **Detail page** `/gallery/{id}` redesigned with same template:
  - Image tabs: ПРЕДИ / СЛЕД / СРАВНЕНИЕ
  - Full materials table with store links + total row (BGN + EUR)
  - "Генерирай подобен проект" → links to AI Designer with prefilled params
  - Dual PDF: "Свали PDF" (survey) + "Дизайн PDF" (images)
  - Like toggle, Rating stars (1-5), Comments system
- Filters: room type, style; sort by newest/popular/top rated
- Visible to ALL users (clients, masters, companies)

### Other Features
- Subscription Plans (Base/Pro/Premium)
- Feedback System (/feedback page)
- PageInstructions on all major pages
- Registration: Company/Master dropdown + dynamic Bulstat
- Price Calculator, AI Chatbot, Messaging, Portfolio, Analytics

## API Endpoints (Published Projects)
- POST /api/published-projects - Publish project (auth)
- GET /api/published-projects - List with filters/pagination (public)
- GET /api/published-projects/{id} - Full detail (public)
- POST /api/published-projects/{id}/like - Toggle like (auth)
- POST /api/published-projects/{id}/comment - Add comment (auth)
- POST /api/published-projects/{id}/rate - Rate 1-5 (auth)
- GET /api/published-projects/{id}/pdf/design - Design images PDF
- GET /api/published-projects/{id}/pdf/survey - Quantity survey PDF

## P0 Remaining
- Video instruction player (replace placeholders)
- Gallery of AI designs on homepage

## P1 Backlog
- AI Blueprint Analysis (95%+ accuracy)
- Mobile app
- Real payments (EasyPay Bulgaria)
- Admin dashboard
- server.py refactoring into modules
