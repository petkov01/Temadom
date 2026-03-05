# TEMADOM — Product Requirements Document

## Original Problem Statement
Build "TemaDom," a multifaceted Bulgarian web application for construction and interior design. Features include an AI-assisted CAD system, video-based room designer, 3D scanner, professions guide, company marketplace, leaderboard, and community features.

## Core Architecture
- **Frontend:** React + TailwindCSS + Shadcn/UI + Konva.js + Three.js
- **Backend:** FastAPI + MongoDB (Motor async driver)
- **Integrations:** Stripe, Emergent LLM (OpenAI), OpenCV, fpdf2

## What's Been Implemented

### v5.2 — CAD Tool (DONE & VERIFIED)
- Professional-grade element manipulation in `/ai-sketch`
- Endpoint dragging, rotation, free-form positioning
- Colored handles, undo/redo, corrected dimension labels

### v6.5 — Global Theme System (DONE & VERIFIED - Feb 2026)
- Dark/Light mode toggle in navbar, fixed for all pages
- CSS variables for both themes (--td-bg-page, --td-bg-nav, --td-bg-card, --td-text, etc.)
- Persisted in localStorage (`temadom-theme` key)
- Applied to: Navbar, Footer, LiveCounter, AuthGate, Login/Register, Projects, Professions, Leaderboard

### v6.8 — Professions Page UI Fix (DONE & VERIFIED - Feb 2026)
- Fixed unreadable text in light mode
- All sections (cards, expanded content, warnings, quality signs, red flags) now theme-aware
- Both dark and light modes tested and verified

### Leaderboard — Active with Test Period (DONE & VERIFIED - Feb 2026)
- Dual leaderboard: Clients vs Firms/Masters
- Points system: register=10, create_project=20, complete_project=50, leave_review=15, receive_review=10, portfolio_add=10, daily_login=2, referral=30
- Auto-awards on: registration, project creation, review, portfolio add
- My rank tracking with auth
- Test mode badge displayed
- Frontend page at `/leaderboard`

### Backend Refactoring (STARTED - Feb 2026)
- `routes/leaderboard.py` extracted as first modular router
- `config.py` already shared for DB, auth, constants
- `models/__init__.py` for all Pydantic models
- Pattern established for future extraction

## Prioritized Backlog

### P1 — Next Up
- **v6.6 Logo & Detailed Profile Page:** Fixed logo top-left, overhauled `/profile` with personal info, projects, payment history, settings
- **v6.7 Community Feed:** `/community` page with infinite scroll, posts, comments, reactions

### P2 — Future
- Complete backend refactoring (auth, projects, companies, messages, AI routes → separate modules)
- Daily login points auto-award
- Referral system implementation

## Key DB Schema
- **users:** `{ id, email, hashed_password, name, user_type, city, leaderboard_points, ... }`
- **leaderboard_log:** `{ id, user_id, user_type, action, points, created_at }`
- **projects, reviews, portfolio_projects, company_profiles:** Standard CRUD collections

## Testing Status
- v5.2 CAD: 14/14 passed
- v6.5+v6.8+Leaderboard: 11/11 backend, 100% frontend (iteration_43)
