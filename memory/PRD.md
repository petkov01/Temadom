# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
TemaDom е уеб платформа за строителство и ремонти в България. Целта е да свързва клиенти с фирми и майстори, предоставяйки AI-базирани инструменти за проектиране, калкулатор на цени, и абонаментни планове.

## What's Been Implemented

### Phase 1-6 (Previous sessions)
- Full auth (JWT + Google Social Login), Company/Master profiles
- Subscription system (Stripe), Price calculator
- AI Designer (gpt-image-1), Real product scraping (21 stores)
- Chat, PDF contracts, Telegram bot, Blog, Community, Multi-language

### Phase 7 - AI Designer Speed & Mobile Fix
- Async Task System, Parallel Processing, DB split

### Phase 8 - AI Designer Cost & Reliability
- gpt-4o-mini for budget (10x cheaper), LLM Cache, Static Fallback Budget

### Phase 9 (Mar 7, 2026) - Landing Page Redesign
- **Navbar**: No logo in corner. Hamburger left + ThemeToggle. Center: Начало | Как работи ▾ | Партньори ▾ | ЧЗВ | Обява ▾. Right: Още, BG, Вход, "Твоят проект" gold button
- **Hero Logo**: LARGE centered (h-64 sm:h-80 md:h-[26rem]) with golden glow
- **BEFORE/AFTER showcase**: Side-by-side with gold arrow + ПРЕДИ/СЛЕД labels
- **Headline**: "Ремонт без стрес — AI проектиране"
- **CTA**: Gold gradient "КАЧИ СНИМКИ НА ПОМЕЩЕНИЕТО"
- **Room tabs**: Баня | Кухня | Хол
- **FAQ section**: 6 items with accordion
- **Animations**: hero-fade, hero-scale-in, arrow-pulse
- **1 снимка** instead of 3 (simplified UX)
- **AI Prompt**: Improved Bulgarian prompt preserving architecture 1:1
- All prices in EUR
- Testing: iteration_82 — 24/24 (100%)

## Key API Endpoints
- POST /api/ai-designer/photo-generate -> {task_id}
- GET /api/ai-designer/task/{task_id} -> progress
- GET /api/ai-designer/result/{design_id} -> full result

## Prioritized Backlog
### P2
- Refactor server.py (6200+ lines) into route modules
- Refactor App.js (4300+ lines) into page files
- Company catalog & portfolio pages
- Job ads module

### P3
- Facebook login, Advanced analytics, SEO

## 3rd Party Integrations
- OpenAI GPT-4o-mini & gpt-image-1 (Emergent LLM Key)
- Stripe (test keys), Google OAuth (Emergent Auth)
- Telegram Bot API
