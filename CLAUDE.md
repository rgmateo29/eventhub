# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
EventHub is a full-stack event ticket booking platform built for QA training. Users register/login, browse events, book tickets, manage bookings, and create their own events. Each user operates in an isolated sandbox — events and seat availability are scoped per user.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, React Query v5
- **Backend**: Express.js, Prisma ORM, MySQL 8+
- **Auth**: JWT (7-day expiry) via `bcryptjs`; token stored in `localStorage` as `token`
- **Testing**: Playwright E2E (Chromium only), targeting `https://eventhub.rahulshettyacademy.com`

## Running Tests with Docker

No local Node.js, browsers, or dependencies required.

```bash
# Build image and run all tests (first run downloads Chromium — cached after)
docker compose run --rm playwright

# Rebuild the image after changing test files or dependencies
docker compose run --rm --build playwright
```

The HTML report is written to `./playwright-report/` on the host. Open `playwright-report/index.html` in a browser to view results. Failure screenshots and videos land in `./test-results/`.

## Commands

```bash
# Development
npm run setup        # Install deps in both /backend and /frontend
npm run dev          # Start frontend (port 3000) + backend (port 3001) concurrently
npm run build        # Build Next.js frontend for production
npm run lint         # ESLint on frontend

# Database
npm run db:push      # Push schema changes non-interactively (no migration files)
npm run migrate      # Run prisma migrate dev (interactive, creates migration files)
npm run seed         # Seed 10 static events

# Testing
npm run test                                                           # Run all Playwright tests
npm run test:ui                                                        # Playwright UI mode
npm run test:report                                                    # Open last HTML report
npx playwright test tests/<file>.spec.js --reporter=line               # Run single test file
```

Swagger UI (local): `http://localhost:3001/api/docs`

## Architecture

Backend follows strict layered architecture: **Routes → Controllers → Services → Repositories → Database**

- `backend/src/routes/` — Express routers with Swagger JSDoc (`authRoutes`, `eventRoutes`, `bookingRoutes`)
- `backend/src/controllers/` — Thin HTTP layer; delegates to services (`authController`, `eventController`, `bookingController`)
- `backend/src/services/` — All business logic and FIFO pruning (`authService`, `eventService`, `bookingService`)
- `backend/src/repositories/` — Pure Prisma data access (`userRepository`, `eventRepository`, `bookingRepository`)
- `backend/src/utils/errors.js` — Custom error classes: `NotFoundError`, `ValidationError`, `ForbiddenError`, `InsufficientSeatsError`
- `backend/src/middleware/authMiddleware.js` — JWT verification; attaches `req.user = { userId, email }`
- `backend/src/middleware/errorHandler.js` — Maps domain error classes → HTTP status codes

Frontend uses React Query hooks in `frontend/lib/hooks/` for all server state, with an Axios client at `frontend/lib/api/client.ts` that attaches the JWT from localStorage. `frontend/components/auth/AuthGuard.tsx` redirects unauthenticated users to `/login`.

## Key Business Rules

- **Event ownership**: `isStatic: true` events are seeded (no `userId`); only the owning user can update/delete dynamic events
- **Seat availability is per-user**: the DB `availableSeats` field is the global count; the API subtracts the requesting user's already-booked quantity to show `availableSeats` in responses — this is why two users see different seat counts for the same event
- **FIFO pruning — events**: max 6 user-created events; oldest is deleted automatically on overflow
- **FIFO pruning — bookings**: max 9 bookings per user; oldest is deleted automatically on overflow (prefers a different event than the one being booked)
- **Booking reference format**: `{EVENT_TITLE[0].toUpperCase()}-{6xA-Z0-9}` — e.g., an event titled "Arena Rock" yields `A-XY4Z7Q`. The README incorrectly shows `EVT-XXXXXX`.
- **Refund eligibility**: quantity = 1 is eligible; quantity > 1 is not — enforced **client-side only**
- **Cross-user access**: accessing another user's booking returns `403 Forbidden` ("Access Denied" in UI)
- **Static events are immutable**: update/delete returns `403 Forbidden`

## Auth Endpoints

- `POST /api/auth/register` — `{ email, password }` → `{ token, user }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`

All other endpoints require `Authorization: Bearer <token>`.

## Testing Conventions

- Test files go in `tests/` as `<feature-name>.spec.js`
- Tests target the hosted deployment; no local server needed
- Test account: `rahulshetty1@gmail.com` / `Magiclife1!`
- Tests must be fully self-contained: login → clear state → action → assert
- Locator priority: `data-testid` > role > label/placeholder > `#id` > CSS class
- No `page.waitForTimeout()` — use `expect().toBeVisible()`
- Use `getByTestId()` over CSS class selectors — some existing tests use legacy selectors listed below; prefer `data-testid` in new tests
- Playwright config: `fullyParallel: false`, `retries: 0`, 30 s test timeout, Chromium only

### Legacy non-testid selectors (used in existing tests, do not remove)

| Selector | Element |
|---|---|
| `#login-btn` | Login submit button |
| `#ticket-count` | Ticket quantity display on booking form |
| `.booking-ref` | Booking reference text on confirmation page |
| `p.text-xl` | Total price display on booking card |

## Key `data-testid` Selectors

| `data-testid` | Element |
|---|---|
| `event-card` | Event card in listings |
| `book-now-btn` | "Book Now" on event card |
| `quantity-input` | Ticket quantity display in booking form |
| `customer-name` | Full name input in booking form |
| `customer-email` | Email input in booking form |
| `customer-phone` | Phone number input in booking form |
| `confirm-booking-btn` | Submit booking button |
| `booking-ref` | Booking reference on confirmation |
| `booking-card` | Booking card in My Bookings list |
| `cancel-booking-btn` | Cancel button on booking card |
| `confirm-dialog-yes` | Confirm button in confirmation dialog |
| `admin-event-form` | Admin event create/edit form |
| `event-title-input` | Title field in admin event form |
| `add-event-btn` | Submit button in admin event form |
| `event-table-row` | Row in admin events table |
| `edit-event-btn` / `delete-event-btn` | Action buttons in admin table row |
| `nav-events` / `nav-bookings` | Navbar links |

## Custom Slash Commands (Skills)

Located in `.claude/skills/`:

- `/generate-tests <feature>` — AI Test Automation Engineer: generates Playwright tests
- `/review-tests <file>` — AI Code Reviewer: reviews test code quality
- `/create-scenarios <area>` — AI Functional Tester: creates test scenario documents
- `/test-strategy <scenarios>` — AI Test Architect: assigns tests to optimal pyramid layers

## Code Style

- Backend: JavaScript (CommonJS), JSDoc, Express patterns
- Frontend: TypeScript, React hooks, Tailwind utility classes
- Tests: JavaScript with Playwright test runner
