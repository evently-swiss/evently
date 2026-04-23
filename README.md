# Evently

Unified nightlife platform for the Swiss nightlife scene — guest management, event discovery, lounge reservations, and venue operations in a single Next.js application.

**Production:** [evently.swiss](https://evently.swiss) | **Dev:** [dev.evently.swiss](https://dev.evently.swiss) | **Version:** 0.2.1

---

## What it does

- **Guest Management** — Signup links per event, CSV import, duplicate detection, Swiss phone normalization, RSVP tracking
- **Door Check-in** — QR code scanning for entry staff, multi-entry/exit tracking
- **Lounge / VIP** — Visual floor plan editor (canvas/SVG), table reservations, min consumption tracking
- **Promoter Portal** — Promoters manage their own events and guest lists
- **Event Scraping** — Python scraper ingest via internal API, admin review queue
- **Subscriptions** — Stripe billing for operator access, featured event promotions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Actions) |
| Language | TypeScript 5 (strict) |
| Database | PostgreSQL 15 + Prisma ORM |
| Auth | NextAuth v5 (JWT, role-based) |
| Styling | Tailwind CSS v4 |
| Email | Resend API + SMTP fallback |
| Payments | Stripe |
| Testing | Vitest (unit) + Playwright (E2E) |
| Runtime | Node.js 20 + PM2 |

---

## Local Development

### Prerequisites

- Node.js 20 (use `.nvmrc`)
- Docker (for local PostgreSQL)

### Setup

```bash
# 1. Start local database
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, etc.

# 4. Run migrations and seed
npx prisma migrate dev
npx prisma db seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful commands

```bash
npm run dev              # Dev server (port 3000)
npm run build            # Production build
npm run lint             # ESLint
npm test                 # Vitest unit tests
npm run test:watch       # Unit tests in watch mode
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:dev-smoke  # Smoke test only

npx prisma generate      # Regenerate Prisma client
npx prisma migrate dev   # Create + apply migration
npx prisma studio        # Database GUI
```

---

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled PostgreSQL connection |
| `DIRECT_URL` | Non-pooled connection (migrations only) |
| `NEXTAUTH_SECRET` | JWT signing key |
| `NEXTAUTH_URL` | Auth redirect base URL |
| `APP_URL` | Base URL for email links |
| `RESEND_API_KEY` | Email via Resend |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `INTERNAL_API_KEY` | Bearer token for scraper ingest |

---

## Role Structure

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Full platform: events, users, venues, scraper, subscriptions |
| `PROMOTER` | Own events, signup links, guest lists |
| `ENTRY_STAFF` | Door check-in only (`/door/[eventId]`) |

Routes are protected in `middleware.ts`. Role redirects happen post-login in `lib/auth.ts`.

---

## Deployment

Hosted on an Infomaniak VPS managed by PM2.

- `npm run build` → `pm2 reload evently-prod` (port 3000)
- Dev instance runs on port 3001 → `dev.evently.swiss`
- CI/CD via GitHub Actions (see `.github/workflows/deploy.yml`)
- Full runbook: [`infra/runbook-deploy.md`](infra/runbook-deploy.md)

### Branching Policy

- Open all PRs against `dev`
- `main` is production-only, updated via CTO-approved release promotion
- Do **not** open PRs directly against `main`

---

## Testing

See [`docs/testing.md`](docs/testing.md) for patterns and setup.

E2E smoke test validates: login → create event → create link → guest signup → verify in guest list.
