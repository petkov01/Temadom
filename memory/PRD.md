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
- TemaDom logo - bigger (90px desktop, 65px mobile) and left-aligned in navbar
- Gradient text, glass morphism effects

### AI Designer (COMPLETE)
- 3 photo upload from 3 different angles
- Room type selection (9 types)
- Dimensions input + 5 styles + 3 material classes + 1/3/5 variants
- GPT-4o room analysis + GPT Image 1 design generation
- Materials list with prices in BGN + EUR from 18 Bulgarian stores
- Before/After comparison with 2 angles per variant
- **NEW: Publish to Gallery button**
- **NEW: Dual PDF download (images + materials separately)**

### AI Gallery (NEW - March 5, 2026)
- Public gallery of published AI design projects at /ai-gallery
- Card grid with thumbnails, style badges, views counter
- Click to open modal with full before/after comparison
- PDF download buttons in modal (images PDF + materials PDF)
- Pagination support

### AI Sketch (NEW - March 5, 2026)
- New page at /ai-sketch for blueprint/sketch analysis
- Upload 1-3 sketches/blueprints/photos
- 5 building types: residential, commercial, industrial, renovation, other
- AI structural analysis: columns, beams, stairs, foundations, roof, walls
- Generated 2D plan + 3D visualization using GPT Image 1
- Quantity survey with 95-100% accuracy in BGN + EUR
- Meshy.ai 3D model integration marked as "Coming Soon"

### Subscription Plans
- Base/Pro/Premium for companies (no AI Designer included)
- AI Designer as separate paid module (free in test mode)

### Feedback System
- Dedicated /feedback page with star rating + reviews
- Floating feedback button

### Other Features
- PageInstructions on all major pages
- Registration: 3 tabs + Company/Master dropdown + dynamic Bulstat
- Price Calculator for 28 regions
- AI Chatbot (dark theme)
- Full BG/EN translation
- Navbar "Още" dropdown with AI Дизайнер, AI Sketch, AI Галерия links

## API Endpoints
- POST /api/ai-designer/generate - Generate AI design from 1-3 photos
- POST /api/ai-designer/publish - Publish project to gallery
- GET /api/ai-designer/published - List published projects (paginated)
- GET /api/ai-designer/published/{id} - Get project details
- GET /api/ai-designer/published/{id}/pdf/images - Download images PDF
- GET /api/ai-designer/published/{id}/pdf/materials - Download materials PDF
- POST /api/ai-sketch/analyze - Analyze sketches for structural elements
- POST /api/feedback - Submit feedback
- GET /api/feedback - Get all feedback
- GET /api/subscriptions/plans - Subscription plans

## P0 Remaining
- None currently - all major features implemented

## P1 Backlog
- AI Blueprint Analysis (Phase 4) - advanced PDF/DWG parsing
- Meshy.ai integration for real 3D model generation
- server.py refactoring into routers/services/models

## P2 Backlog
- Mobile app (React Native/Expo or PWA)
- Real payments (EasyPay Bulgaria)
- Admin dashboard
- Product carousel from stores
