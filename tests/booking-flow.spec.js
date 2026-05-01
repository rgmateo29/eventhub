import { test, expect } from '@playwright/test';

const BASE_URL      = 'https://eventhub.rahulshettyacademy.com';
const USER_EMAIL    = 'rahulshetty1@gmail.com';
const USER_PASSWORD = 'Magiclife1!';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('you@email.com').fill(USER_EMAIL);
  await page.getByLabel('Password').fill(USER_PASSWORD);
  await page.locator('#login-btn').click();
  await expect(page.getByRole('link', { name: /Browse Events/i }).first()).toBeVisible();
}

async function clearBookings(page) {
  await page.goto(`${BASE_URL}/bookings`);
  const isEmpty = await page.getByText('No bookings yet').isVisible().catch(() => false);
  if (isEmpty) return;

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /clear all bookings/i }).click();
  await expect(page.getByText('No bookings yet')).toBeVisible();
}

/**
 * Books the first available event on /events.
 * Returns { bookingRef, eventTitle }.
 * Precondition: user must already be logged in.
 */
async function bookFirstAvailableEvent(page, quantity = 1) {
  await page.goto(`${BASE_URL}/events`);

  const firstCard = page.getByTestId('event-card').filter({
    has: page.getByTestId('book-now-btn'),
  }).first();
  await expect(firstCard).toBeVisible();

  const eventTitle = (await firstCard.locator('h3').textContent())?.trim() ?? '';
  console.log(`Booking event: "${eventTitle}" (qty: ${quantity})`);

  await firstCard.getByTestId('book-now-btn').click();
  await expect(page).toHaveURL(/\/events\/\d+/);

  // Increment quantity beyond 1 if requested
  for (let i = 1; i < quantity; i++) {
    await page.locator('button').filter({ hasText: '+' }).click();
    await expect(page.locator('#ticket-count')).toContainText(String(i + 1));
  }

  await page.getByLabel('Full Name').fill('Test User');
  await page.getByTestId('customer-email').fill('testuser@example.com');
  await page.getByLabel('Phone Number').fill('9876543210');
  await page.getByRole('button', { name: 'Confirm Booking' }).click();

  const refEl = page.locator('.booking-ref').first();
  await expect(refEl).toBeVisible();
  const bookingRef = (await refEl.textContent())?.trim() ?? '';
  console.log(`Booking confirmed. Ref: ${bookingRef}`);

  return { bookingRef, eventTitle };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('Booking Flow — Critical Happy Paths', () => {

  // TC-001 ─────────────────────────────────────────────────────────────────────
  test('TC-001: book single ticket end-to-end and land on confirmation card', async ({ page }) => {
    // -- Step 1: Login and reset state --
    await login(page);
    await clearBookings(page);

    // -- Step 2: Navigate to events and click Book Now on first available card --
    await page.goto(`${BASE_URL}/events`);
    const firstCard = page.getByTestId('event-card').filter({
      has: page.getByTestId('book-now-btn'),
    }).first();
    await expect(firstCard).toBeVisible();

    const eventTitle = (await firstCard.locator('h3').textContent())?.trim() ?? '';
    console.log(`Selected event: "${eventTitle}"`);

    await firstCard.getByTestId('book-now-btn').click();
    await expect(page).toHaveURL(/\/events\/\d+/);

    // -- Step 3: Verify default quantity is 1 --
    await expect(page.locator('#ticket-count')).toContainText('1');

    // -- Step 4: Fill booking form with valid customer details --
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByTestId('customer-email').fill('testuser@example.com');
    await page.getByLabel('Phone Number').fill('9876543210');

    // -- Step 5: Submit the booking --
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // -- Step 6: Assert confirmation card is shown with all expected elements --
    const bookingRef = page.locator('.booking-ref').first();
    await expect(bookingRef).toBeVisible();

    const ref = (await bookingRef.textContent())?.trim() ?? '';
    console.log(`Booking confirmed. Ref: ${ref}`);

    // Customer name appears on the confirmation card
    await expect(page.getByText('Test User')).toBeVisible();

    // Post-booking navigation links
    await expect(page.getByRole('link', { name: 'View My Bookings' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse More Events' })).toBeVisible();

    // "Booking Confirmed!" heading
    await expect(page.getByText('Booking Confirmed!')).toBeVisible();
  });

  // TC-002 ─────────────────────────────────────────────────────────────────────
  test('TC-002: book 3 tickets — price summary updates live and confirmation shows correct total', async ({ page }) => {
    // -- Step 1: Login and reset state --
    await login(page);
    await clearBookings(page);

    // -- Step 2: Navigate to the first available event --
    await page.goto(`${BASE_URL}/events`);
    const firstCard = page.getByTestId('event-card').filter({
      has: page.getByTestId('book-now-btn'),
    }).first();
    await expect(firstCard).toBeVisible();
    const eventTitle = (await firstCard.locator('h3').textContent())?.trim() ?? '';

    await firstCard.getByTestId('book-now-btn').click();
    await expect(page).toHaveURL(/\/events\/\d+/);

    // -- Step 3: Increment quantity to 3 using the + button --
    await page.locator('button').filter({ hasText: '+' }).click();
    await expect(page.locator('#ticket-count')).toContainText('2');

    await page.locator('button').filter({ hasText: '+' }).click();
    await expect(page.locator('#ticket-count')).toContainText('3');

    // -- Step 4: Verify the price summary box updates live to show 3 tickets --
    await expect(page.getByText(/× 3 tickets/)).toBeVisible();

    // -- Step 5: Fill customer details and confirm --
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByTestId('customer-email').fill('testuser@example.com');
    await page.getByLabel('Phone Number').fill('9876543210');
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // -- Step 6: Assert confirmation card — booking ref visible --
    const refEl = page.locator('.booking-ref').first();
    await expect(refEl).toBeVisible();
    const bookingRef = (await refEl.textContent())?.trim() ?? '';
    console.log(`Booking confirmed. Ref: ${bookingRef}`);

    // -- Step 7: Navigate to /bookings and verify the card shows 3 tickets --
    await page.goto(`${BASE_URL}/bookings`);
    const card = page.getByTestId('booking-card').filter({ hasText: bookingRef });
    await expect(card).toBeVisible();

    // Quantity: "3 tickets" shown on the booking card
    await expect(card).toContainText('3 tickets');

    // Event title matches what was booked
    await expect(card).toContainText(eventTitle);

    // Total price is a non-zero currency amount
    await expect(card.locator('p.text-xl')).toBeVisible();
    console.log(`TC-002 passed. Booking "${bookingRef}" shows 3 tickets.`);
  });

  // TC-003 ─────────────────────────────────────────────────────────────────────
  test('TC-003: booking card on My Bookings list displays all expected data fields', async ({ page }) => {
    // -- Step 1: Login, clear state, and create one booking --
    await login(page);
    await clearBookings(page);
    const { bookingRef, eventTitle } = await bookFirstAvailableEvent(page, 1);

    // -- Step 2: Navigate to /bookings --
    await page.goto(`${BASE_URL}/bookings`);

    // -- Step 3: Find the card matching this booking ref --
    const card = page.getByTestId('booking-card').filter({ hasText: bookingRef });
    await expect(card).toBeVisible();

    // -- Step 4: Assert booking ref is displayed in the card --
    await expect(card.locator('.booking-ref')).toContainText(bookingRef);

    // -- Step 5: Assert status badge shows "confirmed" --
    await expect(card).toContainText('confirmed');

    // -- Step 6: Assert event title is displayed --
    await expect(card).toContainText(eventTitle);

    // -- Step 7: Assert ticket quantity shows "1 ticket" --
    await expect(card).toContainText('1 ticket');

    // -- Step 8: Assert total price is displayed as a currency value --
    await expect(card.locator('p.text-xl')).toBeVisible();

    // -- Step 9: Assert the action buttons are present --
    await expect(card.getByRole('link', { name: 'View Details' })).toBeVisible();
    await expect(card.getByTestId('cancel-booking-btn')).toBeVisible();

    console.log(`TC-003 passed. Card for booking "${bookingRef}" shows all expected fields.`);
  });

});
