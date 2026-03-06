# TEMADOM — Product Requirements Document

## Original Problem Statement
TemaDom is a web application for construction and interior design targeting the Bulgarian market.

## Core Products
1. **AI-Assisted CAD System (`/ai-sketch`)** — 2D plans with 3D preview and cost estimation
2. **3D Photo Designer v9.0 (`/room-scan`)** — Vision-powered: Photos → AI analysis → Room-specific 3D renders + Budget + Download/Fullscreen
3. **Community Feed v3.0 (`/community`)** — Social feed with posts, images, offers from firms, notifications
4. **AI Product Search (`/product-search`)** — Upload photo → AI identifies products → Search 21 stores + Share
5. **Leaderboard (`/leaderboard`)** — Dual ranking: Clients and Firms
6. **Referral System** — Auto rewards, WhatsApp/Viber share, milestones
7. **Notifications System** — Real-time bell icon, unread count, mark-read
8. **Stripe Payments** — Subscription checkout (БАЗОВ/ПРО/PREMIUM), payment history

## Implemented Features

### Notifications v1.0 ✅ NEW
- Bell icon in navbar with unread badge (polling every 30s)
- Dropdown with notification list, mark-all-read, delete
- Auto-triggered: offers on your posts, likes on your posts
- Backend: GET /api/notifications, GET unread-count, POST mark-read

### Stripe Payments v1.0 ✅ NEW
- 17 payment packages (БАЗОВ/ПРО/PREMIUM × 1/3/6/12 months + 3D design packages)
- Real Stripe checkout redirect (test mode)
- Payment history in Profile → Плащания tab
- Auto-subscription activation on successful payment
- Webhook handling for payment confirmation

### Profile Page v3.0 ✅ ENHANCED
- 5 tabs: Профил, Проекти, Плащания, Реферали, Настройки

### Backend Modularization ✅ STARTED
- routes/notifications.py — Notification CRUD endpoints
- routes/payments.py — (template, using existing server.py endpoints)
- routes/__init__.py

### All Previous Features ✅
- AI Vision room recognition, Community v3 with offers, Leaderboard, Referrals, FB Pixel/GA, Download/Fullscreen

## Prioritized Backlog

### DONE ✅
- All P0 + P1 + P2 features complete
- Notifications system ✅
- Stripe payments ✅
- Backend modularization started ✅

### P3 — Future
- Full backend refactoring (move all routes from server.py to routes/)
- Real scraping implementation for 21 stores
- Enhanced mobile responsiveness
- Email notifications (SendGrid/Resend)
- Push notifications
