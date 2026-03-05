# TemaDom - PRD

## Original Problem Statement
AI-powered construction/renovation platform with two main products:
1. **AI CAD System (`/ai-sketch`)**: 2D/3D plan drawing with cost estimates, PDF export, contracts
2. **3D Video Designer (`/room-scan`)**: Upload 15s video → AI generates 360° renovated renders

## Implemented Features

### Landing Page v6.5
- Dark/Light mode toggle (desktop + mobile)
- HERO counter "ПЪРВИ 50 ФИРМИ"
- TikTok scroll demo, pricing cards (69/129/220 EUR), 10 style tiles

### 3D Video Designer v6 (`/room-scan`)
- **Multi-room packages**: 69€ (1 room), 129€ (2-3 rooms), 220€ (4-5 rooms)
- Room tabs with add/remove (+/X) per package limit
- Each room: video drag&drop (15s), dimensions (W×L×H), room type, style (1-10), notes
- Progress bar 0-100%, 360° Before/After slider
- PDF project export (working), GLB (placeholder)

### AI CAD Sketch (`/ai-sketch`)
- Side-by-side 2D + 3D live preview
- **3D Pan**: Right-click to move, left-click to rotate, scroll to zoom, two-finger touch pan
- 13 drawing tools + column shape toggle (round O / rect ▭)
- **No dimension limits** — free input for length, width, thickness
- **Regional pricing** — 8 Bulgarian regions with cost multipliers
- **Removable cost items** — X button on each row + restore button
- **PDF Plan + Сметка** — always visible button, downloadable
- **PDF Договор** — contract form with company/client/address fields, editable before download

### Auth Gate
- All feature pages (`/ai-sketch`, `/room-scan`, `/dashboard`, `/messages`) require login
- Unregistered users see blurred content + "Само за регистрирани" modal
- "Вход" / "Регистрация" buttons redirect to login/register

### Platform
- Auth (JWT), messaging, portfolio, reviews, analytics
- Mobile theme toggle in header

## Test Reports
- iteration_37: Video Designer + CAD basics — 100% pass
- iteration_38: Column shapes, regional pricing, PDF exports — 100% pass
- iteration_39: Auth gate, multi-room packages, PDF always visible, contract dialog — 100% pass

## Backlog
- P1: Video demo section on landing page
- P1: Backend refactoring (server.py → routers/)
- P1: GLB file generation for Video Designer
- P2: Stripe monetization for subscriptions
- P2: E-signature for contracts
