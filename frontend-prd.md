# Borough — Frontend PRD (Next.js)

> **Framework:** Next.js 14 + TypeScript
> **UI Library:** nes-ui-react (pixel art / retro gaming aesthetic)
> **Map:** Mapbox GL JS
> **Styling:** Tailwind CSS + NES UI overrides
> **State:** Zustand
> **Real-time:** Socket.io client

---

## 1. Pixel Art UI Library — Recommendation

### Selected: `nes-ui-react`

**Why this library:**
- Most comprehensive retro component set: Buttons, Cards, Dialogs, Toasts, Speech Balloons, Avatars, Badges, Progress bars, Pixel Icons, Menus
- Speech Balloons are perfect for agent negotiation messages
- Toast system ideal for agent activity notifications
- NES color palette built-in — gives us a coherent retro aesthetic
- Can be used CSS-only alongside Tailwind for non-pixel elements (like the map)

**Preview:** https://kyr0.github.io/nes-ui-react/

**Install:**
```bash
npm install nes-ui-react
```

**Alternative considered:** `pixel-retroui` (simpler, Tailwind-native, but fewer components) — can be used as fallback if nes-ui-react has integration issues with Next.js App Router.

### Pixel Art Sprites

Agent characters will be 32x32 PNG sprites created using Pixilart.com with the NES color palette. For hackathon speed, we can also use CSS-based pixel art or simple emoji representations with pixel borders.

---

## 2. Page Structure

```
app/
├── page.tsx                    # Landing / onboarding splash
├── layout.tsx                  # Global layout: NES font import, WS provider
├── globals.css                 # Tailwind + NES UI CSS imports
│
├── map/
│   └── page.tsx                # Main map view (the primary screen)
│
├── dashboard/
│   └── page.tsx                # Council dashboard (Track 2 stretch goal)
│
├── components/
│   ├── map/
│   │   ├── BoroughMap.tsx              # Mapbox GL JS wrapper
│   │   ├── SupplyBubble.tsx            # Pixel-styled listing marker on map
│   │   ├── DemandPulse.tsx             # Pulsing demand ring marker
│   │   ├── ConnectionLine.tsx          # Animated dashed line between matched users
│   │   ├── NegotiationPin.tsx          # Special marker when negotiation is live
│   │   └── ActivityHeatmap.tsx         # Borough-level heat overlay (stretch)
│   │
│   ├── agents/
│   │   ├── AgentAvatar.tsx             # Pixel art character for each agent
│   │   ├── NegotiationTheater.tsx      # Bottom panel: agent vs agent conversation
│   │   ├── AgentMessage.tsx            # Single message with NES speech balloon
│   │   ├── AgentConversation.tsx       # Scrolling message list with auto-scroll
│   │   ├── DealConfirmation.tsx        # Approval dialog with pixel styling
│   │   └── AgentActivityBar.tsx        # Bottom notification bar showing agent work
│   │
│   ├── voice/
│   │   ├── VoiceCompanion.tsx          # ElevenLabs Conversational AI widget
│   │   └── VoiceButton.tsx             # Floating mic button with pixel styling
│   │
│   ├── listings/
│   │   ├── ListingCard.tsx             # NES-styled card for listing details
│   │   ├── ListingPopup.tsx            # Map popup when clicking a bubble
│   │   └── SkillTag.tsx                # Pixel badge component for skill tags
│   │
│   ├── onboarding/
│   │   ├── WelcomeScreen.tsx           # "Welcome to Borough" pixel splash
│   │   └── SkillDiscovery.tsx          # Text/voice skill input with NES styling
│   │
│   ├── dashboard/
│   │   ├── CouncilDashboard.tsx        # Track 2: borough-level analytics
│   │   ├── SkillsInventory.tsx         # Real-time skills chart
│   │   └── DemandGapChart.tsx          # Unmet demand visualization
│   │
│   └── shared/
│       ├── PixelCharacter.tsx          # Reusable agent sprite renderer
│       ├── GameNotification.tsx        # NES toast wrapper for agent events
│       ├── ConfettiEffect.tsx          # Pixel confetti on deal completion
│       ├── PixelLoader.tsx             # NES-style loading animation
│       └── RetroHeader.tsx             # Top bar with Borough branding
│
├── hooks/
│   ├── useWebSocket.ts                 # WS connection + event subscription
│   ├── useBlackboard.ts               # Subscribe to specific blackboard sections
│   ├── useNegotiation.ts              # Track active negotiation state
│   ├── useMapBubbles.ts               # Manage map marker CRUD from WS events
│   └── useAgentActivity.ts            # Track which agents are currently working
│
├── stores/
│   └── borough.store.ts               # Zustand: user, listings, negotiations, map state
│
└── lib/
    ├── mapbox.ts                       # Mapbox config, London center, styles
    ├── websocket.ts                    # Socket.io client factory
    ├── agents.ts                       # Agent definitions: names, colors, sprites
    └── constants.ts                    # London coordinates, categories, etc.
```

---

## 3. Agent Characters — Pixel Art Specs

Each agent has a distinct pixel character. They appear in notifications, the negotiation theater, and activity indicators.

| Agent | Character Concept | Primary Color (NES Palette) | Sprite Size | Appears In |
|---|---|---|---|---|
| **Scout** | Explorer with binoculars + adventurer hat | Teal `#1D9E75` | 32x32 | Activity bar when scanning |
| **Packager** | Artist with paintbrush + beret | Purple `#7F77DD` | 32x32 | Activity bar when drafting |
| **Matchmaker** | Cupid with arrow + heart above head | Coral `#D85A30` | 32x32 | Match notification toast |
| **Buyer Agent** | Merchant with coin bag | Blue `#378ADD` | 32x32 | Negotiation theater (left side) |
| **Seller Agent** | Craftsperson with hammer + tool belt | Amber `#EF9F27` | 32x32 | Negotiation theater (right side) |
| **Companion** | Friendly guide waving | Warm Yellow `#FAC775` | 32x32 | Voice interaction panel |

### Sprite Implementation

For hackathon speed, use one of these approaches (in priority order):

1. **Pre-made PNGs** — Create 6 sprites in Pixilart.com using NES palette, export as 32x32 PNGs, load as `<Image>` components
2. **CSS pixel art** — Use `box-shadow` technique to draw simple 8x8 or 16x16 characters inline
3. **Emoji fallback** — Use emoji with NES PixelBorder wrapper: 🔭 Scout, 🎨 Packager, 💘 Matchmaker, 💰 Buyer, 🔨 Seller, 👋 Companion

---

## 4. Key UI Screens

### 4.1 Welcome / Onboarding Screen

Full-screen pixel art splash. NES dialog box aesthetic.

```
╔══════════════════════════════════════════════╗
║                                              ║
║     ★  W E L C O M E   T O  ★              ║
║                                              ║
║     ██████╗  ██████╗ ██████╗                ║
║     ██╔══██╗██╔═══██╗██╔══██╗               ║
║     ██████╔╝██║   ██║██████╔╝               ║
║     ██╔══██╗██║   ██║██╔══██╗               ║
║     ██████╔╝╚██████╔╝██║  ██║               ║
║     ╚═════╝  ╚═════╝ ╚═╝  ╚═╝               ║
║                                              ║
║   London's post-work micro-economy           ║
║                                              ║
║   Your skills. Your neighbors. Your income.  ║
║                                              ║
║   [👋 Companion avatar waving animation]     ║
║                                              ║
║   ┌────────────────────────────────────┐     ║
║   │  🔊 Talk to Borough               │     ║
║   └────────────────────────────────────┘     ║
║                                              ║
║   ┌────────────────────────────────────┐     ║
║   │  ⌨️  Type instead                  │     ║
║   └────────────────────────────────────┘     ║
║                                              ║
║   ┌────────────────────────────────────┐     ║
║   │  🗺️  Explore the map               │     ║
║   └────────────────────────────────────┘     ║
║                                              ║
╚══════════════════════════════════════════════╝
```

### 4.2 Main Map View

The primary screen. Map fills the viewport with pixel UI overlays.

```
┌──────────────────────────────────────────────────────┐
│  ★ BOROUGH    📍 Shoreditch, E2        [🔊] [⚙️]    │  ← Retro header bar
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │                                               │   │
│  │              L O N D O N   M A P              │   │
│  │                                               │   │
│  │    🟠 Cooking class (£30)                     │   │  ← Supply bubbles
│  │              🔴 "needs bike repair"            │   │  ← Demand pulse
│  │    🟣 Guitar lesson (£25)                     │   │
│  │                    🟢 Coding tutor (£35)      │   │
│  │         🔴 "looking for food experience"       │   │
│  │                                               │   │
│  │    🟠 Sourdough class (£28)                   │   │
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │  ← Agent activity bar
│  │ 🔭 Scout found 3 opportunities nearby          │   │    (NES toast style)
│  │ 🎨 Packager is drafting your listing...        │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  [What can you do?]  [Explore]  [My listings]  [🔊]  │  ← Bottom nav (pixel buttons)
└──────────────────────────────────────────────────────┘
```

### 4.3 Listing Popup (on bubble click)

NES-styled card that appears when clicking a supply bubble on the map:

```
╔══════════════════════════════════════╗
║  South Indian Cooking Experience     ║
║  ─────────────────────────────────   ║
║  🧑‍🍳 Hosted by Maria                ║
║  📍 Shoreditch, E2 (400m away)       ║
║  💰 £30 per person                   ║
║  👥 3/4 spots left                   ║
║  📅 Saturday 2pm · 2 hours           ║
║                                      ║
║  Learn to make crispy dosa, aromatic ║
║  sambar, and fresh coconut chutney   ║
║  from scratch.                       ║
║                                      ║
║  🏷️ cooking · south_indian · hands-on║
║                                      ║
║  ┌──────────┐  ┌──────────────────┐  ║
║  │  Close   │  │ 💘 I'm interested│  ║
║  └──────────┘  └──────────────────┘  ║
╚══════════════════════════════════════╝
```

### 4.4 Negotiation Theater

Slides up from bottom when a negotiation starts. Map visible but dimmed above.

```
┌──────────────────────────────────────────────────────┐
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │         M A P  (dimmed 60% opacity)           │   │
│  │                                               │   │
│  │        you ◉ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ◉ them        │   │  ← Pulsing connection line
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
├──⚔️ NEGOTIATION IN PROGRESS ─────────────────────────┤
│                                                       │
│  [Buyer Agent 💰]                                     │  ← 32x32 pixel sprite
│  ╭─────────────────────────────────────────╮          │
│  │ "My person loved the listing. They're   │          │  ← NES speech balloon (blue)
│  │  interested but budget is £25."         │          │
│  ╰─────────────────────────────────────────╯          │
│                                                       │
│                         [Seller Agent 🔨]             │
│          ╭─────────────────────────────────────────╮  │
│          │ "£28 is already fair — ingredients      │  │  ← NES speech balloon (amber)
│          │  alone cost £8 per person."             │  │
│          ╰─────────────────────────────────────────╯  │
│                                                       │
│  [Buyer Agent 💰]                                     │
│  ╭─────────────────────────────────────────╮          │
│  │ "What about £25 each for 2 spots?"      │          │  ← Typewriter animation
│  ╰─────────────────────────────────────────╯          │
│                                                       │
│  ┌──────────────┐              ┌──────────────────┐  │
│  │  🗣️ Jump in  │              │ 🤖 Let them talk │  │  ← Pixel buttons
│  └──────────────┘              └──────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Animations:**
- Messages appear with typewriter effect (char by char, 30ms per char)
- Agent sprite does a small bounce animation when their message appears
- Connection line on map pulses faster as negotiation progresses
- When deal reached: line turns solid green, both sprites jump

### 4.5 Deal Celebration

Full-screen NES dialog with pixel confetti:

```
╔══════════════════════════════════════════════╗
║                                              ║
║       ★ ★ ★  DEAL CONFIRMED!  ★ ★ ★        ║
║                                              ║
║  ┌────────────────────────────────────────┐  ║
║  │                                        │  ║
║  │  South Indian Cooking Experience       │  ║
║  │  📍 Shoreditch · 📅 Saturday 2pm      │  ║
║  │  👥 2 guests × £26 = £52              │  ║
║  │                                        │  ║
║  │  [Buyer sprite] 🤝 [Seller sprite]    │  ║
║  │                                        │  ║
║  └────────────────────────────────────────┘  ║
║                                              ║
║  + 200 XP                     LEVEL UP! ★    ║
║  ████████████████░░░░  Level 2               ║
║                                              ║
║  ┌──────────────┐  ┌──────────────────────┐  ║
║  │ 🗺️ View Map  │  │ 📤 Share             │  ║
║  └──────────────┘  └──────────────────────┘  ║
║                                              ║
╚══════════════════════════════════════════════╝
```

**Confetti:** Canvas-based pixel confetti (small colored squares falling) triggered on deal confirmation. Use a lightweight confetti library or custom canvas animation with pixel-sized particles.

### 4.6 Council Dashboard (Track 2 — Stretch Goal)

A separate view showing aggregated Borough data for a London council. Uses NES aesthetic for charts (pixel-styled bar charts using recharts or custom canvas).

```
┌──────────────────────────────────────────────────────┐
│  ★ BOROUGH COUNCIL DASHBOARD    📍 Hackney           │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ACTIVE MICRO-ENTREPRENEURS          THIS WEEK        │
│  ████████████████████  47            ↑ +12            │
│                                                       │
│  TOP SKILLS IN HACKNEY               DEMAND GAPS      │
│  🍳 Cooking ......... 14            🌿 Gardening (23) │
│  💻 Tech tutoring ... 8             🪑 Assembly (18)  │
│  🎨 Creative ....... 6             🗣️ Languages (15)  │
│  🔧 Repair ......... 5             📸 Photo (9)       │
│                                                       │
│  MICRO-ECONOMY HEALTH SCORE                           │
│  ★★★★★★★★☆☆  8.2 / 10                               │
│                                                       │
│  TRANSACTIONS THIS WEEK: 34  |  VALUE: £2,847         │
│  AVG RATING: ★★★★☆ 4.3     |  REPEAT: 62%           │
│                                                       │
│  [Export Report]  [Compare Boroughs]  [← Back to Map] │
└──────────────────────────────────────────────────────┘
```

---

## 5. Mapbox Configuration

```typescript
// lib/mapbox.ts

export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  style: 'mapbox://styles/mapbox/dark-v11', // Dark base for colorful bubbles
  center: [-0.1276, 51.5074] as [number, number], // London center
  zoom: 12,
  minZoom: 10,
  maxZoom: 17,
  maxBounds: [
    [-0.5103, 51.2868], // SW corner (Greater London)
    [0.3340, 51.6919]   // NE corner
  ] as [[number, number], [number, number]]
};

// Marker color mapping by category
export const CATEGORY_COLORS: Record<string, string> = {
  food: '#EF9F27',      // Amber
  music: '#7F77DD',      // Purple
  tech: '#1D9E75',       // Teal
  creative: '#D85A30',   // Coral
  repair: '#378ADD',     // Blue
  language: '#D4537E',   // Pink
  wellness: '#97C459',   // Green
  career: '#888780',     // Gray
  pets: '#5DCAA5',       // Light teal
  default: '#888780'     // Gray fallback
};

// Supply bubble style
export const SUPPLY_BUBBLE_PAINT = {
  'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 15, 14],
  'circle-color': ['match', ['get', 'category'],
    ...Object.entries(CATEGORY_COLORS).flat(),
  ],
  'circle-opacity': 0.85,
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
};

// Demand pulse style (animated via JS)
export const DEMAND_PULSE_PAINT = {
  'circle-radius': 20,
  'circle-color': 'transparent',
  'circle-stroke-width': 2,
  'circle-stroke-color': '#E24B4A',
  'circle-stroke-opacity': 0.6,
};
```

---

## 6. State Management (Zustand)

```typescript
// stores/borough.store.ts

interface BoroughState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  
  // Map
  supplyBubbles: MapBubble[];
  demandPulses: MapBubble[];
  addBubble: (bubble: MapBubble) => void;
  removeBubble: (id: string) => void;
  
  // Agents
  agentActivity: AgentActivity[];
  addAgentActivity: (activity: AgentActivity) => void;
  clearAgentActivity: () => void;
  
  // Negotiations
  activeNegotiation: NegotiationState | null;
  negotiationMessages: NegotiationMessage[];
  setActiveNegotiation: (neg: NegotiationState) => void;
  addNegotiationMessage: (msg: NegotiationMessage) => void;
  clearNegotiation: () => void;
  
  // Gamification
  xp: number;
  level: number;
  addXP: (amount: number) => void;
  
  // UI
  isNegotiationTheaterOpen: boolean;
  setNegotiationTheaterOpen: (open: boolean) => void;
  selectedBubble: MapBubble | null;
  setSelectedBubble: (bubble: MapBubble | null) => void;
}
```

---

## 7. WebSocket Integration

```typescript
// hooks/useWebSocket.ts

export function useWebSocket() {
  const store = useBoroughStore();
  
  useEffect(() => {
    const socket = io(WS_URL, { path: '/ws' });
    
    // Map updates
    socket.on('map:bubble-added', (data) => store.addBubble(data.bubble));
    socket.on('map:bubble-removed', (data) => store.removeBubble(data.bubbleId));
    
    // Agent activity
    socket.on('agent:scout-scanning', (data) => {
      store.addAgentActivity({ agent: 'scout', action: 'scanning', area: data.area });
    });
    socket.on('agent:scout-found', (data) => {
      store.addAgentActivity({ agent: 'scout', action: 'found', count: data.opportunityCount });
    });
    socket.on('agent:packager-drafting', () => {
      store.addAgentActivity({ agent: 'packager', action: 'drafting' });
    });
    
    // Negotiations
    socket.on('negotiation:started', (data) => {
      store.setActiveNegotiation(data);
      store.setNegotiationTheaterOpen(true);
    });
    socket.on('negotiation:message', (data) => {
      store.addNegotiationMessage(data);
    });
    socket.on('negotiation:deal-reached', (data) => {
      store.addXP(200);
      // Trigger confetti + deal dialog
    });
    
    // Bookings
    socket.on('booking:confirmed', (data) => {
      // Trigger celebration animation at booking location on map
    });
    
    return () => socket.disconnect();
  }, []);
}
```

---

## 8. Build Priority

### Hour 1-2: Foundation
- [ ] Next.js project scaffold with nes-ui-react installed
- [ ] Mapbox GL JS integrated with London defaults
- [ ] WebSocket hook connected to backend
- [ ] Zustand store with core state

### Hour 2-4: Core Map
- [ ] Supply bubbles rendering from seeded data
- [ ] Bubble click → ListingPopup
- [ ] Agent activity bar at bottom (NES toasts)
- [ ] Voice button (ElevenLabs widget integration)

### Hour 4-5: Negotiation Theater
- [ ] NegotiationTheater component with slide-up animation
- [ ] AgentMessage with speech balloons and typewriter effect
- [ ] Agent pixel avatars (PNGs or emoji fallback)
- [ ] Connection line animation on map
- [ ] Deal confirmation dialog

### Hour 5-6: Polish
- [ ] Demand pulse animations
- [ ] Confetti effect on deal
- [ ] XP/level display
- [ ] Welcome screen
- [ ] Demo flow end-to-end testing

### Stretch: Council Dashboard
- [ ] CouncilDashboard page
- [ ] Skills inventory chart
- [ ] Demand gap visualization