# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)** — 2D plans with 3D preview and cost estimation
2. **3D Photo Designer v8.0 (`/room-scan`)** — BASIC: Photos → 3D renders → Share. Multi-room packages (1/2/5 rooms)
3. **Community Feed (`/community`)** — Social feed with posts, likes, comments, filters, image uploads, project linking
4. **AI Product Search (`/product-search`)** — Upload photo → AI identifies products → Search 21 Bulgarian stores

## Implemented Features

### Authentication & Users
- JWT auth, AuthGate, Profile page with avatar upload
- Regional firm limit: 2 free firms per region (28 x 2 = 56)
- Company registration with region dropdown

### CAD System v5.2 — `/ai-sketch`
- Color-coded handles, endpoint dragging, rotation, undo/redo
- PDF export, cost estimation, multi-floor
- **Fixed**: "Дълбочина" → "Височина" everywhere
- **Removed**: "Покрив/Roof" element type completely

### 3D Photo Designer v8.0 — `/room-scan` (BASIC)
- Multi-room packages: 69EUR (1 стая), 129EUR (2 стаи), 199EUR (до 5 стаи)
- 3 photos → OpenAI GPT Image 1 → 3 separate 3D renders
- Before/After slider, Share (Facebook, WhatsApp, Viber, Twitter, Email)

### Community Feed v2.0 — `/community` ✅ COMPLETED
- Post types: text, project, question, before_after
- **NEW**: Image upload (up to 4 images per post, base64)
- **NEW**: Link 3D designer projects to posts
- **NEW**: Image-only posts allowed (no text required)
- Like/unlike toggle, comments, post deletion
- Filter by type, pagination with "Load more"

### AI Product Search v1.0 — `/product-search` ✅ COMPLETED
- Upload photo → OpenAI Vision (GPT-4o via Emergent LLM key) analyzes image
- AI identifies 3-8 product search queries from the photo
- Parallel search across 21 Bulgarian stores
- Results grouped by query with EUR/BGN prices and direct store links
- Room type selector (Баня, Кухня, Спалня, etc.)
- Text query fallback when no image
- Technomarket prioritized for appliances

### Web Scraping API — 21 Bulgarian Stores
- Praktiker, Jysk, Mr.Bricolage, Bauhaus, HomeMax, Technomarket, Teknoimpex, IKEA, Temax, Maximarket, Toplivo, Marmag, Paros, Praktis, Angro, Rila Online, Baustoff Metall, Atek, Vako, Buildmark, Obijavki

### Firm Subscription Plans (Landing Page)
- 3 plans: БАЗОВ (15EUR), ПРО (35EUR), PREMIUM (75EUR)
- Period toggle: 1/3/6/12 months with discounts

### Global Theme v6.5
- Persistent dark/light mode toggle

## Key API Endpoints
- `POST /api/scrape/ai-search` — AI photo analysis + 21 store search ✅ NEW
- `POST /api/community/posts` — Create post with images & project link ✅ UPDATED
- `GET /api/community/posts` — List posts (public, paginated)
- `POST /api/community/posts/{id}/like` — Toggle like
- `POST /api/community/posts/{id}/comment` — Add comment
- `DELETE /api/community/posts/{id}` — Delete own post
- `GET /api/scrape/stores` — 21 Bulgarian stores list
- `GET /api/scrape/search?q=...` — Product search across stores

## Prioritized Backlog

### P0 — DONE ✅
- Community Feed: image upload, project sharing ✅
- AI Product Search: photo → 21 stores ✅

### P1 — Upcoming
- FB Pixel/Google Analytics tracking
- Referral rewards (automatic)
- Mobile fullscreen + download
- PDF export (site design)
- Profile Page functionality (My Projects, Payment, Settings)
- Leaderboard System (clients & firms)

### P2 — Future
- Backend refactoring (modular routers/)
- Community Feed: public projects + firm offers
