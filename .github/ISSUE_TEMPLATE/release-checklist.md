---
name: Release Checklist
about: Track a deployment with preflight checks, rollout steps, and rollback notes.
title: "release: <env> <version/date>"
labels: ["release"]
assignees: []
---

## Release Context

- Environment: `development` or `production`
- Branch:
- Commit/tag:
- Owner:
- Window:

## Prerequisites

- [ ] GitHub Environment exists for target (`development` or `production`)
- [ ] Required secrets are configured: `INFOMANIAK_HOST`, `INFOMANIAK_USER`, `INFOMANIAK_SSH_KEY`, `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- [ ] PM2 app exists on VPS for target (`evently-dev` or `evently-prod`)

## Deploy

- [ ] Push branch (`dev` for development, `main` for production)
- [ ] CI passed (lint + build)
- [ ] Deploy job ran SSH commands:
  - [ ] `git fetch && git checkout <branch> && git pull`
  - [ ] `npm ci` (omit dev deps on `main`)
  - [ ] `npx prisma generate && npx prisma migrate deploy`
  - [ ] `npm run build`
  - [ ] `pm2 reload evently-<env> --update-env`

## Verify

- [ ] Open target URL (`https://dev.evently.swiss` or `https://evently.swiss`)
- [ ] Check logs: `pm2 logs evently-<env> --lines 100`
- [ ] Smoke test auth via login page

## Rollback (if needed)

- [ ] `ssh` to VPS
- [ ] `cd /var/www/evently && git checkout <previous-tag-or-commit> && npm ci && npm run build`
- [ ] `pm2 reload evently-<env> --update-env`
- [ ] Document rollback reason and follow-up actions

## Troubleshooting Notes

- Build issues (Node 20, `npm ci`, Prisma generate):
- App 502 checks (Nginx upstreams, `pm2 status`):
- Migration recovery actions (`prisma migrate resolve`, if used):

## Sign-off

- [ ] Release owner sign-off
- [ ] Founding Engineer sign-off (app fixes)
- [ ] CEO/Board sign-off when secret/sender changes were involved
