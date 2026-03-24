# Evently — Deploy & Rollback Runbook

**Last updated:** 2026-03-22
**Author:** CTO
**Scope:** Production (`evently.swiss`) and Development (`dev.evently.swiss`) on Infomaniak VPS

---

## 1. Normal Deploy (automated via GitHub Actions)

All feature work must merge via PRs targeting `dev`.
`main` is release-only and reserved for CTO-approved production promotion.

- PR checks run for `dev` only.
- Pushes to `dev` deploy development automatically.
- Pushes to `main` deploy production (release path only).

| Branch | Environment      | Domain                   | PM2 App       |
|--------|------------------|--------------------------|---------------|
| `main` | production       | https://evently.swiss    | evently-prod  |
| `dev`  | development      | https://dev.evently.swiss| evently-dev   |

> Branch policy: Never open PRs to `main`. Use `dev` as the integration branch for all normal work.

**Pipeline steps:**
1. Build & Lint (`ubuntu-latest`)
2. SSH into VPS → `git pull` → `npm ci` → `prisma migrate deploy` → `npm run build` → `pm2 reload <app>`

**Required GitHub Secrets per environment:**

| Secret              | Notes                                  |
|---------------------|----------------------------------------|
| `INFOMANIAK_HOST`   | VPS IP address                         |
| `INFOMANIAK_USER`   | SSH deploy user (e.g. `deploy`)        |
| `INFOMANIAK_SSH_KEY`| Private SSH key (no passphrase)        |
| `DATABASE_URL`      | Postgres connection string (pooled)    |
| `DIRECT_URL`        | Postgres direct connection (Prisma)    |
| `NEXTAUTH_SECRET`   | Random 32-byte secret                  |
| `NEXTAUTH_URL`      | Full URL e.g. `https://evently.swiss`  |
| `AUTH_TRUST_HOST`   | `true`                                 |
| `RESEND_API_KEY`    | From Resend dashboard                  |
| `RESEND_FROM_EMAIL` | `noreply@evently.swiss`                |

---

## 2. Manual Deploy (emergency / first-time setup)

SSH into VPS:

```bash
ssh deploy@<VPS_IP>
cd /var/www/evently

# Choose branch
git fetch origin
git checkout main   # or dev
git pull origin main  # or dev

npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

# Reload PM2
pm2 reload evently-prod   # production
# or
pm2 reload evently-dev    # development
```

---

## 3. First-Time VPS Setup (dev environment)

Run once on the VPS to enable `dev.evently.swiss`:

```bash
# 1. Install Nginx config
sudo cp /var/www/evently/infra/nginx-dev.conf /etc/nginx/sites-enabled/evently-dev
sudo nginx -t && sudo systemctl reload nginx

# 2. Obtain TLS certificate
sudo certbot --nginx -d dev.evently.swiss

# 3. Register PM2 apps (from ecosystem config)
cd /var/www/evently
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the printed command to enable on reboot

# 4. Set required env vars for evently-dev in the shell before building
#    (CI/CD injects them; for manual: use a .env.local or inline exports)
```

---

## 4. Smoke Test Checklist

Run after every deploy:

```bash
# Production
curl -s -o /dev/null -w "%{http_code}" https://evently.swiss/
# Expected: 200

# Development
curl -s -o /dev/null -w "%{http_code}" https://dev.evently.swiss/
# Expected: 200

# PM2 status
pm2 list
# Both apps should show: online

# Logs (last 50 lines)
pm2 logs evently-prod --lines 50
pm2 logs evently-dev --lines 50
```

Manual checks:
- [ ] Homepage loads without JS errors
- [ ] `/api/auth/session` returns JSON (not 500)
- [ ] Login page renders
- [ ] Database connectivity (login attempt reaches Prisma without error)

---

## 5. Rollback

### Option A — Revert via Git (preferred)

```bash
# On GitHub: revert the commit or push the previous tag
git revert HEAD
git push origin main   # triggers CI/CD deploy of reverted code
```

### Option B — Manual rollback on VPS

```bash
ssh deploy@<VPS_IP>
cd /var/www/evently

# Find last known good commit
git log --oneline -10

# Checkout that commit
git checkout <sha>

npm ci
npx prisma generate
npm run build  # set env vars first if running manually

pm2 reload evently-prod  # or evently-dev
```

### Option C — Database rollback

Prisma does not support automatic down migrations. If a bad migration was applied:

```bash
# 1. Restore from Infomaniak managed PG backup (via Infomaniak console)
# 2. Or manually revert schema changes — write and run a reverse migration:
npx prisma migrate dev --name revert_<feature>
```

> **Warning:** Only roll back the database if you have confirmed data integrity issues. Coordinate with the CEO before any DB rollback in production.

---

## 6. Uptime & Monitoring

- PM2 auto-restarts crashed processes.
- Check PM2 status: `pm2 list`
- Check Nginx: `sudo systemctl status nginx`
- Logs: `/var/log/pm2/` and `/var/log/nginx/`

Alerting (future): integrate UptimeRobot or Betteruptime for HTTP probe on both domains.

---

## 7. Contacts

| Role  | Escalation path                   |
|-------|-----------------------------------|
| CTO   | Architecture, CI/CD, server ops   |
| FE    | App code, auth, build failures    |
| Board | Secrets rotation, domain/DNS      |
