# Zorvyn FinanceOps Dashboard

A production-grade finance operations backend + frontend, built as a Zorvyn-style assignment submission.

---

## Why This Matches Zorvyn's Work

Zorvyn builds **secure, compliance-aware fintech backends** for startups and SMEs — focusing on payments, transaction visibility, and unified dashboards for finance teams. This project is modelled as exactly that:

- The **data model** mirrors a startup's accounting ledger (income, expenses, refunds, gateway fees) across payment channels (UPI, card, netbanking, bank transfer) — not a generic personal-finance app.
- The **dashboard APIs** are designed as finance-ops endpoints a real startup would consume: KPI summary, cash-flow timeline, category breakdown, and an anomaly monitor.
- **Role-based access control** mirrors real finance team structures: Viewer (clerk), Analyst, Admin (finance manager) with progressively increasing permissions — enforced at the middleware layer using JWT.
- The **anomaly monitor** (`/dashboard/anomalies`) flags high-value transactions (P90 threshold), month-over-month expense spikes, elevated refund rates, and reversed transactions — a simplified version of Zorvyn's fraud-monitoring-centric style.
- **Soft deletes**, structured error responses, input validation, rate limiting, and pagination are all implemented as they would be in a production system.

---

| **Frontend** | https://zorvyn-drab.vercel.app |
| **Backend API** | https://zorvyn-9ben.onrender.com |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | SQLite (dev) / PostgreSQL-compatible |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | Zod |
| Logging | Winston |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| HTTP client | Axios |

---

## Project Structure

```
zorvyn/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Data model
│   └── src/
│       ├── controllers/            # Request handlers
│       │   ├── auth.controller.ts
│       │   ├── user.controller.ts
│       │   ├── record.controller.ts
│       │   └── dashboard.controller.ts
│       ├── services/               # Business logic
│       │   ├── auth.service.ts     # Login, register, JWT
│       │   ├── user.service.ts     # User management (admin)
│       │   ├── record.service.ts   # CRUD + filtering + soft delete
│       │   └── dashboard.service.ts # KPIs, cashflow, categories, anomalies
│       ├── middleware/
│       │   ├── auth.middleware.ts  # JWT verify + requireRole
│       │   ├── error.middleware.ts # Global error handler
│       │   └── validate.middleware.ts # Zod validation
│       ├── routes/                 # Express routers
│       ├── utils/                  # prisma, logger, response helpers, schemas
│       ├── types/                  # Shared TypeScript types
│       └── scripts/seed.ts        # Database seed with realistic data
└── frontend/
    └── src/
        ├── pages/                  # One page per dashboard section
        ├── components/             # UI primitives + layout + modals
        ├── hooks/                  # Data fetching hooks
        ├── context/                # Auth context
        ├── lib/                    # API client, formatters
        └── types/                  # TypeScript interfaces
```

---

## Setup & Running

### Prerequisites

- Node.js 18+
- npm or yarn

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed        # creates demo users + 120 realistic transactions
npm run dev         # starts on :3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev         # starts on :5173
```

The Vite dev server proxies `/api` → `http://localhost:3001`.

---

## Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | admin@zorvyn.com | Password123 | Full access |
| **Analyst** | analyst@zorvyn.com | Password123 | Dashboard + records (read) |
| **Viewer** | viewer@zorvyn.com | Password123 | Summary + transactions only |

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | Register new user |
| POST | `/api/v1/auth/login` | — | Login, returns JWT |
| GET | `/api/v1/auth/me` | Any | Current user info |

### Users (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/users` | List all users (paginated) |
| GET | `/api/v1/users/:id` | Get user by ID |
| PATCH | `/api/v1/users/:id` | Update name, status, or role |

### Financial Records

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/records` | Any | List records with filters + pagination |
| GET | `/api/v1/records/:id` | Any | Get single record |
| POST | `/api/v1/records` | Admin | Create record |
| PUT | `/api/v1/records/:id` | Admin | Update record |
| DELETE | `/api/v1/records/:id` | Admin | Soft delete |

**Query filters for GET /records:**
```
?page=1&limit=20
&from_date=2026-01-01&to_date=2026-03-31
&type=EXPENSE
&category=salary
&status=SETTLED
&channel=UPI
&search=payroll
```

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/dashboard/summary` | Any | KPIs + recent activity |
| GET | `/api/v1/dashboard/cashflow` | Analyst+ | Monthly cash-flow timeline |
| GET | `/api/v1/dashboard/categories` | Analyst+ | Category-wise breakdown |
| GET | `/api/v1/dashboard/anomalies` | Analyst+ | Anomaly detection |

---

## Transaction Data Model

```
type:     INCOME | EXPENSE | REFUND | FEE
category: sales, subscription_revenue, investor_funding,
          salary, rent, vendor_payment, advertising,
          customer_refund, payment_gateway_refund,
          payment_gateway_fee, bank_fee, ...
status:   SETTLED | PENDING | REVERSED
channel:  UPI | CARD | NETBANKING | BANK_TRANSFER
```

---

## Access Control

Implemented as an explicit `requireRole` middleware factory:

```typescript
export const requireRole = (allowedRoles: RoleName[]) => (req, res, next) => {
  if (!req.user?.roles.some(r => allowedRoles.includes(r))) {
    return next(new AppError('Access denied.', 403));
  }
  next();
};

// Usage in routes:
router.delete('/:id', requireAdmin, recordController.delete);
router.get('/cashflow', requireAnalystOrAdmin, dashboardController.getCashflow);
```

| Role | Permissions |
|---|---|
| Viewer | GET /records, GET /dashboard/summary |
| Analyst | Viewer + cashflow, categories, anomalies |
| Admin | All of the above + create/update/delete records + manage users |

---

## Anomaly Detection Logic

The `/dashboard/anomalies` endpoint implements four checks:

1. **P90 high-amount transactions** — flags any transaction above the 90th percentile amount across all records.
2. **Month-over-month expense spike** — flags if current month expenses are >30% higher than last month.
3. **Refund rate** — flags if total refunds exceed 5% of total income.
4. **Reversed transactions** — lists all records with status `REVERSED`.

---

## Assumptions & Design Decisions

- **SQLite** used for zero-config local development. The Prisma schema is fully compatible with PostgreSQL — just change `DATABASE_URL` and `provider = "postgresql"`.
- **Soft delete**: records are never physically deleted — `is_deleted = true` hides them from all queries while preserving audit history.
- **Single role per user** for simplicity, though the `UserRole` many-to-many table supports multi-role if needed.
- **Amount is always positive** — the sign (+/-) is inferred from `type` (INCOME vs EXPENSE).
- Timestamps (`created_at`, `updated_at`) are managed by Prisma and not editable via API.
