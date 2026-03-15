# Borough — Integration Test Specifications

> Tests that verify multiple modules working together — API routes hitting real services,
> agents triggering each other through the blackboard, WebSocket events flowing from backend
> to a connected client, and database state changing correctly across operations.
>
> Use a real test database (SQLite in-memory or test PostgreSQL). Mock only the Claude API
> (use canned responses). Use a real WebSocket test client to verify events.

---

## Setup

### Backend Integration Test Environment

```
test/
├── jest-integration.json          # Jest config pointing to *.integration.spec.ts
├── helpers/
│   ├── test-app.ts                # NestJS TestingModule factory (creates the app)
│   ├── test-db.ts                 # In-memory SQLite or test PG connection
│   ├── mock-claude.ts             # Canned Claude responses for each agent
│   └── ws-client.ts               # Socket.io test client helper
└── integration/
    ├── user-flow.integration.spec.ts
    ├── listing-flow.integration.spec.ts
    ├── demand-flow.integration.spec.ts
    ├── match-negotiation.integration.spec.ts
    ├── agent-pipeline.integration.spec.ts
    ├── websocket-events.integration.spec.ts
    ├── map-api.integration.spec.ts
    ├── voice-tools.integration.spec.ts
    ├── seed-demo.integration.spec.ts
    └── auth-flow.integration.spec.ts
```

### Frontend Integration Test Environment

```
__tests__/integration/
├── map-websocket.integration.test.tsx
├── negotiation-flow.integration.test.tsx
├── store-api.integration.test.tsx
└── onboarding-flow.integration.test.tsx
```

---

## Backend Integration Tests

### 1. User Registration & Profile Flow

**File:** `test/integration/user-flow.integration.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 1.1 | POST /api/auth/register → GET /api/users/:id | Register a user, then fetch by ID — all fields match |
| 1.2 | POST /api/auth/register → POST /api/auth/login | Register, then login with same credentials — returns user |
| 1.3 | POST /api/auth/login with wrong password → 401 | Login with incorrect password after valid registration — rejected |
| 1.4 | POST /api/users creates user and appears in GET /api/users/:id | Creating via users endpoint (voice flow) persists correctly |
| 1.5 | User preferences JSON round-trip | Create user with complex `preferences` object → GET returns identical JSON |
| 1.6 | User skills array round-trip | Create user with `skills: ['cooking', 'guitar', 'python']` → GET returns same array |

### 2. Listing CRUD Flow

**File:** `test/integration/listing-flow.integration.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 2.1 | POST /api/listings → GET /api/listings/:id | Create listing, fetch it — all fields match including tags and included arrays |
| 2.2 | POST /api/listings → GET /api/listings (nearby filter) | Create listing at known coords → query with lat/lng/radius returns it |
| 2.3 | POST /api/listings → GET /api/listings?category=food | Create food listing → category filter returns it; tech filter does not |
| 2.4 | POST /api/listings → PATCH /api/listings/:id | Create listing, update price → GET returns updated price |
| 2.5 | Listing appears in map bubbles | POST listing → GET /api/map/bubbles with matching coords returns it in `supply` |
| 2.6 | Multiple listings filter correctly | Create 5 listings in different categories and locations → each filter combination returns correct subset |
| 2.7 | Listing with minimumPricePence persists | Create listing with `minimumPricePence: 2000` → GET returns correct value |

### 3. Demand Signal Flow

**File:** `test/integration/demand-flow.integration.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 3.1 | POST /api/demand → GET /api/demand (nearby filter) | Create demand signal → query nearby returns it |
| 3.2 | Demand signal appears in map bubbles | POST demand → GET /api/map/bubbles returns it in `demand` |
| 3.3 | Demand signal with expiry | Create demand with `expiresAt` in the past → query does not return it (or returns with expired status) |
| 3.4 | Multiple demand signals in different areas | Create signals in Shoreditch, Camden, Brixton → each area query returns only local signals |

### 4. Match & Negotiation Flow

**File:** `test/integration/match-negotiation.integration.spec.ts`

This is the most critical integration test — it verifies the core product loop.

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 4.1 | **Full match-to-booking pipeline** | 1. Seed a listing (seller) and a demand signal (buyer). 2. Trigger matchmaker via `POST /api/demo/trigger-match`. 3. Verify match is created with confidence > 0.5. 4. Verify negotiation is created with `outcome: 'in_progress'`. 5. Wait for negotiation to complete (mock Claude to converge). 6. Verify negotiation transcript has alternating buyer/seller messages. 7. Approve from buyer side → `buyerApproved = true`. 8. Approve from seller side → `sellerApproved = true`. 9. Verify booking is created with correct price, quantity, status. |
| 4.2 | Negotiation transcript has correct structure | GET /api/negotiations/:id/transcript → returns array of `{ from: 'buyer'|'seller', text: string, timestamp: string }` |
| 4.3 | Negotiation respects maximum 6 rounds | With a Claude mock that never agrees → negotiation ends as `'abandoned'` with ≤ 12 messages (6 rounds × 2 turns) |
| 4.4 | Human intervention during negotiation | POST /api/negotiations/:id/intervene with `{ userId, message }` → message appears in transcript |
| 4.5 | Partial approval doesn't create booking | Only buyer approves → no booking is created yet |
| 4.6 | Both-side rejection abandons negotiation | Both sides reject → negotiation outcome is `'abandoned'` or similar |
| 4.7 | GET /api/matches/:userId returns all user's matches | After creating matches for a user as both buyer and seller → all appear |
| 4.8 | Negotiation with deal terms has finalPricePence and quantity | After deal, negotiation entity has non-null `finalPricePence` and `quantity` |

### 5. Agent Pipeline (Blackboard Orchestration)

**File:** `test/integration/agent-pipeline.integration.spec.ts`

These tests verify the agent chain triggers correctly through the blackboard.

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 5.1 | **User profile → Scout → Opportunities** | Write a user profile to blackboard → orchestrator triggers ScoutService → blackboard now has opportunities for that user |
| 5.2 | **Opportunity → Packager → Draft Listing** | Write an opportunity to blackboard → orchestrator triggers PackagerService → blackboard has a draft listing |
| 5.3 | **Listing live → Matchmaker → Match** | Write a listing to activeListings → orchestrator triggers MatchmakerService → if matching demand exists, blackboard has a match |
| 5.4 | **Demand signal → Matchmaker re-scan** | Write a demand signal → orchestrator triggers matchmaker scan → matches are found against existing listings |
| 5.5 | **High-confidence match → Negotiator starts** | Write a match with confidence 0.92 → negotiator starts → negotiation messages appear on blackboard |
| 5.6 | **Low-confidence match → No negotiation** | Write a match with confidence 0.6 → negotiator does NOT start |
| 5.7 | **Full pipeline: profile → booking** | Create user profile → wait for scout → wait for packager → approve listing → seed a demand signal → wait for matchmaker → wait for negotiation → both approve → booking exists. This is the full autonomous agent flow. |
| 5.8 | **Blackboard snapshot reflects all stages** | After running the full pipeline, `getSnapshot()` returns data in every section: userProfiles, opportunities, activeListings, demandSignals, matches, negotiations, transactions |

### 6. WebSocket Event Flow

**File:** `test/integration/websocket-events.integration.spec.ts`

Use a test Socket.io client to verify events are emitted at the right times.

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 6.1 | Client receives map:bubble-added when listing is created | Connect WS client → POST a listing → client receives `map:bubble-added` with listing data |
| 6.2 | Client receives agent:scout-scanning when scout runs | Trigger scout → client receives `agent:scout-scanning` with area info |
| 6.3 | Client receives agent:scout-found with opportunity count | After scout completes → client receives `agent:scout-found` with `opportunityCount` |
| 6.4 | Client receives agent:packager-drafting when packager runs | Trigger packager → client receives `agent:packager-drafting` |
| 6.5 | Client receives agent:packager-ready with draft | After packager completes → client receives `agent:packager-ready` with `listingDraft` |
| 6.6 | Client receives agent:matchmaker-found on match | Trigger matchmaker with matching data → client receives `agent:matchmaker-found` |
| 6.7 | Client receives negotiation:started with locations | Start negotiation → client receives `negotiation:started` with `buyerLocation` and `sellerLocation` |
| 6.8 | Client receives negotiation:message for each turn | During negotiation → client receives multiple `negotiation:message` events with `from`, `message`, `agentName`, `agentColor` |
| 6.9 | Client receives negotiation:deal-reached with terms | On deal → client receives `negotiation:deal-reached` with `DealTerms` |
| 6.10 | Client receives negotiation:abandoned when no deal | On abandonment → client receives `negotiation:abandoned` with `reason` |
| 6.11 | Client receives booking:confirmed after both approvals | Both approve → client receives `booking:confirmed` with booking data and `celebrationLocation` |
| 6.12 | Multiple clients receive the same events | Connect 2 WS clients → trigger event → both clients receive it |

### 7. Map API Integration

**File:** `test/integration/map-api.integration.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 7.1 | GET /api/map/bubbles returns seeded data after seed | POST /api/demo/seed → GET /api/map/bubbles → supply and demand arrays are non-empty |
| 7.2 | Bubbles respect radius filter | Seed data across London → query with small radius around Shoreditch → only Shoreditch listings returned |
| 7.3 | GET /api/map/negotiations/active returns in-progress negotiations | Start a negotiation → GET active negotiations → returns it with locations and status |
| 7.4 | Completed negotiation disappears from active list | After negotiation completes → GET active negotiations → it's gone |
| 7.5 | GET /api/map/activity-heatmap returns density data | After seeding → GET heatmap for a borough → returns `cells` array with `lat`, `lng`, `intensity` |

### 8. Voice Tool Endpoints

**File:** `test/integration/voice-tools.integration.spec.ts`

These endpoints are called by ElevenLabs tool-use. They must return the right data format.

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 8.1 | POST /api/voice/tools/write-user-profile creates/updates user | Send profile data → user exists in DB with correct fields |
| 8.2 | POST /api/voice/tools/get-opportunities returns opportunities | After writing profile → get-opportunities returns array of opportunity objects |
| 8.3 | POST /api/voice/tools/get-draft-listing returns a listing draft | After opportunities exist → get-draft-listing returns a draft with title, price, capacity |
| 8.4 | POST /api/voice/tools/publish-listing creates a live listing | Send draft approval → listing appears in GET /api/listings |
| 8.5 | POST /api/voice/tools/get-matches returns matches | After listing is matched → get-matches returns match data |
| 8.6 | POST /api/voice/tools/approve-deal approves negotiation | After negotiation → approve-deal sets approved flag |
| 8.7 | POST /api/voice/tools/get-local-context returns area info | Returns supply/demand data for the user's area |
| 8.8 | Voice tools chain: profile → opportunities → draft → publish → match → approve | Full voice flow end-to-end through tool endpoints |

### 9. Seed & Demo Flow

**File:** `test/integration/seed-demo.integration.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 9.1 | POST /api/demo/seed populates all tables | After seed: users > 0, listings > 0, demand_signals > 0 |
| 9.2 | POST /api/demo/reset clears and re-seeds | After reset: counts match fresh seed, old data is gone |
| 9.3 | POST /api/demo/trigger-match creates a negotiation | Seed → trigger-match with a listing ID → negotiation starts |
| 9.4 | POST /api/demo/snapshot returns full blackboard state | After seed → snapshot returns populated blackboard sections |
| 9.5 | Seeded listings have valid London coordinates | All seeded listings have lat between 51.28-51.69 and lng between -0.51-0.33 |
| 9.6 | Seeded data matches PRD specifications | Verify the 10 listings from the PRD exist (South Indian Cooking, Guitar in Camden, etc.) |

### 10. Auth Flow

**File:** `test/integration/auth-flow.integration.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 10.1 | Register → Login → Access protected resource | Register user, login, use returned credentials to access user profile |
| 10.2 | Cannot access another user's data | User A cannot GET /api/users/:userB_id/opportunities (if protected) |
| 10.3 | Password is never exposed in API responses | GET /api/users/:id never returns `passwordHash` or `password` field |

---

## Frontend Integration Tests

### 11. Map + WebSocket Integration

**File:** `__tests__/integration/map-websocket.integration.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 11.1 | Map renders supply bubbles from API | Mount BoroughMap → mock API returns listings → bubbles appear on map |
| 11.2 | New bubble appears on map:bubble-added event | Mount map → simulate WS `map:bubble-added` → new marker appears |
| 11.3 | Bubble removed on map:bubble-removed event | Mount map with bubble → simulate `map:bubble-removed` → marker disappears |
| 11.4 | Clicking a supply bubble opens ListingPopup | Mount map → click a supply marker → ListingPopup renders with correct data |
| 11.5 | Demand pulses render differently from supply | Mount map with both types → demand markers have pulsing animation class |

### 12. Negotiation Flow (Frontend)

**File:** `__tests__/integration/negotiation-flow.integration.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 12.1 | NegotiationTheater opens on negotiation:started event | Simulate WS `negotiation:started` → theater slides up, `isNegotiationTheaterOpen` is true |
| 12.2 | Messages appear sequentially | Simulate 3 `negotiation:message` events → 3 AgentMessage components render in order |
| 12.3 | Buyer and seller messages render on correct sides | Buyer messages render left-aligned (blue), seller messages right-aligned (amber) |
| 12.4 | DealConfirmation shows on negotiation:deal-reached | Simulate `negotiation:deal-reached` → DealConfirmation dialog appears with terms |
| 12.5 | Approve button sends POST to /api/negotiations/:id/approve | Click "Approve" → mock fetch is called with correct endpoint and body |
| 12.6 | Confetti fires after deal is confirmed | Simulate deal-reached → `canvas-confetti` is called |
| 12.7 | XP increases by 200 on deal | After deal-reached event, store `xp` increases by 200 |
| 12.8 | "Jump in" button sends intervention message | Click "Jump in" → type message → submit → POST to /api/negotiations/:id/intervene |
| 12.9 | Theater closes and map un-dims after negotiation ends | After deal or abandonment, theater closes and map opacity returns to 1 |

### 13. Store + API Integration

**File:** `__tests__/integration/store-api.integration.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 13.1 | Login populates user in store | Submit auth form → API returns user → `store.user` has correct data |
| 13.2 | Fetching bubbles populates store | Call useMapBubbles → API returns data → `store.supplyBubbles` and `store.demandPulses` populated |
| 13.3 | Agent activity from WS populates store | Simulate agent WS events → `store.agentActivity` has entries |
| 13.4 | Clearing negotiation resets all negotiation state | After negotiation completes → `clearNegotiation()` resets messages, activeNegotiation, and theater state |

### 14. Onboarding Flow

**File:** `__tests__/integration/onboarding-flow.integration.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 14.1 | Landing page shows AuthScreen when not logged in | Mount page.tsx → AuthScreen is rendered |
| 14.2 | After login, WelcomeScreen appears | Submit login → API returns user → WelcomeScreen renders |
| 14.3 | Clicking "Explore the map" navigates to /map | Click the explore button → router pushes to `/map` |
| 14.4 | Map page renders BoroughMap and AgentActivityBar | Navigate to /map → both components are present |
| 14.5 | RetroHeader shows on map page with user info | Map page shows header with user name and XP |

---

## Running Integration Tests

### Backend

```bash
cd backend

# Start test database (use docker or in-memory SQLite)
# Set DATABASE_URL to test DB

yarn test:integration   # Add this script: jest --config test/jest-integration.json
```

### Frontend

```bash
cd frontend

# Mock the API server (use msw or manual fetch mocks)
npx jest --testPathPattern='integration'
```

---

## Mock Strategy

### Claude API Mocks

Create canned responses for each agent type so tests are deterministic:

```typescript
// test/helpers/mock-claude.ts

export const MOCK_CLAUDE_RESPONSES = {
  scout: JSON.stringify([{
    type: 'opportunity',
    category: 'food_experience',
    demand_score: 0.87,
    reasoning: 'High demand for cooking classes in area',
    competition: 'low',
    suggested_price_range: { min: 25, max: 40 }
  }]),

  packager: JSON.stringify({
    title: 'South Indian Cooking Experience',
    description: 'Learn to make dosa and sambar',
    price_per_person: 30,
    capacity: 4,
    tags: ['cooking', 'south_indian']
  }),

  matchmaker: JSON.stringify([{
    demandId: 'test-demand-id',
    confidence: 0.92,
    reasoning: 'Strong semantic match for food experience'
  }]),

  buyerNegotiator: [
    "My person is interested but their budget is £25. Any flexibility?",
    "What about £25 each for 2 spots?",
    "Deal at £26 each. Confirmed."
  ],

  sellerNegotiator: [
    "£28 is already fair for a hands-on cooking experience.",
    "I'll do £26 each for 2 guaranteed spots.",
    "Agreed. Sending to both parties for confirmation."
  ]
};
```

### WebSocket Test Client

```typescript
// test/helpers/ws-client.ts

import { io, Socket } from 'socket.io-client';

export function createTestWSClient(port: number): Socket {
  return io(`http://localhost:${port}`, {
    path: '/ws',
    transports: ['websocket'],
    autoConnect: false
  });
}

export function waitForEvent(socket: Socket, event: string, timeout = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}
```
