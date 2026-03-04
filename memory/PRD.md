# TemaDom v10.8 - PRD (Product Requirements Document)

## Original Problem Statement
Build a marketplace platform "TemaDom" for construction and renovation services in Bulgaria with AI-powered features.

## Platform Architecture
Modular design with independent blocks communicating through Central AI Core:
- **Central AI Core**: Manages AI Designer, calculations, PDF generation, limits tracking
- **Block 1**: User System (Client, Company, Designer, Master)
- **Block 2**: Subscription Engine (test mode)
- **Block 3**: AI Designer Engine (2D + 3D)
- **Block 4**: Calculator & Charter Engine
- **Block 5**: Ads System
- **Block 6**: Referral System (demo)
- **Block 7**: Rating System
- **Block 8**: Homepage Structure

## Current Mode
**TEST MODE** — All prices replaced with "Тестов режим". Limits and functionalities active.

## Tech Stack
- **Frontend**: React.js, TailwindCSS, Shadcn/UI, lucide-react
- **Backend**: FastAPI, Python, MongoDB
- **AI**: OpenAI GPT-5.2 via emergentintegrations (blueprint analysis, chatbot)
- **Notifications**: Telegram

## User Types
1. **Клиент** (Client) - posts projects, free ads
2. **Фирма** (Company) - requires bulstat, subscription plans
3. **Дизайнер** (Designer) - AI design access, portfolio
4. **Майстор** (Master) - individual craftsman

## What's Been Implemented

### Phase 1 - Foundation (COMPLETED - March 2026)
- [x] User system with 4 types (Client, Company, Designer, Master)
- [x] New Homepage v10.8 with Hero ("ПЪРВИ 20 ФИРМИ = 1 МЕСЕЦ ПРО ТЕСТОВ РЕЖИМ")
- [x] AI Designer promo section ("Първите 100 AI дизайна безплатни")
- [x] 4 Demo projects on homepage
- [x] How it works section (Калкулатор, AI Дизайнер, Намери фирма, Оценка)
- [x] Top companies section
- [x] Subscription plans page (Базов/Про/Премиум for companies, Designer plan)
- [x] Ads/Listings system (create, view, delete)
- [x] AI Designer showcase page with 3 variants and free counter (100/100)
- [x] Referral system endpoints (demo mode)
- [x] AI review moderation endpoint
- [x] Updated Navbar: Главна | Калкулатор | Фирми | Дизайнери | Обяви | Още
- [x] Registration with 4 user type tabs
- [x] Subscription activation (test mode)

### Previously Completed (carried over)
- [x] Price Calculator with 28 regions, 3 quality levels
- [x] AI Blueprint Analysis (GPT-5.2)
- [x] AI Chatbot Assistant ("TemaDom Асистент")
- [x] Full-site BG/EN translation system
- [x] PDF generation from calculator (fixed format)
- [x] Real-time chat between users
- [x] Telegram notifications
- [x] Rating & review system
- [x] Contact info protection (censoring in chat)
- [x] Google Analytics 4 integration

## API Endpoints
### New in v10.8
- `GET /api/subscriptions/plans` - Subscription plans (test mode)
- `POST /api/subscriptions/activate` - Activate subscription
- `GET /api/ads` - List ads
- `POST /api/ads` - Create ad (auth required)
- `DELETE /api/ads/{ad_id}` - Delete ad
- `GET /api/ai-design/status` - AI design counter
- `GET /api/demo-projects` - 4 demo projects for homepage
- `GET /api/top-companies` - Top-rated companies
- `GET /api/referrals/status` - Referral status (demo)
- `POST /api/reviews/check` - AI moderation for reviews

## Backlog (Prioritized)

### P0 - Phase 2: Subscriptions + Ads Enhancement
- Subscription auto-deactivation on expiry (7-day reminder)
- Ads with image upload
- Ads filtering by category and city
- Auto-delete ads on subscription expiry

### P1 - Phase 3: AI Designer Engine
- OpenAI GPT Image 1 integration for 2D visualizations
- 3D GLB model generation (Kaedim/Point-E/Spline)
- Style and budget selection flow
- PDF + GLB file generation and download
- Store links integration
- Video instructions
- 100 global free limit enforcement
- 1 per profile limit enforcement

### P2 - Phase 4: Calculator & Charter Engine
- PDF dimension analysis
- 3D formwork recognition (columns, beams, slabs, stairs, elevator shafts)
- Quantity survey generation
- Contract generation
- Share version (no prices)
- Manual price editing by companies

### P3 - Future
- EasyPay Bulgaria integration
- Mobile app (React Native/Expo)
- Forum system
- Full English translation for all content pages
- server.py refactoring into modular FastAPI structure
