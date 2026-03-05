# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Build "TemaDom" — a web application that converts hand-drawn construction sketches and room photos into 3D visualizations and renovation designs.

## Core Features

### 1. AI CAD Sketch (`/ai-sketch`) — IA CAD v5.1
**Two modes:**
- **Draw (CAD):** Interactive touch canvas with grid, snap-to-grid, snap-to-endpoints
  - 13 Tools: Select, Wall(15-40cm), Roof(15-60deg), Slab(12-30cm), Rectangle, Circle, Stairs, Door, Window, Column, Beam, X/Y/Z Dimension, Erase
  - **Parametric L/W/H inputs**: Every element has РАЗМЕРИ section with editable dimensions
    - Wall: L(дължина), W(дебелина 15-40см), H(височина)
    - Slab: X(ширина), Y(дълбочина), Z(дебелина 12-30см)
    - Column: D(диаметър), H(височина)
    - Door: L + Шир/Вис
    - Window: L + Шир/Вис/Перваз
    - Beam: L + Шир/Вис/Кота
    - Roof: L + Ъгъл(15-60°)/Надвес
    - Stairs: L + Стъпала/Rise/Run/Шир
  - Floor selector (multi-story support with 3m floor offset)
  - Auto-cost estimate (EUR/BGN): concrete 90EUR/m3, rebar 1.05EUR/kg, tiles 28EUR/m2, formwork 22.5EUR/m2
  - 3D Live Preview: all 8 element types render correctly
  - Touch support (iPhone/Android/iPad/Desktop)
  - Auto-select after drawing
  - Type switching on any object
- **Upload (CV/OCR):** Upload sketches → OpenCV line detection + Tesseract OCR → .glb

### 2. IA Designer (`/room-scan`) — 1:1 Renovation
- Upload photo + describe renovation → 4-angle renovated views
- Before/After comparison slider
- 9 room types, 5 styles
- Variant selector (1-3 variants)
- Progress bar

### 3. Live Counter Widget
### 4. Social Gallery (`/ready-projects`)
### 5. Subscriptions (3 tiers)
### 6. Telegram notifications

## Architecture
- **Backend:** FastAPI + MongoDB + OpenCV + Tesseract + Emergent LLM
- **Frontend:** React + TailwindCSS + Three.js + Shadcn/UI + HTML5 Canvas (CAD)
- **Language:** Bulgarian
- **CAD Components:** `/frontend/src/components/cad/` (constants, utils, CADCanvas, ThreeDPreview, StructurePanel, CostEstimate)

## Implemented (March 5, 2026)
- [x] IA CAD v5.1: 13 tools, touch canvas, floor selector, auto-cost EUR/BGN
- [x] IA CAD v5.1: Parametric L/W/H dimension inputs for all 8 element types
- [x] IA CAD v5.1: 3D rendering of all elements (wall, door, window, column, beam, roof, stairs, slab, circle)
- [x] IA CAD v5.1: Auto-select after drawing, type switching
- [x] IA CAD v5.1: Modular component architecture (6 files in /cad/)
- [x] IA Designer: 1:1 renovation + Before/After slider + Variant selector (1/2/3)
- [x] IA Designer: Bug fix - room_type_name + generated_images response mapping
- [x] Live Counter with online users tracking
- [x] Social Gallery, Subscriptions, Telegram

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

## Test Reports
- iteration_31: CAD system + Online users (100%)
- iteration_32: IA Designer bug fixes (100%)
- iteration_33: IA CAD v5.1 full test (36/36 = 100%)
- iteration_34: Dimension inputs + 3D rendering (100% all 8 types)
