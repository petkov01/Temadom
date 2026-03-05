# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Marketplace app "TemaDom" for construction project leads. Connects clients with verified companies/masters in Bulgaria. Features AI-powered design, price calculator, and project management.

## Current Phase: Phase 3 - Soft Launch (all features free for testing)

## Tech Stack
- Frontend: React.js, TailwindCSS, Shadcn/UI, Lucide React
- Backend: FastAPI, Python, MongoDB
- AI: OpenAI GPT-4o (analysis) + GPT Image 1 (generation) via Emergent LLM Key
- i18n: Custom LanguageContext (BG/EN)

## What's Been Implemented

### Visual Identity
- Dark theme: #1E2A38, #2B2B2B, accents #FF8C42, #28A745, #DC3545, #4DA6FF, #8C56FF
- TemaDom logo - h-[72px] desktop / h-[58px] mobile, left-corner aligned with pt-1, no cutoff
- Gradient text, glass morphism effects

### AI Designer (COMPLETE)
- 3 photo upload from 3 different angles
- Room type selection (9 types), dimensions, 5 styles, 3 material classes, 1/3/5 variants
- GPT-4o room analysis + GPT Image 1 design generation
- Materials list with prices in BGN + EUR from 18 Bulgarian stores
- Before/After comparison with 2 angles per variant
- Publish to Gallery button + social sharing after publish
- Dual PDF download (images PDF + materials PDF separately)

### AI Gallery (March 5, 2026)
- Public gallery of published AI design projects at /ai-gallery
- Card grid with thumbnails, style badges, views counter
- Click modal with full before/after comparison
- PDF download + Social sharing (Facebook, Viber, WhatsApp, Telegram, Copy Link)
- Auto-open from shared URL (?project=ID)
- Pagination support

### AI Sketch (March 5, 2026)
- Page at /ai-sketch for blueprint/sketch analysis
- Upload 1-3 sketches/blueprints/photos
- 5 building types: residential, commercial, industrial, renovation, other
- AI structural analysis: columns, beams, stairs, foundations, roof, walls
- Generated 2D plan + 3D visualization using GPT Image 1
- Quantity survey with 95-100% accuracy in BGN + EUR
- Meshy.ai 3D model integration marked as "Coming Soon"

### Social Sharing (March 5, 2026)
- Facebook, Viber, WhatsApp, Telegram, Copy Link buttons
- Available on: Gallery modal, Gallery cards, AI Designer after publish
- Direct share URLs with project deep linking

### Subscription Plans (Updated March 5, 2026)
- **Starter/Basic**: Project management, test 3D renders, demo materials/budgets
- **Pro**: + AI Builder (sketches/photos to 3D), multi-upload, video instructions, material tables
- **Premium**: + Structural drawings (PDF/Excel, 95-100%), columns/beams/roofs/foundations tables, personal manager
- AI Designer: Separate paid module (free in test mode)

### Other Features
- PageInstructions, Feedback system, Registration (multi-role)
- Price Calculator (28 regions), AI Chatbot, Full BG/EN translation
- Navbar "Още" dropdown: AI Дизайнер, AI Sketch, AI Галерия

## API Endpoints
- POST /api/ai-designer/generate - Generate AI design
- POST /api/ai-designer/publish - Publish project to gallery
- GET /api/ai-designer/published - List published projects
- GET /api/ai-designer/published/{id} - Project details
- GET /api/ai-designer/published/{id}/pdf/images - Images PDF
- GET /api/ai-designer/published/{id}/pdf/materials - Materials PDF
- POST /api/ai-sketch/analyze - Analyze sketches
- POST /api/feedback - Submit feedback
- GET /api/feedback - Get feedback
- GET /api/subscriptions/plans - Subscription plans (starter/pro/premium)

## P1 Backlog
- Meshy.ai integration for real 3D model generation (needs API key)
- AI Blueprint Analysis (Phase 4) - advanced PDF/DWG parsing
- server.py refactoring into routers/services/models

## P2 Backlog
- Mobile app (React Native/Expo or PWA)
- Real payments (EasyPay Bulgaria)
- Admin dashboard
- Product carousel from stores
