# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a multifaceted web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)** — 2D plans with 3D preview and cost estimation
2. **3D Designer v7.0 (`/room-scan`)** — Photo-based AI room redesign with 360° view, budget tiers, and direct product links

## What's Been Implemented

### Authentication & Users
- JWT auth, AuthGate, Profile page
- Regional firm limit: 2 free firms per region (28 regions × 2 = 56)

### CAD System v5.2 — `/ai-sketch`
- Color-coded handles (RED/BLUE/GREEN), endpoint dragging, rotation
- Undo/Redo, ghost preview, live dimensions
- PDF export, cost estimation, multi-floor

### 3D Designer v7.0 — `/room-scan` (NEW - Mar 2026)
- **Photo-based workflow**: 3 photos (front, left, right) → AI analysis → 360° redesign
- **AI Image Generation**: OpenAI GPT Image 1 via Emergent key
- **Budget Section**: 3 tiers (Economy/Medium/Premium) with direct product links
- **Direct product links**: Praktiker, Jysk, MrBricolage, IKEA, Teknoimpex, Bauhaus, HomeMax
- **360° viewer**: Before/After slider with 3 angle views
- **Share**: Facebook, Twitter, direct link copy
- **My Projects**: Save, load, delete projects
- **Project sharing**: Public project URLs

### Global Theme v6.5
- Persistent dark/light mode toggle with CSS variables
- All pages theme-aware

### Business Logic
- Free firm limit: 56 total (2 per Bulgarian region)
- New TemaDom logo (uploaded image, bigger in navbar)

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, Three.js
- **Backend**: FastAPI, MongoDB, OpenCV, emergentintegrations (LLM + Image Gen)
- **AI**: OpenAI GPT-4o (analysis), GPT Image 1 (generation)

## Key API Endpoints
- `POST /api/ai-designer/photo-generate` — 3 photos → AI redesign + budget
- `GET /api/ai-designer/my-projects` — User's projects (auth required)
- `GET /api/ai-designer/project/{id}` — Single project (public)
- `POST /api/ai-designer/project/{id}/share` — Enable sharing
- `POST /api/auth/register` — With regional limit check

## Prioritized Backlog

### P1 — Upcoming
- **v6.6: Logo & Detailed Profile Page** — Expanded profile with "My Projects", "Payment", "Settings"
- **v6.7: Community Feed** — Facebook-style social feed at `/community`

### P2 — Future
- **Leaderboard System** — Dual leaderboard for clients and firms
- Backend refactoring: Break `server.py` into modular `routers/`
- Video-based 3D designer (legacy support)
- GLB 3D model export
