# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Build "TemaDom" — a web application that converts hand-drawn construction sketches and room photos into 3D visualizations and renovation designs.

## Core Features

### 1. AI Sketch (`/ai-sketch`) — CV/OCR Pipeline
- Upload hand-drawn sketches/blueprints (JPG, PNG, WebP)
- Backend: OpenCV line detection + Tesseract OCR dimension detection
- Outputs: Vectorized geometry + .glb 3D model
- Three.js 3D viewer with rotate/zoom/pan
- STRICT MODE: No hallucination, only geometry from drawing
- Download .glb file
- **Save & Share:** Projects saved to DB, shareable via `/ai-sketch?id=xxx`

### 2. IA Designer (`/room-scan`) — 1:1 Renovation
- Upload real room photo (bathroom, kitchen, stairs, facade)
- Describe renovation in text
- AI generates the EXACT same space renovated (GPT-4o vision + GPT Image 1)
- 4 camera angles output
- **Before/After comparison slider** (draggable)
- Progress bar with elapsed time
- Strict 1:1 geometry preservation

### 3. Live Counter Widget
- Fixed position top-right corner
- Shows: clients, companies, masters, free slots remaining
- Real-time updates every 30 seconds
- Pulse animation on new registrations
- Mobile: displays in hamburger menu as 4-column grid

### 4. Social Gallery (`/ready-projects`)
- Users publish finished renovation projects
- Like, comment, share functionality

### 5. Subscriptions
- 3 tiers: БАЗОВ, ПРО, PREMIUM
- Telegram notifications (priority-based)

## Architecture
- **Backend:** FastAPI + MongoDB (motor) + OpenCV + Tesseract + Emergent LLM
- **Frontend:** React + TailwindCSS + Three.js/R3F + Shadcn/UI
- **Language:** Bulgarian (Български)

## What's Been Implemented
- [x] AI Sketch: Full CV/OCR pipeline (OpenCV + Tesseract → .glb → Three.js)
- [x] AI Sketch: Save projects to DB + shareable links (?id=xxx)
- [x] IA Designer: Strict 1:1 renovation UI with progress bar, 4 angles
- [x] IA Designer: Before/After comparison slider
- [x] Live Counter widget (desktop fixed + mobile hamburger)
- [x] Logo cleanup (removed duplicate white text)
- [x] Social Gallery (Ready Projects page)
- [x] Homepage with psychological copy
- [x] Subscription system (3 tiers)
- [x] Telegram notifications (priority-based)
- [x] Navigation restructured
- [x] Backend partial refactoring (config.py, models.py extracted)

## Prioritized Backlog
- **P1:** Complete backend refactoring — split server.py into routers/
- **P2:** Monetization (Stripe payments, feature locking by subscription)
- **P3:** Mobile app + advanced features

## Key Files
- `/app/backend/cv_pipeline.py` — OpenCV/Tesseract pipeline
- `/app/backend/server.py` — Main FastAPI app (3500+ lines)
- `/app/backend/config.py` — Shared configuration
- `/app/backend/models.py` — Pydantic models
- `/app/frontend/src/components/AISketchPage.jsx` — AI Sketch + Three.js + share
- `/app/frontend/src/components/AIDesignerPage.jsx` — IA Designer + Before/After slider
- `/app/frontend/src/App.js` — Routes, navigation, LiveCounter, layout

## Test Reports
- `/app/test_reports/iteration_29.json` — AI Sketch + IA Designer core features
- `/app/test_reports/iteration_30.json` — Live Counter + Share + Slider + Logo fix
