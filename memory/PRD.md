# TemaDom - PRD

## Original Problem Statement
AI-powered construction/renovation platform:
1. **AI CAD System (`/ai-sketch`)**: 2D/3D plan drawing, cost estimates, PDF+contract export
2. **TEMADOM 360° VIDEO 3D v6.1 (`/room-scan`)**: Upload 30-60s video → AI 360° renovation

## Implemented Features

### TEMADOM 360° VIDEO 3D v6.1 (`/room-scan`)
- **Filming Guide**: "КАК ДА СНИМАШ ПРАВИЛНО" — 5 steps, collapsible
- **3 packages**: 69€ (1 помещение), 129€ (2 помещения), 199€ (Апартамент до 5)
- **Video**: Max 60s MP4 (50MB), Drag&Drop + Gallery + Camera
- **Upload progress**: 0% → 100%
- **12 keyframes** extraction (5s interval)
- **10 styles**: Модерен, Минималист, Класически, Бохо, Хай-тек, Индустриален, Скандинавски, Лофт, Неокласически, Арт Деко
- **Dimensions**: W×L×H (default 2.7m height), editable
- **Generation progress**: 0% → 100%
- **Result**: 360° Before/After slider, КАЛКУЛАЦИЯ cost breakdown
- **PDF download**, GLB placeholder, Retry button on error

### AI CAD Sketch (`/ai-sketch`)
- 2D+3D side-by-side, 3D pan (right-click)
- 13 tools, round+rect columns with L/W/H
- No dimension limits, regional pricing (8 regions)
- Removable cost items, PDF Plan + Contract always visible

### About Page — Dark theme, readable, 6 problems, 5 solutions, mission, CTA
### Profile Page (`/profile`) — View/edit user info, account info, logout
### Auth Gate — All features locked for unregistered (blurred + modal)
### Landing Page v6.5 — Dark/light mode, HERO, pricing 69/129/199 EUR

## Test Reports
- iteration_37-41: All 100% pass

## Backlog
- P1: Video demo section on landing
- P1: Backend refactoring (server.py → routers/)
- P1: GLB file generation (Meshy.ai or trimesh)
- P2: Stripe monetization
- P2: E-signature for contracts
- P2: Luma.ai panorama integration
