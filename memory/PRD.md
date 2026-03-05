# TemaDom - PRD

## Current Phase: PRODUCTION LAUNCH

## Pricing (EUR) — Updated March 2026
- **БАЗОВ**: 15 EUR/мес — Профил + портфолио + 10 снимки, 5 оферти/мес, БЕЗ PDF/AI/Telegram
- **ПРО**: 35 EUR/мес — Telegram известия, PDF договори, AI скици, количествени сметки, неограничени оферти (90% избират!)
- **PREMIUM**: 75 EUR/мес — ВСИЧКО от ПРО + 10 мин. предимство, персонализирани PDF, неограничени AI скици, екип до 5, API
- AI Designer: 12 EUR/gen (пакети: 29 EUR/3, 45 EUR/5)
- PDF договор+сметка: 6 EUR, AI чертеж+договор: 17 EUR

### Notification Timing Model
- PREMIUM: 10:00 ч. → вижда обявата ПЪРВИ
- ПРО: 10:10 ч. → получава известие
- БАЗОВ: търси ръчно в сайта

## Implemented Features
- Homepage: Hero + Защо TemaDom + Топ функции + Sora 2 видео + Цени + Как работи + CTA
- Logo: TemaDom image + "TemaDom / СТРОИТЕЛСТВО И РЕМОНТ"
- AI Designer: JPEG auto-convert, 1-3 photos, 1/3/5 variants, publish+share+PDF
- AI Sketch: JPEG auto-convert, structural analysis 95-100%
- AI Gallery: Published projects, before/after, social sharing
- Video: Sora 2 generated tutorial video on homepage
- Video instructions: Interactive tutorial modals
- Subscriptions: 3 tiers (БАЗОВ/ПРО/PREMIUM) + standalone services + AI Designer module
- **3D Multi-Angle Scanner** (March 2026): Upload 3 photos → Three.js 360° sphere, hotspots, swap panel, PDF, save/share
- **AI Chart Analyzer** (March 2026): Real GPT-4o integration for blueprint analysis → quantity survey → PDF contract
- **Backend Refactoring** (March 2026): Extracted config.py + models/__init__.py from monolithic server.py

## Architecture
```
/app/backend/
├── config.py           # DB, JWT, auth helpers, subscription plans, stores
├── models/__init__.py  # All Pydantic models  
├── server.py           # FastAPI routes (~3380 lines, down from ~3730)
└── routes/             # (future: further route splitting)

/app/frontend/src/
├── components/
│   ├── Scanner3DPage.jsx    # 3D Scanner with save/share
│   ├── AIChartPage.jsx      # AI Chart Analyzer
│   ├── AIDesignerPage.jsx   # AI Designer
│   ├── AISketchPage.jsx     # AI Sketch
│   └── Navbar.jsx           # Navigation
├── pages/
│   ├── LandingPage.jsx      # Homepage
│   ├── SubscriptionsPage.jsx
│   └── PublishedGalleryPage.jsx
└── App.js                    # Routes + inline pages
```

## P1 Backlog
- Further server.py route splitting (routes/ directory)

## P2 Backlog
- Mobile app (React Native/Expo)
- Payments (Stripe integration)
- Admin dashboard
