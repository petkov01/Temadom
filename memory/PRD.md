# TEMADOM — MVP READY FOR LAUNCH

## Status: PRODUCTION READY

## Core Features — ALL WORKING
1. **3D Photo Designer v9.3** — GPT-4o-mini Vision + gpt-image-1 renders
   - Room dimensions, free text budget input (EUR)
   - 3 budget tiers (Иконом/Среден/Премиум) with real store search URLs
   - **AFFILIATE tracking** on all material links (utm_source=temadom)
   - Image compression <2MB, retry with backoff, 300s timeout
   - /api/test-ai diagnostic endpoint

2. **AI Product Search** — Photo → 21 Bulgarian stores
   - All product URLs include **affiliate tracking**

3. **Community Feed v3** — Posts, images, project linking, firm offers
   - **Auto-detect** product keywords (плочки, мивка, etc.) and store names
   - Generates **affiliate link pills** automatically under posts
   - Non-intrusive pill design with ExternalLink icon

4. **Affiliate Monetization System**
   - Centralized AFFILIATE_CONFIG with ref_id per store
   - make_affiliate_url() adds tracking to ALL store URLs
   - Stores: Praktiker, Jysk, Mr.Bricolage, HomeMax, Bauhaus, eMAG, IKEA, Teknoimpex, Technomarket
   - Auto-applied in: Budget materials, Product Search, Community posts
   - Format: `?utm_source=temadom&utm_medium=affiliate&utm_campaign=temadom`

5. **Leaderboard** — Dual ranking: Clients + Firms
6. **Notifications** — Bell icon, auto-triggered
7. **Stripe Payments** — 17 packages
8. **Referral System** — Auto rewards, milestones
9. **CAD System** — 2D plans with cost estimation
10. **Auth** — JWT, AuthGate (mandatory login)
11. **Tracking** — GA + FB Pixel + PostHog

## Latest Changes (2026-03-07)
- Added AFFILIATE_CONFIG with make_affiliate_url() for monetization
- Community posts auto-detect product/store mentions → affiliate pills
- All budget material URLs, product search URLs include affiliate tracking
- Budget changed to free text input + "materials only" info
- GPT-4o-mini for faster Vision, retry with backoff, image resize

## Post-Launch Backlog
- P1: Backend refactoring (server.py monolith → modular routers)
- P1: Mobile responsiveness polish
- P1: Real scraping (currently placeholder/MOCKED)
- P2: Company catalog & portfolios
- P2: Direct messaging
- P2: Job ads module

## Affiliate Config (editable in server.py)
- Default ref_id: "temadom"
- To update: Edit AFFILIATE_CONFIG in server.py (~line 82)
- Each store has configurable param name and ref value
