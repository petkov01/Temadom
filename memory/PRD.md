# TemaDom - PRD (Product Requirements Document)

## Original Problem Statement
Build a marketplace application named "TemaDom" for construction project leads in Bulgaria. Connect clients with contractors (companies and individual masters).

## Business Model
- **COMPLETELY FREE** platform for all users (clients, companies, masters)
- All payment gates removed (Stripe integrated but disabled)

## User Personas
- **Clients:** Post construction/renovation projects
- **Companies:** Contractors with registered company (BULSTAT validation required)
- **Masters:** Individual craftsmen without a registered company
- **Admin:** Platform moderator with access to analytics, complaints management

## Core Requirements

### Implemented Features (Complete)
1. **Multi-role Authentication** - Client/Company/Master registration with BULSTAT validation
2. **Project Listings** - CRUD for construction projects with image upload
3. **Company/Master Profiles** - With portfolio gallery, ratings, reviews
4. **Price Calculator** - 28 services x 28 regions, 3 quality levels, labor +/- materials
5. **AI Blueprint Analysis** - GPT-4o powered image analysis of construction drawings
6. **Real-time Chat** - Direct messaging with image sharing
7. **Telegram Notifications** - Bot notifications for new projects in contractor's city
8. **Blog & SEO** - 40+ articles, 28 regional pages, Schema.org, Open Graph
9. **Analytics Dashboard** - Password-protected admin analytics
10. **Find Master Page** - Filterable listing of contractors
11. **Dropdown Navigation Menu** - 4 main items visible + "Още" dropdown with 5 more
12. **Language Switcher** - 8 languages (BG, EN, DE, FR, ES, IT, RU, TR) with flag icons
13. **AI Chatbot** - GPT-4o powered assistant for platform questions and complaint handling

### Date Log
- 2026-02-27: Added dropdown navigation, language switcher (8 languages), AI chatbot with complaint handling

## Technical Architecture
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, lucide-react
- **Backend:** FastAPI (Python), monolithic server.py
- **Database:** MongoDB (users, projects, conversations, messages, events, chatbot_conversations, complaints, user_warnings)
- **AI:** OpenAI GPT-4o via emergentintegrations + Emergent LLM Key
- **Integrations:** Telegram Bot, Stripe (disabled), Google Analytics

## P0 (Critical) - DONE
- All core marketplace features
- Calculator with AI analysis
- Chat system
- Navigation improvements

## P1 (Important) - BACKLOG
- Refactor server.py into modular FastAPI structure (routes, models, services)
- Add more content translations for landing page and subpages

## P2 (Nice to have) - BACKLOG
- EasyPay Bulgaria payment integration (if payments re-introduced)
- Admin dashboard for complaint management UI
- Push notifications for mobile web
- User reputation/review system improvements

## Known Limitations
- Emergent LLM Key budget may be low - users should add balance via Profile -> Universal Key -> Add Balance
- Landing page hero content stays in Bulgarian regardless of language setting (intentional - Bulgarian market focus)
- PDF generation has Cyrillic encoding issue (pre-existing, low priority)
