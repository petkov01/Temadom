# TEMADOM — MVP READY FOR LAUNCH

## Status: PRODUCTION READY

## Core Features — ALL WORKING
1. **3D Photo Designer v9.3** — GPT-4o-mini Vision + gpt-image-1 renders
   - Room dimensions (Дължина/Ширина/Височина)
   - Free text budget input (EUR) — client types own amount
   - Info: "Само за материали и обзавеждане (без труд/монтаж)"
   - Download PNG + Fullscreen per render
   - Multi-room packages: 69/129/199 EUR
   - Image compression to <2MB (frontend + backend PIL)
   - Retry with exponential backoff (3 retries)
   - 5 min timeout (300s)
   - /api/test-ai diagnostic endpoint

2. **AI Product Search** — Photo to 21 Bulgarian stores with EUR prices + share

3. **Community Feed v3** — Posts, images, project linking, firm offers, filters

4. **Leaderboard** — Dual ranking: Clients + Firms with scoring

5. **Notifications** — Bell icon, auto-triggered on offers/likes

6. **Stripe Payments** — 17 packages (multi-tier subscriptions)

7. **Referral System** — Auto rewards, WhatsApp/Viber share, milestones

8. **CAD System** — 2D plans with cost estimation

9. **Auth** — JWT, regional firm limits, AuthGate (mandatory login)

10. **Tracking** — Google Analytics + Facebook Pixel + PostHog

## Latest Changes (2026-03-07)
- Budget: Changed from preset buttons to free text input (min 100 EUR)
- Budget info text: "Само за материали и обзавеждане (без труд/монтаж)"
- Added /api/test-ai diagnostic endpoint for AI health checks
- GPT-4o Vision timeout fixes (gpt-4o-mini, retry, resize, 300s timeout)
- Fixed ProductSearchPage.jsx JSX syntax error

## Post-Launch Backlog (Priority)
- P1: Backend refactoring (server.py monolith to modular routers)
- P1: Mobile responsiveness polish
- P1: Real scraping for 21 stores (currently placeholder/MOCKED)
- P2: Company catalog & portfolios
- P2: Direct user-to-user messaging
- P2: Job ads module
- P2: Email notifications (SendGrid)
- P2: Push notifications
