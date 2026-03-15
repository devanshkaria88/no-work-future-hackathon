# Borough — Unit Test Specifications

> Tests that verify individual functions, services, components, and hooks in isolation.
> Mock all external dependencies (database, Claude API, WebSocket, Mapbox, etc.)

---

## Backend Unit Tests (NestJS + Jest)

### 1. UsersService

**File:** `src/users/users.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 1.1 | should create a user with valid fields | `create()` persists name, email, locationArea, lat, lng, skills, status, preferences and returns a user with a UUID |
| 1.2 | should hash the password before storing | `create()` never stores plaintext password — `passwordHash` differs from input |
| 1.3 | should reject duplicate email | `create()` with an already-used email throws a conflict error |
| 1.4 | should find a user by ID | `findOne(id)` returns the correct user object |
| 1.5 | should return null for non-existent user | `findOne('random-uuid')` returns null or throws NotFoundException |
| 1.6 | should find a user by email | `findByEmail(email)` returns the matching user |
| 1.7 | should update user fields | `update(id, { locationArea: 'Camden' })` changes the field and returns updated user |
| 1.8 | should store skills as a JSON array | Creating a user with `skills: ['cooking', 'guitar']` persists and retrieves as an array |

### 2. ListingsService

**File:** `src/listings/listings.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 2.1 | should create a listing tied to a user | `create()` with valid body returns a listing with correct `userId` |
| 2.2 | should reject listing with zero or negative price | `create({ pricePence: 0 })` throws validation error |
| 2.3 | should reject listing with zero capacity | `create({ capacity: 0 })` throws validation error |
| 2.4 | should filter listings by lat/lng/radius | `findAll({ lat, lng, radius: 1000 })` only returns listings within 1km |
| 2.5 | should filter listings by category | `findAll({ category: 'food' })` only returns food listings |
| 2.6 | should update listing price | `update(id, { pricePence: 2500 })` changes the price |
| 2.7 | should update listing status | `update(id, { status: 'paused' })` changes status |
| 2.8 | should default status to 'active' | New listing has `status === 'active'` |
| 2.9 | should default booked to 0 | New listing has `booked === 0` |
| 2.10 | should return a single listing by ID | `findOne(id)` returns the correct listing with all fields |

### 3. DemandService

**File:** `src/demand/demand.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 3.1 | should create a demand signal | `create()` with query, budgetMaxPence, lat, lng, radiusMeters persists correctly |
| 3.2 | should filter demand signals by location and radius | `findAll({ lat, lng, radius })` returns only nearby signals |
| 3.3 | should reject demand signal with no query text | `create({ query: '' })` throws validation error |
| 3.4 | should default status to 'active' | New demand signal has `status === 'active'` |

### 4. MatchesService

**File:** `src/matches/matches.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 4.1 | should find all matches for a given user | `findMatchesByUser(userId)` returns matches where user is buyer or seller |
| 4.2 | should return empty array for user with no matches | `findMatchesByUser('new-user-id')` returns `[]` |
| 4.3 | should find a negotiation by ID | `findNegotiation(id)` returns negotiation with transcript, outcome, prices |
| 4.4 | should return the negotiation transcript | `findNegotiationTranscript(id)` returns array of `{ from, text, timestamp }` messages |
| 4.5 | should approve negotiation from buyer side | `approveNegotiation(id, { userId: buyerId, approved: true })` sets `buyerApproved = true` |
| 4.6 | should approve negotiation from seller side | Same but sets `sellerApproved = true` |
| 4.7 | should mark negotiation as deal when both approve | After both buyer and seller approve, `outcome` changes to `'deal'` |
| 4.8 | should create a booking when deal is confirmed | After both approvals, a Booking entity is created with correct price, quantity, status |

### 5. MapService

**File:** `src/map/map.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 5.1 | should return supply and demand bubbles within radius | `getBubbles({ lat, lng, radius })` returns `{ supply: [...], demand: [...] }` |
| 5.2 | should return empty arrays for unpopulated area | Querying coordinates far from any data returns empty supply and demand |
| 5.3 | should return active negotiations for the map | `getActiveNegotiations()` returns negotiations with status `'in_progress'` and location data |

### 6. BlackboardService

**File:** `src/agents/blackboard/blackboard.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 6.1 | should write data to a section | `write('opportunities', data)` stores data retrievable via `getSnapshot()` |
| 6.2 | should return full state snapshot | `getSnapshot()` returns object with all blackboard sections |
| 6.3 | should overwrite data in a section on re-write | Writing to the same section replaces previous data |
| 6.4 | should emit events when writing | After `write()`, the EventEmitter fires a `blackboard.*` event |

### 7. OrchestratorService

**File:** `src/agents/orchestrator/orchestrator.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 7.1 | should trigger ScoutAgent when new user profile is written | Mock blackboard event for `userProfiles` → verify `scoutService.analyze()` is called |
| 7.2 | should trigger PackagerAgent when Scout writes opportunity | Mock blackboard event for `opportunities` → verify packager is called |
| 7.3 | should trigger MatchmakerAgent when listing goes live | Mock blackboard event for `activeListings` → verify matchmaker is called |
| 7.4 | should trigger MatchmakerAgent when demand signal is posted | Mock blackboard event for `demandSignals` → verify matchmaker scan |
| 7.5 | should trigger NegotiatorService when match confidence > 0.8 | Mock a match write with confidence 0.92 → verify negotiator starts |
| 7.6 | should NOT trigger NegotiatorService when match confidence <= 0.8 | Mock a match write with confidence 0.6 → verify negotiator is NOT called |

### 8. ScoutService

**File:** `src/agents/scout/scout.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 8.1 | should call Claude API with scout system prompt | `analyze(userProfile)` calls `claudeService.chat()` with `SCOUT_SYSTEM_PROMPT` |
| 8.2 | should return an array of opportunities | The parsed result from Claude is an array of Opportunity objects |
| 8.3 | should include demand_score in each opportunity | Each opportunity has a numeric `demand_score` between 0 and 1 |
| 8.4 | should write opportunities to blackboard | After analysis, `blackboardService.write('opportunities', ...)` is called |

### 9. PackagerService

**File:** `src/agents/packager/packager.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 9.1 | should call Claude API with packager system prompt | `draft(profile, opportunity)` calls `claudeService.chat()` with `PACKAGER_SYSTEM_PROMPT` |
| 9.2 | should return a ListingDraft with required fields | Result has `title`, `description`, `price_per_person`, `capacity`, `tags` |
| 9.3 | should write draft listing to blackboard | After drafting, data is written to blackboard |

### 10. MatchmakerService

**File:** `src/agents/matchmaker/matchmaker.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 10.1 | should find matches between listings and demand signals | `forceScan(listingId)` returns matches with `confidence` and `reasoning` |
| 10.2 | should call Claude API with listing and demand data | Claude is called with `MATCHMAKER_SYSTEM_PROMPT` and relevant context |
| 10.3 | should write matches to blackboard | Matches are written to the blackboard after scan |
| 10.4 | should only return matches above minimum confidence threshold | Matches below 0.5 confidence are filtered out |

### 11. NegotiatorService

**File:** `src/agents/negotiator/negotiator.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 11.1 | should initialize buyer agent with buyer constraints | Buyer prompt includes `budget_max`, `preferred_price`, `party_size` |
| 11.2 | should initialize seller agent with seller constraints | Seller prompt includes `listing_price`, `minimum_price`, `remaining_capacity` |
| 11.3 | should alternate turns between buyer and seller | Message array alternates `from: 'buyer'` and `from: 'seller'` |
| 11.4 | should stop after MAX_ROUNDS (6) if no agreement | If Claude never produces agreement keywords, negotiation ends as `'abandoned'` after 6 rounds |
| 11.5 | should detect agreement when both messages contain deal keywords | `detectAgreement('Deal confirmed', 'Agreed, let\'s do it')` returns `true` |
| 11.6 | should NOT detect agreement from a single side | `detectAgreement('I accept', 'No way')` returns `false` |
| 11.7 | should emit negotiation:message via WebSocket for each turn | Each turn triggers `wsGateway.emit('negotiation:message', ...)` |
| 11.8 | should emit negotiation:deal-reached when deal is found | On agreement, `wsGateway.emit('negotiation:deal-reached', ...)` is called |
| 11.9 | should emit negotiation:abandoned when max rounds exceeded | After 6 rounds with no deal, abandoned event fires |
| 11.10 | should build conversation history with correct role mapping | For seller's turn, buyer messages have `role: 'user'` and seller messages have `role: 'assistant'` |

### 12. ClaudeService

**File:** `src/common/llm/claude.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 12.1 | should call Anthropic API with correct model | `chat()` calls `client.messages.create()` with `model: 'claude-sonnet-4-20250514'` |
| 12.2 | should use default temperature of 0.7 | When no temperature is specified, 0.7 is used |
| 12.3 | should use default maxTokens of 1024 | When no maxTokens is specified, 1024 is used |
| 12.4 | should return the text content from response | Response is extracted from `response.content[0].text` |
| 12.5 | should parse JSON response in chatJSON | `chatJSON()` parses Claude's text response as JSON |
| 12.6 | should use lower temperature (0.3) for chatJSON | Structured output uses lower temperature for consistency |

### 13. VoiceService

**File:** `src/voice/voice.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 13.1 | should create a voice session and return a token | `createSession()` returns an object with a conversation token |
| 13.2 | should write user profile via voice tool | `writeUserProfile(data)` creates/updates a user in the database |
| 13.3 | should return opportunities via voice tool | `getOpportunities(userId)` triggers scout and returns opportunities |
| 13.4 | should return draft listing via voice tool | `getDraftListing(userId)` triggers packager and returns a draft |
| 13.5 | should publish listing via voice tool | `publishListing(data)` creates a live listing |
| 13.6 | should return matches via voice tool | `getMatches(userId)` returns user's matches |
| 13.7 | should approve deal via voice tool | `approveDeal(data)` approves the negotiation for the user |

### 14. SeedService

**File:** `src/seed/seed.service.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 14.1 | should seed users into the database | After `seed()`, at least 5 users exist in the DB |
| 14.2 | should seed listings with London coordinates | After `seed()`, listings have lat/lng within London bounds |
| 14.3 | should seed demand signals | After `seed()`, demand signals exist |
| 14.4 | should reset and re-seed on reset | `reset()` clears all data then seeds again — counts match initial seed |

### 15. AuthController

**File:** `src/users/auth.controller.spec.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 15.1 | should register a new user and return user object | POST `/api/auth/register` with valid body returns 201 with user data |
| 15.2 | should reject registration with missing email | POST `/api/auth/register` without email returns 400 |
| 15.3 | should login with valid credentials | POST `/api/auth/login` with correct email/password returns user |
| 15.4 | should reject login with wrong password | POST `/api/auth/login` with wrong password returns 401 |

---

## Frontend Unit Tests (Jest + React Testing Library)

> Install `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, and `jest-environment-jsdom`.

### 16. Zustand Store — `useBoroughStore`

**File:** `app/stores/borough.store.test.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 16.1 | should initialize with null user | `getState().user` is `null` on first load |
| 16.2 | should set user profile | `setUser({ name: 'Maria', ... })` updates `user` in state |
| 16.3 | should add a supply bubble | `addBubble({ type: 'supply', ... })` increases `supplyBubbles` length by 1 |
| 16.4 | should add a demand bubble | `addBubble({ type: 'demand', ... })` increases `demandPulses` length by 1 |
| 16.5 | should remove a bubble by ID | `removeBubble(id)` removes from the correct list |
| 16.6 | should add agent activity | `addAgentActivity({ agent: 'scout', action: 'scanning' })` appends to `agentActivity` |
| 16.7 | should clear agent activity | `clearAgentActivity()` empties the `agentActivity` array |
| 16.8 | should set active negotiation | `setActiveNegotiation(data)` updates `activeNegotiation` |
| 16.9 | should add negotiation message | `addNegotiationMessage(msg)` appends to `negotiationMessages` |
| 16.10 | should clear negotiation state | `clearNegotiation()` resets `activeNegotiation` and `negotiationMessages` |
| 16.11 | should add XP and compute level | `addXP(200)` updates `xp` and `level` correctly |
| 16.12 | should toggle negotiation theater open/close | `setNegotiationTheaterOpen(true)` sets `isNegotiationTheaterOpen` to true |
| 16.13 | should set and clear selected bubble | `setSelectedBubble(bubble)` then `setSelectedBubble(null)` |

### 17. Lib — `constants.ts`

**File:** `app/lib/constants.test.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 17.1 | LONDON_CENTER should be valid London coordinates | lat ~51.5, lng ~-0.12 |
| 17.2 | CATEGORY_COLORS should have all expected categories | Keys include `food`, `music`, `tech`, `creative`, `repair`, `language`, `wellness`, `career`, `pets` |
| 17.3 | getLevelForXP should return level 1 for 0 XP | `getLevelForXP(0)` returns 1 |
| 17.4 | getLevelForXP should increase level at thresholds | `getLevelForXP(500)` returns higher level than `getLevelForXP(100)` |

### 18. Lib — `agents.ts`

**File:** `app/lib/agents.test.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 18.1 | AGENTS should define all 6 agent types | Keys: scout, packager, matchmaker, buyerNegotiator, sellerNegotiator, companion |
| 18.2 | each agent should have name, color, and sprite path | Every agent in AGENTS has non-empty `name`, `color`, `sprite` |
| 18.3 | getAgentForRole should return correct agent | `getAgentForRole('scout')` returns the scout definition |
| 18.4 | getAgentForRole should return undefined for unknown role | `getAgentForRole('unknown')` returns `undefined` |

### 19. Lib — `websocket.ts`

**File:** `app/lib/websocket.test.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 19.1 | getSocket should return a socket.io client instance | `getSocket()` returns an object with `on`, `emit`, `disconnect` methods |
| 19.2 | connectSocket should connect to WS_URL | Mock `io()` — verify it's called with the correct URL |
| 19.3 | disconnectSocket should call disconnect on the socket | After connect, `disconnectSocket()` calls `.disconnect()` |
| 19.4 | getSocket should return the same instance on repeated calls | Two calls to `getSocket()` return the same reference (singleton) |

### 20. Component — `RetroHeader`

**File:** `app/components/shared/RetroHeader.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 20.1 | should render the Borough logo/title | Text "BOROUGH" appears in the header |
| 20.2 | should display user name when logged in | When store has a user, their name is visible |
| 20.3 | should display XP and level | XP count and level indicator are rendered |

### 21. Component — `PixelCharacter`

**File:** `app/components/shared/PixelCharacter.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 21.1 | should render an image with correct sprite src | Given `agent="scout"`, renders `<img>` with scout sprite path |
| 21.2 | should apply correct size | Given `size={32}`, the image has width and height of 32 |
| 21.3 | should render nothing for unknown agent | Given an invalid agent type, renders nothing or fallback |

### 22. Component — `PixelLoader`

**File:** `app/components/shared/PixelLoader.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 22.1 | should render a loading animation | Component mounts without error and contains loading indicator |
| 22.2 | should display optional loading text | Given `text="Loading..."`, that text appears |

### 23. Component — `AgentMessage`

**File:** `app/components/agents/AgentMessage.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 23.1 | should render the agent name | Given `agentName="Buyer Agent"`, the name is visible |
| 23.2 | should render the message text | Given `message="I'd like to negotiate"`, the text appears |
| 23.3 | should apply correct color based on agent | Buyer messages use blue, seller messages use amber |
| 23.4 | should render the agent sprite | The PixelCharacter for the correct agent type is rendered |

### 24. Component — `AgentActivityBar`

**File:** `app/components/agents/AgentActivityBar.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 24.1 | should render nothing when no agent activity | Empty `agentActivity` array → nothing rendered |
| 24.2 | should render scout scanning notification | Activity `{ agent: 'scout', action: 'scanning' }` → shows scout scanning text |
| 24.3 | should render packager drafting notification | Activity `{ agent: 'packager', action: 'drafting' }` → shows drafting text |
| 24.4 | should render matchmaker found notification | Activity `{ agent: 'matchmaker', action: 'found', count: 3 }` → shows match count |

### 25. Component — `NegotiationTheater`

**File:** `app/components/agents/NegotiationTheater.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 25.1 | should not render when isNegotiationTheaterOpen is false | Component is hidden/unmounted |
| 25.2 | should render when isNegotiationTheaterOpen is true | Component is visible |
| 25.3 | should render each negotiation message | Given 3 messages in store, 3 AgentMessage components appear |
| 25.4 | should show "Jump in" button | Button with "Jump in" text is rendered |
| 25.5 | should show "Let them talk" button | Button with "Let them talk" text is rendered |

### 26. Component — `DealConfirmation`

**File:** `app/components/agents/DealConfirmation.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 26.1 | should render deal terms | Shows final price, quantity, listing title |
| 26.2 | should render approve and reject buttons | Both "Approve" and "Reject" buttons are present |
| 26.3 | should call approve handler on approve click | Clicking approve calls the approval callback |
| 26.4 | should call reject handler on reject click | Clicking reject calls the rejection callback |

### 27. Component — `ListingPopup`

**File:** `app/components/listings/ListingPopup.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 27.1 | should render listing title | Given a listing, its title appears |
| 27.2 | should render price in pounds | Price `3000` (pence) renders as "£30" |
| 27.3 | should render capacity and booked count | Shows spots remaining (capacity - booked) |
| 27.4 | should render category tags | Tags array renders as visible badges |
| 27.5 | should render location area | Location like "Shoreditch, E2" is visible |
| 27.6 | should render "I'm interested" button | The interest/CTA button is present |
| 27.7 | should render "Close" button | Close button is present |

### 28. Component — `WelcomeScreen`

**File:** `app/components/onboarding/WelcomeScreen.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 28.1 | should render Borough welcome text | "WELCOME TO" and "BOROUGH" text appears |
| 28.2 | should render companion character | Companion agent sprite is displayed |
| 28.3 | should render "Talk to Borough" button | Voice CTA button is present |
| 28.4 | should render "Explore the map" button | Map exploration button is present |

### 29. Component — `AuthScreen`

**File:** `app/components/onboarding/AuthScreen.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 29.1 | should render login form by default | Email and password inputs are visible |
| 29.2 | should toggle to register mode | Clicking "Register" shows name field |
| 29.3 | should call login handler on form submit | Submitting login form calls the login function |
| 29.4 | should show error message on failed login | After failed login, error text is displayed |

### 30. Component — `GameNotification`

**File:** `app/components/shared/GameNotification.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 30.1 | should render notification text | Given `text="Match found!"`, the text is visible |
| 30.2 | should auto-dismiss after timeout | After specified duration, notification is removed from DOM |
| 30.3 | should render the correct agent icon | Given `agent="matchmaker"`, the matchmaker sprite appears |

### 31. Component — `ConfettiEffect`

**File:** `app/components/shared/ConfettiEffect.test.tsx`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 31.1 | should call canvas-confetti when triggered | When `trigger` prop is true, `confetti()` function is called |
| 31.2 | should not fire confetti when trigger is false | When `trigger` is false, `confetti()` is not called |

### 32. Hook — `useWebSocket`

**File:** `app/hooks/useWebSocket.test.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 32.1 | should connect to WebSocket on mount | Mock `io()` is called with `WS_URL` |
| 32.2 | should register map event listeners | Socket `.on()` is called with `'map:bubble-added'` and `'map:bubble-removed'` |
| 32.3 | should register agent event listeners | Socket `.on()` is called with `'agent:scout-scanning'`, `'agent:scout-found'`, `'agent:packager-drafting'` |
| 32.4 | should register negotiation event listeners | Socket `.on()` is called with `'negotiation:started'`, `'negotiation:message'`, `'negotiation:deal-reached'` |
| 32.5 | should disconnect socket on unmount | When component unmounts, `socket.disconnect()` is called |
| 32.6 | should update store on map:bubble-added | Simulating the event fires `store.addBubble()` |
| 32.7 | should open negotiation theater on negotiation:started | Simulating the event fires `store.setNegotiationTheaterOpen(true)` |
| 32.8 | should add XP on negotiation:deal-reached | Simulating the event fires `store.addXP(200)` |

### 33. Hook — `useMapBubbles`

**File:** `app/hooks/useMapBubbles.test.ts`

| # | Test Name | What It Checks |
|---|-----------|----------------|
| 33.1 | should fetch bubbles from API on mount | `fetch()` is called with `/api/map/bubbles?lat=...&lng=...&radius=...` |
| 33.2 | should populate store with supply bubbles | After fetch resolves, `supplyBubbles` in store is populated |
| 33.3 | should populate store with demand pulses | After fetch resolves, `demandPulses` in store is populated |
| 33.4 | should handle API error gracefully | If fetch fails, store remains empty and no crash |

---

## Running the Tests

### Backend

```bash
cd backend
yarn test              # Run all unit tests
yarn test --watch      # Watch mode
yarn test --coverage   # Coverage report
```

### Frontend

```bash
cd frontend
npx jest               # Run all unit tests
npx jest --watch       # Watch mode
npx jest --coverage    # Coverage report
```
