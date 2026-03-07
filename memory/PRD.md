# TEMADOM — MVP READY FOR LAUNCH

## Status: PRODUCTION READY

## Core Features — ALL WORKING
1. **3D Photo Designer v9.3** — GPT-4o-mini Vision + gpt-image-1 renders
   - Free text budget (EUR), retry with backoff, image resize <2MB
   - 3 budget tiers with REAL affiliate search URLs to 9 stores
   - /api/test-ai diagnostic endpoint

2. **Landing Page Showcase** — 5 REAL AI-generated projects
   - Bathroom (2,000 EUR), Living Room (3,500 EUR), Bedroom (2,790 EUR), Kitchen (4,497 EUR), Kids Room (2,295 EUR)
   - Before/After photos (real AI renders from the 3D Designer)
   - 3 top materials per room with affiliate links
   - CTA buttons: СНИМАЙ БАНЯ/ХОЛ/СПАЛНЯ/КУХНЯ/ДЕТСКА
   - Quick room selection buttons
   - Images in /app/frontend/public/showcase/

3. **Affiliate Monetization** — Auto-applied everywhere
   - 9 stores: Praktiker, Jysk, Mr.Bricolage, HomeMax, Bauhaus, eMAG, IKEA, Teknoimpex, Technomarket
   - Budget materials, Product Search, Community posts (auto-detect)
   - Configurable ref IDs in AFFILIATE_CONFIG

4. **Subscription Plan Enforcement**
   - БАЗОВ: 5 offers/month, no PDF/AI sketches
   - ПРО/PREMIUM: Unlimited offers, all features
   - /api/subscriptions/my-limits, /api/subscriptions/check-feature

5. **Live Counter** — Desktop sidebar + Mobile bottom bar
   - Online count, clients, firms, masters, FREE slots

6. **AI Product Search** — Photo → 21 stores, affiliate links
7. **Community Feed v3** — Auto affiliate pills on product mentions
8. **Leaderboard, Notifications, Referrals, Stripe, CAD, Auth, Tracking**

## Post-Launch Backlog
- P1: Backend refactoring (server.py monolith → modular routers)
- P1: Mobile responsiveness polish (all pages)
- P1: Real scraping service (currently placeholder/MOCKED)
- P2: Company catalog & portfolios
- P2: Direct messaging
- P2: Job ads module
