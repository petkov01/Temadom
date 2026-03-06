# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)** — 2D plans with 3D preview and cost estimation
2. **3D Photo Designer v7.0 (`/room-scan`)** — Photo-based AI room redesign with 360° view, budget tiers, direct product links

## Implemented Features

### Authentication & Users
- JWT auth, AuthGate, Profile page
- Regional firm limit: 2 free firms per region (28 regions × 2 = 56)
- Company registration with region dropdown (color-coded availability)

### CAD System v5.2 — `/ai-sketch`
- Color-coded handles (RED/BLUE/GREEN), endpoint dragging, rotation, undo/redo
- PDF export, cost estimation, multi-floor, Bulgarian labels

### 3D Photo Designer v7.0 — `/room-scan`
- Photo-based workflow: 3 photos → AI analysis → 360° redesign
- Budget Section: 3 tiers (Economy/Medium/Premium) with direct product links
- Direct links to: Praktiker, Jysk, MrBricolage, IKEA, Teknoimpex, Bauhaus, HomeMax
- 360° viewer: Before/After slider with 3 angle views
- Share: Facebook, Twitter, direct link copy
- My Projects: Save, load, delete

### Global Theme v6.5
- Persistent dark/light mode toggle with CSS variables

### Landing Page
- Regional breakdown showing all 28 Bulgarian regions with status (green/yellow/red)
- "3D Photo Designer" text (not Video)
- Stats: 23/56 (2/област) format
- Hero counter: "(2 на област × 28 области)"

### Business Logic
- Free firms: 56 total = 2 per region × 28 regions
- New TemaDom logo (custom uploaded image)

## Key API Endpoints
- `POST /api/ai-designer/photo-generate` — 3 photos → AI redesign + budget
- `GET /api/ai-designer/my-projects` — User's projects (auth)
- `GET /api/ai-designer/project/{id}` — Single project (public)
- `GET /api/stats/live` — Live stats + per-region breakdown (28 regions)
- `POST /api/auth/register` — With regional limit check (2 per region)

## Tech Stack
- Frontend: React, TailwindCSS, Shadcn/UI, Three.js
- Backend: FastAPI, MongoDB, emergentintegrations (GPT-4o + GPT Image 1)

## Prioritized Backlog

### P1 — Upcoming
- v6.6: Detailed Profile Page (My Projects, Payment, Settings)
- v6.7: Community Feed (Facebook-style social feed)

### P2 — Future
- Leaderboard System (clients & firms)
- Backend refactoring (modular routers/)
