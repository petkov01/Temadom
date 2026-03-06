# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)** — 2D plans with 3D preview and cost estimation
2. **3D Photo Designer v7.0 (`/room-scan`)** — Photo-based AI room redesign with 360° view, budget-based materials, direct product links

## Implemented Features

### Authentication & Users
- JWT auth, AuthGate, Profile page
- Regional firm limit: 2 free firms per region (28 × 2 = 56)
- Company registration with region dropdown (color-coded availability)

### CAD System v5.2 — `/ai-sketch`
- Color-coded handles, endpoint dragging, rotation, undo/redo
- PDF export, cost estimation, multi-floor

### 3D Photo Designer v7.0 — `/room-scan`
- **Budget-driven workflow**: Client enters budget (€) → AI generates materials WITHIN that budget
- Budget quick presets: €1000, €2000, €3000, €5000, €10000
- 3 tiers: Economy (60%), Medium (100%), Premium (150% of budget)
- Photo-based: 3 photos (Общ план, Ъгъл 1, Ъгъл 2) → AI → 360° redesign
- Direct product links to Bulgarian stores (Praktiker, Jysk, MrBricolage, IKEA, Teknoimpex, Bauhaus, HomeMax)
- Share: Facebook, Twitter, direct link. My Projects: save/load/delete
- Generation priority: 3D renders → Budget+links → 360° (optional)

### Landing Page
- **Big TemaDom logo** (130px desktop, left corner)
- Regional breakdown: 28 regions with status
- **Testimonials carousel**: Reviews from site-wide users, auto-rotate, stats
- Reviews API: any logged-in user can submit (site-wide)
- "3D Photo Designer" text (not Video)

### Global Theme v6.5
- Persistent dark/light mode toggle with CSS variables

## Key API Endpoints
- `POST /api/ai-designer/photo-generate` — 3 photos + budget_eur → AI redesign + budget
- `GET /api/ai-designer/my-projects` — User's projects (auth)
- `GET /api/reviews` — Public reviews + stats
- `POST /api/reviews` — Submit review (auth)
- `GET /api/stats/live` — Live stats + per-region breakdown

## Prioritized Backlog

### P1 — Upcoming
- **Real-time web scraping** for Bulgarian stores — actual prices/availability
- v6.6: Detailed Profile Page (My Projects, Payment, Settings)
- v6.7: Community Feed (Facebook-style social feed)

### P2 — Future
- Leaderboard System (clients & firms)
- Backend refactoring (modular routers/)
