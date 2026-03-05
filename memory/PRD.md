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
- → PREMIUM взима 80% от договорите!

## Implemented
- Homepage: Hero + Защо TemaDom + Топ функции (4) + Sora 2 видео + Цени + Как работи + CTA
- Logo: TemaDom image + "TemaDom / СТРОИТЕЛСТВО И РЕМОНТ" text subtitle
- AI Designer: JPEG auto-convert, 1-3 photos, 1/3/5 variants, publish+share+PDF
- AI Sketch: JPEG auto-convert, structural analysis 95-100%, improved prompts
- AI Gallery: Published projects, before/after, social sharing
- Video: Sora 2 generated tutorial video on homepage (8sec, 3.6MB)
- Video instructions: Interactive tutorial modals with 4 steps on AI Designer + AI Sketch
- Subscriptions: 3 tiers (БАЗОВ/ПРО/PREMIUM) + standalone services + AI Designer module
- "Дизайнери" section REMOVED from nav
- **3D Multi-Angle Scanner** (March 2026): Upload 3 photos → Three.js 360° sphere, hotspots, swap panel, PDF
- **New subscription model** (March 2026): БАЗОВ 15€ / ПРО 35€ / PREMIUM 75€ with notification timing advantage

## P1 Backlog
- AI Blueprint Analysis (PDF/DWG) - real AI integration for /ai-chart (currently mocked)
- server.py refactoring into routers/services/models

## P2 Backlog
- Mobile app, Payments (Stripe), Admin dashboard
