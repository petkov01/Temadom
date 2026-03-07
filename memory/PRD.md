# TemaDom - PRD

## Original Problem Statement
TemaDom е уеб платформа за строителство и ремонти в България.

## What's Been Implemented

### Phase 1-8 (Previous)
- Full auth, Subscriptions, AI Designer, Chat, PDFs, Telegram, Blog, Multi-language
- Async Task System, gpt-4o-mini budget, LLM Cache, Static Fallback

### Phase 9 (Mar 7, 2026) - Landing Page Redesign
- Navbar: No logo corner, hamburger left, center logo, nav items, "Твоят проект" gold button
- Hero: LARGE logo (h-[26rem]) + AI-generated ПРЕДИ/СЛЕД images (1:1 architecture)
- Gold CTA, Room tabs, FAQ 6 items, Animations
- Footer: Removed footer_desc text under logo
- Mobile: "Начало" first in menu, center logo in navbar
- Light mode: Darker text (#4b5563 muted, #6b7280 subtle) for readability
- 1 снимка instead of 3
- AI prompt improved for 1:1 architecture in Bulgarian
- All prices EUR

## Prioritized Backlog
### P2
- Refactor server.py / App.js
- Company catalog & portfolio
- Job ads module

### P3
- Facebook login, Analytics, SEO

## 3rd Party Integrations
- OpenAI GPT-4o-mini & gpt-image-1 (Emergent LLM Key)
- Stripe (test keys), Google OAuth (Emergent Auth)
- Telegram Bot API
