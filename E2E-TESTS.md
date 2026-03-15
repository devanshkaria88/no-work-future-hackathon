# Borough — End-to-End Test Specifications

> Tests that simulate a real user interacting with the full running system — frontend in
> a browser, backend server running, real database, real WebSocket connections. Claude API
> can be mocked with deterministic responses or (for smoke tests) called live.
>
> Use Playwright or Cypress. Each test launches a browser, interacts with the UI, and
> verifies visual + data outcomes.

---

## Prerequisites

- Backend running on `http://localhost:3001` with test database
- Frontend running on `http://localhost:3000`
- Database freshly seeded via `POST /api/demo/seed` before each test suite
- Claude API mocked at the service level (swap `ClaudeService` with a mock provider) for deterministic outcomes
- Mapbox token set (or Mapbox mocked for CI environments)

---

## Test Suites

### 1. First-Time User Journey: Register → Welcome → Map

**File:** `e2e/user-journey.spec.ts`

> A brand new user arrives at Borough, creates an account, sees the welcome screen,
> and lands on the map with London visible.

| # | Step | Expected Outcome |
|---|------|------------------|
| 1.1 | Navigate to `http://localhost:3000` | Landing page loads. AuthScreen is visible. |
| 1.2 | See the login/register form | Email and password fields are present. "Register" toggle is visible. |
| 1.3 | Click "Register" toggle | Name field appears. Form switches to registration mode. |
| 1.4 | Fill in name: "Maria", email: "maria@test.com", password: "test1234" and submit | Loading state shows briefly. No error. |
| 1.5 | Registration succeeds | WelcomeScreen appears with "WELCOME TO BOROUGH" text. |
| 1.6 | Companion character is visible | The companion agent sprite (waving character) is displayed. |
| 1.7 | See three options: "Talk to Borough", "Type instead", "Explore the map" | All three buttons are visible and clickable. |
| 1.8 | Click "Explore the map" | Browser navigates to `/map`. |
| 1.9 | Map page loads | Mapbox map renders with London visible. RetroHeader shows "BOROUGH" and user name "Maria". |
| 1.10 | Supply bubbles from seed data appear on map | Colored circles are visible on the map (at least 5 from seed data). |
| 1.11 | Agent activity bar is at the bottom | The AgentActivityBar component is rendered at the bottom of the screen. |

### 2. Exploring the Map: Bubbles, Popups, Demand Pulses

**File:** `e2e/map-exploration.spec.ts`

> A logged-in user explores the seeded map — clicks bubbles, views listings, sees demand pulses.

| # | Step | Expected Outcome |
|---|------|------------------|
| 2.1 | Navigate to `/map` (logged in) | Map loads with supply bubbles visible. |
| 2.2 | Zoom into Shoreditch area | Bubbles become larger as zoom increases. Individual labels may appear. |
| 2.3 | Click on a supply bubble (e.g., "South Indian Cooking Experience") | ListingPopup appears with: title, host name, location, price (£30), spots (3/4 left), description, tags. |
| 2.4 | Verify popup shows price in pounds | Price displays as "£30" not "3000". |
| 2.5 | Verify popup shows capacity correctly | Shows available spots (capacity - booked). |
| 2.6 | Verify popup has "I'm interested" button | CTA button is present and clickable. |
| 2.7 | Click "Close" on the popup | Popup disappears. Map is interactive again. |
| 2.8 | Demand pulses are visible on map | Red pulsing rings are visible at demand signal locations. |
| 2.9 | Demand pulses are visually distinct from supply | Different color (red vs category colors) and animation (pulsing). |
| 2.10 | Pan around London | Map stays within London bounds (maxBounds prevents scrolling to Paris). |

### 3. The Core Demo Flow: Seed → Match → Negotiate → Deal

**File:** `e2e/demo-flow.spec.ts`

> This is THE critical test. It simulates the exact 5-minute demo sequence from the PRD.
> A user is logged in, the map is seeded, a match is triggered, two AI agents negotiate
> on screen, a deal is reached, and the user approves it.

| # | Step | Expected Outcome |
|---|------|------------------|
| 3.1 | Seed the database | POST `/api/demo/seed` returns 200. Map shows pre-seeded London data. |
| 3.2 | Navigate to `/map` as logged-in user | Map loads. Supply bubbles and demand pulses visible. |
| 3.3 | Trigger a match for "South Indian Cooking Experience" listing | POST `/api/demo/trigger-match?listingId=<cooking-listing-id>` returns 200. |
| 3.4 | **Agent activity bar shows matchmaker activity** | Within 5 seconds, notification appears: matchmaker found a match. |
| 3.5 | **Connection line appears on map** | An animated dashed line connects buyer location to seller location on the map. |
| 3.6 | **Negotiation Theater slides up** | Bottom panel slides up from the bottom of the screen. Map dims to ~60% opacity. |
| 3.7 | **"NEGOTIATION IN PROGRESS" header visible** | The theater header shows negotiation status text. |
| 3.8 | **Buyer Agent's first message appears** | Blue-colored speech balloon appears on the left side with buyer agent sprite. Message text references the listing and a price offer. |
| 3.9 | **Seller Agent responds** | After a delay (~1.5s), amber-colored speech balloon appears on the right side with seller agent sprite. Message counters the buyer's offer. |
| 3.10 | **Messages alternate buyer/seller** | Subsequent messages alternate sides. At least 3-4 exchanges happen. |
| 3.11 | **Agent sprites are visible** | PixelCharacter images for buyer (coin bag) and seller (craftsperson) are rendered next to their messages. |
| 3.12 | **"Jump in" and "Let them talk" buttons visible** | Both action buttons are present at the bottom of the theater. |
| 3.13 | **Deal is reached** | Agents converge on terms. A "DEAL CONFIRMED" notification or dialog appears. |
| 3.14 | **DealConfirmation dialog shows terms** | Dialog shows: listing title, final price per person, quantity, total amount. |
| 3.15 | **Click "Approve"** | User clicks the approve button on the deal confirmation. |
| 3.16 | **Confetti effect fires** | Pixel confetti animation triggers on screen. |
| 3.17 | **XP increases** | XP counter in the header increases by 200. Level indicator may update. |
| 3.18 | **Deal celebration screen** | Shows deal summary: listing name, date/time, price, quantity, total. Buyer and seller sprites shown with handshake. |
| 3.19 | **"View Map" button returns to map** | Clicking "View Map" dismisses the celebration and returns to the full map view. |
| 3.20 | **Map shows completed deal** | Connection line between buyer and seller is now solid (not dashed) or a pin/marker appears at the deal location. |

### 4. Negotiation Theater — Detailed UI Behavior

**File:** `e2e/negotiation-theater.spec.ts`

> Deep testing of the negotiation UI experience — animations, auto-scroll, intervention.

| # | Step | Expected Outcome |
|---|------|------------------|
| 4.1 | Theater slides up with animation | Panel animates from below, not instant appearance. |
| 4.2 | Map dims when theater opens | Map container has reduced opacity (around 0.4-0.6). |
| 4.3 | Messages auto-scroll to latest | As new messages appear, the conversation scrolls to show the latest message. |
| 4.4 | Agent sprite bounces when their message appears | The PixelCharacter for the speaking agent has a bounce/pulse animation. |
| 4.5 | Click "Jump in" button | A text input appears allowing the user to type a message. |
| 4.6 | Submit intervention message | User types "Can you go lower?" and submits → message appears in the conversation with a different styling (human vs agent). |
| 4.7 | After intervention, agents continue | The next agent message acknowledges or incorporates the human's input. |
| 4.8 | Click "Let them talk" (no intervention) | Nothing happens — agents continue their conversation. Button may be disabled during typing. |
| 4.9 | Connection line on map pulses during negotiation | The dashed line between buyer/seller locations pulses or animates. |
| 4.10 | Connection line turns solid green on deal | After deal-reached, the line changes from dashed/animated to solid green. |

### 5. Negotiation Failure Path

**File:** `e2e/negotiation-failure.spec.ts`

> Tests what happens when agents can't reach a deal (abandon after 6 rounds).

| # | Step | Expected Outcome |
|---|------|------------------|
| 5.1 | Configure Claude mock to never agree | Mock both agents to always counter-offer without agreement keywords. |
| 5.2 | Trigger a match and start negotiation | Negotiation theater opens and messages flow. |
| 5.3 | Messages continue for 6 rounds (12 messages) | 12 messages appear in the theater (6 buyer, 6 seller). |
| 5.4 | After round 6, negotiation ends | "Could not reach agreement" message or status appears. |
| 5.5 | No DealConfirmation dialog | The deal approval dialog does NOT appear. |
| 5.6 | No confetti | No confetti animation fires. |
| 5.7 | Theater shows abandoned state | Visual indication that negotiation was abandoned (text, color change, etc.). |
| 5.8 | Map connection line disappears or fades | The dashed connection line is removed or turns gray. |
| 5.9 | User can dismiss the theater | Clicking close or "back to map" dismisses the theater panel. |

### 6. Auth Flow — Login, Logout, Persistence

**File:** `e2e/auth-flow.spec.ts`

| # | Step | Expected Outcome |
|---|------|------------------|
| 6.1 | Visit `/` → see login form | AuthScreen renders with email and password fields. |
| 6.2 | Login with valid credentials | User is logged in. WelcomeScreen or map appears. |
| 6.3 | Login with wrong password | Error message appears: "Invalid credentials" or similar. User stays on auth screen. |
| 6.4 | Login with non-existent email | Error message appears. User stays on auth screen. |
| 6.5 | Register with already-used email | Error message appears about duplicate email. |
| 6.6 | After login, refresh the page | User remains logged in (session persists). |
| 6.7 | Navigate directly to `/map` without login | Redirected to `/` (login page) or shown auth screen. |

### 7. Real-Time Updates — Multi-Tab/Multi-User

**File:** `e2e/realtime-updates.spec.ts`

> Verify that WebSocket events propagate in real-time across browser tabs / users.

| # | Step | Expected Outcome |
|---|------|------------------|
| 7.1 | Open two browser tabs, both on `/map` | Both tabs show the map with seeded data. |
| 7.2 | In tab 1, create a new listing via API | In tab 2, a new supply bubble appears on the map without page refresh. |
| 7.3 | Trigger a negotiation in tab 1 | Tab 2 sees the negotiation theater open or activity bar notification. |
| 7.4 | Negotiation messages appear in both tabs | Both tabs show the streaming negotiation messages in real-time. |
| 7.5 | Deal confirmed in tab 1 | Tab 2 sees the deal confirmation / confetti. |

### 8. Seed & Reset — Demo Operator Flow

**File:** `e2e/demo-management.spec.ts`

> An operator resets the demo between presentations.

| # | Step | Expected Outcome |
|---|------|------------------|
| 8.1 | POST /api/demo/seed | Map populates with London listings and demand signals. |
| 8.2 | Verify seeded listings appear on map | Known listings from PRD (Cooking, Guitar, Bike Repair, etc.) are visible as bubbles. |
| 8.3 | POST /api/demo/reset | All data is cleared and re-seeded. |
| 8.4 | Refresh the map page | Map shows fresh seed data. No stale negotiations or bookings visible. |
| 8.5 | POST /api/demo/trigger-match works after reset | Triggering a match after reset starts a new negotiation cleanly. |
| 8.6 | Multiple resets in sequence don't cause errors | Reset 3 times in a row → no duplicate data, no DB constraint violations. |

### 9. Voice Companion — Basic Interaction

**File:** `e2e/voice-companion.spec.ts`

> Tests the voice interface availability (ElevenLabs widget). Actual voice recognition
> can't be automated, but we verify the UI elements and session management.

| # | Step | Expected Outcome |
|---|------|------------------|
| 9.1 | Voice button is visible on map page | Floating microphone button is rendered in the bottom area. |
| 9.2 | Click voice button | Voice companion panel/widget appears or expands. |
| 9.3 | Voice companion shows companion character | Companion agent sprite is displayed in the voice UI. |
| 9.4 | Click voice button again to close | Voice panel collapses or hides. |
| 9.5 | Voice session endpoint is accessible | POST `/api/voice/start-session` returns 200 with a token. |

### 10. Responsive & Visual Regression

**File:** `e2e/visual-regression.spec.ts`

> Screenshot-based tests to catch visual regressions in the pixel art UI.

| # | Step | Expected Outcome |
|---|------|------------------|
| 10.1 | Screenshot: Welcome screen (1280x720) | Matches baseline screenshot — NES-styled dialog box, BOROUGH title, companion sprite. |
| 10.2 | Screenshot: Map view with bubbles (1280x720) | Map visible, bubbles rendered, header shows BOROUGH branding. |
| 10.3 | Screenshot: Listing popup open (1280x720) | NES-styled card popup with listing details, properly positioned. |
| 10.4 | Screenshot: Negotiation theater open (1280x720) | Bottom panel with agent messages, sprites, speech balloons visible. |
| 10.5 | Screenshot: Deal confirmation dialog (1280x720) | Pixel-styled dialog with deal terms, approve/reject buttons. |
| 10.6 | Screenshot: Mobile viewport (375x812) | UI is usable — map fills viewport, buttons are tappable size. |

### 11. Error Handling & Edge Cases

**File:** `e2e/error-handling.spec.ts`

> Graceful degradation when things go wrong.

| # | Step | Expected Outcome |
|---|------|------------------|
| 11.1 | Backend is down → frontend shows error state | If API returns 500 or is unreachable, map page shows a friendly error message, not a blank screen. |
| 11.2 | WebSocket disconnects → reconnection | Kill WS connection → client attempts reconnection. After reconnect, events resume. |
| 11.3 | Invalid listing ID in trigger-match | POST `/api/demo/trigger-match?listingId=nonexistent` returns 404, no crash. |
| 11.4 | Double-approve a negotiation | Approving the same side twice doesn't create duplicate bookings. |
| 11.5 | Approve already-abandoned negotiation | POST approve on an abandoned negotiation returns an error, doesn't create a booking. |
| 11.6 | Click supply bubble during active negotiation | Popup opens over the dimmed map — doesn't break the negotiation theater. |
| 11.7 | Rapid-fire bubble clicks | Clicking multiple bubbles quickly → only the last popup stays open. No stacked popups. |
| 11.8 | Empty map (no seed data) | Map loads without errors. Shows empty London map. No JS console errors. |
| 11.9 | Very long listing title or description | A listing with a 500-character title renders without layout breakage. |
| 11.10 | Negotiate while on different page, then return | Start negotiation → navigate away → navigate back to /map → theater state is preserved or recoverable. |

### 12. Performance Smoke Tests

**File:** `e2e/performance.spec.ts`

| # | Step | Expected Outcome |
|---|------|------------------|
| 12.1 | Initial page load time | `/map` page loads (first contentful paint) in under 3 seconds. |
| 12.2 | Map renders within 2 seconds of page load | Mapbox canvas is visible and interactive within 2s of page mount. |
| 12.3 | 50 bubbles render without jank | Seed 50 listings → map renders all 50 without visible lag or dropped frames. |
| 12.4 | Negotiation messages render instantly | Each `negotiation:message` event renders the message within 100ms of receipt. |
| 12.5 | No memory leaks on repeated theater open/close | Open and close the negotiation theater 20 times → browser memory usage stays stable. |

---

## Running E2E Tests

### Setup

```bash
# Terminal 1: Start backend
cd backend
DATABASE_URL="postgresql://test:test@localhost:5432/borough_test" yarn start:dev

# Terminal 2: Start frontend
cd frontend
NEXT_PUBLIC_API_URL="http://localhost:3001" yarn dev

# Terminal 3: Run E2E tests
npx playwright test                    # Run all E2E tests
npx playwright test demo-flow.spec.ts  # Run just the demo flow
npx playwright test --headed           # Run with visible browser
npx playwright test --debug            # Step-through debug mode
```

### CI Configuration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: borough_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd backend && yarn install && yarn build
      - run: cd frontend && yarn install && yarn build
      - run: npx playwright install --with-deps
      - run: |
          cd backend && yarn start:prod &
          cd frontend && yarn start &
          npx wait-on http://localhost:3000 http://localhost:3001
          npx playwright test
```

---

## Test Priority for Demo Day

If time is limited, run these tests in order of importance:

1. **Suite 3: Demo Flow** — This IS the demo. If this passes, the hackathon presentation works.
2. **Suite 1: User Journey** — Users need to register and reach the map.
3. **Suite 2: Map Exploration** — Bubbles and popups need to render.
4. **Suite 4: Negotiation Theater UI** — The theater is the visual highlight.
5. **Suite 8: Seed & Reset** — Demo operator needs to reset between runs.
6. **Suite 11: Error Handling** — Prevents embarrassing crashes during live demo.
