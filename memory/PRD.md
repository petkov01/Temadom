# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Build "TemaDom" — AI-powered construction/renovation platform that converts sketches and room photos into realistic 1:1 renovation renders with cost estimates.

## Core Features

### 1. Landing Page v6.5
- **HERO**: "ПЪРВИ 50 ФИРМИ = 1 ГОДИНА ПРЕМИУМ 0 EUR" counter [0/50]
- **Dark/Light mode** toggle with system preference detection
- **Demo**: TikTok-style horizontal scroll with 6 project cards
- **Pricing**: 3 glassmorphism cards (69/129/220 EUR)
- **10 Style tiles**: Модерен, Скандинавски, Лофт, Класически, Минималистичен, Бохо, Индустриален, Арт Деко, Рустик, Хай-тек
- **CTA**: "РЕГИСТРИРАЙ ФИРМАТА" + mobile sticky CTA
- **Removed**: All "безплатно", "първи 1000 клиенти", магазинни цени

### 2. AI CAD Sketch (`/ai-sketch`)
- **Draw mode**: 2D canvas with 13 tools, parametric L/W/H inputs, touch support, auto-cost EUR/BGN
- **Upload mode**: CV/OCR analysis → GLB 360° viewer
- **3D viewer removed** from draw mode (kept in upload mode only)

### 3. IA Designer (`/room-scan`)
- **Pricing**: 1 пом.=69€, 2-3=129€, 4-5=220€
- **10 styles**, 4 снимки/помещение, размери 2x4x2.6м
- **Pред/След рендер** with before/after slider
- **Percentage progress** (no seconds)
- **Variant selector** (1-3)

### 4. Live Counter Widget
### 5. Social Gallery (`/ready-projects`)
### 6. Subscriptions (3 tiers)

## Architecture
- **Backend:** FastAPI + MongoDB + OpenCV + Tesseract + Emergent LLM
- **Frontend:** React + TailwindCSS + Three.js + Shadcn/UI + HTML5 Canvas
- **Theme:** Dark/Light mode via ThemeContext.jsx

## Implemented
- [x] v6.5 Landing Page: counter [0/50], pricing 69/129/220, 10 styles, dark/light, CTA
- [x] CAD v5.1: 13 tools, touch canvas, floor selector, auto-cost, L/W/H dimensions
- [x] 3D removed from CAD draw mode (kept in upload mode)
- [x] IA Designer: 10 styles, pricing badges, percentage progress, variant selector
- [x] Live Counter, Social Gallery, Subscriptions, Telegram

## Backlog
- P0: Editable Contract with e-signature
- P0: Tutorial (8 GIF steps)
- P1: Sharing FB/IG/LinkedIn + embed link
- P1: Profile cloud save + mobile access
- P1: 99% Drawing Recognition (GPT-4o vision)
- P1: PDF plan export
- P2: Refactor server.py → routers/
- P3: Stripe monetization

## Test Reports
- iteration_33: CAD v5.1 (36/36 = 100%)
- iteration_34: Dimensions + 3D rendering (100%)
- iteration_35: v6.5 redesign (100% - all features verified)
