# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server

# Production build (generates Prisma client first)
npm run build

# Lint
npm run lint

# Database (Prisma)
npx prisma generate         # Regenerate client after schema changes
npx prisma migrate dev       # Create and apply a migration
npx prisma studio            # Open DB GUI
```

Local PostgreSQL is available via Docker:
```bash
docker-compose up -d
```

Environment variables follow `.env.example`: `DATABASE_URL` (direct), `DATABASE_URL_UNPOOLED` (for migrations), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.

## Architecture

**Next.js 15 App Router** with TypeScript, Prisma (PostgreSQL/Supabase), NextAuth v5, and Tailwind CSS v4.

### Route Structure & Role Separation

| Prefix | Role | Purpose |
|--------|------|---------|
| `/` | Public | Landing page, login |
| `/s/[slug]` | Public | Guest signup form (per SignupLink) |
| `/admin/*` | ADMIN | Full system: events, users, stats |
| `/promoter/*` | PROMOTER | Own events, signup links, guest management |
| `/door/[eventId]` | ENTRY_STAFF | Guest check-in interface |

Middleware (`middleware.ts`) gates routes by auth status. Role-based redirects happen post-login in the NextAuth `signIn` callback (`lib/auth.ts`).

### Data Model

Five core Prisma models: `User` → `Event` ← `SignupLink` → `Guest` ← `CheckIn`

- **User** roles: `ADMIN`, `PROMOTER`, `ENTRY_STAFF`
- **SignupLink** types: `GENERAL`, `PROMOTER`, `PERSONAL` — each link controls which fields are visible/required (`HIDDEN | OPTIONAL | REQUIRED`) and has its own guest quota
- **Guest** records belong to both an Event and a SignupLink; check-in is tracked via a separate `CheckIn` model
- Phone numbers are normalized to Swiss format (+41) in `lib/guest-utils.ts`; duplicate detection checks name, email, and phone

### Server Actions

Mutations are handled via Next.js Server Actions co-located in each route's `page.tsx` or a sibling `actions.ts`. There is no separate REST API layer (except `/api/auth/[...nextauth]` and `/admin/events/[id]/export`).

### Key Files

- `lib/auth.ts` — NextAuth config, credential validation, JWT/session with role
- `lib/guest-utils.ts` — Phone normalization, duplicate detection logic
- `lib/definitions.ts` — Shared TypeScript types
- `prisma/schema.prisma` — Full data model
- `components/modals/` — AddGuest, EditGuest, LinkModal, ImportGuests (CSV via PapaParse)
- `components/SignupForm.tsx` — Public-facing signup with conditional field rendering
