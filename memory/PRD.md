# TemaDom - PRD

## Original Problem Statement
AI-powered construction/renovation platform. Two main products:
1. **AI CAD System (`/ai-sketch`)**: 2D/3D construction plan drawing with cost estimates
2. **3D Video Designer (`/room-scan`)**: Upload 15s video → AI generates 360° renovated renders

## Core Features

### 1. Landing Page v6.5
- Dark/Light mode toggle with system preference
- HERO: "ПЪРВИ 50 ФИРМИ = 1 ГОДИНА ПРЕМИУМ 0 EUR" counter [0/50]
- Demo: TikTok scroll 6 projects
- Pricing: 69/129/220 EUR glassmorphism cards
- 10 style tiles + CTA "РЕГИСТРИРАЙ ФИРМАТА"
- Mobile sticky CTA
- Updated hero: "3D Video Designer" button

### 2. 3D Video Designer v6 (`/room-scan`)
- **Video drag & drop** (15s max, MP4/MOV/WebM, 100MB limit)
- **Mandatory dimensions**: Width × Length × Height (meters)
- **Room type dropdown**: 9 types (Баня, Кухня, Хол, Спалня, etc.)
- **Style dropdown (1-10)**: Модерен, Скандинавски, Лофт, Класика, Минималистичен, Бохо, Индустриален, Арт Деко, Рустик, Хай-тек
- **Progress bar**: 0% → 100% during AI processing
- **360° Before/After slider**: Compare original vs renovated
- **Output**: PDF + 3D GLB download (69 EUR)
- **Backend**: Extracts 4 key frames from video via OpenCV, sends to GPT-4o for analysis, generates 4 angle renders via gpt-image-1

### 3. AI CAD Sketch (`/ai-sketch`)
- Side-by-side 2D canvas + 3D live preview
- 13 drawing tools (wall, roof, slab, door, window, column, beam, stairs, circle, rect, dimension, erase, select)
- Element dragging with distance indicators
- Parametric dimensions (L/W/H) with real-time updates
- Floor system, structure panel, cost estimate (EUR/BGN)
- Upload mode: GLB 360° viewer preserved

### 4. Platform Features
- Live counter + social gallery + subscriptions + Telegram
- Auth (JWT), messaging, portfolio, reviews
- Analytics dashboard

## Implemented
- [x] v6.5 Landing: counter, pricing 69/129/220, dark/light, 10 styles
- [x] **3D Video Designer v6**: Video drag&drop, dimensions, style 1-10, progress bar, 360° Before/After, PDF+GLB buttons
- [x] **Backend video-generate endpoint**: /api/ai-designer/video-generate with OpenCV frame extraction
- [x] Navigation updated: "3D Video Designer" in dropdown and hero
- [x] CAD: Side-by-side 2D+3D, drag with distance lines, all tools functional
- [x] Phone removed from registration + footer + leads
- [x] Subscription plans (15/35/75 EUR + designer 69/129/220)

## Backlog
- P0: PDF plan + contract export from /ai-sketch
- P0: Regional pricing for cost estimates in CAD
- P0: PDF + GLB actual file generation for Video Designer
- P1: Video demo section on landing page
- P1: Backend refactoring (server.py → routers/)
- P2: Stripe monetization for subscriptions
- P2: Editable contract with e-signature
- P2: Profile cloud save + mobile access

## Test Reports
- iteration_37.json: Video Designer v6 + CAD - 100% pass rate (frontend + backend)
