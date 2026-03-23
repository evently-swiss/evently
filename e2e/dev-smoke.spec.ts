import { expect, test } from '@playwright/test';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

test('dev smoke: admin login to guest signup flow', async ({ page }) => {
  const adminEmail = requiredEnv('E2E_ADMIN_EMAIL');
  const adminPassword = requiredEnv('E2E_ADMIN_PASSWORD');

  const runId = Date.now();
  const eventName = `Smoke Event ${runId}`;
  const eventSlug = `smoke-event-${runId}`;
  const signupSlug = `smoke-signup-${runId}`;
  const guestFirstName = 'Smoke';
  const guestLastName = `Guest${runId}`;
  const guestEmail = process.env.E2E_GUEST_EMAIL || `smoke-${runId}@example.com`;

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /Sign in to your account/i })).toBeVisible();

  await page.getByLabel('Email address').fill(adminEmail);
  await page.getByLabel('Password').fill(adminPassword);
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/\/admin(\/events)?/);

  await page.goto('/admin/events/new');
  await expect(page.getByRole('heading', { name: /Create New Event/i })).toBeVisible();

  await page.locator('#name').fill(eventName);
  await page.locator('#slug').fill(eventSlug);
  await page.locator('#date').fill('2026-12-31');
  await page.locator('#status').selectOption('PUBLISHED');
  await page.getByRole('button', { name: 'Create Event' }).click();

  await page.waitForURL('/admin/events');
  await page.getByRole('link', { name: eventName, exact: false }).first().click();
  await page.waitForURL(/\/admin\/events\/.+/);
  const eventDetailUrl = page.url();

  await page.getByRole('button', { name: 'New Link' }).click();
  await expect(page.getByRole('heading', { name: /Create Signup Link/i })).toBeVisible();

  await page.locator('input#slug').fill(signupSlug);
  await page.locator('input#title').fill('Smoke Link');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText(`/s/${signupSlug}`)).toBeVisible();

  await page.goto(`/s/${signupSlug}`);
  await expect(page.getByRole('heading', { name: eventName })).toBeVisible();

  await page.locator('#firstName').fill(guestFirstName);
  await page.locator('#lastName').fill(guestLastName);
  await page.locator('#email').fill(guestEmail);
  await page.getByRole('button', { name: /Request access/i }).click();

  await page.waitForURL(new RegExp(`/s/${signupSlug}/confirmation\\?token=`));

  await page.goto(eventDetailUrl);
  await expect(page.getByText(`${guestFirstName} ${guestLastName}`)).toBeVisible();
});
