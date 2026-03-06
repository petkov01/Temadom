# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)** — 2D plans with 3D preview and cost estimation
2. **3D Photo Designer v9.0 (`/room-scan`)** — Vision-powered: Photos → AI analysis → Room-specific 3D renders + Budget
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

### 3D Photo Designer v9.0 — `/room-scan` ✅ EMERGENCY FIX APPLIED
- **NEW**: GPT-4o Vision analyzes each uploaded photo BEFORE generation
- **NEW**: Vision identifies room type, visible elements, colors, layout, camera angle
- **NEW**: Room-specific prompt ensures bathroom→bathroom, kitchen→kitchen (no more mismatches)
- Multi-room packages: 69EUR (1 стая), 129EUR (2 стаи), 199EUR (до 5 стаи)
- Room types: Баня, Кухня, Хол, Спалня, Коридор, Балкон, Стълбище, Фасада
- Styles: Модерен, Минималист, Класически, Бохо, Хай-тек, Индустриален, Скандинавски, Лофт, Неокласически, Арт Деко
- 3 photos → GPT-4o Vision analysis → gpt-image-1 3D renders → Budget with 21 store links
- Before/After slider, Share (Facebook, WhatsApp, Viber, Twitter, Email)

### Community Feed v2.0 — `/community` ✅
- Post types: text, project, question, before_after
- Image upload (up to 4 images per post, base64)
- Link 3D designer projects to posts
- Image-only posts allowed
- Like/unlike, comments, deletion, filters, pagination

### AI Product Search v1.0 — `/product-search` ✅
- Upload photo → OpenAI Vision (GPT-4o) analyzes → Search 21 stores
- Results with EUR/BGN prices and direct store links
- Technomarket prioritized for appliances

### Web Scraping API — 21 Bulgarian Stores
- Praktiker, Jysk, Mr.Bricolage, Bauhaus, HomeMax, Technomarket, Teknoimpex, IKEA, Temax, Maximarket, Toplivo, Marmag, Paros, Praktis, Angro, Rila Online, Baustoff Metall, Atek, Vako, Buildmark, Obijavki

### Firm Subscription Plans (Landing Page)
- 3 plans: БАЗОВ (15EUR), ПРО (35EUR), PREMIUM (75EUR)
- Period toggle: 1/3/6/12 months with discounts

### Global Theme v6.5 — Persistent dark/light mode toggle

## Key API Endpoints
- `POST /api/ai-designer/photo-generate` — Vision + 3D render + budget (multipart/form-data) ✅ FIXED
- `POST /api/scrape/ai-search` — AI photo analysis + 21 store search
- `POST /api/community/posts` — Create post with images & project link
- `GET /api/community/posts` — List posts (public, paginated)
- `GET /api/scrape/stores` — 21 Bulgarian stores list

## Prioritized Backlog

### P0 — DONE ✅
- Community Feed: image upload, project sharing ✅
- AI Product Search: photo → 21 stores ✅
- EMERGENCY FIX: Room recognition with Vision ✅

### P1 — Upcoming
- Share results button in AI Product Search (→ Community Feed / WhatsApp/Viber)
- FB Pixel / Google Analytics tracking
- Referral rewards (automatic)
- Mobile fullscreen + download
- PDF export (site design)
- Profile Page functionality (My Projects, Payment, Settings)
- Leaderboard System (clients & firms)

### P2 — Future
- Backend refactoring (modular routers/)
- Community Feed: public projects + firm offers
