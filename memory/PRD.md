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
- **Async Task System**: POST -> task_id immediately (<2s), frontend polls every 3s
- **Separated polling from result**: Polling returns ~150 bytes (no base64)
- **Parallel Processing**: Photos + product scraping via `asyncio.gather`

### Phase 8 (Mar 7, 2026) - AI Designer Cost & Reliability
- **Safe LlmChat Import**: try/except with `_LLM_AVAILABLE` flag
- **gpt-4o-mini for budget**: 10x cheaper ($0.15/M vs $3.75/M tokens)
- **LLM Response Cache**: MD5-based in-memory cache (200 entries)
- **Static Fallback Budget**: BG_ROOM_PRICES for bathroom/kitchen/living_room/bedroom
- **Budget Fallback on Error**: Returns static budget + original photos instead of crashing
- **Frontend Fallback Notice**: Orange banner when budget is from static data

### Phase 8b (Mar 7, 2026) - Compact Taskbar
- **Desktop**: 42px height, 36px logo, 14px icons, compact spacing
- **Mobile**: 32px height, 24px logo, 12px icons
- **CSS classes**: .taskbar-container, .taskbar-logo, .taskbar-icon
- Responsive breakpoint at 1023px (lg)

## Key API Endpoints
- `POST /api/ai-designer/photo-generate` -> `{task_id}` immediately
- `GET /api/ai-designer/task/{task_id}` -> lightweight progress (150 bytes)
- `GET /api/ai-designer/result/{design_id}` -> full result with base64 renders
- `POST /api/ai-designer/generate` -> parallelized camera angles

## Prioritized Backlog
### P2 (Medium)
- Refactor server.py (6000+ lines) into route modules
- Refactor App.js (4270+ lines) into page files
- SEO optimization, Company catalog & portfolio
- Job ads module for firms

### P3 (Future)
- Refactor ai_designer_service.py into smaller modules
- Facebook login, Advanced analytics

## 3rd Party Integrations
- OpenAI GPT-4o-mini & gpt-image-1 (Emergent LLM Key)
- Stripe (test keys), Playwright, Google OAuth (Emergent Auth)
- Telegram Bot API, litellm.aimage_edit
