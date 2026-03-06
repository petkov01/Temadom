# TEMADOM — Product Requirements Document

## Original Problem Statement
Build "TemaDom," a Bulgarian web application for construction and interior design. Features include AI CAD, video room designer, 3D scanner, professions guide, company marketplace, leaderboard, and community.

## Core Architecture
- **Frontend:** React + TailwindCSS + Shadcn/UI + Konva.js + Three.js
- **Backend:** FastAPI + MongoDB (Motor) | Modular routers in `/backend/routes/`
- **Integrations:** Stripe, Emergent LLM (OpenAI gpt-4o, gpt-image-1), OpenCV, fpdf2, FFmpeg

## What's Been Implemented

### v5.2 — CAD Tool (DONE)
- Endpoint dragging, rotation, undo/redo, dimension labels

### v6.5 — Global Theme System (DONE - Feb 2026)
- Dark/Light toggle, CSS variables, localStorage persistence, all pages

### v6.8 — Professions Page UI Fix (DONE - Feb 2026)
- Theme-aware styling, readable in both modes

### Leaderboard + Weekly Challenges + Referrals (DONE - Feb 2026)
- Dual leaderboard: Clients vs Firms/Masters
- Points: register=10, create_project=20, complete_project=50, leave_review=15, receive_review=10, portfolio_add=10, daily_login=2, referral=30
- 3 rotating weekly challenges with progress bars, claim system, timer
- Referral system with unique links, +30 points per referral, copy button, stats
- Backend modularized: routes/leaderboard.py

### Video Designer FFmpeg Fix (DONE - Mar 2026)
- FFmpeg auto-conversion: H.265, AVI, MOV, MKV → MP4 H.264 + AAC
- 3-step fallback: FFmpeg convert → OpenCV extract → FFmpeg single-frame extraction
- 35MB frontend limit, 40MB backend limit, 65s max duration
- Frontend accepts: MP4, MOV, AVI, MKV, WebM

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
- v6.5+v6.8+Leaderboard: 11/11 (iteration_43)
- Weekly Challenges + Referrals: 20/20 (iteration_44)
- Video FFmpeg Fix: 9/11 backend + 100% frontend (iteration_45, 2 timeouts = preview env)
