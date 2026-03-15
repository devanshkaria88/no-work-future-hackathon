# Borough — Backend PRD (NestJS)

> **Framework:** NestJS + PostgreSQL + TypeORM
> **Real-time:** WebSockets (Socket.io)
> **AI:** Claude API (Anthropic SDK)
> **Architecture:** Blackboard pattern with agent orchestration

---

## 1. Directory Structure

```
src/
├── app.module.ts
├── main.ts
│
├── agents/                    # Agent orchestration
│   ├── agents.module.ts
│   ├── blackboard/
│   │   ├── blackboard.service.ts       # Shared state manager
│   │   ├── blackboard.gateway.ts       # WebSocket gateway for real-time updates
│   │   └── blackboard.types.ts         # Blackboard state interfaces
│   ├── orchestrator/
│   │   └── orchestrator.service.ts     # Controls agent triggering logic
│   ├── scout/
│   │   ├── scout.service.ts            # Scout agent logic
│   │   └── scout.prompt.ts             # Scout system prompt constant
│   ├── packager/
│   │   ├── packager.service.ts
│   │   └── packager.prompt.ts
│   ├── matchmaker/
│   │   ├── matchmaker.service.ts
│   │   └── matchmaker.prompt.ts
│   └── negotiator/
│       ├── negotiator.service.ts       # Manages negotiation sessions
│       ├── buyer-negotiator.prompt.ts
│       └── seller-negotiator.prompt.ts
│
├── listings/                  # Listing CRUD
│   ├── listings.module.ts
│   ├── listings.controller.ts
│   ├── listings.service.ts
│   └── entities/
│       └── listing.entity.ts
│
├── users/                     # User profiles + skills
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── entities/
│       └── user.entity.ts
│
├── matches/                   # Match + negotiation management
│   ├── matches.module.ts
│   ├── matches.controller.ts
│   ├── matches.service.ts
│   └── entities/
│       ├── match.entity.ts
│       ├── negotiation.entity.ts
│       └── booking.entity.ts
│
├── map/                       # Map data endpoints
│   ├── map.module.ts
│   ├── map.controller.ts
│   └── map.service.ts
│
├── voice/                     # ElevenLabs webhook + tool handlers
│   ├── voice.module.ts
│   ├── voice.controller.ts
│   └── voice.service.ts
│
├── seed/                      # Demo data seeding
│   └── seed.service.ts
│
└── common/
    ├── config/
    │   └── database.config.ts
    ├── llm/
    │   └── claude.service.ts   # Shared Claude API client
    └── types/
        └── index.ts
```

---

## 2. Core Services

### 2.1 BlackboardService

The central nervous system. All agents read/write here. WebSocket broadcasts state changes to the frontend in real-time.

```typescript
// Blackboard state interface
interface BlackboardState {
  userProfiles: Map<string, UserProfile>;
  opportunities: Opportunity[];
  activeListings: Listing[];
  demandSignals: DemandSignal[];
  matches: Match[];
  negotiations: Map<string, NegotiationSession>;
  transactions: Transaction[];
}

// Core methods
class BlackboardService {
  // Write data to a section and notify orchestrator + broadcast via WS
  write(section: BlackboardSection, data: any): void;
  
  // Read current state of a section with optional filtering
  read(section: BlackboardSection, filter?: Record<string, any>): any;
  
  // Agents subscribe to sections they care about
  subscribe(section: BlackboardSection, callback: (data: any) => void): void;
  
  // Full state snapshot for frontend hydration
  getSnapshot(): BlackboardState;
  
  // Clear a section (for demo resets)
  clear(section: BlackboardSection): void;
}
```

### 2.2 OrchestratorService

Watches blackboard changes and triggers the right agents at the right time.

```
Trigger rules:
─────────────────────────────────────────────────────
Blackboard Event              → Agent Triggered
─────────────────────────────────────────────────────
New user profile written      → ScoutAgent.analyze()
Scout writes opportunity      → PackagerAgent.draft()
Listing goes live             → MatchmakerAgent.scan()
New demand signal posted      → MatchmakerAgent.scan()
Match found (confidence >0.8) → NegotiatorService.start()
Negotiation complete          → Notify both users via WS
Booking confirmed             → Update map, send celebration
─────────────────────────────────────────────────────
```

### 2.3 NegotiatorService

The most complex service. Manages turn-based conversations between two Claude instances with opposing objectives.

```typescript
async runNegotiation(match: Match): Promise<NegotiationResult> {
  const MAX_ROUNDS = 6;
  const MESSAGE_DELAY_MS = 1500; // Dramatic pause between messages
  const messages: NegotiationMessage[] = [];
  
  // 1. Initialize buyer agent with their constraints
  const buyerSystemPrompt = buildBuyerPrompt({
    buyer_max_budget: match.buyer.preferences.budgetMax,
    buyer_preferred_price: match.buyer.preferences.budgetPreferred,
    buyer_party_size: match.buyer.preferences.partySize,
    buyer_flexibility: match.buyer.preferences.flexibility,
  });
  
  // 2. Initialize seller agent with their constraints  
  const sellerSystemPrompt = buildSellerPrompt({
    listing_price: match.listing.price,
    seller_minimum_price: match.listing.minimumPrice,
    remaining_capacity: match.listing.capacity - match.listing.booked,
    seller_flexibility: match.listing.flexibility,
    listing_title: match.listing.title,
    listing_description: match.listing.description,
    listing_includes: match.listing.included,
  });

  // 3. Buyer opens the negotiation
  const buyerOpening = await this.claude.chat({
    system: buyerSystemPrompt,
    messages: [{
      role: 'user',
      content: `You've found a listing: "${match.listing.title}" priced at 
                £${match.listing.price / 100} per person. Your human wants 
                to book ${match.buyer.preferences.partySize} spots. 
                Open the negotiation with the seller's agent.`
    }]
  });
  
  messages.push({ from: 'buyer', text: buyerOpening, timestamp: new Date() });
  this.wsGateway.emit('negotiation:message', { 
    negotiationId: match.negotiationId,
    from: 'buyer',
    message: buyerOpening,
    agentName: 'Buyer Agent',
    agentColor: '#378ADD' // Blue
  });
  
  // 4. Turn-based conversation loop
  let lastMessage = buyerOpening;
  let currentTurn: 'seller' | 'buyer' = 'seller';
  
  for (let round = 0; round < MAX_ROUNDS; round++) {
    await this.delay(MESSAGE_DELAY_MS);
    
    const systemPrompt = currentTurn === 'seller' 
      ? sellerSystemPrompt 
      : buyerSystemPrompt;
    
    const conversationHistory = this.buildConversationHistory(messages, currentTurn);
    
    const response = await this.claude.chat({
      system: systemPrompt,
      messages: conversationHistory
    });
    
    messages.push({ from: currentTurn, text: response, timestamp: new Date() });
    this.wsGateway.emit('negotiation:message', { 
      negotiationId: match.negotiationId,
      from: currentTurn,
      message: response,
      agentName: currentTurn === 'seller' ? 'Seller Agent' : 'Buyer Agent',
      agentColor: currentTurn === 'seller' ? '#EF9F27' : '#378ADD'
    });
    
    // 5. Check if deal was reached
    if (this.detectAgreement(response, lastMessage)) {
      const terms = await this.extractDealTerms(messages);
      this.wsGateway.emit('negotiation:deal-reached', { 
        negotiationId: match.negotiationId, 
        terms 
      });
      return { outcome: 'deal', terms, transcript: messages };
    }
    
    lastMessage = response;
    currentTurn = currentTurn === 'seller' ? 'buyer' : 'seller';
  }
  
  // 6. Max rounds without deal
  this.wsGateway.emit('negotiation:abandoned', { 
    negotiationId: match.negotiationId, 
    reason: 'Could not reach agreement within 6 rounds' 
  });
  return { outcome: 'abandoned', transcript: messages };
}

// Build conversation history from the other agent's perspective
private buildConversationHistory(
  messages: NegotiationMessage[], 
  currentTurn: 'buyer' | 'seller'
): ChatMessage[] {
  return messages.map(msg => ({
    role: msg.from === currentTurn ? 'assistant' : 'user',
    content: msg.text
  }));
}

// Detect agreement keywords in last two messages
private detectAgreement(latest: string, previous: string): boolean {
  const agreementPatterns = [
    /\bdeal\b/i, /\bagreed\b/i, /\baccept/i, 
    /\bsound[s]? good\b/i, /\bworks for me\b/i,
    /\blet'?s do it\b/i, /\bconfirm/i
  ];
  return agreementPatterns.some(p => p.test(latest)) && 
         agreementPatterns.some(p => p.test(previous));
}
```

### 2.4 ClaudeService

Shared Claude API client used by all agents.

```typescript
class ClaudeService {
  private client: Anthropic;
  
  async chat(params: {
    system: string;
    messages: { role: string; content: string }[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: params.maxTokens || 1024,
      temperature: params.temperature || 0.7,
      system: params.system,
      messages: params.messages,
    });
    return response.content[0].text;
  }
  
  // For agents that need JSON output
  async chatJSON<T>(params: {
    system: string;
    messages: { role: string; content: string }[];
  }): Promise<T> {
    const text = await this.chat({
      ...params,
      temperature: 0.3 // Lower temp for structured output
    });
    return JSON.parse(text);
  }
}
```

---

## 3. API Endpoints

### Map Data

```
GET  /api/map/bubbles?lat=X&lng=Y&radius=Z
     Returns all supply bubbles and demand pulses within radius.
     Response: { supply: Listing[], demand: DemandSignal[] }

GET  /api/map/activity-heatmap?borough=hackney
     Returns density data for heatmap overlay.
     Response: { cells: { lat, lng, intensity }[] }

GET  /api/map/negotiations/active
     Returns currently running negotiations for map animation.
     Response: { negotiations: { id, buyerLat, buyerLng, sellerLat, sellerLng, status }[] }
```

### Users

```
POST /api/users
     Create or update user profile from voice onboarding.
     Body: { name, skills[], location_area, lat, lng, status, preferences }

GET  /api/users/:id
     Get user profile.

GET  /api/users/:id/opportunities
     Trigger Scout Agent and return opportunities.
     Response: { opportunities: Opportunity[] }
```

### Listings

```
POST /api/listings
     Create a new listing (from Packager Agent draft after user approval).
     Body: { userId, title, description, pricePence, capacity, category, lat, lng, timeSlot }

GET  /api/listings?lat=X&lng=Y&radius=Z&category=food
     Nearby listings with optional category filter.

GET  /api/listings/:id
     Single listing detail.

PATCH /api/listings/:id
      Update listing (price, availability, etc.)
```

### Demand Signals

```
POST /api/demand
     Post a demand signal (what someone is looking for).
     Body: { userId, query, budgetMaxPence, lat, lng, radiusMeters }

GET  /api/demand?lat=X&lng=Y&radius=Z
     Nearby demand signals.
```

### Matches and Negotiations

```
GET  /api/matches/:userId
     All matches for a user.

GET  /api/negotiations/:id
     Negotiation details including status.

GET  /api/negotiations/:id/transcript
     Full negotiation transcript (array of messages).

POST /api/negotiations/:id/approve
     Human approves a negotiated deal.
     Body: { userId, approved: boolean }

POST /api/negotiations/:id/intervene
     Human jumps into the negotiation with a message.
     Body: { userId, message: string }
```

### Voice Tool Endpoints

Called by ElevenLabs Conversational AI tool-use system:

```
POST /api/voice/tools/write-user-profile
POST /api/voice/tools/get-opportunities
POST /api/voice/tools/get-draft-listing
POST /api/voice/tools/publish-listing
POST /api/voice/tools/get-matches
POST /api/voice/tools/approve-deal
POST /api/voice/tools/get-local-context
```

### Demo Management

```
POST /api/demo/seed        # Seed database with London demo data
POST /api/demo/reset       # Clear all data and re-seed
POST /api/demo/trigger-match?listingId=X  # Force a match for demo purposes
```

---

## 4. WebSocket Events

### Gateway Setup

```typescript
@WebSocketGateway({ cors: true, namespace: '/ws' })
class BlackboardGateway {
  @WebSocketServer() server: Server;
  
  // Events emitted to frontend:
  emit(event: string, data: any): void;
}
```

### Event Catalog

```typescript
// Map updates
'map:bubble-added'        → { type: 'supply'|'demand', bubble: MapBubble }
'map:bubble-removed'      → { bubbleId: string }
'map:bubble-updated'      → { bubbleId: string, updates: Partial<MapBubble> }

// Agent activity (for notification bar)
'agent:scout-scanning'    → { userId: string, area: string }
'agent:scout-found'       → { userId: string, opportunityCount: number }
'agent:packager-drafting'  → { userId: string }
'agent:packager-ready'     → { userId: string, listingDraft: ListingDraft }
'agent:matchmaker-found'   → { matchId: string, buyerId: string, sellerId: string }

// Negotiation (for negotiation theater)
'negotiation:started'     → { negotiationId, buyerLocation, sellerLocation }
'negotiation:message'     → { negotiationId, from: 'buyer'|'seller', message, agentName, agentColor }
'negotiation:deal-reached' → { negotiationId, terms: DealTerms }
'negotiation:abandoned'   → { negotiationId, reason: string }

// Bookings
'booking:confirmed'       → { booking: Booking, celebrationLocation: { lat, lng } }
```

---

## 5. Database Entities

### UserEntity

```typescript
@Entity('users')
class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column() locationArea: string;
  @Column('decimal') lat: number;
  @Column('decimal') lng: number;
  @Column('simple-json') skills: string[];
  @Column({ default: 'exploring' }) status: string;
  @Column('simple-json', { nullable: true }) preferences: UserPreferences;
  @Column({ nullable: true }) previousRole: string;
  @CreateDateColumn() createdAt: Date;
  
  @OneToMany(() => Listing, listing => listing.user) listings: Listing[];
}
```

### ListingEntity

```typescript
@Entity('listings')
class Listing {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => User) user: User;
  @Column() userId: string;
  @Column() title: string;
  @Column('text') description: string;
  @Column('int') pricePence: number;
  @Column('int', { nullable: true }) minimumPricePence: number;
  @Column('int') capacity: number;
  @Column('int', { default: 0 }) booked: number;
  @Column() category: string;
  @Column('decimal') lat: number;
  @Column('decimal') lng: number;
  @Column('simple-json', { nullable: true }) tags: string[];
  @Column('simple-json', { nullable: true }) included: string[];
  @Column({ type: 'timestamp', nullable: true }) timeSlot: Date;
  @Column({ default: 'active' }) status: string;
  @CreateDateColumn() createdAt: Date;
}
```

### NegotiationEntity

```typescript
@Entity('negotiations')
class Negotiation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() matchId: string;
  @Column('simple-json') transcript: NegotiationMessage[];
  @Column('int', { nullable: true }) finalPricePence: number;
  @Column('int', { nullable: true }) quantity: number;
  @Column({ default: 'in_progress' }) outcome: string; // in_progress | deal | abandoned
  @Column({ default: false }) buyerApproved: boolean;
  @Column({ default: false }) sellerApproved: boolean;
  @CreateDateColumn() createdAt: Date;
}
```

---

## 6. Demo Seed Data

The seed script populates London with realistic data across zones 1-3:

### Supply (Pre-seeded Listings)

| Title | Area | Category | Price | Capacity |
|---|---|---|---|---|
| South Indian Cooking Experience | Shoreditch, E2 | food | £30 | 4 |
| Beginner Guitar in Camden | Camden, NW1 | music | £25/hr | 2 |
| Bike Repair Clinic | Hackney, E8 | repair | £15 | 6 |
| Conversational Japanese | Angel, N1 | language | £20/hr | 3 |
| Photography Walk: Street Art | Brick Lane, E1 | creative | £18 | 8 |
| Intro to Python Coding | Shoreditch, EC2 | tech | £35 | 4 |
| Sourdough Baking Masterclass | Brixton, SW9 | food | £28 | 5 |
| Yoga in the Park | Victoria Park, E9 | wellness | £12 | 12 |
| CV & Interview Coaching | Farringdon, EC1 | career | £40/hr | 1 |
| Dog Walking & Basic Training | Hampstead, NW3 | pets | £15/walk | 4 |

### Demand (Pre-seeded Signals)

| Query | Area | Budget Max | Radius |
|---|---|---|---|
| "unique food experience for date night" | Shoreditch | £40 | 1km |
| "someone to fix my bike wheel" | Hackney | £20 | 2km |
| "learn to cook something new" | Bethnal Green | £35 | 1.5km |
| "guitar lessons for absolute beginner" | Kentish Town | £30/hr | 2km |
| "help with garden, willing to pay" | Dalston | £50 | 1km |
| "coding tutor for my teenager" | Islington | £40/hr | 3km |
| "furniture assembly help needed" | Peckham | £30 | 1.5km |
| "walking buddy or group activity" | Clapham | £15 | 2km |

### Demo Trigger

A special endpoint `POST /api/demo/trigger-match?listingId=X` forces the Matchmaker to find the best demand signal for a given listing and immediately start a negotiation. This is used during the live demo to ensure the flow works reliably.