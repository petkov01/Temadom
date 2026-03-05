# TemaDom - PRD

## Current Phase: PRODUCTION LAUNCH

## Pricing (EUR) — March 2026
- **БАЗОВ**: 15 EUR/мес — Профил + портфолио + 10 снимки, 5 оферти/мес, БЕЗ PDF/AI/Telegram
- **ПРО**: 35 EUR/мес — Telegram известия, PDF договори, AI скици, количествени сметки, неограничени оферти
- **PREMIUM**: 75 EUR/мес — ВСИЧКО от ПРО + 10 мин. предимство, персонализирани PDF, неограничени AI скици, екип до 5, API

### Notification Timing Model
- PREMIUM: 10:00 ч. → вижда обявата ПЪРВИ (instant)
- ПРО: 10:10 ч. → получава Telegram известие (10 мин. закъснение)
- БАЗОВ: търси ръчно в сайта (без Telegram)

## Implemented Features
- Homepage: Hero + Sora 2 видео + Цени + CTA
- AI Designer: JPEG auto-convert, 1/3/5 variants, publish+share+PDF
- AI Sketch: structural analysis 95-100%
- AI Chart Analyzer: Real GPT-4o integration → quantity survey → PDF contract
- 3D Multi-Angle Scanner: Upload 3 photos → Three.js 360° sphere, hotspots, swap panel, PDF, save/share
- AI Gallery: Published projects, before/after, social sharing
- Subscriptions: 3 tiers (БАЗОВ/ПРО/PREMIUM) + standalone services
- **Telegram Bot Integration** (March 2026):
  - @TemaDomBot with /start command
  - Priority-based notifications: PREMIUM=instant, PRO=10min delay, BASIC=none
  - Rich notifications: title, category, city, budget, description, photo, link
  - TelegramConnectCard in CompanyDashboard with tier timing visualization
  - /api/telegram/status, /api/telegram/link, /api/telegram/webhook endpoints
- Backend Refactoring: config.py + models/__init__.py extracted from server.py

## Architecture
```
/app/backend/
├── config.py           # DB, JWT, auth, subscription plans, stores
├── models/__init__.py  # All Pydantic models
├── server.py           # FastAPI routes (~3400 lines)
└── tests/              # pytest test files

/app/frontend/src/
├── components/
│   ├── Scanner3DPage.jsx    # 3D Scanner with save/share
│   ├── AIChartPage.jsx      # AI Chart Analyzer (real GPT-4o)
│   ├── AIDesignerPage.jsx   # AI Designer
│   └── AISketchPage.jsx     # AI Sketch
└── App.js                    # Routes, pages, TelegramConnectCard
```

## Backlog
- P1: Further server.py route splitting
- P2: Mobile app (React Native/Expo)
- P2: Stripe payment integration
- P3: Admin dashboard
