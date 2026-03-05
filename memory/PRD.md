# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Marketplace "TemaDom" for construction project leads in Bulgaria. AI-powered design, quantity surveys, PDF contracts.

## Current Phase: PRODUCTION LAUNCH

## Tech Stack
- Frontend: React.js, TailwindCSS, Shadcn/UI, Lucide React
- Backend: FastAPI, Python, MongoDB
- AI: OpenAI GPT-4o + GPT Image 1 via Emergent LLM Key

## Implemented Features

### Homepage (Redesigned March 5, 2026)
- Hero: "Вашият строителен проект без непредвидени разходи"
- "Защо TemaDom?" — 3 cards (клиенти, фирми, майстори)
- "Топ функции" — AI Designer, AI Sketch, Calculator+PDF, Gallery
- Pricing overview: 17/35/69 EUR + standalone 5/15 EUR
- "Как работи?" — 4 steps
- CTA section

### AI Designer
- Upload 1-3 photos, 9 rooms, 5 styles, 3 material classes
- 1 variant: 2 angles; 3/5 variants: 1 angle each (optimized)
- Materials in EUR + Publish to Gallery + Social sharing + Dual PDF

### AI Sketch (/ai-sketch)
- Upload 1-3 sketches, 5 building types
- AI structural analysis (95-100%): columns, beams, stairs, foundations, roof
- 2D plan + 3D visualization + quantity survey in EUR

### AI Gallery (/ai-gallery)
- Published projects with before/after + Social sharing
- PDF download (images + materials separately)

### Pricing (EUR, Production)
- Starter: 17 EUR/мес — до 2 проекта, без AI
- Pro: 35 EUR/мес — неограничени проекти, AI Designer 1 вариант
- Premium: 69 EUR/мес — пълен достъп, 5 варианта, чертежи, PDF договори
- AI Designer: 10 EUR/gen (bundles: 25 EUR/3, 39 EUR/5)
- Standalone: PDF contract 5 EUR, AI blueprint+contract 15 EUR

### Other
- Feedback system, Price Calculator (28 regions)
- Registration (multi-role), Social sharing
- "Дизайнери" section REMOVED from nav

## P1 Backlog
- Meshy.ai for 3D models (needs API key)
- AI Blueprint Analysis (PDF/DWG)
- server.py refactoring

## P2 Backlog
- Mobile app (PWA/React Native)
- Real payment processing (Stripe)
- Admin dashboard
