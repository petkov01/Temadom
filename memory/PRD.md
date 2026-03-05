# TemaDom - PRD

## Original Problem Statement
AI-powered construction/renovation platform that converts sketches and room photos into realistic 1:1 renovation renders with cost estimates.

## Core Features

### 1. Landing Page v6.5
- Dark/Light mode toggle (☀️/🌙) with system preference
- HERO: "ПЪРВИ 50 ФИРМИ = 1 ГОДИНА ПРЕМИУМ 0 EUR" counter [0/50]
- Demo: TikTok scroll 6 projects
- Pricing: 69/129/220 EUR glassmorphism cards
- 10 style tiles + CTA "РЕГИСТРИРАЙ ФИРМАТА"
- Mobile sticky CTA
- Removed: "безплатно", "първи 1000 клиенти", phone numbers

### 2. IA Designer (`/room-scan`) — Multi-Room System
- **Plan selector**: 1 пом.=69€, 2-3=129€, 4-5=220€
- **Multi-room upload**: Each plan unlocks room slots (1/3/5)
- **4 photos per room** from different angles
- **10 styles**: Модерен, Сканди, Лофт, Класика, Минимал, Бохо, Индустр., Арт Деко, Рустик, Хай-тек
- **Image compression** (1200px, 80% JPEG) before API
- Before/After slider, percentage progress

### 3. AI CAD Sketch (`/ai-sketch`)
- 2D canvas only (3D viewer removed from draw mode)
- 13 tools, parametric L/W/H, touch, auto-cost EUR/BGN
- Upload mode: GLB 360° viewer preserved

### 4. Live Counter + Social Gallery + Subscriptions + Telegram

## Implemented
- [x] v6.5 Landing: counter, pricing 69/129/220, dark/light, 10 styles
- [x] IA Designer: multi-room (1/3/5), 4 photos/room, plan selector, 10 styles
- [x] Phone removed from registration + footer + leads
- [x] Designer pricing in backend config (69/129/220)
- [x] CAD: 3D removed from draw mode, 2D canvas intact
- [x] Subscription plans proportional (15/35/75 EUR + designer 69/129/220)

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
- iteration_35: v6.5 landing page (100%)
- iteration_36: Bug fixes: multi-room, phone removed, styles, pricing (100%)
