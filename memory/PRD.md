# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Build "TemaDom" — a web application that converts hand-drawn construction sketches and room photos into 3D visualizations and renovation designs.

## Core Features

### 1. AI Sketch (`/ai-sketch`) — CV/OCR Pipeline
- Upload hand-drawn sketches/blueprints (JPG, PNG, WebP)
- Backend pipeline: OpenCV line detection + Tesseract OCR dimension detection
- Outputs: Vectorized geometry + .glb 3D model
- Three.js 3D viewer with rotate/zoom/pan
- STRICT MODE: No hallucination, only geometry from drawing
- Download .glb file

### 2. IA Designer (`/room-scan`) — 1:1 Renovation
- Upload real room photo (bathroom, kitchen, stairs, facade)
- Describe renovation in text
- AI generates the EXACT same space renovated (GPT-4o vision + GPT Image 1)
- 4 camera angles output
- Progress bar with elapsed time
- Strict 1:1 geometry preservation

### 3. Social Gallery (`/ready-projects`)
- Users publish finished renovation projects
- Like, comment, share functionality

### 4. Subscriptions
- 3 tiers: БАЗОВ, ПРО, PREMIUM
- Telegram notifications (priority-based)

## Architecture
- **Backend:** FastAPI + MongoDB (motor) + OpenCV + Tesseract + Emergent LLM
- **Frontend:** React + TailwindCSS + Three.js/R3F + Shadcn/UI
- **Language:** Bulgarian (Български)

## What's Been Implemented (as of March 5, 2026)
- [x] AI Sketch: Full CV/OCR pipeline (OpenCV + Tesseract → .glb → Three.js)
- [x] IA Designer: Strict 1:1 renovation UI with progress bar, 4 angles, room types, styles
- [x] Social Gallery (Ready Projects page)
- [x] Homepage with psychological copy
- [x] Subscription system (3 tiers)
- [x] Telegram notifications (priority-based)
- [x] Navigation restructured (AI Sketch, IA Designer, Готови проекти, Фирми)
- [x] Backend partial refactoring (config.py, models.py extracted)

## Prioritized Backlog
- **P1:** Complete backend refactoring — split server.py into routers/
- **P2:** Monetization (Stripe payments, feature locking by subscription)
- **P3:** Save AI Sketch projects to DB with shareable links
- **P4:** Mobile app + advanced features

## Key Files
- `/app/backend/cv_pipeline.py` — OpenCV/Tesseract pipeline
- `/app/backend/server.py` — Main FastAPI app
- `/app/backend/config.py` — Shared configuration
- `/app/backend/models.py` — Pydantic models
- `/app/frontend/src/components/AISketchPage.jsx` — AI Sketch page with Three.js
- `/app/frontend/src/components/AIDesignerPage.jsx` — IA Designer page
- `/app/frontend/src/App.js` — Routes & navigation
