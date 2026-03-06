# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)** — 2D plans with 3D preview and cost estimation
2. **3D Photo Designer v7.0 (`/room-scan`)** — Photo-based AI room redesign with 360° view, budget tiers, direct product links

## Implemented Features

### Authentication & Users
- JWT auth, AuthGate, Profile page
- Regional firm limit: 2 free firms per region (28 × 2 = 56)
- Company registration with region dropdown (color-coded availability)

### CAD System v5.2 — `/ai-sketch`
- Color-coded handles, endpoint dragging, rotation, undo/redo
- PDF export, cost estimation, multi-floor

### 3D Photo Designer v7.0 — `/room-scan`
- Photo-based: 3 photos (Общ план, Ъгъл 1, Ъгъл 2) → AI → 360° redesign
- Budget: 3 tiers (Economy/Medium/Premium) with direct product links
- Bulgarian stores: Praktiker, Jysk, MrBricolage, IKEA, Teknoimpex, Bauhaus, HomeMax
- 360° viewer: Before/After slider, 3 angle views
- Share: Facebook, Twitter, direct link. My Projects: save/load/delete

### Landing Page
- Regional breakdown: 28 regions with status indicators
- **Testimonials carousel**: 8 reviews, auto-rotate (5s), 3 cards desktop / 1 mobile
- Stats: rating, recommend %, avg project time, total saved
- Reviews API: any logged-in user can submit reviews (site-wide, not just designer)

### Reviews System
- `GET /api/reviews` — Public reviews + stats
- `POST /api/reviews` — Submit review (auth required), any category
- 8 seed reviews from different cities/features

### Global Theme v6.5
- Persistent dark/light mode toggle with CSS variables

## Key API Endpoints
- `POST /api/ai-designer/photo-generate` — 3 photos → AI redesign + budget
- `GET /api/ai-designer/my-projects` — User's projects (auth)
- `GET /api/reviews` — Public reviews + stats
- `POST /api/reviews` — Submit review (auth)
- `GET /api/stats/live` — Live stats + per-region breakdown
- `POST /api/auth/register` — With regional limit check

## Prioritized Backlog

### P1 — Upcoming
- **Real-time web scraping** for Bulgarian stores (Praktiker, Jysk, etc.) — actual prices/availability
- v6.6: Detailed Profile Page (My Projects, Payment, Settings)
- v6.7: Community Feed (Facebook-style social feed)

### P2 — Future
- Leaderboard System (clients & firms)
- Backend refactoring (modular routers/)
