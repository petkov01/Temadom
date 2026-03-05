# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Marketplace "TemaDom" for construction project leads. Connects clients with companies/masters in Bulgaria. AI-powered design, price calculator, project management.

## Current Phase: Production Launch Preparation

## Tech Stack
- Frontend: React.js, TailwindCSS, Shadcn/UI, Lucide React
- Backend: FastAPI, Python, MongoDB
- AI: OpenAI GPT-4o (analysis) + GPT Image 1 (generation) via Emergent LLM Key

## What's Been Implemented

### Visual Identity
- Dark theme: #1E2A38 with accent colors
- Logo: h-[72px] desktop / h-[58px] mobile, left-corner, fully visible

### AI Designer
- 3 photo upload, 9 room types, 5 styles, 3 material classes
- 1 variant: 2 angles (frontal + side); 3/5 variants: 1 angle each (optimized)
- Materials list in BGN + EUR from 18 Bulgarian stores
- Publish to Gallery + Social sharing + Dual PDF

### AI Gallery (/ai-gallery)
- Public gallery of published projects with before/after
- Social sharing: Facebook, Viber, WhatsApp, Telegram, Copy Link
- Deep linking from shared URLs

### AI Sketch (/ai-sketch)
- Upload 1-3 sketches/blueprints, 5 building types
- AI structural analysis (95-100%): columns, beams, stairs, foundations, roof
- 2D plan + 3D visualization + quantity survey

### Subscription Plans (Production Pricing)
- Starter/Basic: 49 лв/мес (25 EUR) — до 2 проекта, без AI
- Pro: 99 лв/мес (50 EUR) — неограничени проекти, AI Builder 1 вариант
- Premium: 199 лв/мес (102 EUR) — пълен достъп, 5 варианта, чертежи
- AI Дизайнер: 29 лв/генерация (15 EUR), пакети: 3 варианта=69лв, 5=99лв

### Admin
- POST /api/admin/clean-test-data — изтриване на тестови данни (key: temadom-clean-2026)
- Test data cleaned: 21 users, 7 AI designs, 1 published project removed

### Other Features
- Feedback system, PageInstructions, Registration (multi-role)
- Price Calculator (28 regions), AI Chatbot
- Social sharing (Facebook, Viber, WhatsApp, Telegram)

## P1 Backlog
- Meshy.ai for real 3D models (needs API key)
- AI Blueprint Analysis (PDF/DWG)
- server.py refactoring

## P2 Backlog
- Mobile app (PWA/React Native)
- Real payments (Stripe/EasyPay)
- Admin dashboard
