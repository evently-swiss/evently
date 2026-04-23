# Evently — DB Backup & Restore Runbook

**Last updated:** 2026-03-23
**Author:** CTO
**Scope:** `evently_prod` and `evently_dev` on Infomaniak Managed PostgreSQL

---

## Overview

| Item | Value |
|------|-------|
| Engine | Infomaniak Managed PostgreSQL |
| Databases | `guestlist` (prod), `guestlist_dev` (dev) |
| Backup type | Automated daily snapshot (Infomaniak) + manual pre-deploy dumps |
| RPO | 24 hours (automated) / 0 on manual pre-deploy snapshot |
| RTO | ~30 minutes (restore + migrate + PM2 restart) |

---

## 1. Automated Backups (Infomaniak)

Infomaniak Managed PostgreSQL provides daily automated backups via the Cloud Manager console.

### Enable / verify backup schedule

1. Log in to [Infomaniak Manager](https://manager.infomaniak.com).
2. Navigate to **Cloud** → **Managed Databases** → select your PostgreSQL instance.
3. Under **Backups** (or **Sauvegardes**):
   - Confirm **Automated backups** is **enabled**.
   - Set **Retention** to **14 days** (max available on standard plans).
   - Note the backup window (prefer off-peak, e.g. 02:00–04:00 UTC).
4. Screenshot the confirmation and store it in `plans/infra-screenshots/` (optional but recommended for audit).

### What is backed up
- Full logical snapshot of the entire Postgres instance (all databases, roles, schemas).
- Point-in-time restore is available if your plan includes WAL archiving — confirm in the console.

---

## 2. Manual Pre-Deploy Snapshot

Run this **before every production deploy** that includes a Prisma schema migration.

```bash
# On the Infomaniak VPS, as the `deploy` user
DATE=$(date +%Y%m%d-%H%M%S)
PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d guestlist \
  --format=custom \
  --no-owner \
  --no-acl \
  -f "/home/deploy/backups/guestlist-pre-deploy-${DATE}.dump"

echo "Snapshot: /home/deploy/backups/guestlist-pre-deploy-${DATE}.dump"
```

**Variables** (from `.env` on the server):

| Variable | Description |
|----------|-------------|
| `DB_HOST` | Infomaniak Postgres host (from DATABASE_URL) |
| `DB_USER` | DB user |
| `DB_PASS` | DB password |

**Retention:** Keep pre-deploy snapshots for 30 days, then delete.

```bash
# Prune snapshots older than 30 days
find /home/deploy/backups -name "guestlist-pre-deploy-*.dump" -mtime +30 -delete
```

---

## 3. Restore Procedures

### 3a. Restore from Infomaniak automated backup

1. In Infomaniak Manager → **Managed Databases** → **Backups**.
2. Select the desired restore point (date/time).
3. Click **Restore** → choose restore to **same instance** (overwrites) or **new instance**.
   - For production recovery: restore to new instance, verify, then swap `DATABASE_URL`.
   - For dev recovery: restore to same instance is acceptable.
4. Monitor restore progress in the console (~5–15 min for typical DB size).
5. After restore, run application health check:
   ```bash
   cd /var/www/evently
   npx prisma migrate status
   ```
6. If migrations are pending (e.g. restored to older point), run:
   ```bash
   npx prisma migrate deploy
   pm2 reload evently-prod
   ```

### 3b. Restore from manual pre-deploy dump

```bash
# Stop app to prevent writes during restore (optional but recommended for prod)
pm2 stop evently-prod

# Drop and recreate the target database
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -c "DROP DATABASE IF EXISTS guestlist_restore;"
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -c "CREATE DATABASE guestlist_restore;"

# Restore the dump
PGPASSWORD="$DB_PASS" pg_restore \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d guestlist_restore \
  --no-owner \
  --no-acl \
  /home/deploy/backups/guestlist-pre-deploy-<DATE>.dump

# Verify row counts / spot-check
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d guestlist_restore -c "\dt"

# Swap DATABASE_URL in .env to point to guestlist_restore
# Then restart app
pm2 start evently-prod
```

> **Note:** Prefer renaming (`ALTER DATABASE ... RENAME TO`) over dropping prod database
> directly. Rename prod to `guestlist_old`, rename restore to `guestlist`, swap back if needed.

---

## 4. RPO / RTO Summary

| Scenario | Recovery Point Objective | Recovery Time Objective |
|----------|--------------------------|-------------------------|
| Infomaniak automated restore | Up to 24 hours data loss | ~30 min (restore) + ~5 min (migrate + restart) |
| Manual pre-deploy snapshot restore | 0 data loss at deploy time | ~20 min (pg_restore + restart) |
| Infomaniak PITR (if WAL enabled) | Minutes (depends on WAL interval) | ~30–60 min |

---

## 5. Verification Checklist

Run after any restore:

- [ ] `prisma migrate status` shows no pending migrations (or apply them deliberately)
- [ ] App responds at `/` with HTTP 200
- [ ] Guest signup form submits successfully (smoke test)
- [ ] Check event count via admin or DB query: `SELECT COUNT(*) FROM "Event";`
- [ ] PM2 shows no restarts: `pm2 status`

---

## 6. Backup Storage Layout (VPS)

```
/home/deploy/backups/
  guestlist-pre-deploy-YYYYMMDD-HHMMSS.dump   ← manual snapshots
```

Ensure the `backups/` directory exists:

```bash
mkdir -p /home/deploy/backups
chmod 700 /home/deploy/backups
```

---

## 7. Contacts / Escalation

| Issue | Action |
|-------|--------|
| Infomaniak console inaccessible | Contact Infomaniak support |
| `pg_dump` / `pg_restore` errors | Check DB connectivity and credentials in `.env` |
| Restore fails mid-way | Restore to separate DB first; keep prod live |
| Data corruption suspected | Stop app writes immediately; escalate to CEO |
