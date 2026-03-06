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
- ✅ Dark/Light mode toggle (v6.5)
- ✅ Blog system
- ✅ About page
- ✅ Services page
- ✅ Regional pricing page
- ✅ Portfolio gallery

### Global Theme (v6.5)
- ✅ Site-wide persistent dark/light mode toggle
- ✅ Toggle in navbar top-right (☀️/🌙)
- ✅ CSS custom variables for all theme colors
- ✅ localStorage persistence (key: temadom-theme)
- ✅ Smooth transitions (0.3s ease)
- ✅ All pages theme-aware (Navbar, Footer, LiveCounter, Landing, Professions, Login, Register, etc.)

### Business Logic
- ✅ Free firm registration limit: 56 (changed from 50)

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
│       ├── index.css             # Theme CSS variables (dark/light)
│       ├── components/
│       │   ├── ThemeContext.jsx   # Theme provider & hook
│       │   ├── AISketchPage.jsx  # CAD v5.2 orchestrator
│       │   ├── AIDesignerPage.jsx # Video Designer v6.1
│       │   ├── ProfessionsPage.jsx # Theme-aware (v6.8 fix)
│       │   ├── cad/
│       │   │   ├── CADCanvas.jsx
│       │   │   ├── StructurePanel.jsx
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
- **Global Dark/Light Theme v6.5** (Mar 2026) — Site-wide persistent theme toggle with CSS variables
- **Professions Page Fix v6.8** (Mar 2026) — Fixed light mode readability
- **Registration Limit P0** (Mar 2026) — Changed from 50 to 56

## Prioritized Backlog

### P1 — Upcoming Tasks
- **v6.6: Logo & Detailed Profile Page** — Fixed logo top-left, expanded `/profile` with "My Projects", "Payment", "Settings", "Social"
- **v6.7: Community Feed** — Facebook-style social feed at `/community` with posts, comments, reactions, infinite scrolling

### P2 — Future Tasks
- **Leaderboard System** — Dual leaderboard for clients and firms with points for orders/reviews
- Backend refactoring: Break `server.py` into modular `routers/` structure
- Video Demo Section on landing page
- GLB File Generation for Video Designer results
- Mobile touch context menu (long press → options)
- Pinch-to-zoom on mobile
- Mirror/Flip elements (X/Y axis)

## Key API Endpoints
- `POST /api/auth/register` — Register user (affected by 56 limit)
- `GET /api/stats/live` — Live stats with free_slots (total: 56)
- `PUT /api/auth/profile` — Update user profile
- `POST /api/ai-designer/video-generate` — Process uploaded video
- `POST /api/ai-sketch/export-pdf` — Export CAD plan as PDF
- `POST /api/ai-sketch/export-contract` — Export contract as PDF

## Tech Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, Canvas 2D API, Three.js
- **Backend**: FastAPI, MongoDB, OpenCV, fpdf2
- **Key Libraries**: react-router-dom, axios, lucide-react, three, @react-three/fiber
