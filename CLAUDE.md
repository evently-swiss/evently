# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Quick Commands

```bash
# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Tests
npm test                       # Vitest unit tests (run once)
npm run test:watch             # Watch mode
npm run test:e2e               # Playwright E2E
npm run test:e2e:dev-smoke     # Smoke test only

# Database
npx prisma generate            # Regenerate client after schema changes
npx prisma migrate dev         # Create + apply migration
npx prisma studio              # Database GUI

# Local DB via Docker
docker-compose up -d
```

## Architecture

**Next.js 15 App Router** with TypeScript (strict), Prisma (PostgreSQL), NextAuth v5, Tailwind CSS v4.

All mutations use **Server Actions** co-located in `page.tsx` or sibling `actions.ts` files. There is no separate REST layer except:
- `/api/auth/[...nextauth]` — NextAuth
- `/api/internal/*` — internal APIs (scraper ingest, reconciliation, subscription check)
- `/api/stripe/*` and `/api/webhooks/stripe/` — Stripe billing

### Route Structure & Role Separation

| Prefix | Role | Purpose |
|--------|------|---------|
| `/` | Public | Landing page, login, register, pricing |
| `/s/[eventSlug]/[linkSlug]` | Public | Guest signup form (no login required) |
| `/admin/*` | SUPER_ADMIN | Events, users, venues, scraper queue, subscriptions |
| `/promoter/*` | PROMOTER | Own events, signup links, guest management |
| `/door/[eventId]` | ENTRY_STAFF | Check-in with QR scanning |
| `/account/billing` | SUPER_ADMIN | Subscription management |
| `/auth/*` | Public | Email verification, password setup/reset |

`middleware.ts` gates routes by auth status. Role-based redirects happen post-login in `src/auth.config.ts`.

### Data Model

16 Prisma models. Core chain: `User` → `Event` ← `SignupLink` → `Guest` ← `CheckIn`

Key models:
- **User** roles: `SUPER_ADMIN`, `PROMOTER`, `ENTRY_STAFF`
- **Event** sources: `INTERNAL` or `SCRAPED`; statuses: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- **SignupLink** types: `GENERAL`, `PROMOTER`, `PERSONAL` — controls field visibility (`HIDDEN | OPTIONAL | REQUIRED`), per-link quotas, max plus-ones
- **Guest** — belongs to both Event and SignupLink; `CheckIn` is a separate model for multi-entry tracking
- **ScrapedEvent** — raw ingest from Python scraper; sync statuses: `NEW`, `RECONCILED`, `DUPLICATE`, `FAILED`
- **OperatorSubscription** — Stripe subscription for SUPER_ADMIN access
- **LoungeLayout / LoungeBox** — canvas/SVG floor plans per venue, with event-specific overrides

### Key Files

| File | Purpose |
|------|---------|
| `src/auth.config.ts` | NextAuth config, JWT callbacks, role redirects |
| `src/middleware.ts` | Route protection |
| `src/lib/auth.ts` | Credential validation, session helpers |
| `src/lib/guest-utils.ts` | Phone normalization (+41), duplicate detection |
| `src/lib/definitions.ts` | Shared TypeScript types |
| `src/lib/subscription.ts` | Subscription status helpers |
| `src/lib/stripe.ts` | Stripe client |
| `prisma/schema.prisma` | Full data model |
| `src/app/components/modals/` | AddGuest, EditGuest, ImportGuests (CSV/PapaParse), LinkModal |
| `src/app/components/SignupForm.tsx` | Public signup with conditional field rendering |
| `src/app/api/internal/scraped-events/` | Scraper ingest endpoint (API key auth) |
| `ecosystem.config.js` | PM2 config (prod port 3000, dev port 3001) |

## Environment Variables

Required (see `.env.example`):
- `DATABASE_URL` — pooled connection
- `DIRECT_URL` — non-pooled (Prisma migrations only)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `APP_URL`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `EMAIL_SMTP_HOST/PORT/USER/PASS/FROM` — SMTP fallback
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `INTERNAL_API_KEY` — Bearer token for scraper endpoint
- `SUPER_ADMIN_EMAIL` — used for seeding

## Testing

Unit tests use Vitest with mocked Prisma (`src/test/mocks/prisma.ts`) and auth helpers (`src/test/mocks/auth.ts`).

E2E tests use Playwright. The smoke test (`e2e/dev-smoke.spec.ts`) validates the full flow: login → create event → create signup link → guest signup → verify in guest list.

E2E environment variables: `PLAYWRIGHT_BASE_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.

See `docs/testing.md` for patterns.

## Deployment

- **VPS**: Infomaniak, Node.js 20, PM2
- **prod** → port 3000 → `evently.swiss`
- **dev** → port 3001 → `dev.evently.swiss`
- CI/CD: GitHub Actions (`.github/workflows/deploy.yml`) → SSH → `npm ci` → `prisma migrate deploy` → `npm run build` → `pm2 reload`
- Deploy + rollback runbook: `infra/runbook-deploy-rollback.md`
- DB backup + restore runbook: `infra/runbook-db-backup-restore.md`

### GitHub Actions Secrets

Required per environment (`production` / `development`):

| Secret | Value |
|--------|-------|
| `INFOMANIAK_HOST` | VPS IP |
| `INFOMANIAK_USER` | SSH deploy user |
| `INFOMANIAK_SSH_KEY` | Private SSH key (PEM) |
| `DATABASE_URL` | Pooled Postgres connection string |
| `DIRECT_URL` | Non-pooled (for Prisma migrations) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://evently.swiss` or `https://dev.evently.swiss` |
| `APP_URL` | Same as NEXTAUTH_URL |
| `AUTH_TRUST_HOST` | `true` |
| `RESEND_API_KEY` | From Resend dashboard |
| `RESEND_FROM_EMAIL` | `noreply@evently.swiss` |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `INTERNAL_API_KEY` | Bearer token for scraper endpoint |

### Branching Policy

- PRs always target `dev`
- `main` is production-only; promoted by CTO approval
- Never push directly to `main`

## Patterns & Conventions

- **Server Actions** for all mutations — avoid adding REST endpoints unless for external callers
- **Zod** for input validation at API boundaries
- **Swiss phone format** — always normalize via `lib/guest-utils.ts` before storing
- **Duplicate detection** — check name + email + phone before inserting guests
- **Prisma singleton** — always import from `lib/prisma.ts`, never instantiate directly
- When adding a new route, add it to the role table in `middleware.ts`
- Migrations: use `npx prisma migrate dev --name <descriptive-name>`
