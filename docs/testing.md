# Testing

## Test runner

This project uses `vitest`.

Commands:

- `npm test` runs all tests once and succeeds when no tests exist yet.
- `npm run test:watch` starts watch mode for local development.
- `npm run test:e2e` runs Playwright tests under `e2e/`.
- `npm run test:e2e:dev-smoke` runs the deploy smoke test against the configured base URL.

## Setup

Global setup is in `src/test/setup.ts`. It currently restores Vitest mocks after each test.

## Prisma test utilities

Use one of these patterns depending on what you are validating:

1. Fast unit tests with mocked Prisma client
   - Import `createPrismaMock` from `src/test/mocks/prisma.ts`.
   - Stub only the calls used by the unit under test (`findUnique`, `create`, etc.).
   - Mock `@/lib/prisma` in the test file to return that mock instance.

2. Integration tests with a real test database
   - Point `DATABASE_URL` at an isolated test Postgres instance.
   - Run `npx prisma migrate deploy` (or `prisma db push` for disposable local runs) before tests.
   - Seed only minimal fixtures and truncate between tests to avoid cross-test coupling.

## Auth helpers

`src/test/mocks/auth.ts` provides helpers for mocking session state in tests that depend on roles or auth checks.

## Playwright smoke test

`e2e/dev-smoke.spec.ts` validates this flow against a deployed environment:

1. Admin logs in at `/login`
2. Admin creates a published event
3. Admin creates a signup link for that event
4. Guest signs up via `/s/[slug]`
5. Admin sees that guest in the event guest list

Required env vars:

- `PLAYWRIGHT_BASE_URL` (for CI deploy smoke this is `https://dev.evently.swiss`)
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

Optional:

- `E2E_GUEST_EMAIL` (defaults to a generated unique `example.com` email)
