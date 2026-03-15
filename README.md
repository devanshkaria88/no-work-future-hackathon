# Borough

> **London's post-work micro-economy — AI agents broker skills between neighbors**

[![Define The Future of (No) Work](https://img.shields.io/badge/Hackathon-Define%20The%20Future%20of%20%28No%29%20Work-2026-blue)](/)
[![Track 1: Human Flourishing](https://img.shields.io/badge/Track-Human%20Flourishing-green)](/)
[![Track 2: Public Systems](https://img.shields.io/badge/Track-Public%20Systems-orange)](/)

---

## The Problem

Work is disappearing. AI is automating service jobs across London — the city most dependent on them. When work vanishes, people lose three things simultaneously:

| Lost | Impact |
|------|--------|
| **Income** | No salary, no gig fallback (gigs are being automated too) |
| **Purpose** | No projects, no deadlines, no reason to get up |
| **Community** | No colleagues, no watercooler, no social fabric |

The gig economy was the bridge between traditional employment and full automation. But that bridge is collapsing. Uber, Deliveroo, and TaskRabbit are deploying AI agents. **What economic model exists when both traditional jobs AND gig platforms are automated?**

---

## The Solution: Borough

Borough is a real-time, map-based platform where **AI agents** help unemployed and underemployed Londoners discover, package, price, and trade skills and micro-services with their neighbors. It turns free time into a thriving local economy.

> In a post-work London, the most valuable economic unit isn't a job — it's a skill shared between neighbors. AI agents don't replace this human exchange — they make it frictionless.

---

## User Flow

### End-to-End Journey: From Screen Time to Real-World Action

```mermaid
flowchart TB
    subgraph Entry["📱 Entry Point"]
        A[User doomscrolling]
        B[Opens Borough]
    end

    subgraph Onboarding["🎙️ Voice Onboarding"]
        C[Talk to Companion Agent]
        D["Share: skills, location, situation"]
        E[Skill discovery conversation]
    end

    subgraph AgentWork["🤖 Agents Work Behind the Scenes"]
        F[Scout scans local demand]
        G[Packager drafts listing]
        H[Listing appears on map]
    end

    subgraph Discovery["🗺️ Map Discovery"]
        I[Explore London map]
        J[Supply bubbles = skills offered]
        K[Demand pulses = things needed]
    end

    subgraph Match["💘 Match & Negotiate"]
        L[Matchmaker finds fit]
        M[Buyer & Seller agents negotiate]
        N[Deal reached — both approve]
    end

    subgraph Outcome["✨ Real-World Outcome"]
        O[Booking confirmed]
        P[Physical meetup scheduled]
        Q[Income + purpose + community]
    end

    A --> B --> C --> D --> E
    E --> F --> G --> H
    H --> I
    I --> J
    I --> K
    J --> L
    K --> L
    L --> M --> N --> O --> P --> Q
```

### Detailed User Flow Diagram

```mermaid
flowchart LR
    subgraph Phase1["Phase 1: Onboarding"]
        direction TB
        U1[User: "I lost my job. I can cook South Indian food."]
        C1[Companion: empathetic + skill discovery]
        U2[User shares location, skills, preferences]
        B1[(Blackboard: user profile)]
    end

    subgraph Phase2["Phase 2: Opportunity → Listing"]
        direction TB
        S1[Scout: scans demand, finds gaps]
        O1[Opportunity: "High demand, low competition"]
        P1[Packager: drafts listing copy + price]
        L1[Listing goes live on map]
    end

    subgraph Phase3["Phase 3: Match"]
        direction TB
        M1[Matchmaker: semantic match]
        D1[Demand: "unique food experience"]
        L2[Supply: cooking class]
        N1[Match: 0.92 confidence]
    end

    subgraph Phase4["Phase 4: Negotiation Theater"]
        direction TB
        NB[Buyer Agent: "Budget is £25"]
        NS[Seller Agent: "£28 is fair"]
        NB2[Buyer: "£26 each for 2?"]
        NS2[Seller: "Deal at £26"]
    end

    subgraph Phase5["Phase 5: Deal"]
        direction TB
        A1[Both humans approve]
        B2[Booking confirmed]
        X1[+200 XP, celebration]
    end

    Phase1 --> Phase2 --> Phase3 --> Phase4 --> Phase5
```

---

## System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph UserLayer["User Layer"]
        WEB[Web App — Next.js]
        VOICE[Voice Interface — ElevenLabs]
    end

    subgraph MapLayer["Map & Visualization"]
        MAP[Interactive London Map — Mapbox]
        BUBBLES[Supply Bubbles]
        DEMAND[Demand Pulses]
        NEGVIEW[Negotiation Theater]
    end

    subgraph Orchestrator["Agent Orchestrator"]
        ORCH[Blackboard Controller]
        BB[(Shared Blackboard State)]
    end

    subgraph Agents["Agent Council"]
        SCOUT[🔭 Scout]
        PACKAGER[🎨 Packager]
        MATCHMAKER[💘 Matchmaker]
        BUYER[💰 Buyer Agent]
        SELLER[🔨 Seller Agent]
        COMPANION[👋 Companion]
    end

    subgraph Data["Data Layer"]
        DB[(PostgreSQL)]
        EVENTS[London APIs]
        GEO[Geolocation]
    end

    WEB --> MAP
    VOICE --> COMPANION
    MAP --> BUBBLES
    MAP --> DEMAND
    MAP --> NEGVIEW

    ORCH --> BB
    SCOUT --> BB
    PACKAGER --> BB
    MATCHMAKER --> BB
    BUYER --> BB
    SELLER --> BB
    COMPANION --> BB

    BB --> MAP
    BB --> DB
    SCOUT --> EVENTS
    SCOUT --> GEO
```

### Blackboard Architecture

All agents communicate through a shared blackboard. No agent talks directly to another — they read and write state, and the orchestrator triggers the right agent at the right time.

```mermaid
graph LR
    subgraph Blackboard["Blackboard (Shared State)"]
        UP[User Profiles]
        OPP[Opportunities]
        LIST[Active Listings]
        DEM[Demand Signals]
        MAT[Matches]
        NEG[Negotiations]
        TRANS[Transactions]
    end

    subgraph KnowledgeSources["Knowledge Sources (Agents)"]
        SA[Scout]
        PA[Packager]
        MA[Matchmaker]
        NA[Negotiators]
        CA[Companion]
    end

    subgraph Control["Control"]
        CTRL[Orchestrator]
    end

    SA -->|writes| OPP
    PA -->|writes| LIST
    MA -->|writes| MAT
    NA -->|writes| NEG
    NA -->|writes| TRANS
    CA -->|reads/writes| UP

    CTRL -->|monitors & triggers| Blackboard
```

### Agent Communication Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant C as Companion
    participant B as Blackboard
    participant S as Scout
    participant P as Packager
    participant M as Matchmaker
    participant NB as Buyer Agent
    participant NS as Seller Agent

    U->>C: "I can cook South Indian. I'm in Shoreditch."
    C->>B: WRITE: user_profile

    S->>B: READ: user_profile
    S->>B: WRITE: opportunity

    P->>B: READ: user_profile + opportunity
    P->>B: WRITE: draft_listing

    C->>U: "I've drafted a listing. £28 per person?"
    U->>C: "Yes"
    C->>B: WRITE: listing_live

    M->>B: READ: listings + demand
    M->>B: WRITE: match

    Note over NB,NS: Negotiation Theater (visible on map)
    NB->>NS: "Budget is £25. Any flexibility?"
    NS->>NB: "£28 is fair — ingredients cost £8/person"
    NB->>NS: "£26 each for 2 spots?"
    NS->>NB: "Deal at £26"

    NB->>B: WRITE: deal_proposed
    NS->>B: WRITE: deal_accepted
    B->>U: Notification: "Booking confirmed!"
```

### Negotiation State Machine

```mermaid
stateDiagram-v2
    [*] --> MatchFound: Matchmaker writes match

    MatchFound --> AgentsLoaded: Controller spawns negotiators

    AgentsLoaded --> Opening: Buyer agent sends opening

    Opening --> CounterOffer: Seller responds

    CounterOffer --> Creative: Creative terms proposed

    Creative --> Convergence: Acceptable terms found

    Convergence --> PendingApproval: Deal sent to both humans

    PendingApproval --> Confirmed: Both approve
    PendingApproval --> Rejected: Either rejects

    Rejected --> CounterOffer: Restart with new constraints
    Rejected --> Abandoned: Max retries exceeded

    Confirmed --> Booked: Transaction recorded
    Booked --> [*]
    Abandoned --> [*]
```

---

## The Agent Council

| Agent | Role | Personality | Output |
|-------|------|-------------|--------|
| **🔭 Scout** | Opportunity radar — scans local demand gaps | Curious, data-driven | Opportunities with demand scores |
| **🎨 Packager** | Service designer — turns skills into bookable listings | Creative, persuasive | Draft listings with copy & pricing |
| **💘 Matchmaker** | Connection broker — semantic supply/demand matching | Warm, perceptive | Matches with confidence scores |
| **💰 Buyer Agent** | Deal-maker for the buyer | Frugal, value-seeking | Negotiation messages |
| **🔨 Seller Agent** | Deal-maker for the seller | Confident, protective | Negotiation messages |
| **👋 Companion** | Primary user interface — voice & text | Empathetic, practical | Conversational guidance |

---

## Map UI Elements

```mermaid
graph TB
    subgraph MapLayer["Map Visual Layer"]
        SB[Supply Bubbles — skills being offered]
        DP[Demand Pulses — things people need]
        CL[Connection Lines — active matches]
        NT[Negotiation Theater — agent conversation]
    end

    subgraph BubbleProps["Bubble Properties"]
        COLOR[Color = Category]
        SIZE[Size = Demand level]
        PULSE[Pulse = New/active]
    end

    SB --> COLOR
    SB --> SIZE
    DP --> PULSE
    CL --> NT
```

---

## Track 2: Public Systems — Council Dashboard

Borough doubles as a **reimagined unemployment system**. London councils can deploy it to replace or augment Job Centre Plus.

```mermaid
graph TB
    subgraph Platform["Borough Platform"]
        MAP_APP[Consumer Map App]
        DATA[Anonymized Activity Data]
    end

    subgraph Council["Council Dashboard"]
        SKILLS[Real-time Skills Inventory]
        GAPS[Demand Gap Analysis]
        ECON[Micro-Economy Health Score]
        UNEMPLOY[Unemployment Activity]
    end

    subgraph Policy["Policy Outcomes"]
        TRAIN[Targeted Training]
        FUND[Micro-grant Allocation]
        PLAN[Urban Planning]
        WELFARE[Welfare-to-Work Alternative]
    end

    MAP_APP --> DATA
    DATA --> SKILLS
    DATA --> GAPS
    DATA --> ECON
    DATA --> UNEMPLOY
    SKILLS --> TRAIN
    GAPS --> FUND
    ECON --> PLAN
    UNEMPLOY --> WELFARE
```

| Current Job Centre | Borough |
|-------------------|---------|
| Manual job search | AI agents surface opportunities in real-time |
| Generic CV workshops | Personalized skill packaging from conversation |
| Weekly sign-in | Continuous engagement via voice companion |
| No local economic data | Live map of neighborhood supply/demand |
| Binary: employed/unemployed | Spectrum: micro-earning, skill-building, community |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, TypeScript, nes-ui-react (pixel art), Tailwind, Zustand |
| **Map** | Mapbox GL JS |
| **Backend** | NestJS, PostgreSQL, TypeORM |
| **AI Agents** | Claude API (Anthropic) |
| **Voice** | ElevenLabs Conversational AI |
| **Real-time** | Socket.io (WebSockets) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- [Mapbox](https://mapbox.com) account
- [Anthropic](https://anthropic.com) API key
- [ElevenLabs](https://elevenlabs.io) account (for voice companion)

### 1. Clone & Install

```bash
git clone <repo-url>
cd no-work-hackathon
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Environment Setup

**Backend** (`backend/.env`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/borough
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=...
ELEVENLABS_WEBHOOK_SECRET=...
FRONTEND_URL=http://localhost:3000
PORT=3001
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk....
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_...
```

### 3. Run Backend & Frontend

```bash
# Terminal 1 — Backend
cd backend && npm run start:dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Seed Demo Data

Once the backend is running, seed London with demo listings and demand signals:

```bash
curl -X POST http://localhost:3001/api/demo/seed
```

Or use the API from your app. Tables are auto-created via TypeORM `synchronize`.

### 5. Demo Flow

1. **Onboarding**: Talk to the Companion — "I lost my job. I can cook South Indian food. I'm in Shoreditch."
2. **Map**: Watch Scout and Packager work — listing appears as a supply bubble.
3. **Match**: Trigger a match (or wait for Matchmaker) — connection line appears.
4. **Negotiation**: Negotiation theater opens — watch Buyer and Seller agents negotiate.
5. **Deal**: Both approve → booking confirmed, confetti, +200 XP.

---

## Project Structure

```
no-work-hackathon/
├── frontend/                 # Next.js 14 + Mapbox + nes-ui-react
│   ├── app/
│   │   ├── page.tsx          # Landing / onboarding
│   │   ├── map/page.tsx      # Main map view
│   │   └── dashboard/       # Council dashboard (Track 2)
│   ├── components/
│   │   ├── map/              # BoroughMap, SupplyBubble, DemandPulse, etc.
│   │   ├── agents/           # NegotiationTheater, AgentAvatar, etc.
│   │   ├── voice/            # VoiceCompanion, VoiceButton
│   │   └── listings/         # ListingCard, ListingPopup
│   └── stores/               # Zustand (borough.store)
│
├── backend/                  # NestJS + PostgreSQL
│   ├── src/
│   │   ├── agents/           # Scout, Packager, Matchmaker, Negotiator
│   │   ├── blackboard/       # BlackboardService, BlackboardGateway
│   │   ├── listings/         # CRUD
│   │   ├── users/            # Profiles, skills
│   │   ├── matches/          # Match + negotiation management
│   │   ├── map/              # Map data endpoints
│   │   └── voice/            # ElevenLabs webhook handlers
│   └── ...
│
├── borough-prd.md            # Full product requirements
├── frontend-prd.md           # Frontend specs
├── backend-prd.md            # Backend specs
└── agent-system-prompts.md   # Agent prompts
```

---

## License

MIT

---

*Built for Define The Future of (No) Work Hackathon — March 2026*
