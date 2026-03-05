# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Build "TemaDom" — a web application that converts hand-drawn construction sketches and room photos into 3D visualizations and renovation designs.

## Core Features

### 1. AI CAD Sketch (`/ai-sketch`) — Parametric 3D
**Two modes:**
- **Draw (CAD):** Interactive canvas with grid, snap-to-grid, snap-to-endpoints, measurement labels
  - Tools: Wall, Line, Rectangle, Stairs, Dimension, Erase, Select
  - 4-step flow: Draw → Dimensions → Description → Review → 3D
  - AI shape detection (suggests wall/staircase/slab)
  - Live dimension editing per element
  - Structure panel showing all objects
  - Parametric 3D generation (createWall, createStairs, createSlab)
- **Upload (CV/OCR):** Upload sketches → OpenCV line detection + Tesseract OCR → .glb

### 2. IA Designer (`/room-scan`) — 1:1 Renovation
- Upload photo + describe renovation → 4-angle renovated views
- Before/After comparison slider
- 9 room types, 5 styles
- Progress bar

### 3. Live Counter Widget
- Fixed top-right: online users, clients, companies, masters, FREE slots
- Online users tracked via heartbeat API (25s interval, 60s timeout)
- Pulse animation on new registrations
- Mobile: in hamburger menu

### 4. Social Gallery (`/ready-projects`)
### 5. Subscriptions (3 tiers)
### 6. Telegram notifications (priority-based)

## Architecture
- **Backend:** FastAPI + MongoDB + OpenCV + Tesseract + Emergent LLM
- **Frontend:** React + TailwindCSS + Three.js/R3F + Shadcn/UI + HTML5 Canvas (CAD)
- **Language:** Bulgarian

## Implemented (March 5, 2026)
- [x] AI CAD Sketch: Full parametric builder (Draw + Upload modes)
- [x] IA Designer: 1:1 renovation + Before/After slider
- [x] IA Designer: Variant selector (1/2/3 variants x 4 angles)
- [x] IA Designer: Bug fix - room_type_name + generated_images response mapping
- [x] Live Counter with online users tracking
- [x] Logo cleanup
- [x] Social Gallery, Subscriptions, Telegram
- [x] Save & share AI Sketch projects

## Backlog
- **P1:** Refactor server.py → routers/
- **P2:** Monetization (Stripe)
- **P3:** Mobile app

## Test Reports
- iteration_29: CV/OCR pipeline core
- iteration_30: Counter + Slider + Share
- iteration_31: CAD system + Online users (100% all)
