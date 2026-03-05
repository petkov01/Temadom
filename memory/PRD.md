# TemaDom - PRD

## Original Problem Statement
AI-powered construction/renovation platform with two main products:
1. **AI CAD System (`/ai-sketch`)**: 2D/3D construction plan drawing with cost estimates, PDF export, contracts
2. **3D Video Designer (`/room-scan`)**: Upload 15s video → AI generates 360° renovated renders with PDF export

## Core Features

### 1. Landing Page v6.5
- Dark/Light mode toggle (desktop + mobile)
- HERO: "ПЪРВИ 50 ФИРМИ = 1 ГОДИНА ПРЕМИУМ 0 EUR" counter
- Demo: TikTok scroll 6 projects
- Pricing: 69/129/220 EUR glassmorphism cards
- 10 style tiles + CTA

### 2. 3D Video Designer v6 (`/room-scan`)
- Video drag & drop (15s max, 100MB)
- Mandatory dimensions (W×L×H)
- Room type (9 types) + Style dropdown (1-10)
- Progress bar 0-100%
- 360° Before/After slider
- **PDF project export** (working endpoint)
- GLB export (placeholder)
- Price: 69 EUR

### 3. AI CAD Sketch (`/ai-sketch`)
- Side-by-side 2D canvas + 3D live preview
- 13 drawing tools
- **Column shapes: Round (O) + Rectangular (▭)** with L/W/H for each
- Element dragging (fixed - raw coords during drag, no snap)
- Parametric dimensions
- Floor system, structure panel
- **Regional pricing** — 8 Bulgarian regions with multipliers (Sofia +15% to Other -12%)
- **PDF Plan + Cost Estimate export**
- **Contract PDF export** with company/client form
- Upload mode: GLB 360° viewer

### 4. Platform Features
- Auth (JWT), messaging, portfolio, reviews, analytics
- Mobile theme toggle in header

## Implemented
- [x] v6.5 Landing with dark/light mode
- [x] 3D Video Designer v6 with video drag&drop + PDF export
- [x] CAD with rect + round columns, L/W/H dimensions
- [x] Drag & drop fix (raw coords during dragging)
- [x] Mobile dark/light theme toggle
- [x] Regional pricing (8 regions with multipliers)
- [x] PDF Plan + Cost Estimate export (/api/ai-sketch/export-pdf)
- [x] Contract PDF export (/api/ai-sketch/export-contract)
- [x] Video Designer PDF export (/api/ai-designer/video-pdf)
- [x] Phone removed, subscription plans

## Test Reports
- iteration_37: Video Designer + CAD basics - 100% pass
- iteration_38: Column shapes, regional pricing, PDF exports, contract, mobile toggle - 100% pass

## Backlog
- P1: Video demo section on landing page
- P1: Backend refactoring (server.py → routers/)
- P1: GLB file generation for Video Designer
- P2: Stripe monetization
- P2: Editable contract with e-signature
