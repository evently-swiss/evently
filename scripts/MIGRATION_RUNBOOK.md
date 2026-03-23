# Nightpilot Migration Runbook

## Prerequisites

1. MongoDB data exported: `scripts/migration-data/nightpilot_*.json`
2. Venue records seeded in target DB (slugs must match nightpilot venue slugs)
3. At least one `SUPER_ADMIN` user in target DB
4. `DATABASE_URL` / `DIRECT_URL` pointing at target DB

## Staging Run

```bash
# 1. Export from nightpilot MongoDB (on Pi or MongoDB host)
MONGO_HOST=<host> bash scripts/export-nightpilot.sh

# 2. Copy migration-data/*.json to this machine if needed

# 3. Set DATABASE_URL to staging
export DATABASE_URL=postgresql://...staging...

# 4. Dry run first — verify output, no DB writes
npx ts-node --project tsconfig.json scripts/migrate-nightpilot.ts --dry-run

# 5. Live run
npx ts-node --project tsconfig.json scripts/migrate-nightpilot.ts

# 6. Validate
# - Check event count: SELECT COUNT(*) FROM "Event" WHERE source='INTERNAL';
# - Check lounge reservations: SELECT COUNT(*) FROM "LoungeReservation";
# - Check guests: SELECT COUNT(*) FROM "Guest";
# - Spot-check 5 lounge reservations visually in /admin
```

## Production Run

```bash
# Same steps as above but with DATABASE_URL pointing at production
# Run in a transaction-safe way (script uses individual creates, not bulk)
# Keep nightpilot MongoDB alive for 2-week parallel run before decommissioning
```

## Rollback

If migration produces bad data:
```sql
-- Remove all INTERNAL events added after a known cutoff
DELETE FROM "Event" WHERE source='INTERNAL' AND "createdAt" > '<migration-timestamp>';
```

Or restore from DB backup taken before migration.
