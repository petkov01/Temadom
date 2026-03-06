# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)** — 2D plans with 3D preview and cost estimation
2. **3D Photo Designer v8.0 (`/room-scan`)** — Photo-based AI room redesign with 3 separate 3D renders, budget-based materials, direct product links, PDF export, enhanced sharing

## Implemented Features

### Authentication & Users
- JWT auth, AuthGate, Profile page with avatar upload
- Regional firm limit: 2 free firms per region (28 x 2 = 56)
- Company registration with region dropdown (color-coded availability)

### CAD System v5.2 — `/ai-sketch`
- Color-coded handles, endpoint dragging, rotation, undo/redo
- PDF export, cost estimation, multi-floor

### 3D Photo Designer v8.0 — `/room-scan`
- **NO 360° — REMOVED COMPLETELY** (v8.0 change)
- **Budget-driven workflow**: Client enters budget (EUR) -> AI generates materials WITHIN that budget
- Budget quick presets: EUR1000, EUR2000, EUR3000, EUR5000, EUR10000
- 3 tiers: Economy (60%), Medium (100%), Premium (150% of budget)
- Photo-based: 3 photos (Общ план, Ъгъл 1, Ъгъл 2) -> AI -> 3 separate 3D renders
- Direct product links to Bulgarian stores (Praktiker, Jysk, MrBricolage, IKEA, Teknoimpex, Bauhaus, HomeMax)
- **NEW: PDF download** with renders + budget table + project info
- **NEW: Enhanced sharing** - Facebook, WhatsApp, Viber, Twitter, Email, Copy link
- **NEW: Fullscreen viewer** with swipe navigation, download per image
- **NEW: Mobile gestures** - Tap for fullscreen, swipe between renders, download
- Share: Facebook, Twitter, WhatsApp, Viber, Email, direct link
- My Projects: save/load/delete
- Generation flow: 3D renders -> Budget+links (no 360°)

### Profile Page (v6.6)
- Avatar upload/display
- Personal info editing
- My Projects tab with project list
- Settings tab with account info, subscription, statistics
- Logout

### Landing Page
- Big TemaDom logo (130px desktop, left corner)
- Regional breakdown: 28 regions with status
- Testimonials carousel with auto-rotate and stats
- Reviews API: any logged-in user can submit
- NO 360° references anywhere

### Global Theme v6.5
- Persistent dark/light mode toggle with CSS variables

## Key API Endpoints
- `POST /api/ai-designer/photo-generate` — 3 photos + budget_eur -> 3 separate 3D renders + budget
- `POST /api/ai-designer/photo-pdf` — Generate PDF with renders + budget (NEW)
- `GET /api/ai-designer/my-projects` — User's projects (auth)
- `GET /api/ai-designer/project/{id}` — Get single project
- `DELETE /api/ai-designer/project/{id}` — Delete project
- `POST /api/auth/avatar` — Upload avatar
- `GET /api/auth/me` — User profile
- `PUT /api/auth/profile` — Update profile
- `GET /api/reviews` — Public reviews + stats
- `POST /api/reviews` — Submit review (auth)
- `GET /api/stats/live` — Live stats + per-region breakdown

## Prioritized Backlog

### P1 — Upcoming
- **Real-time web scraping** for Bulgarian stores — actual prices/availability
- v6.7: Community Feed (Facebook-style social feed)

### P2 — Future
- Leaderboard System (clients & firms)
- Backend refactoring (modular routers/)
