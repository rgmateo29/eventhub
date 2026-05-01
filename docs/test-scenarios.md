# Test Scenarios — Booking Management

**Area**: Booking Management (create, view, cancel, clear, refund eligibility)
**Generated**: 2026-04-25
**Base URL**: https://eventhub.rahulshettyacademy.com
**Test Account**: rahulshetty1@gmail.com / Magiclife1!

---

## Happy Path (TC-001–TC-099)

---

### TC-001: Book a single ticket end-to-end and land on confirmation card
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is logged in; at least one event with available seats exists
**Steps**:
1. Navigate to `/events`
2. Click `[data-testid="book-now-btn"]` on the first available event card
3. On `/events/:id`, confirm quantity = 1 (default)
4. Fill Full Name: "Test User", Email: "test@example.com", Phone: "9876543210"
5. Click `.confirm-booking-btn`
**Expected Results**:
- Confirmation card appears with `.booking-ref` visible
- Customer name, ticket count, and total price shown on confirmation
- "View My Bookings" and "Browse More Events" links visible
**Business Rule**: Booking creates a unique reference; confirmation card is displayed post-booking
**Suggested Layer**: E2E

---

### TC-002: Book multiple tickets and verify total price calculation
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is logged in; event with ≥ 3 available seats exists
**Steps**:
1. Navigate to `/events/:id` for an event priced at $X
2. Click `+` button twice to set quantity to 3
3. Fill valid customer details
4. Click `.confirm-booking-btn`
**Expected Results**:
- Confirmation card shows quantity: 3
- Total price = $X × 3 (price summary box updates live before submission)
- Booking ref is visible
**Business Rule**: `totalPrice = event.price × quantity` (business-rules.md §9)
**Suggested Layer**: E2E

---

### TC-003: Booking card appears on My Bookings list with correct data
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User has at least one confirmed booking
**Steps**:
1. Complete a booking for a known event
2. Navigate to `/bookings`
3. Locate the booking card matching the booking ref
**Expected Results**:
- `[data-testid="booking-card"]` displays: booking ref, "confirmed" badge, event title, event date, quantity, city, booked-on date, total price
**Business Rule**: Booking card reflects the persisted booking record
**Suggested Layer**: E2E

---

### TC-004: Booking detail page shows all five sections
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User has at least one confirmed booking
**Steps**:
1. Navigate to `/bookings`
2. Click "View Details" on a booking card
3. Verify URL changes to `/bookings/:id`
**Expected Results**:
- Breadcrumb shows: "My Bookings / {bookingRef}"
- Booking ref badge + "confirmed" status badge visible in header
- "Event Details" section: event name, category, date, venue, city
- "Customer Details" section: name, email, phone
- "Payment Summary" section: tickets, price-per-ticket, total paid
- "Refund" section: "Check eligibility for refund?" link visible
- "Booking Information" section: booked-on date, booking ID
- "Cancel Booking" button visible
- "← Back to My Bookings" button visible
**Business Rule**: Detail page aggregates booking + event data
**Suggested Layer**: E2E

---

### TC-005: Cancel booking from the booking list card
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User has at least one confirmed booking
**Steps**:
1. Navigate to `/bookings`
2. Click `[data-testid="cancel-booking-btn"]` on a booking card
3. Confirm dialog: click "Yes, cancel it"
**Expected Results**:
- Success toast: "Booking cancelled successfully"
- Booking card disappears from the list (React Query refetches)
- If last booking, empty state "No bookings yet" appears
**Business Rule**: Cancellation deletes the booking; seats restored for future bookings (business-rules.md §4)
**Suggested Layer**: E2E

---

### TC-006: Cancel booking from the booking detail page
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User is on `/bookings/:id` for a confirmed booking
**Steps**:
1. Navigate to a booking detail page
2. Click "Cancel Booking" button (danger variant)
3. Confirm dialog appears; click "Yes, cancel it"
**Expected Results**:
- Confirm dialog shows booking ref and seat count in its description
- After confirmation: toast "Booking cancelled successfully"
- Redirected to `/bookings`
- Cancelled booking no longer appears in the list
**Business Rule**: Cancellation from detail page follows same flow as from list (business-rules.md §1)
**Suggested Layer**: E2E

---

### TC-007: Clear all bookings removes every booking and shows empty state
**Category**: Happy Path
**Priority**: P0
**Preconditions**: User has ≥ 1 booking
**Steps**:
1. Navigate to `/bookings`
2. Click "Clear all bookings" link
3. Accept the browser `confirm()` dialog
**Expected Results**:
- All booking cards removed
- Empty state "No bookings yet" is visible
- "Browse Events" button in empty state is visible
**Business Rule**: "Clear All Bookings" removes all bookings in one operation (business-rules.md §4)
**Suggested Layer**: E2E

---

### TC-008: "View My Bookings" link on confirmation card navigates to /bookings
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User just completed a booking (confirmation card is showing)
**Steps**:
1. Complete a booking from `/events/:id`
2. On the confirmation card, click "View My Bookings"
**Expected Results**:
- Navigates to `/bookings`
- The newly created booking card appears in the list
**Business Rule**: Post-booking navigation flow (user-flows.md Flow 3)
**Suggested Layer**: E2E

---

### TC-009: Lookup booking by reference via API GET /api/bookings/ref/:ref
**Category**: Happy Path
**Priority**: P1
**Preconditions**: User has a confirmed booking with a known ref
**Steps**:
1. Create a booking; note `bookingRef` (e.g., `T-AB12CD`)
2. Call `GET /api/bookings/ref/T-AB12CD` with user's Bearer token
**Expected Results**:
- HTTP 200
- Response body contains the correct booking object with matching `bookingRef`
**Business Rule**: Booking can be retrieved by reference (api-reference.md)
**Suggested Layer**: API

---

## Business Rules (TC-100–TC-199)

---

### TC-100: Booking reference first character matches event title first character
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User is logged in
**Steps**:
1. Navigate to an event whose title starts with a known letter (e.g., "Tech Conference Bangalore" → "T")
2. Book 1 ticket
3. Note the `bookingRef` from the confirmation card
**Expected Results**:
- `bookingRef` matches regex: `^T-[A-Z0-9]{6}$`
- First character before the dash is the uppercase first letter of the event title
**Business Rule**: Booking reference first character = event title first character, uppercase (business-rules.md §7)
**Suggested Layer**: E2E

---

### TC-101: Booking reference format is `{LETTER}-{6_ALPHANUMERIC}`
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User has at least one booking
**Steps**:
1. Create a booking
2. Read the `bookingRef` from the confirmation card or API response
**Expected Results**:
- Ref matches regex: `^[A-Z]-[A-Z0-9]{6}$`
- Characters after the dash are uppercase letters and/or digits only
**Business Rule**: bookingRef format: `[FIRST_LETTER]-[6_RANDOM_ALPHANUMERIC]` (business-rules.md §7)
**Suggested Layer**: API

---

### TC-102: Single-ticket booking shows "Eligible for refund" after 4-second check
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User has a booking with quantity = 1
**Steps**:
1. Navigate to `/bookings/:id` for a 1-ticket booking
2. Click "Check eligibility for refund?"
3. Observe spinner for ~4 seconds
4. Spinner disappears; result appears
**Expected Results**:
- Spinner visible during the ~4-second wait
- Result shows green panel: "Eligible for refund. Single-ticket bookings qualify for a full refund."
- `[data-testid="refund-result"]` contains the eligible message
**Business Rule**: quantity = 1 → refund eligible (business-rules.md §8)
**Suggested Layer**: E2E

---

### TC-103: Multi-ticket booking shows "Not eligible for refund" with correct quantity in message
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User has a booking with quantity > 1 (e.g., quantity = 3)
**Steps**:
1. Navigate to `/bookings/:id` for the multi-ticket booking
2. Click "Check eligibility for refund?"
3. Wait for the 4-second spinner to complete
**Expected Results**:
- Red panel appears: "Not eligible for refund. Group bookings (3 tickets) are non-refundable."
- The actual quantity (3) appears in the message
**Business Rule**: quantity > 1 → not eligible; message includes the exact quantity (business-rules.md §8)
**Suggested Layer**: E2E

---

### TC-104: Refund eligibility is purely client-side — no API call is made
**Category**: Business Rule
**Priority**: P2
**Preconditions**: User has a confirmed booking
**Steps**:
1. Open browser DevTools → Network tab
2. Navigate to `/bookings/:id`
3. Click "Check eligibility for refund?"
4. Wait for result
**Expected Results**:
- No network request to any `/api/refund` or `/api/bookings` endpoint is made during the check
- Result is determined solely by the quantity value already present on the page
**Business Rule**: Refund eligibility is frontend-only logic (business-rules.md §8)
**Suggested Layer**: E2E

---

### TC-105: Total price on confirmation card matches price × quantity
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User books a known event (price = $999) with quantity = 2
**Steps**:
1. Book 2 tickets for an event priced at $999
2. Check the confirmation card total
3. Also verify via `GET /api/bookings/:id`
**Expected Results**:
- Confirmation card shows Total: $1,998
- API response: `totalPrice = 1998`
**Business Rule**: `totalPrice = event.price × quantity` (business-rules.md §9)
**Suggested Layer**: E2E + API

---

### TC-106: FIFO pruning — 10th booking auto-deletes the oldest booking
**Category**: Business Rule
**Priority**: P1
**Preconditions**: User has exactly 9 bookings; note the oldest booking ref
**Steps**:
1. Verify 9 bookings exist (note the oldest booking ref)
2. Create a 10th booking
3. Navigate to `/bookings`
**Expected Results**:
- Total visible bookings is still 9
- The oldest booking (from step 1) is no longer in the list
- The new booking appears in the list
**Business Rule**: Max 9 bookings per user; oldest auto-deleted on overflow (business-rules.md §4)
**Suggested Layer**: E2E + API

---

### TC-107: FIFO pruning prefers deleting a booking from a different event
**Category**: Business Rule
**Priority**: P2
**Preconditions**: User has 9 bookings; at least 8 are for different events; the oldest booking is for Event A; the next-oldest is for a different event
**Steps**:
1. Use API: `POST /api/bookings` for Event A to create the 10th booking (same event as oldest)
2. Check remaining bookings
**Expected Results**:
- A booking for a different event (not Event A) was pruned, not the oldest booking for Event A
- The new Event A booking exists in the list
**Business Rule**: FIFO prune prefers a different event than the one being booked (bookingService.js line 74)
**Suggested Layer**: API

---

### TC-108: Seat availability decreases for user after booking
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User is logged in; note available seats for a specific event before booking
**Steps**:
1. Navigate to `/events/:id` and note `availableSeats` shown (e.g., 500)
2. Book 2 tickets
3. Navigate back to `/events/:id`
**Expected Results**:
- Available seats now shows 498 (500 − 2)
- The reduction is per-user: another user's view of the same event is unaffected
**Business Rule**: Per-user seat availability: `DB.availableSeats − sum(user's bookings for event)` (business-rules.md §6)
**Suggested Layer**: E2E

---

### TC-109: Seat availability restores after cancellation
**Category**: Business Rule
**Priority**: P0
**Preconditions**: User has a booking for an event (seats were reduced)
**Steps**:
1. Note available seats for the event (e.g., 498 after prior booking of 2)
2. Cancel that 2-ticket booking
3. Navigate back to `/events/:id`
**Expected Results**:
- Available seats returns to 500
**Business Rule**: Cancellation restores seats (business-rules.md §4); computed dynamically from remaining bookings
**Suggested Layer**: E2E

---

## Security (TC-200–TC-299)

---

### TC-200: Unauthenticated user is redirected away from /bookings
**Category**: Security
**Priority**: P0
**Preconditions**: No JWT token in localStorage (not logged in)
**Steps**:
1. Clear localStorage
2. Navigate directly to `/bookings`
**Expected Results**:
- Redirected to `/login` (or login page)
- Booking data is never shown
**Business Rule**: All booking endpoints require Bearer token (api-reference.md)
**Suggested Layer**: E2E

---

### TC-201: Unauthenticated user is redirected away from /bookings/:id
**Category**: Security
**Priority**: P0
**Preconditions**: No JWT in localStorage; a valid booking ID is known
**Steps**:
1. Clear localStorage
2. Navigate directly to `/bookings/1`
**Expected Results**:
- Redirected to login, OR "Access Denied" / "Booking not found" error state shown
- Booking data not exposed
**Business Rule**: `GET /api/bookings/:id` requires auth; returns 401 without token (api-reference.md)
**Suggested Layer**: E2E

---

### TC-202: Cross-user booking view — User B sees "Access Denied" for User A's booking
**Category**: Security
**Priority**: P0
**Preconditions**: Two test accounts available (Gmail + Yahoo)
**Steps**:
1. Login as User A (rahulshetty1@gmail.com); create a booking; note the booking ID
2. Logout (clear localStorage)
3. Login as User B (rahulshetty1@yahoo.com)
4. Navigate to `/bookings/{userA_booking_id}`
**Expected Results**:
- Page shows "Access Denied" title
- Description: "You are not authorized to view this booking."
- "View My Bookings" button is shown
- User A's booking data is not exposed
**Business Rule**: Cross-user booking access returns 403 Forbidden (business-rules.md §2)
**Suggested Layer**: E2E

---

### TC-203: Cross-user booking cancellation via API returns 403
**Category**: Security
**Priority**: P0
**Preconditions**: User A has a confirmed booking with known ID; User B's JWT token is available
**Steps**:
1. Obtain User B's JWT (login via `POST /api/auth/login`)
2. Call `DELETE /api/bookings/{userA_booking_id}` with User B's Bearer token
**Expected Results**:
- HTTP 403 Forbidden
- Response: `{ success: false, error: "You do not own this booking" }` (or similar)
- User A's booking remains intact
**Business Rule**: ForbiddenError thrown when `booking.userId !== userId` (bookingService.js)
**Suggested Layer**: API

---

### TC-204: API booking creation without auth token returns 401
**Category**: Security
**Priority**: P1
**Preconditions**: A valid event ID exists
**Steps**:
1. Call `POST /api/bookings` with valid body but NO Authorization header
**Expected Results**:
- HTTP 401 Unauthorized
- Response: `{ success: false, error: "Unauthorized" }`
**Business Rule**: All booking endpoints require Bearer token (api-reference.md)
**Suggested Layer**: API

---

### TC-205: Retrieve booking by ref for another user's booking returns 403
**Category**: Security
**Priority**: P1
**Preconditions**: User A has a booking with known ref; User B's token is available
**Steps**:
1. Call `GET /api/bookings/ref/{userA_bookingRef}` with User B's Bearer token
**Expected Results**:
- HTTP 403 Forbidden
- User A's data is not returned
**Business Rule**: `getBookingByRef` checks `booking.userId !== userId` (bookingService.js)
**Suggested Layer**: API

---

## Negative / Error (TC-300–TC-399)

---

### TC-300: Submit booking form with empty Full Name shows validation error
**Category**: Negative
**Priority**: P1
**Preconditions**: User is on `/events/:id`
**Steps**:
1. Leave Full Name blank
2. Fill valid email and phone
3. Click `.confirm-booking-btn`
**Expected Results**:
- Form does not submit
- Error message visible under name field: "Name must be at least 2 chars"
- No API request is made
**Business Rule**: `customerName` min 2 chars (event detail page, `validate()`)
**Suggested Layer**: E2E + Component

---

### TC-301: Submit booking form with name of 1 character shows validation error
**Category**: Negative
**Priority**: P1
**Preconditions**: User is on `/events/:id`
**Steps**:
1. Enter "A" in the Full Name field
2. Fill valid email and phone
3. Click `.confirm-booking-btn`
**Expected Results**:
- Error: "Name must be at least 2 chars"
- Booking is not created
**Business Rule**: `customerName.length < 2` is invalid (SKILL.md data model + validate())
**Suggested Layer**: E2E + Component

---

### TC-302: Submit booking form with invalid email format shows validation error
**Category**: Negative
**Priority**: P1
**Preconditions**: User is on `/events/:id`
**Steps**:
1. Fill name with "Test User"
2. Enter "notanemail" in the email field
3. Fill valid phone
4. Click `.confirm-booking-btn`
**Expected Results**:
- Error under email: "Enter a valid email"
- No API request is made
**Business Rule**: Email must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (validate() in event detail page)
**Suggested Layer**: E2E + Component

---

### TC-303: Submit booking form with phone shorter than 10 digits shows validation error
**Category**: Negative
**Priority**: P1
**Preconditions**: User is on `/events/:id`
**Steps**:
1. Fill valid name and email
2. Enter "98765" (5 digits) in the phone field
3. Click `.confirm-booking-btn`
**Expected Results**:
- Error: "Enter a valid 10-digit phone"
- Booking not submitted
**Business Rule**: Phone digits (non-digit chars stripped) must be ≥ 10 (validate() in event detail page)
**Suggested Layer**: E2E + Component

---

### TC-304: Booking form submit with all fields empty shows multiple validation errors simultaneously
**Category**: Negative
**Priority**: P2
**Preconditions**: User is on `/events/:id`
**Steps**:
1. Leave all fields blank (Name, Email, Phone)
2. Click `.confirm-booking-btn`
**Expected Results**:
- All three error messages visible at once: name, email, and phone errors
- Booking is not created
**Business Rule**: Client-side `validate()` returns all errors before any API call
**Suggested Layer**: E2E + Component

---

### TC-305: API create booking with missing required fields returns 400
**Category**: Negative
**Priority**: P1
**Preconditions**: Valid Bearer token available
**Steps**:
1. Call `POST /api/bookings` with Bearer token, body missing `customerName`
**Expected Results**:
- HTTP 400
- Response contains validation error details identifying the missing field
**Business Rule**: Backend validators enforce required fields (api-reference.md)
**Suggested Layer**: API

---

### TC-306: Navigate to non-existent booking ID shows "Booking not found"
**Category**: Negative
**Priority**: P1
**Preconditions**: User is logged in; booking ID 999999 does not exist
**Steps**:
1. Navigate to `/bookings/999999`
**Expected Results**:
- "Booking not found" empty state title
- Description: "This booking doesn't exist or may have been cancelled."
- "View My Bookings" button visible
**Business Rule**: `getBookingById` throws NotFoundError → 404 → UI shows not-found state
**Suggested Layer**: E2E

---

### TC-307: Cancel an already-cancelled booking via API returns 404
**Category**: Negative
**Priority**: P2
**Preconditions**: User has cancelled a booking; the ID is known
**Steps**:
1. Cancel a booking via `DELETE /api/bookings/:id`
2. Immediately call `DELETE /api/bookings/:id` again with the same ID
**Expected Results**:
- Second call returns HTTP 404
- Response: booking not found
**Business Rule**: Deleted booking cannot be cancelled again (NotFoundError)
**Suggested Layer**: API

---

### TC-308: Cannot decrement quantity below 1 via the `−` button
**Category**: Negative
**Priority**: P2
**Preconditions**: User is on `/events/:id`; quantity starts at 1
**Steps**:
1. Verify quantity shows "1"
2. Click the `−` (decrement) button
**Expected Results**:
- Quantity remains at 1
- The `−` button is disabled (has `disabled` attribute) when quantity = 1
**Business Rule**: Minimum quantity is 1 (booking form, disabled when `quantity <= 1`)
**Suggested Layer**: E2E + Component

---

## Edge Cases (TC-400–TC-499)

---

### TC-400: Book exactly 1 ticket (minimum boundary)
**Category**: Edge Case
**Priority**: P1
**Preconditions**: Event has available seats
**Steps**:
1. On `/events/:id`, confirm quantity = 1 (default)
2. Submit with valid customer details
**Expected Results**:
- Booking created successfully with quantity = 1
- `bookingRef` present in confirmation
**Business Rule**: Minimum quantity is 1 (data model)
**Suggested Layer**: E2E

---

### TC-401: Book exactly 10 tickets (maximum boundary)
**Category**: Edge Case
**Priority**: P1
**Preconditions**: Event has ≥ 10 available seats
**Steps**:
1. On `/events/:id`, click `+` 9 times to reach quantity = 10
2. Submit with valid customer details
**Expected Results**:
- Booking created with quantity = 10
- `+` button is disabled at quantity = 10
- Total price = 10 × event price
**Business Rule**: Max quantity per booking = 10 (data model; `maxQty = Math.min(10, availableSeats)`)
**Suggested Layer**: E2E

---

### TC-402: `+` button is disabled when quantity equals available seats (< 10)
**Category**: Edge Case
**Priority**: P2
**Preconditions**: Event has exactly 3 available seats (for current user)
**Steps**:
1. Navigate to the event detail page for such an event
2. Increment quantity to 3 via `+` button
**Expected Results**:
- At quantity = 3, the `+` button becomes disabled
- `(max 3)` label is shown next to the counter
**Business Rule**: `maxQty = Math.min(10, event.availableSeats)` (event detail page)
**Suggested Layer**: E2E + Component

---

### TC-403: Refund check spinner displays for approximately 4 seconds
**Category**: Edge Case
**Priority**: P2
**Preconditions**: User is on `/bookings/:id`
**Steps**:
1. Record time before clicking "Check eligibility for refund?"
2. Click the button
3. Record time when `[data-testid="refund-result"]` becomes visible
**Expected Results**:
- `[data-testid="refund-spinner"]` visible during the wait
- Total elapsed time is approximately 4 seconds (±500ms acceptable)
- Result panel replaces spinner
**Business Rule**: 4-second `setTimeout` before result (booking detail page, `RefundEligibility` component)
**Suggested Layer**: E2E

---

### TC-404: Same user can book the same event multiple times (sandbox design)
**Category**: Edge Case
**Priority**: P1
**Preconditions**: User is logged in; a static or dynamic event exists with enough seats
**Steps**:
1. Book Event A for 1 ticket → note booking ref 1
2. Book Event A again for 1 ticket → note booking ref 2
**Expected Results**:
- Both bookings appear on `/bookings` with different booking refs
- The second booking succeeds without error
- Available seats for Event A decreases by 1 more after the second booking
**Business Rule**: Per-user seat computation allows repeated bookings for testing (business-rules.md §6)
**Suggested Layer**: E2E

---

### TC-405: Clear all bookings is idempotent — calling when list is empty causes no error
**Category**: Edge Case
**Priority**: P2
**Preconditions**: User has no bookings (empty state showing)
**Steps**:
1. Navigate to `/bookings` (empty state is visible)
2. Click "Clear all bookings"
3. Accept the browser confirm dialog
**Expected Results**:
- No error toast
- Empty state remains visible
- Page does not crash
**Business Rule**: `DELETE /api/bookings` (clear all) should handle zero bookings gracefully
**Suggested Layer**: E2E + API

---

### TC-406: Booking form quantity max label shows correct available seat count when < 10
**Category**: Edge Case
**Priority**: P3
**Preconditions**: An event exists with exactly 4 available seats for the current user
**Steps**:
1. Navigate to `/events/:id` for the event
2. Check the max label next to the quantity counter
**Expected Results**:
- Label reads "(max 4)"
- Clicking `+` is possible up to 4, then disabled
**Business Rule**: `maxQty = Math.min(10, event.availableSeats)` displayed to user
**Suggested Layer**: Component

---

### TC-407: API create booking with quantity = 0 returns validation error
**Category**: Edge Case
**Priority**: P2
**Preconditions**: Valid Bearer token and event ID available
**Steps**:
1. Call `POST /api/bookings` with `{ eventId, customerName, customerEmail, customerPhone, quantity: 0 }`
**Expected Results**:
- HTTP 400
- Validation error indicating invalid quantity
**Business Rule**: quantity must be ≥ 1 (data model)
**Suggested Layer**: API

---

## UI State (TC-500–TC-599)

---

### TC-500: Bookings list shows empty state when user has no bookings
**Category**: UI State
**Priority**: P1
**Preconditions**: User has zero bookings
**Steps**:
1. Navigate to `/bookings`
**Expected Results**:
- "No bookings yet" heading visible
- Description: "You haven't booked any events yet..."
- Ticket icon illustration visible
- "Browse Events" button visible and navigates to `/events`
**Business Rule**: Empty state shown when `bookings.length === 0`
**Suggested Layer**: E2E + Component

---

### TC-501: Bookings list shows skeleton loading cards while fetching
**Category**: UI State
**Priority**: P2
**Preconditions**: User is logged in; network is normal speed
**Steps**:
1. Navigate to `/bookings` and immediately observe the page before data loads
**Expected Results**:
- Multiple `BookingCardSkeleton` components visible briefly (animated pulse)
- Skeleton replaced by actual booking cards once data arrives
- No layout shift after data loads
**Business Rule**: `isLoading` state renders skeleton placeholders
**Suggested Layer**: E2E + Component

---

### TC-502: Booking card displays all expected data fields
**Category**: UI State
**Priority**: P1
**Preconditions**: User has at least one confirmed booking for a known event
**Steps**:
1. Navigate to `/bookings`
2. Inspect the first booking card
**Expected Results**:
- Booking ref (font-mono, indigo badge): present and matches expected format
- Status badge "confirmed": green/success variant
- Booking ID (e.g., "#42"): visible in small grey mono text
- Event title: truncated if long but readable
- Event date (📅), ticket count (🎫), city (📍), booked-on date (🗓): all visible
- Total price: bold indigo, formatted as currency
- "View Details" and "Cancel Booking" buttons visible
**Business Rule**: BookingCard renders all booking + event fields
**Suggested Layer**: E2E + Component

---

### TC-503: Confirm dialog appears before cancellation from list page
**Category**: UI State
**Priority**: P0
**Preconditions**: User has a confirmed booking on `/bookings`
**Steps**:
1. Click `[data-testid="cancel-booking-btn"]` on a booking card
**Expected Results**:
- React `ConfirmDialog` modal opens (NOT a browser native confirm)
- Title: "Cancel this booking?"
- Description mentions the booking ref and number of seats to be released
- "Yes, cancel it" confirm button and close/cancel button visible
**Business Rule**: Cancellation requires explicit user confirmation via dialog
**Suggested Layer**: E2E + Component

---

### TC-504: Confirm dialog appears before cancellation from detail page
**Category**: UI State
**Priority**: P0
**Preconditions**: User is on `/bookings/:id`
**Steps**:
1. Click "Cancel Booking" button
**Expected Results**:
- ConfirmDialog modal opens
- Title: "Cancel this booking?"
- Description includes the booking ref and quantity
- "Yes, cancel it" and close buttons visible
**Business Rule**: Same cancellation flow on detail page as on list
**Suggested Layer**: E2E + Component

---

### TC-505: Cancel booking from list card shows success toast and removes card
**Category**: UI State
**Priority**: P0
**Preconditions**: User has ≥ 2 confirmed bookings (so list is not empty after cancel)
**Steps**:
1. Click "Cancel Booking" on a card; confirm in dialog
**Expected Results**:
- Toast notification: "Booking cancelled successfully" with success styling
- The cancelled booking card disappears
- Other booking cards remain
**Business Rule**: onSuccess → toast shown, React Query cache invalidated
**Suggested Layer**: E2E

---

### TC-506: "Clearing…" text appears on the Clear All button while request is in-flight
**Category**: UI State
**Priority**: P2
**Preconditions**: User has bookings
**Steps**:
1. Click "Clear all bookings"; accept the browser confirm
2. Observe the button text immediately
**Expected Results**:
- Button text changes to "Clearing…" and is disabled while the API call is in-flight
- After completion, empty state appears
**Business Rule**: `clearing` state sets button text and disables it (bookings page component)
**Suggested Layer**: E2E + Component

---

### TC-507: Booking detail page shows "Access Denied" state (not 404) for cross-user booking
**Category**: UI State
**Priority**: P0
**Preconditions**: User B is logged in; User A's booking ID is known
**Steps**:
1. As User B, navigate to `/bookings/{userA_id}`
**Expected Results**:
- Page title: "Access Denied" (not "Booking not found")
- Description: "You are not authorized to view this booking."
- "View My Bookings" button visible
**Business Rule**: 403 response maps to "Access Denied" UI state; distinct from 404 "not found" (booking detail page, `is403` branch)
**Suggested Layer**: E2E

---

### TC-508: Booking detail page shows "Booking not found" for deleted/non-existent booking
**Category**: UI State
**Priority**: P1
**Preconditions**: User navigates to `/bookings/999999` (non-existent ID)
**Steps**:
1. Navigate to `/bookings/999999`
**Expected Results**:
- Title: "Booking not found"
- Description: "This booking doesn't exist or may have been cancelled."
- "View My Bookings" button visible
**Business Rule**: 404 from API maps to "Booking not found" UI state (booking detail page)
**Suggested Layer**: E2E

---

### TC-509: Refund section starts in idle state — only the check link is visible
**Category**: UI State
**Priority**: P2
**Preconditions**: User is on `/bookings/:id`; has not clicked refund check yet
**Steps**:
1. Navigate to booking detail page
2. Locate the "Refund" section
**Expected Results**:
- "Check eligibility for refund?" link visible (`[data-testid="check-refund-btn"]`)
- No spinner visible
- No result panel visible
**Business Rule**: Refund component starts in 'idle' state
**Suggested Layer**: Component

---

### TC-510: Refund check button disappears after being clicked (only one check allowed per page load)
**Category**: UI State
**Priority**: P2
**Preconditions**: User is on `/bookings/:id`
**Steps**:
1. Click "Check eligibility for refund?"
2. Observe the idle state button
**Expected Results**:
- After clicking, the "Check eligibility for refund?" link is no longer visible
- Spinner (or result) takes its place
- Clicking again is not possible (no visible button)
**Business Rule**: Status transitions: `idle → checking → eligible | ineligible` (one-way); no reset (RefundEligibility component)
**Suggested Layer**: Component

---

### TC-511: Breadcrumb on detail page shows booking ref in monospace font
**Category**: UI State
**Priority**: P3
**Preconditions**: User is on `/bookings/:id`
**Steps**:
1. Navigate to `/bookings/:id`
2. Inspect the breadcrumb at the top
**Expected Results**:
- Breadcrumb reads: "My Bookings / {bookingRef}"
- The booking ref part is in monospace font
- "My Bookings" part is a clickable link to `/bookings`
**Business Rule**: Breadcrumb navigation aids orientation in the booking flow
**Suggested Layer**: Component

---

### TC-512: "Cancel Booking" button is not shown on detail page for a non-confirmed status
**Category**: UI State
**Priority**: P2
**Preconditions**: A booking exists with a status other than "confirmed" (requires direct DB manipulation or a future cancelled-state scenario)
**Steps**:
1. If a booking with status != "confirmed" can be produced, navigate to its detail page
**Expected Results**:
- "Cancel Booking" button is not rendered (conditional on `booking.status === 'confirmed'`)
- Booking details still visible
**Business Rule**: Cancel action only shown for confirmed bookings (booking detail page, conditional render)
**Suggested Layer**: Component

---

*Total scenarios: 42 | P0: 13 | P1: 17 | P2: 10 | P3: 2*
