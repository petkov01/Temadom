# TEMADOM — Product Requirements Document

## Original Problem Statement
Build "TemaDom," a Bulgarian web application for construction and interior design. Features include AI CAD, video room designer, 3D scanner, professions guide, company marketplace, leaderboard, and community.

## Core Architecture
- **Frontend:** React + TailwindCSS + Shadcn/UI + Konva.js + Three.js
- **Backend:** FastAPI + MongoDB (Motor) | Modular routers in `/backend/routes/`
- **Integrations:** Stripe, Emergent LLM (OpenAI), OpenCV, fpdf2

## What's Been Implemented

### v5.2 — CAD Tool (DONE)
- Endpoint dragging, rotation, undo/redo, dimension labels

### v6.5 — Global Theme System (DONE - Feb 2026)
- Dark/Light toggle, CSS variables, localStorage persistence, all pages

### v6.8 — Professions Page UI Fix (DONE - Feb 2026)
- Theme-aware styling, readable in both modes

### Leaderboard — Active with Test Period (DONE - Feb 2026)
- Dual leaderboard: Clients vs Firms/Masters
- Points: register=10, create_project=20, complete_project=50, leave_review=15, receive_review=10, portfolio_add=10, daily_login=2, referral=30
- Auto-awards on registration, project creation, review, portfolio add

### Weekly Challenges (DONE - Feb 2026)
- 3 rotating challenges per week based on ISO week number
- Examples: "Публикувай 3 проекта" (+100), "Остави 2 отзива" (+50), "Добави 3 в портфолио" (+75)
- Progress tracking with progress bars
- Claim system — user clicks to collect bonus when challenge completed
- Timer showing time remaining in the week

### Referral System (DONE - Feb 2026)
- Each user gets unique referral code (first 8 chars of user ID)
- Shareable link: `/register?ref=CODE`
- Referrer earns +30 points per successful referral
- Registration page shows referral banner when `?ref=` is present
- Copy-to-clipboard button for referral link
- Stats: total referrals, points earned, recent referrals list

### Backend Refactoring (STARTED - Feb 2026)
- `routes/leaderboard.py` — leaderboard, challenges, referrals (extracted)
- `config.py` — shared DB, auth, constants
- `models/__init__.py` — Pydantic models

## Prioritized Backlog

### P1 — Next Up
- **v6.6 Logo & Detailed Profile:** Fixed logo, overhauled `/profile` (info, projects, payments, settings)
- **v6.7 Community Feed:** `/community` page with infinite scroll, posts, comments, reactions

### P2 — Future
- Complete backend refactoring (auth, projects, companies, messages → separate routers)
- Daily login auto-award implementation
- Challenge completion notifications

## Testing Status
- v5.2 CAD: 14/14 passed
- v6.5+v6.8+Leaderboard: 11/11 backend, 100% frontend (iteration_43)
- Weekly Challenges + Referrals: 20/20 backend, 100% frontend (iteration_44)
