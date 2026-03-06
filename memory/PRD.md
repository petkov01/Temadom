# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)** — 2D plans with 3D preview and cost estimation
2. **3D Photo Designer v9.0 (`/room-scan`)** — Vision-powered: Photos → AI analysis → Room-specific 3D renders + Budget + Download/Fullscreen
3. **Community Feed (`/community`)** — Social feed with posts, images, project linking, likes, comments
4. **AI Product Search (`/product-search`)** — Upload photo → AI identifies products → Search 21 stores + Share results
5. **Referral System** — Automatic rewards, share via WhatsApp/Viber, milestones

## Implemented Features

### Authentication & Users
- JWT auth, AuthGate, Profile page with avatar upload
- Regional firm limit: 2 free firms per region (28 x 2 = 56)
- Company registration with region dropdown

### CAD System v5.2 — `/ai-sketch`
- Color-coded handles, endpoint dragging, rotation, undo/redo
- PDF export, cost estimation, multi-floor

### 3D Photo Designer v9.0 — `/room-scan` ✅
- GPT-4o Vision analyzes each uploaded photo BEFORE generation
- Room-specific prompts (bathroom→bathroom, kitchen→kitchen)
- Multi-room packages: 69EUR/129EUR/199EUR
- **Download** button per render (PNG)
- **Fullscreen** view per render (opens in new tab)
- Before/After slider, Share (Facebook, WhatsApp, Viber, Twitter, Email)

### Community Feed v2.0 — `/community` ✅
- Image upload (up to 4), project linking, image-only posts
- Like/unlike, comments, deletion, filters, pagination

### AI Product Search v1.0 — `/product-search` ✅
- OpenAI Vision (GPT-4o) → 21 store search
- **Share results**: WhatsApp, Viber, Facebook, Copy buttons

### Referral System v1.0 ✅
- **Backend**: GET /api/referrals/status, POST /api/referrals/apply
- Unique referral code (first 8 chars of user ID)
- Share via WhatsApp/Viber with pre-filled messages
- Rewards milestones: 1→€3, 3→€10, 5→free 3D, 10→PRO month
- Apply referral code with validation (no self-referral, no duplicates)

### FB Pixel + Google Analytics ✅
- Google Analytics 4 (G-526267282)
- Facebook Pixel (PLACEHOLDER_FB_PIXEL_ID — user needs to replace)
- PostHog analytics

### Profile Page v2.0 — `/profile` ✅
- 4 tabs: Профил, Проекти, Реферали, Настройки
- Avatar upload, personal info editing
- My Projects list with view/share/delete
- Referral code + share + rewards milestones
- Account type, subscription status, statistics

### Web Scraping API — 21 Bulgarian Stores
### Firm Subscription Plans (Landing Page)
### Global Theme v6.5 — Persistent dark/light mode

## Key API Endpoints
- `POST /api/ai-designer/photo-generate` — Vision + 3D render + budget
- `POST /api/scrape/ai-search` — AI photo → 21 store search
- `GET /api/referrals/status` — Referral code, count, rewards
- `POST /api/referrals/apply` — Apply referral code
- `POST /api/community/posts` — Create post with images
- `GET /api/community/posts` — List posts

## Prioritized Backlog

### P1 — DONE ✅
- Share results (WhatsApp/Viber/Facebook) ✅
- FB Pixel tracking ✅
- Referral rewards (automatic) ✅
- Mobile fullscreen + download ✅
- Profile Page enhanced (4 tabs) ✅

### P2 — Upcoming
- PDF export for 3D designs (enhanced with site branding)
- Leaderboard System (clients & firms)
- Community Feed: public projects + firm offers
- Backend refactoring (modular routers/)
