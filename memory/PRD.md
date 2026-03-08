# TemaDom - PRD

## Original Problem Statement
TemaDom е уеб платформа за строителство и ремонти в България. Свързва клиенти с фирми и майстори, предоставяйки AI-базирани инструменти за проектиране, калкулатор на цени, абонаментни планове, чат и блог.

## What's Been Implemented (ALL TESTED & VERIFIED)

### Core Features
- **Auth**: JWT + Google Social Login (Emergent Auth)
- **Subscriptions**: Stripe (test) -- БАЗОВ 15 EUR, ПРО 35 EUR, PREMIUM 75 EUR + Designer plans (69/119/220 EUR)
- **Price Calculator**: Room type + area + quality -> price in EUR
- **Companies Directory**: Search, filter, profiles with **priority sort by plan** (premium > pro > basic > free)
- **Photo Limits**: Enforced per plan (basic=10, pro=50, premium=999)
- **Ads Module**: Job postings for firms
- **Blog & Community**: Posts, comments, leaderboard
- **Chat**: Real-time with online status, typing indicators, read receipts
- **Notifications**: In-app notification system
- **PDF Export**: Editable contracts & calculations (Bulgarian Cyrillic)
- **Telegram Bot**: Linked accounts, notifications
- **Multi-language**: BG, EN, DE, TR

### AI Designer
- **Single photo upload** (simplified from 3)
- **Async processing**: POST -> task_id -> poll -> result
- **gpt-4o-mini** for budget (10x cheaper)
- **LLM response cache** (MD5, 200 entries)
- **Static fallback budget**: BG_ROOM_PRICES for bathroom/kitchen/living_room/bedroom
- **Improved prompt**: "КОПИРАЙ 100% архитектурата" -- 1:1 preservation
- **Product links**: Real Bulgarian stores (Praktiker, Bauhaus, Mr.Bricolage, HomeMax, Jysk, eMAG)

### UI/UX
- **Landing page**: Reference-matching design, ПРЕДИ/СЛЕД showcase, gold CTA, room tabs, FAQ
- **Navbar desktop**: ThemeToggle left, nav center (Начало/Фирми и Майстори/Обяви/Калкулатор), right (Още dropdown/BG/Вход/Твоят проект)
- **Navbar mobile**: Hamburger + ThemeToggle left, Logo 86px center, Globe right
- **Dark/Light mode**: Both fully readable, CSS variables
- **Animations**: hero-fade, scale-in, arrow-pulse

### Projects Page (Mar 8, 2026 - MERGED)
- **Single /projects page** with two main tabs: "Разгледай проекти" (Browse) and "Създай проект" (Create)
- Browse tab: Renovation/Construction sub-tabs, search, category/city filters, property type for construction
- Create tab: Full inline form (title, description, category, city, budget, images, construction details)
- Public access for browsing, auth required for creation
- Removed duplicate /ready-projects from all navigation

### Database Cleanup (Mar 8, 2026)
- All fake/seed data purged: users, companies, projects, reviews, community posts, ads, feedback
- Clean slate for production launch

### Subscription Features (Verified Mar 8, 2026)
- **Priority display**: Companies sorted by plan (premium -> pro -> basic -> free) then by rating
- **Photo limits**: Enforced on profile update (basic=10, pro=50, premium=999)
- **Statistics access**: Gated for appropriate plans

### Testing Status (Mar 8, 2026)
- **Backend**: 14/14 endpoints PASS (iteration_84)
- **Frontend**: 100% all flows PASS (iteration_84)
- **DB cleanup**: Verified 0 clients, 0 companies, 0 projects
- **Subscription features**: Priority sort and photo limits verified

## Key API Endpoints (137 total)
- Auth: register, login, me, google
- Subscriptions: plans, checkout, status
- Calculator: calculate
- Companies (priority sorted), Ads, Blog, Community, Reviews
- AI Designer: photo-generate, task/{id}, result/{id}
- Projects: list, create, detail, my-projects
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
