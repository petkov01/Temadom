# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a multifaceted web application for construction and interior design with two main products:
1. **AI-Assisted CAD System (`/ai-sketch`)** — Tool for architects to draw 2D plans with live 3D preview and cost estimation.
2. **Video 3D Designer (`/room-scan`)** — Interior design tool that processes room videos to generate renovated 360° panorama and 3D models.

The application is in Bulgarian (Български) and targets the Bulgarian construction market.

## User Personas
- **Architects/Engineers**: Use CAD tool for drawing 2D plans, exporting PDFs and contracts
- **Interior Designers**: Use Video 3D Designer for room visualization
- **Construction Companies**: Use cost estimation and contract generation features
- **Homeowners**: Use platform to find construction professionals and get estimates

## Core Requirements

### Authentication & User Management
- ✅ User registration with email, name, city, user_type
- ✅ JWT-based authentication
- ✅ AuthGate component restricting tool access to registered users
- ✅ Profile page for viewing/updating user information

### CAD System (v5.2) — `/ai-sketch`
- ✅ 2D drawing canvas with multiple tools (wall, roof, slab, stairs, door, window, column, beam, dimension, erase)
- ✅ **Professional Handle Manipulation (v5.2)**:
  - ✅ Color-coded handles: RED (endpoints), BLUE (center), GREEN (rotation)
  - ✅ Individual endpoint dragging (only that end moves, other stays fixed)
  - ✅ Center dragging (whole element moves)
  - ✅ Rotation via GREEN handle
  - ✅ Ghost preview during drag (original position shown at 0.2 opacity)
  - ✅ Live dimension display during drag (golden label)
  - ✅ Free positioning without grid snap during manipulation
  - ✅ Shift+Drag = orthogonal constraint
  - ✅ Ctrl+Drag = precision (0.1m steps)
  - ✅ Double-click to select element
  - ✅ Undo/Redo (Ctrl+Z/Y) with history stack
- ✅ Raw coordinates in select mode (not snapped) for accurate hit detection
- ✅ Bulgarian dimension labels: Дължина, Широчина, Дебелина, Височина
- ✅ Live 3D preview with OrbitControls
- ✅ Multi-floor support
- ✅ Cost estimation by region (8 Bulgarian regions with price multipliers)
- ✅ PDF Plan + Cost export
- ✅ PDF Contract export
- ✅ Rectangular and round column support
- ✅ Sketch upload mode with 3D model generation
- ✅ Project sharing via link
- ✅ GLB file download

### Video 3D Designer (v6.1) — `/room-scan`
- ✅ Multi-room packages (1, 2, or apartment) at 69/129/199 EUR
- ✅ 60-second/50MB video processing
- ✅ 12 keyframe extraction
- ✅ New UI based on detailed spec

### Landing Page & Navigation
- ✅ Comprehensive landing page with pricing
- ✅ Dark/Light mode toggle
- ✅ Blog system
- ✅ About page
- ✅ Services page
- ✅ Regional pricing page
- ✅ Portfolio gallery

## Technical Architecture
```
/app/
├── backend/
│   ├── server.py         # FastAPI app (monolithic)
│   ├── routes/           # Route modules
│   ├── models/           # Data models
│   └── services/         # Business logic
├── frontend/
│   └── src/
│       ├── App.js
│       ├── components/
│       │   ├── AISketchPage.jsx    # CAD v5.2 orchestrator
│       │   ├── AIDesignerPage.jsx  # Video Designer v6.1
│       │   ├── cad/
│       │   │   ├── CADCanvas.jsx   # Professional 2D canvas with handles
│       │   │   ├── StructurePanel.jsx  # Parametric editing panel
│       │   │   ├── CostEstimate.jsx
│       │   │   ├── ThreeDPreview.jsx
│       │   │   ├── constants.js
│       │   │   └── utils.js
│       │   └── ...
│       └── ...
└── memory/
    └── PRD.md
```

## What's Been Implemented (Chronological)
- Authentication system with AuthGate
- Landing page, Blog, About, Services pages
- CAD tool v5.0 (basic drawing)
- CAD tool v5.1 (columns, cost estimate, PDF export)
- **CAD tool v5.2** (Feb 2026) — Professional handle manipulation, undo/redo, rotation, ghost preview
- Video Designer v6.1
- Profile page
- Dark/Light mode

## Prioritized Backlog

### P1 — Upcoming Tasks
- Video Demo Section on landing page
- GLB File Generation for Video Designer results

### P2 — Future Tasks
- Backend refactoring: Break `server.py` into modular `routers/` structure
- Mobile touch context menu (long press → options)
- Pinch-to-zoom on mobile
- Mirror/Flip elements (X/Y axis)

## Key API Endpoints
- `PUT /api/auth/profile` — Update user profile
- `POST /api/ai-designer/video-generate` — Process uploaded video
- `POST /api/ai-sketch/export-pdf` — Export CAD plan as PDF
- `POST /api/ai-sketch/export-contract` — Export contract as PDF
- `POST /api/ai-designer/video-pdf` — Export Video Designer results as PDF

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, Canvas 2D API, Three.js
- **Backend**: FastAPI, MongoDB, OpenCV, fpdf2
- **Key Libraries**: react-router-dom, axios, lucide-react, three, @react-three/fiber
