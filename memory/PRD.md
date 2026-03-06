# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)**
2. **3D Photo Designer v9.1 (`/room-scan`)** — Vision + Dimensions + Budget + PNG only
3. **Community Feed v3.0 (`/community`)** — Posts, offers, notifications
4. **AI Product Search (`/product-search`)** — Photo → 21 stores
5. **Leaderboard (`/leaderboard`)** — Clients + Firms
6. **Notifications** — Bell icon, auto-triggered
7. **Stripe Payments** — Subscription checkout
8. **Referral System** — Auto rewards

## 3D Designer v9.1 — CURRENT ✅
- Dimensions: Дължина/Ширина/Височина (м) — defaults 4.0/3.0/2.6
- Budget checkboxes: 2,000лв / 5,000лв / 10,000лв
- GPT-4o Vision analyzes each photo → room-specific 3D render
- 3x PNG output (no PDF)
- Download + Fullscreen buttons
- Multi-room packages: 69/129/199 EUR
- Saves to profile: renders + budget + dimensions

## Key API Endpoints
- `POST /api/ai-designer/photo-generate` — Vision + 3D + budget (form-data)
- `POST /api/scrape/ai-search` — AI photo → 21 stores
- `GET /api/leaderboard/clients|companies`
- `GET/POST /api/notifications`
- `POST /api/payments/checkout?package_type=X`
- `POST /api/community/offers`

## Backlog
- Full backend refactoring
- Real scraping for 21 stores
- Email notifications
- Push notifications
