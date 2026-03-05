# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Build "TemaDom" — a web application that converts hand-drawn construction sketches and room photos into 3D visualizations and renovation designs.

## Core Features

### 1. AI CAD Sketch (`/ai-sketch`) — IA CAD v5.1
**Two modes:**
- **Draw (CAD):** Interactive touch canvas with grid, snap-to-grid, snap-to-endpoints
  - 13 Tools: Select, Wall(15-40cm), Roof(15-60deg), Slab(12-30cm), Rectangle, Circle, Stairs, Door, Window, Column, Beam, X/Y/Z Dimension, Erase
  - Floor selector (multi-story support)
  - Live dimension editing per element in Structure Panel
  - Auto-cost estimate (EUR/BGN): concrete 90EUR/m3, rebar 1.05EUR/kg, tiles 28EUR/m2, formwork 22.5EUR/m2
  - Parametric 3D generation (wall, roof, stairs, slab, door, window, column, beam, circle)
  - Touch support (iPhone/Android/iPad/Desktop)
- **Upload (CV/OCR):** Upload sketches → OpenCV line detection + Tesseract OCR → .glb

### 2. IA Designer (`/room-scan`) — 1:1 Renovation
- Upload photo + describe renovation → 4-angle renovated views
- Before/After comparison slider
- 9 room types, 5 styles
- Variant selector (1-3 variants)
- Progress bar

### 3. Live Counter Widget
- Fixed top-right: online users, clients, companies, masters, FREE slots
- Online users tracked via heartbeat API (25s interval, 60s timeout)

### 4. Social Gallery (`/ready-projects`)
### 5. Subscriptions (3 tiers)
### 6. Telegram notifications (priority-based)

## Architecture
- **Backend:** FastAPI + MongoDB + OpenCV + Tesseract + Emergent LLM
- **Frontend:** React + TailwindCSS + Three.js + Shadcn/UI + HTML5 Canvas (CAD)
- **Language:** Bulgarian
- **CAD Components:**
  - `/frontend/src/components/cad/constants.js` - Constants & cost rates
  - `/frontend/src/components/cad/utils.js` - Snap, distance, cost calculation
  - `/frontend/src/components/cad/CADCanvas.jsx` - 2D canvas with touch
  - `/frontend/src/components/cad/ThreeDPreview.jsx` - Three.js 3D viewer
  - `/frontend/src/components/cad/StructurePanel.jsx` - Object list & edit
  - `/frontend/src/components/cad/CostEstimate.jsx` - Auto cost EUR/BGN

## Implemented (March 5, 2026)
- [x] IA CAD v5.1: 13 tools, touch canvas, floor selector, auto-cost estimate
- [x] IA CAD v5.1: Modular component architecture (6 files)
- [x] IA Designer: 1:1 renovation + Before/After slider + Variant selector (1/2/3)
- [x] IA Designer: Bug fix - room_type_name + generated_images response mapping
- [x] Live Counter with online users tracking
- [x] Logo cleanup
- [x] Social Gallery, Subscriptions, Telegram
- [x] Save & share AI Sketch projects

## Backlog
- **P0:** Editable Contract with e-signature
- **P0:** Tutorial (8 GIF steps)
- **P1:** Sharing: FB/IG/LinkedIn + temadom.com/project/[ID] embed
- **P1:** Profile cloud save + mobile access
- **P1:** 99% Drawing Recognition (GPT-4o vision for sketch analysis)
- **P1:** PDF plan export
- **P1:** GLB/STEP export improvements
- **P2:** Refactor server.py → routers/
- **P3:** Stripe monetization
- **P3:** Mobile app

## Test Reports
- iteration_31: CAD system + Online users (100%)
- iteration_32: IA Designer bug fixes (100%)
- iteration_33: IA CAD v5.1 full test (36/36 = 100%)
