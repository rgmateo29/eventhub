# Test Strategy — Booking Management

**Input**: `docs/test-scenarios.md` (42 scenarios, TC-001–TC-512)
**Generated**: 2026-04-25
**Scope**: Booking creation, list/detail views, cancellation, clear-all, refund eligibility, security

---

## Layer Distribution

| Layer | Count | Primary Focus | Avg Speed |
|---|---|---|---|
| Unit | 5 | Pure functions: `randomRef()`, refund logic | < 1 ms |
| API / Integration | 15 | HTTP contracts, backend validation, security, FIFO | < 200 ms |
| Component | 13 | React rendering, form validation UI, conditional states | < 50 ms |
| E2E | 9 | Critical user journeys, multi-page flows, real timing | 5–15 s |
| **Total** | **42** | | |

**Pyramid shape**: 5 Unit → 15 API → 13 Component → 9 E2E ✓

---

## Unit Layer (5 scenarios)

> **Rule**: Pure function, no I/O → Unit

### Source: `backend/src/services/bookingService.js` — `randomRef(eventTitle)`

This function is pure (random + string construction only). It is the sole author of the booking reference format rule. It deserves direct unit coverage.

| ID | Title | Rationale |
|---|---|---|
| TC-100 | Booking ref first char matches event title first char | `randomRef('Tech Summit')` → assert result starts with `T-` |
| TC-101 | Booking ref format is `{LETTER}-{6_ALPHANUMERIC}` | assert result matches `/^[A-Z]-[A-Z0-9]{6}$/` |

**Additional unit cases to write** (not explicitly numbered in scenarios, cover edge branches in `randomRef`):
- Null/undefined event title → fallback prefix `E-` (line: `const prefix = (eventTitle?.[0] ?? 'E').toUpperCase()`)
- Event title starting with a lowercase character → uppercased correctly
- Event title starting with a digit → digit used as prefix

---

### Source: `frontend/app/bookings/[id]/page.tsx` — `RefundEligibility` component, `check()` function

The entire refund eligibility decision is `quantity === 1 ? 'eligible' : 'ineligible'` with a `setTimeout`. The logic itself (not the timer) is a unit-testable predicate.

| ID | Title | Rationale |
|---|---|---|
| TC-102 | quantity = 1 → eligible | pure conditional; no API call, no DB |
| TC-103 | quantity > 1 → ineligible with correct quantity in message | pure conditional on `quantity` prop |

**Note**: The 4-second spinner (TC-403) cannot be unit tested — it requires a rendered component. Assign to Component layer.

---

### Source: `backend/src/validators/bookingValidator.js` — quantity rule

| ID | Title | Rationale |
|---|---|---|
| TC-407 | quantity = 0 returns 400 | `isInt({ min: 1, max: 10 })` is an express-validator rule; can also test at API layer but documenting the specific rule here |

> **Note**: TC-407 is listed here as a unit-level fact (the validator rule), but should **also** be confirmed at the API layer with a real HTTP call.

---

## API / Integration Layer (15 scenarios)

> **Rule**: Backend business rule or HTTP contract → API

Run these with an HTTP client (e.g., `axios` in a Node test script, or Postman/Newman). No browser required.

### Happy Path — API Contracts

| ID | Title | Endpoint | Assertion |
|---|---|---|---|
| TC-009 | Lookup booking by reference | `GET /api/bookings/ref/:ref` | 200 + correct booking object |
| TC-105 | Total price = price × quantity | `POST /api/bookings` | `response.data.totalPrice === event.price * quantity` |
| TC-108 | Available seats decrease after booking | `GET /api/events/:id` before/after POST | `availableSeats` drops by `quantity` |
| TC-109 | Available seats restore after cancellation | `DELETE /api/bookings/:id` then `GET /api/events/:id` | `availableSeats` returns to pre-booking value |

---

### Business Rules — FIFO Pruning

| ID | Title | Endpoint | Assertion |
|---|---|---|---|
| TC-106 | 10th booking auto-deletes the oldest | `POST /api/bookings` × 10 | After 10th, oldest booking ID no longer in `GET /api/bookings` |
| TC-107 | FIFO prefers deleting a booking from a different event | `POST /api/bookings` × 9 (varied events) + 10th same as first event | The deleted booking is NOT from the same event as the 10th |

**Rationale for API layer**: FIFO pruning happens atomically in `bookingService.createBooking()`. Setting up 9 bookings via browser would take ~5 minutes E2E. Via API it takes milliseconds. The pruning behavior is invisible to the UI (no toast, no redirect) — the only observable is the subsequent booking list.

---

### Security

| ID | Title | Endpoint | Expected |
|---|---|---|---|
| TC-200 | No token → 401 on `GET /api/bookings` | `GET /api/bookings` (no header) | 401, `"Unauthorized"` |
| TC-201 | No token → 401 on `GET /api/bookings/:id` | `GET /api/bookings/1` (no header) | 401, `"Unauthorized"` |
| TC-203 | Cross-user cancel → 403 | `DELETE /api/bookings/{userA_id}` (userB token) | 403, `"You do not own this booking"` |
| TC-204 | No token → 401 on booking creation | `POST /api/bookings` (no header) | 401 |
| TC-205 | Cross-user ref lookup → 403 | `GET /api/bookings/ref/{userA_ref}` (userB token) | 403 |

**Rationale**: Security rules are enforced in `authMiddleware.js` (auth check) and `bookingService.js` (`booking.userId !== userId` guard). These are server-side checks that must be verified at the API layer — a browser test only confirms the UI rendering of the error, not the underlying enforcement.

---

### Negative / Validation

| ID | Title | Endpoint | Expected |
|---|---|---|---|
| TC-305 | Missing `customerName` → 400 | `POST /api/bookings` (body without customerName) | 400, validation details listing the missing field |
| TC-307 | Double-cancel → 404 | `DELETE /api/bookings/:id` twice | Second call returns 404 |
| TC-407 | quantity = 0 → 400 | `POST /api/bookings` (quantity: 0) | 400, "Quantity must be an integer between 1 and 10" |
| TC-405 | Clear all when empty → no error | `DELETE /api/bookings` with 0 bookings | 200, `{ deleted: 0 }` |

---

## Component Layer (13 scenarios)

> **Rule**: Single component rendering or UI state — no routing, no API calls needed

**Current gap**: The project has no component testing setup (no Vitest + React Testing Library in `frontend/package.json`). Before writing these tests, install:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom
```

### Booking Form (`frontend/app/events/[id]/page.tsx` — `BookingForm`)

| ID | Title | What to render | Assertion |
|---|---|---|---|
| TC-300 | Empty name → shows name error | `<BookingForm event={...} />`, submit with empty name | Error message "Name must be at least 2 chars" visible |
| TC-301 | 1-char name → shows name error | Fill name "A", submit | Same error |
| TC-302 | Invalid email → shows email error | Fill "notanemail", submit | "Enter a valid email" visible |
| TC-303 | Phone < 10 digits → shows phone error | Fill "98765", submit | "Enter a valid 10-digit phone" visible |
| TC-304 | All blank → all three errors shown simultaneously | Submit with no fields | All 3 error messages visible at once |
| TC-308 | `−` button disabled at quantity = 1 | Render with default state | `−` button has `disabled` attribute |
| TC-402 | `+` button disabled when quantity = availableSeats (< 10) | Render with `event.availableSeats = 3`, increment to 3 | `+` button becomes disabled |
| TC-406 | Max label shows correct seat count | Render with `event.availableSeats = 4` | Label "(max 4)" visible |

**Rationale for pushing validation DOWN from E2E**: Form validation in `validate()` (`frontend/app/events/[id]/page.tsx:88`) is frontend-only logic that fires before any API call. Testing it E2E requires login + navigation to an event page + form interaction = ~8 seconds per test. A component test does the same in ~50ms and is not flaky.

---

### `RefundEligibility` Component (`frontend/app/bookings/[id]/page.tsx`)

| ID | Title | State to verify | Assertion |
|---|---|---|---|
| TC-403 | Spinner shows for ~4 seconds then result appears | Click check button, use fake timers | Spinner visible → advance 4000ms → result visible |
| TC-509 | Idle state — only check link shown | Initial render | Check link visible; no spinner; no result |
| TC-510 | Check link disappears after click | Click the check button | Check link no longer in DOM |

**Rationale**: The `RefundEligibility` component transitions through `idle → checking → eligible/ineligible`. These are deterministic state transitions driven by a `setTimeout`. Use `vi.useFakeTimers()` to advance time in the component test rather than waiting 4 real seconds in an E2E test.

---

### `BookingCard` Component (`frontend/components/bookings/BookingCard.jsx`)

| ID | Title | What to render | Assertion |
|---|---|---|---|
| TC-502 | Card displays all expected fields | Render with full booking fixture | Assert ref, status badge, event title, date, qty, city, price all present |
| TC-503 | Confirm dialog opens on cancel click | Click cancel button | ConfirmDialog title "Cancel this booking?" visible |
| TC-512 | Cancel button not shown when status ≠ confirmed | Render booking with `status: "cancelled"` | `[data-testid="cancel-booking-btn"]` not present |

---

### `BookingsPage` — Empty State (`frontend/app/bookings/page.tsx`)

| ID | Title | How to set up | Assertion |
|---|---|---|---|
| TC-500 | Empty state when no bookings | Mock `GET /api/bookings` to return `{ data: [] }` | "No bookings yet" heading + "Browse Events" button visible |
| TC-501 | Skeleton loading while fetching | Intercept API and delay response | Skeleton cards visible before response resolves |

---

## E2E Layer (9 scenarios)

> **Rule**: Multi-page journey or full-stack flow with real timing → E2E
> Run against `https://eventhub.rahulshettyacademy.com`

| ID | Title | Priority | Why E2E |
|---|---|---|---|
| TC-001 | Book single ticket end-to-end | P0 | Full stack: login → events → form → confirmation → API → DB |
| TC-002 | Book multiple tickets, verify total price in UI | P0 | Requires rendered price summary and confirmation card |
| TC-003 | Booking card appears on list with correct data | P0 | Requires API + React Query + rendered card |
| TC-005 | Cancel from list card → toast + card disappears | P0 | React Query invalidation + toast system |
| TC-006 | Cancel from detail page → toast + redirect | P0 | Multi-page: detail → confirm dialog → redirect to list |
| TC-007 | Clear all bookings → empty state | P0 | Browser native `confirm()` dialog + API call |
| TC-202 | Cross-user booking — "Access Denied" in UI | P0 | Requires two user sessions; UI renders 403 as "Access Denied" |
| TC-004 | Detail page shows all five sections | P1 | Requires full booking data from API rendered in React |
| TC-108 | Seat count decreases in UI after booking | P1 | Requires live re-fetch of event page after booking |

### E2E scenarios intentionally excluded (downgraded)

| ID | Downgraded To | Reason |
|---|---|---|
| TC-100 | Unit + API | Booking ref format verifiable in API response without browser |
| TC-103 | Component | Refund ineligible message is pure client logic; fake timer is faster |
| TC-106 | API | Setting up 9 bookings via browser is slow; API is direct |
| TC-107 | API | FIFO same-event fallback has no UI signal |
| TC-300–304 | Component | Input validation messages are client-side; component tests are 100× faster |
| TC-200, TC-204 | API | Auth middleware enforcement is a backend contract, not a UI flow |
| TC-203, TC-205 | API | Cross-user API security tested at HTTP level |

---

## Anti-Patterns Found in Existing Tests

File: `tests/booking-management.spec.js`

| # | Anti-Pattern | Location | Fix |
|---|---|---|---|
| 1 | CSS class selector `.booking-ref` | `bookEvent()` helper, line 46 | Use `page.getByTestId('booking-ref')` — the element has `data-testid` |
| 2 | CSS class selector `.confirm-booking-btn` | `bookEvent()` helper, line 43 | Use `page.getByRole('button', { name: 'Confirm Booking' })` or add `data-testid` |
| 3 | CSS selector `#customer-email` | `bookEvent()` helper, line 41 | Use `page.getByLabel('Email')` or `page.getByTestId('customer-email')` — `data-testid` is present on the input |
| 4 | CSS selector `.confirm-booking-btn` in TC-006 | line 141 | Same as #2 above |
| 5 | CSS selector `.booking-ref` in TC-006 | line 146 | Same as #1 above |
| 6 | `span.font-mono.font-bold` in TC-002 | line 102 | Use `page.locator('[data-testid="booking-ref"]')` on the detail page breadcrumb; if no `data-testid` is there, request one from dev |

**Note on `#confirm-dialog-yes`**: TC-003 and TC-006 use `page.locator('#confirm-dialog-yes')` (Priority 4 — ID). This is acceptable per the locator strategy since `data-testid` is not present on the dialog confirm button; however, a `data-testid="confirm-dialog-yes"` attribute would be preferable.

---

## Defense-in-Depth Coverage Map

Key business rules covered at multiple layers:

| Rule | Unit | API | Component | E2E |
|---|---|---|---|---|
| Booking ref format | TC-100, TC-101 (`randomRef`) | TC-100, TC-101 (POST response) | — | TC-001 (ref visible in UI) |
| totalPrice = price × qty | — | TC-105 | TC-002 (price summary) | TC-002 (confirmation card) |
| Refund: qty=1 eligible | TC-102 (predicate) | — | TC-102, TC-403 (component state) | — |
| Seat availability change | — | TC-108, TC-109 | — | TC-108 (UI display) |
| Cross-user 403 | — | TC-203, TC-205 | — | TC-202 (UI "Access Denied") |
| Validation: name ≥ 2 chars | — | TC-305 (backend validator) | TC-300, TC-301 (form error) | — |
| FIFO pruning at 9 bookings | — | TC-106, TC-107 | — | — |

---

## Implementation Order (by ROI)

1. **E2E first** — TC-001, TC-005, TC-006, TC-007 (P0 happy paths + cancellation): these catch regressions in the critical booking flow immediately
2. **API security** — TC-203, TC-204, TC-205, TC-200: auth rules must hold before anything else ships
3. **API FIFO** — TC-106, TC-107: easy to automate, impossible to miss otherwise
4. **Component validation** — TC-300–TC-304: fastest payback after E2E; covers the most common user errors
5. **Unit** — TC-100, TC-101: pin the booking ref contract early; cheap to maintain
6. **Remaining Component/E2E** — TC-202, TC-004, TC-108, TC-500–TC-512
