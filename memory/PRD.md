# TemaDom - PRD

## Original Problem Statement
TemaDom е уеб платформа за строителство и ремонти в България. Свързва клиенти с фирми и майстори, предоставяйки AI-базирани инструменти за проектиране, калкулатор на цени, абонаментни планове, чат и блог.

## What's Been Implemented (ALL TESTED & VERIFIED)

### Core Features
- **Auth**: JWT + Google Social Login (Emergent Auth)
- **Subscriptions**: Stripe (test) — БАЗОВ 15 EUR, ПРО 35 EUR, PREMIUM 75 EUR + Designer plans (69/119/220 EUR)
- **Price Calculator**: Room type + area + quality → price in EUR
- **Companies Directory**: Search, filter, profiles
- **Ads Module**: Job postings for firms
- **Blog & Community**: Posts, comments, leaderboard
- **Chat**: Real-time with online status, typing indicators, read receipts
- **Notifications**: In-app notification system
- **PDF Export**: Editable contracts & calculations (Bulgarian Cyrillic)
- **Telegram Bot**: Linked accounts, notifications
- **Multi-language**: BG, EN, DE, TR

### AI Designer
- **Single photo upload** (simplified from 3)
- **Async processing**: POST → task_id → poll → result
- **gpt-4o-mini** for budget (10x cheaper)
- **LLM response cache** (MD5, 200 entries)
- **Static fallback budget**: BG_ROOM_PRICES for bathroom/kitchen/living_room/bedroom
- **Improved prompt**: "КОПИРАЙ 100% архитектурата" — 1:1 preservation
- **Product links**: Real Bulgarian stores (Praktiker, Bauhaus, Mr.Bricolage, HomeMax, Jysk, eMAG)

### UI/UX (Phase 9 - Mar 7, 2026)
- **Landing page**: Reference-matching design, ПРЕДИ/СЛЕД showcase, gold CTA, room tabs, FAQ
- **Navbar desktop**: ThemeToggle left, nav center (Начало/Как работи/Партньори/ЧЗВ/Обява/Още), right (BG/Вход/Твоят проект)
- **Navbar mobile**: Hamburger + ThemeToggle left, Logo 86px center, Globe right
- **Dark/Light mode**: Both fully readable, CSS variables
- **Animations**: hero-fade, scale-in, arrow-pulse

### Testing Status (Pre-Launch)
- **Backend**: 24/24 endpoints ✅ (iteration_83)
- **Frontend**: 100% all flows ✅ (iteration_83)
- **Subscriptions**: Verified correct EUR pricing ✅
- **Designer plans**: "1 снимка" confirmed ✅
- **Theme toggle**: Works correctly ✅

## Key API Endpoints (137 total)
- Auth: register, login, me, google
- Subscriptions: plans, checkout, status
- Calculator: calculate
- Companies, Ads, Blog, Community, Reviews
- AI Designer: photo-generate, task/{id}, result/{id}
- Chat, Notifications, Telegram, Leaderboard

## Prioritized Backlog
### P2
- Refactor server.py (6500+ lines) into route modules
- Refactor App.js (4300+ lines) into page files
- Company catalog & portfolio pages

### P3
- Facebook login, Advanced analytics, SEO

## 3rd Party Integrations
- OpenAI GPT-4o-mini & gpt-image-1 (Emergent LLM Key)
- Stripe (test keys)
- Google OAuth (Emergent Auth)
- Telegram Bot API
