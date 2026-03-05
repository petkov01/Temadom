# TemaDom - PRD

## Current Phase: PRODUCTION LAUNCH

## Pricing (EUR, +15%)
- Starter: 20 EUR/мес — до 2 проекта, без AI
- Pro: 40 EUR/мес — неограничени проекти, БЕЗ AI Designer
- Premium: 79 EUR/мес — пълен достъп, AI Designer 5 варианта, AI Sketch, PDF договори
- AI Designer: 12 EUR/gen (пакети: 29 EUR/3, 45 EUR/5)
- PDF договор+сметка: 6 EUR, AI чертеж+договор: 17 EUR

## Implemented
- Homepage: Hero + Защо TemaDom + Топ функции (4) + Sora 2 видео + Цени + Как работи + CTA
- Logo: TemaDom image + "TemaDom / СТРОИТЕЛСТВО И РЕМОНТ" text subtitle
- AI Designer: JPEG auto-convert, 1-3 photos, 1/3/5 variants, publish+share+PDF
- AI Sketch: JPEG auto-convert, structural analysis 95-100%, improved prompts
- AI Gallery: Published projects, before/after, social sharing
- Video: Sora 2 generated tutorial video on homepage (8sec, 3.6MB)
- Video instructions: Interactive tutorial modals with 4 steps on AI Designer + AI Sketch
- Subscriptions: 3 tiers + standalone services + AI Designer module
- "Дизайнери" section REMOVED from nav
- **3D Multi-Angle Scanner** (NEW - March 2026):
  - Upload 3 photos (left, front, right) → Three.js 360° sphere panorama
  - Drag-to-rotate (mouse/touch), zoom with scroll
  - 5 interactive hotspots: Душ кабина, Тоалетна, Плочки, Мивка, Мебели
  - Swap panel with options and prices for each element
  - Results summary with total price calculation
  - PDF export (backend /api/scanner3d/pdf), Share, Companies buttons
  - Navigation: desktop More dropdown, mobile menu, homepage hero button
  - Route: /3d-scanner

## P1 Backlog
- AI Blueprint Analysis (PDF/DWG) - real AI integration for /ai-chart (currently mocked)
- server.py refactoring into routers/services/models

## P2 Backlog
- Mobile app, Payments (Stripe), Admin dashboard

## Architecture
- Frontend: React, TailwindCSS, Three.js (@react-three/fiber, @react-three/drei)
- Backend: FastAPI (monolithic server.py), MongoDB
- 3D: Three.js sphere with equirectangular mapped panorama textures
- PDF: fpdf2 (backend), jspdf (frontend)
