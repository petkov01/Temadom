# TemaDom - PRD

## Original Problem Statement
AI-powered construction/renovation platform:
1. **AI CAD System (`/ai-sketch`)**: 2D/3D plan drawing, cost estimates, PDF export, contracts
2. **3D Video Designer (`/room-scan`)**: Upload 15s video → AI 360° renovation with multi-room packages

## Implemented Features

### Landing Page v6.5
- Dark/Light mode (desktop + mobile), HERO counter, TikTok demo, pricing cards

### 3D Video Designer v6 (`/room-scan`)
- **3 packages**: 69€ (1 room), 129€ (2-3 rooms), 220€ (4-5 rooms)
- Auto-expand: selecting 129€ creates 2 room tabs, 220€ creates 4 room tabs
- Each room: video drag&drop, W×L×H dimensions, room type, style (1-10), notes
- 360° Before/After, PDF export

### AI CAD Sketch (`/ai-sketch`)
- 2D+3D side-by-side, 3D pan (right-click), 13 tools, round+rect columns
- No dimension limits, regional pricing (8 regions), removable cost items
- PDF Plan + Contract always visible, contract form editable

### About Page
- Dark theme (#0F1923), 6 problem cards, 5 solution cards, mission, CTA

### Profile Page (`/profile`)
- View/edit user info (name, company, BULSTAT, city, website, description)
- Account info (registration date, type, subscription status), logout

### Auth Gate
- All feature pages require login, blurred content + "Само за регистрирани" modal

### Pricing Section
- 3D Video Designer: 3 package cards (69/129/220 EUR) with features list

## Test Reports
- iteration_37-40: All 100% pass (backend + frontend)

## Backlog
- P1: Video demo section on landing
- P1: Backend refactoring (server.py → routers/)
- P1: GLB file generation
- P2: Stripe monetization
- P2: E-signature for contracts
