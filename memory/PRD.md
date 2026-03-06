# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)** — 2D plans with 3D preview and cost estimation
2. **3D Photo Designer v9.0 (`/room-scan`)** — Vision-powered: Photos → AI analysis → Room-specific 3D renders + Budget + Download/Fullscreen
3. **Community Feed v3.0 (`/community`)** — Social feed with posts, images, project linking, offers from firms, likes, comments
4. **AI Product Search (`/product-search`)** — Upload photo → AI identifies products → Search 21 stores + Share results
5. **Leaderboard (`/leaderboard`)** — Dual ranking system for clients and firms
6. **Referral System** — Automatic rewards, share via WhatsApp/Viber, milestones

## Implemented Features

### Authentication & Users
- JWT auth, AuthGate, Profile page (4 tabs: Профил, Проекти, Реферали, Настройки)
- Regional firm limit: 2 free firms per region (28 x 2 = 56)
- Avatar upload, personal info editing

### CAD System v5.2 — `/ai-sketch`
- Color-coded handles, endpoint dragging, rotation, undo/redo, PDF export, cost estimation

### 3D Photo Designer v9.0 — `/room-scan`
- GPT-4o Vision analyzes each photo → room-specific prompts
- Multi-room packages: 69EUR/129EUR/199EUR
- Download + Fullscreen buttons per render
- Before/After slider, Share (FB, WhatsApp, Viber, Twitter, Email)

### Community Feed v3.0 — `/community` ✅ NEW
- Post types: text, project, question, before_after, offer
- Image upload (up to 4), project linking
- **Firm Offers**: Companies can bid on project posts (price EUR, timeline days, message)
- Public projects gallery endpoint
- Like/unlike, comments, deletion, filters, pagination

### AI Product Search v1.0 — `/product-search`
- OpenAI Vision → 21 store search
- Share results: WhatsApp, Viber, Facebook, Copy

### Leaderboard v1.0 — `/leaderboard` ✅ NEW
- **Clients tab**: Ranked by score = projects*10 + likes*3 + posts*2
- **Companies tab**: Ranked by score = rating*20 + reviews*5 + offers*3 + projects*10
- Period filter: All time / This month
- Top 3 highlighted with Crown/Medal/Award icons
- Scoring explanation card

### Referral System v1.0
- Unique code, WhatsApp/Viber share
- Milestones: 1→€3, 3→€10, 5→free 3D, 10→PRO month

### Tracking
- Google Analytics 4, Facebook Pixel, PostHog

### PDF Export
- 3D designs with TemaDom logo, renders, budget, region-based labor costs
- Published project PDFs (images + materials)

## Key API Endpoints
- `GET /api/leaderboard/clients` ✅ NEW
- `GET /api/leaderboard/companies` ✅ NEW
- `POST /api/community/offers` ✅ NEW (company only)
- `GET /api/community/offers/{post_id}` ✅ NEW
- `GET /api/community/public-projects` ✅ NEW
- `POST /api/ai-designer/photo-generate`
- `POST /api/scrape/ai-search`
- `GET/POST /api/referrals/status|apply`
- `GET/POST/DELETE /api/community/posts`

## Prioritized Backlog

### DONE ✅
- All P0 + P1 features complete
- Leaderboard system ✅
- Community v3 with firm offers ✅
- Public projects gallery ✅

### P2 — Future
- Backend refactoring (modular routers/ — server.py is ~5300 lines)
- Real scraping implementation for 21 stores
- Enhanced mobile responsiveness
- Payment integration (Stripe) for subscriptions
