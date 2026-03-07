# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
TemaDom е уеб платформа за строителство и ремонти в България. Целта е да свързва клиенти с фирми и майстори, предоставяйки AI-базирани инструменти за проектиране, калкулатор на цени, и абонаментни планове.

## What's Been Implemented

### Phase 1-6 (Previous sessions)
- Full auth (JWT + Google Social Login), Company/Master profiles
- Subscription system (Stripe), Price calculator
- AI Designer (gpt-image-1), Real product scraping (21 stores)
- Chat with online status, typing indicators, read receipts
- Complete UI/UX redesign with CSS variables dark/light theme
- Editable Contract & Calculation PDFs (Bulgarian Cyrillic)
- Telegram bot, Blog, Community, Multi-language

### Phase 7 (Mar 7, 2026) - AI Designer Speed & Mobile Fix
- Async Task System: POST -> task_id, frontend polls every 3s
- Parallel Processing via asyncio.gather
- DB split: designs + design_renders collections

### Phase 8 (Mar 7, 2026) - AI Designer Cost & Reliability
- Safe LlmChat Import with _LLM_AVAILABLE flag
- gpt-4o-mini for budget (10x cheaper)
- LLM Response Cache (MD5, 200 entries)
- Static Fallback Budget: BG_ROOM_PRICES for bathroom/kitchen/living_room/bedroom
- Frontend Fallback Notice

### Phase 9 (Mar 7, 2026) - Landing Page Redesign + AI Prompt
- **Complete landing page redesign** matching reference image
- **Navbar**: Начало | Как работи | Партньори | ЧЗВ | Обява | Още + "Твоят проект" gold button
- **Logo**: 98px desktop / 72px mobile, taskbar 110px/84px
- **Hero**: Centered logo → BEFORE/AFTER showcase → Gold arrow → ПРЕДИ/СЛЕД labels
- **CTA**: "КАЧИ СНИМКИ НА ПОМЕЩЕНИЕТО" gold gradient button
- **Room tabs**: Баня | Кухня | Хол
- **FAQ section**: 6 accordion items with <details> elements
- **Animations**: hero-fade-1..5, hero-scale-in, arrow-pulse, shimmer
- **AI Prompt**: Improved Bulgarian prompt preserving room architecture 1:1
- **All prices in EUR**
- **Testing**: iteration_82 — 24/24 frontend tests passed (100%)

## Key API Endpoints
- POST /api/ai-designer/photo-generate -> {task_id}
- GET /api/ai-designer/task/{task_id} -> progress
- GET /api/ai-designer/result/{design_id} -> full result

## Prioritized Backlog
### P2
- Refactor server.py (6200+ lines) into route modules
- Refactor App.js (4270+ lines) into page files
- Company catalog & portfolio pages
- Job ads module

### P3
- Refactor ai_designer_service into smaller modules
- Facebook login, Advanced analytics, SEO

## 3rd Party Integrations
- OpenAI GPT-4o-mini & gpt-image-1 (Emergent LLM Key)
- Stripe (test keys), Google OAuth (Emergent Auth)
- Telegram Bot API
