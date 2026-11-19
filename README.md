# Muse Agency Management Dashboard — Infloww OpenAPI v1.4

## 1. Project Overview

**Muse Agency Management Dashboard** is a full-stack business intelligence and agency operations platform built for an OnlyFans creator management agency integrating with the **Infloww OpenAPI v1.4** (`https://openapi.infloww.com/v1`).

The dashboard provides a centralized, read-only analytical view of:
- **Agency Overview KPIs**: Total Gross & Net Revenue, Connected & Total Creators, Active Fans & New Subscribers, Active Chatters, Average Revenue per Creator, and Total Transactions & Refunds.
- **Revenue & Earnings Analytics**: Daily, weekly, and monthly revenue time-series trends, revenue breakdown by creator, transaction category distribution (`Subscription`, `Recurring Subscription`, `Tips`, `Messages`, `Streams`, `Posts`, `Referrals`), and refund tracking.
- **Creator Management**: Searchable, sortable, paginated creator roster with per-creator drill-down drawers showing daily earnings trajectory, active/expired/auto-renew fan counts, OnlyFans platform ranking percentile, profile visitor reach, creator chat summary, and recent transactions.
- **Chatter / Employee Performance**: Verified employee-level sales and messaging performance sourced from Infloww's `/v1/employee-report/*` endpoints (`Total Attributed Sales`, `PPV Sales`, `Tips Sales`, `PPVs Unlocked`, `PPV Unlock Rate %`, `Golden Ratio %`, `Average PPV Sale Value`, `Direct Messages Sent`, and `Average Reply Time`) plus per-employee assigned creators and daily performance charts.
- **Marketing & Tracking-Link Analytics**: Performance tracking across **Tracking Links (`TRACKING`)**, **Free Trial Links (`TRIAL`)**, and **Profile Promotions (`CAMPAIGN`)** (`/v1/links`), including total clicks, new subscribers, conversion rate (`Subscribers ÷ Clicks × 100`), attributed gross/net revenue, EPC, AEPS, and individual acquired fan spending breakdown (`/v1/linkfans`).

### Read-Only & Security Guardrails
- **Strictly Read-Only Infloww Integration**: The backend `InflowwClient` enforces a request-level guard (`assertReadOnlyMethod`) that permits only `GET` requests against `https://openapi.infloww.com/v1` and blocks `POST`, `PUT`, `PATCH`, and `DELETE`.
- **Credential Isolation**: `INFLOWW_API_KEY` and `INFLOWW_AGENCY_OID` remain strictly on the NestJS backend and are never exposed, logged, or sent to the React client.
- **JWT Authentication**: All internal `/api/*` endpoints are protected by a global NestJS `JwtAuthGuard` using RFC 7519 HS256 Bearer tokens (`POST /api/auth/login`, `GET /api/auth/me`).

---

## 2. Technology Stack

### Backend (`/backend`)
- **NestJS v12** & **TypeScript**
- **`@nestjs/axios` & `axios`** — Centralized read-only HTTP client for Infloww OpenAPI v1.4
- **`@nestjs/config`** — Environment configuration management
- **`@nestjs/swagger`** — OpenAPI / Swagger UI documentation with Bearer JWT support
- **`class-validator` & `class-transformer`** — DTO query and body validation
- **Node.js `crypto`** — RFC 7519 HS256 JWT token signing, verification, and constant-time credential comparison
- **Jest & `ts-jest`** — Unit and business calculation test suites

### Frontend (`/frontend`)
- **React 19** & **TypeScript** (initialized with **Vite 8**)
- **Astryx Design System** (`@astryxdesign/core`, `@stylexjs/stylex`, `@astryxdesign/theme-neutral`, `@astryxdesign/cli`) — Accessible, themeable UI components with light and dark mode support
- **TanStack Query v5** (`@tanstack/react-query`) — Server-state caching, background refetching, and query invalidation
- **Axios** — Single reusable HTTP client with JWT Bearer request interceptor and 401 session expiration handling
- **Recharts v3** — Responsive `AreaChart`, `BarChart`, and Donut `PieChart` visualizations
- **Lucide React** — Consistent SaaS iconography
- **History API SPA Router** (`RouterProvider`) — Clean URL routing (`/login`, `/dashboard`, `/creators`, `/chatters`, `/earnings`, `/marketing`)

---

## 3. Architecture Overview

```text
MuseManagement/
├── backend/
│   ├── src/
│   │   ├── auth/             # JWT authentication (POST /api/auth/login, GET /api/auth/me, JwtAuthGuard)
│   │   ├── config/           # Environment variable configuration
│   │   ├── common/           # Global exception filter, DTOs, 31-day date window & cents-to-dollars utilities
│   │   ├── infloww/          # Read-only Infloww OpenAPI v1.4 client, service, types, constants & TTL cache
│   │   ├── dashboard/        # GET /api/dashboard/overview, /revenue, /performance
│   │   ├── creators/         # GET /api/creators, GET /api/creators/:id
│   │   ├── chatters/         # GET /api/chatters, GET /api/chatters/:id
│   │   ├── earnings/         # GET /api/earnings
│   │   ├── tracking-links/   # GET /api/tracking-links, GET /api/tracking-links/fans
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/              # Single Axios instance + typed domain API modules
│   │   ├── components/
│   │   │   ├── charts/       # Recharts RevenueChart, RevenueByCreatorChart, RevenueCategoryPieChart
│   │   │   ├── dashboard/    # StatCard (with null/Unavailable vs 0 distinction)
│   │   │   ├── tables/       # CreatorTable, ChatterTable, TrackingLinkTable
│   │   │   └── ui/           # DateRangePicker, LoadingSkeleton, EmptyState, ErrorState
│   │   ├── hooks/            # Reusable TanStack Query hooks
│   │   ├── layouts/          # DashboardLayout (Sidebar + Topbar + Theme Switcher)
│   │   ├── pages/            # LoginPage, DashboardPage, CreatorsPage, ChattersPage, EarningsPage, MarketingPage
│   │   ├── providers/        # AuthProvider, QueryProvider, RouterProvider, ThemeProvider (Astryx)
│   │   ├── types/            # Strict TypeScript interfaces
│   │   └── utils/            # Currency, number, percentage, date, and duration formatters
│   └── package.json
│
├── docs/
│   └── API_ANALYSIS.md       # Complete Phase 1 Infloww OpenAPI v1.4 analysis & schema reference
└── task/                     # Phase-by-phase implementation breakdown (Phase 1 – Phase 7)
```

---

## 4. Installation Instructions

### Prerequisites
- **Node.js** `v22+` and **npm** `v10+`

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

---

## 5. Environment Configuration

Create `backend/.env` based on [backend/.env.example](file:///d:/findjob/MuseManagement/backend/.env.example):

```env
PORT=3000

# Infloww OpenAPI v1.4 Credentials (Never exposed to frontend)
INFLOWW_API_URL=https://openapi.infloww.com/v1
INFLOWW_API_KEY=your_raw_infloww_api_key
INFLOWW_AGENCY_OID=your_infloww_agency_oid

# Frontend Origin for CORS
FRONTEND_URL=http://localhost:5173
CACHE_TTL_MS=60000

# JWT Authentication
JWT_SECRET=muse-agency-management-jwt-secret-key-2026-hs256
JWT_EXPIRES_IN_SECONDS=86400
ADMIN_EMAIL=admin@musemanagement.com
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Agency Administrator
```

Optional frontend environment override (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 6. Running Both Backend & Frontend Simultaneously (Root Scripts)

From the root directory (`d:\findjob\MuseManagement`), you can start, build, or test both the NestJS backend and React frontend together using [package.json](file:///d:/findjob/MuseManagement/package.json):

```bash
# Run both NestJS backend (http://localhost:3000) and Vite frontend (http://localhost:5173) at the same time
npm run dev

# Build both backend and frontend for production
npm run build

# Run backend unit tests
npm test

# Install dependencies for both backend and frontend
npm run install:all
```

---

## 7. Individual Backend Startup & Testing Instructions

```bash
cd backend

# Development mode (with file watching)
npm run start:dev

# Production build & start
npm run build
npm run start:prod

# Run unit & business calculation tests
npm test
```

- **Backend Base URL**: `http://localhost:3000/api`
- **Swagger API Documentation**: `http://localhost:3000/api/docs`

---

## 8. Individual Frontend Startup Instructions & Application Routes

```bash
cd frontend

# Start Vite development server
npm run dev

# Type-check and build production bundle
npm run build
```

- **Frontend URL Routes**:
  - `http://localhost:5173/login` — JWT Sign-In Page (Default demo credentials: `admin@musemanagement.com` / `Admin@123`)
  - `http://localhost:5173/dashboard` — Main Agency Overview Dashboard
  - `http://localhost:5173/creators` — Creator Management & Creator Detail Analytics
  - `http://localhost:5173/chatters` — Chatter / Employee Performance & Sales Attribution
  - `http://localhost:5173/earnings` — Revenue, Category Breakdown, Refunds & Transaction Logs
  - `http://localhost:5173/marketing` — Tracking Links, Free Trial Links & Profile Promotions Analytics

---

## 8. API Documentation References

- **Official Infloww OpenAPI Portal**: `https://infloww-openapi.stoplight.io/`
- **Phase 1 Technical Analysis**: [docs/API_ANALYSIS.md](file:///d:/findjob/MuseManagement/docs/API_ANALYSIS.md)
- **Local Backend Swagger UI**: `http://localhost:3000/api/docs`

---

## 9. Implemented Features

1. **JWT Authentication & Protected Routes**:
   - `POST /api/auth/login` issues an HS256 Bearer JWT; `GET /api/auth/me` verifies active sessions.
   - Astryx-powered `LoginPage` with validation, error banners, light/dark mode switch, and one-click demo credential auto-fill.
2. **Infloww v1.4 Read-Only Integration & Data Normalization**:
   - Verified authentication headers (`Authorization: <raw_api_key>` without `Bearer ` prefix + `x-oid: <agency_oid>`).
   - Automatic cursor pagination traversal, 31-day date window chunking (allowing users to query 90-day ranges seamlessly across Infloww's 31-day per-request limit), batching `creatorIds` and `employeeIds` in groups of 10, and cents-to-dollars monetary normalization.
3. **Strict Data Accuracy**:
   - Never silently substitutes missing or unavailable API data (`null`) with `0`.
   - Explicitly distinguishes `0` (`$0.00` / `0`), missing report data (`Unavailable`), and unexposed API fields.

---

## 10. Known Infloww API Limitations

As documented in [docs/API_ANALYSIS.md](file:///d:/findjob/MuseManagement/docs/API_ANALYSIS.md):
1. **No External Promotion Cost / Ad Spend Field**:
   - `GET /v1/links` provides clicks, subscribers, conversion rates, EPC, AEPS, and attributed gross/net revenue, but does not store external marketing spend (`Promotion Cost`). Cost per Subscriber and cost-based ROI are therefore explicitly labeled **Unavailable** in the UI rather than fabricated.
2. **Clicks Are Tracked Only on `TRACKING` Links**:
   - Only `linkType=TRACKING` (`TrackingLinkModel`) exposes `clickCount`, `subscriptionCVR`, and `epcGross/Net`. `TRIAL` (Free Trial Links) and `CAMPAIGN` (Profile Promotions) track `subCount`, `payingFansCount`, `spendClaim`, and `earningsGross/Net`.
3. **31-Day Maximum Window per Single Request**:
   - Infloww time-filtered endpoints cap each HTTP request to a 31-day span (up to 366 days in the past). Our NestJS backend automatically splits multi-month ranges into `<= 30-day` chunks.
4. **Optional API Key Scopes (`All Creators` & `Organization`)**:
   - Endpoints such as `GET /v1/all-creators` and `GET /v1/transaction-perf/details` require the `"All Creators"` scope on the agency's API key. If an API key only has the standard connected-creators scope and receives `403`, `InflowwService` gracefully falls back to `GET /v1/creators` and `GET /v1/employee-report/*` while reporting `allCreatorsScopeAvailable: false` in the response metadata.
5. **Upstream OnlyFans Synchronization Latency**:
   - Infloww documents an upstream sync delay of up to 1 hour for creators, transactions, and refunds; up to 2 hours for links; and up to 4 hours for link fans.
