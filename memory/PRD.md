# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)** — 2D plans with 3D preview and cost estimation
2. **3D Photo Designer v8.0 (`/room-scan`)** — Photo-based AI room redesign with 3 separate 3D renders, budget-based materials, direct product links, PDF export, enhanced sharing
3. **Community Feed (`/community`)** — Social feed with posts, likes, comments, filters

## Implemented Features

### Authentication & Users
- JWT auth, AuthGate, Profile page with avatar upload
- Regional firm limit: 2 free firms per region (28 x 2 = 56)
- Company registration with region dropdown

### CAD System v5.2 — `/ai-sketch`
- Color-coded handles, endpoint dragging, rotation, undo/redo
- PDF export, cost estimation, multi-floor

### 3D Photo Designer v8.0 — `/room-scan`
- **NO 360° — REMOVED COMPLETELY**
- Budget-driven workflow: EUR presets (1000, 2000, 3000, 5000, 10000)
- 3 tiers: Economy (60%), Medium (100%), Premium (150%)
- 3 photos -> 3 separate 3D renders (OpenAI GPT Image 1)
- Direct product links to Bulgarian stores
- **PDF download** with TemaDom logo (centered, large), renders, budget table, region-based labor
- **Enhanced sharing** — Facebook, WhatsApp, Viber, Twitter, Email, Copy link
- **Fullscreen viewer** with swipe, download per image
- My Projects: save/load/delete

### Community Feed v1.0 — `/community`
- Post types: text, project, question, before_after
- Like/unlike toggle
- Comments on posts
- Post deletion (own posts)
- Filter by type: Всички, Обсъждане, Проекти, Въпроси, Преди/След
- Pagination with "Load more"
- Nav link in "Още" dropdown

### Web Scraping API
- `/api/scrape/stores` — 5 Bulgarian stores (Praktiker, Jysk, Mr.Bricolage, Bauhaus, HomeMax)
- `/api/scrape/search?q=...` — Search products across stores
- Real HTML scraping with BeautifulSoup, price parsing, BGN→EUR conversion

### Firm Subscription Plans (Landing Page)
- 3 plans: БАЗОВ (15EUR), ПРО (35EUR), PREMIUM (75EUR)
- Period toggle: 1/3/6/12 months
- Discounts: 3mo (-10%), 6mo (-15%), 12mo (-20%)
- Notification priority explanation
- Feature comparison with checkmarks/X

### Profile Page (v6.6)
- Avatar upload/display, personal info editing
- My Projects, Settings tabs

### Landing Page
- TemaDom logo, regional breakdown (28 regions), testimonials carousel
- Firm subscription plans section with period toggle
- Reviews API, NO 360° references

### Global Theme v6.5
- Persistent dark/light mode toggle

## Key API Endpoints
- `POST /api/ai-designer/photo-generate` — 3 photos + budget -> 3 renders + budget
- `POST /api/ai-designer/photo-pdf` — PDF with logo + region labor
- `GET /api/scrape/stores` — Bulgarian stores list
- `GET /api/scrape/search?q=...` — Product search across stores
- `POST /api/community/posts` — Create post (auth)
- `GET /api/community/posts` — List posts (public, paginated)
- `POST /api/community/posts/{id}/like` — Toggle like (auth)
- `POST /api/community/posts/{id}/comment` — Add comment (auth)
- `DELETE /api/community/posts/{id}` — Delete own post (auth)

## Prioritized Backlog

### P1 — Upcoming
- Integrate web scraping into 3D Designer budget (replace AI-generated links with real scraped products)
- Community Feed: image upload, project sharing from designer

### P2 — Future
- Leaderboard System (clients & firms)
- Backend refactoring (modular routers/)
