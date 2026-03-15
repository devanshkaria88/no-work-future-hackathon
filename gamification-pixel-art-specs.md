# Borough — Gamification & Pixel Art Design Specs

> **UI Framework:** nes-ui-react
> **Aesthetic:** NES / retro gaming with modern map overlay
> **Purpose:** Make agent interactions visible, delightful, and memorable for demo

---

## 1. Design Philosophy

Borough combines two visual languages:

1. **The Map Layer** — Modern, clean, dark Mapbox with colorful data visualization. This is the "real world" layer.
2. **The Agent Layer** — Pixel art NES aesthetic for all AI agent interactions. This is the "game world" layer that sits on top of the map.

The contrast is intentional: the real map of London grounding the experience in reality, with playful pixel characters making the AI agents feel like helpful companions rather than cold automation. This duality reinforces the hackathon's thesis — AI and humans coexisting in a new kind of economy.

---

## 2. Agent Character Designs

### 2.1 Character Sheet

Each agent has a 32x32 pixel sprite. Create in Pixilart.com using the NES color palette (https://pixilart.com/palettes/nes-palette-56539).

#### Scout — "The Explorer"
- **Appearance:** Small character wearing an explorer hat, holding binoculars
- **Primary colors:** Teal body (#1D9E75), brown hat (#8B6914)
- **Idle animation:** Looking left and right through binoculars (2 frame loop)
- **Active animation:** Walking in place, binoculars up (4 frame loop)
- **Sound effect concept:** Retro "discovery" chime when opportunity found

#### Packager — "The Artist"  
- **Appearance:** Character wearing a beret, holding a paintbrush and palette
- **Primary colors:** Purple body (#7F77DD), pink beret (#D4537E)
- **Idle animation:** Dipping brush in palette (2 frame loop)
- **Active animation:** Painting motion, sparkles appearing (4 frame loop)
- **Sound effect concept:** Pencil scratch sound when drafting

#### Matchmaker — "The Cupid"
- **Appearance:** Small winged character with a bow, heart floating above head
- **Primary colors:** Coral body (#D85A30), red wings (#E24B4A), pink heart (#D4537E)
- **Idle animation:** Heart bouncing above head (2 frame loop)
- **Active animation:** Drawing bow, arrow flies (4 frame sequence, not loop)
- **Sound effect concept:** Sparkle/match sound when connection found

#### Buyer's Negotiator — "The Merchant"
- **Appearance:** Character carrying a coin bag, wearing a blue cap
- **Primary colors:** Blue outfit (#378ADD), gold coin bag (#EF9F27)
- **Idle animation:** Tossing a coin up and catching it (4 frame loop)
- **Active animation:** Talking gesture — hand up, mouth moving (2 frame loop)
- **Sound effect concept:** Coin clink

#### Seller's Negotiator — "The Craftsperson"
- **Appearance:** Character with a tool belt and small hammer, wearing an orange bandana
- **Primary colors:** Amber outfit (#EF9F27), brown tool belt (#8B6914)
- **Idle animation:** Polishing a small item (2 frame loop)
- **Active animation:** Talking gesture — hands on hips, confident nod (2 frame loop)
- **Sound effect concept:** Light hammer tap

#### Companion — "The Guide"
- **Appearance:** Friendly character waving, wearing headphones (voice reference)
- **Primary colors:** Warm yellow (#FAC775), white headphones
- **Idle animation:** Gentle wave (2 frame loop)
- **Active animation:** Listening pose — head tilted, hand to ear (2 frame loop)
- **Sound effect concept:** Warm notification chime

### 2.2 Fallback Implementation (No Time for Sprites)

If there's no time to create proper pixel sprites, use this CSS + emoji approach:

```tsx
// components/shared/PixelCharacter.tsx
const AGENT_EMOJIS = {
  scout: '🔭',
  packager: '🎨',
  matchmaker: '💘',
  buyerNegotiator: '💰',
  sellerNegotiator: '🔨',
  companion: '👋',
};

const AGENT_COLORS = {
  scout: '#1D9E75',
  packager: '#7F77DD',
  matchmaker: '#D85A30',
  buyerNegotiator: '#378ADD',
  sellerNegotiator: '#EF9F27',
  companion: '#FAC775',
};

// Wrap emoji in a PixelBorder from nes-ui-react
<PixelBorder color={AGENT_COLORS[agent]}>
  <span style={{ fontSize: '24px' }}>{AGENT_EMOJIS[agent]}</span>
</PixelBorder>
```

---

## 3. Gamification System

### 3.1 XP and Levels

| Level | XP Required | Title | Visual Reward |
|---|---|---|---|
| 1 | 0 | Newcomer | Basic map marker |
| 2 | 200 | Neighbor | Colored marker + name label |
| 3 | 500 | Local Hero | Animated marker + badge |
| 4 | 1000 | Borough Builder | Crown on marker + leaderboard |
| 5 | 2000 | Community Pillar | Golden marker + special effects |

### 3.2 XP Awards

| Action | XP | Notification Text |
|---|---|---|
| Complete profile | +50 | "★ +50 XP — Welcome to Borough!" |
| Scout finds opportunity | +25 | "★ +25 XP — Opportunity discovered!" |
| Publish first listing | +100 | "★ +100 XP — You're on the map!" |
| Get first match | +75 | "★ +75 XP — Someone found you!" |
| Complete a negotiation | +100 | "★ +100 XP — Deal in progress!" |
| First booking confirmed | +200 | "★★ +200 XP — LEVEL UP! Your first deal!" |
| Earn first £50 | +150 | "★ +150 XP — Micro-entrepreneur!" |
| Get a 5-star review | +150 | "★ +150 XP — Brilliant service!" |
| Help 5 neighbors | +300 | "★★ +300 XP — Neighborhood Hero badge unlocked!" |
| Help 10 neighbors | +500 | "★★★ +500 XP — Borough Builder!" |

### 3.3 XP Bar UI

Use nes-ui-react Progress component:

```tsx
<div className="xp-bar">
  <Badge text={`Level ${level}`} bgColor={levelColor} />
  <Progress value={xpProgress} max={xpToNextLevel} />
  <Text size="small">{currentXP} / {xpToNextLevel} XP</Text>
</div>
```

---

## 4. Notification System

All agent activity displays as NES-style toasts in the bottom bar. Each notification features the agent's pixel avatar, their color, and a short message.

### Notification Types

```tsx
// Agent starts working
{ agent: 'scout', type: 'working', text: 'Scanning Shoreditch for opportunities...' }
{ agent: 'packager', type: 'working', text: 'Crafting your listing...' }
{ agent: 'matchmaker', type: 'working', text: 'Looking for matches...' }

// Agent completed work
{ agent: 'scout', type: 'success', text: 'Found 3 opportunities nearby!' }
{ agent: 'packager', type: 'success', text: 'Your listing is ready for review!' }
{ agent: 'matchmaker', type: 'success', text: 'Match found! Someone 800m away!' }

// Negotiation events
{ agent: 'buyerNegotiator', type: 'negotiation', text: 'Opening negotiation...' }
{ agent: 'sellerNegotiator', type: 'negotiation', text: 'Responding to offer...' }

// Deal events
{ agent: 'matchmaker', type: 'celebration', text: '★ DEAL CONFIRMED! +200 XP' }

// XP events  
{ agent: null, type: 'xp', text: '★ +100 XP — First listing published!' }
{ agent: null, type: 'levelup', text: '★★ LEVEL UP! You are now a Local Hero!' }
```

### Toast Behavior

- Toasts appear at the bottom of the screen, above the nav bar
- Maximum 2 visible at once (older ones fade out)
- Working notifications persist until the agent finishes
- Success/celebration notifications auto-dismiss after 4 seconds
- Level up notification stays for 6 seconds with a special animation

---

## 5. Map Gamification Elements

### 5.1 Supply Bubbles (Listings)

Markers on the map for active listings. Style varies by level:

| Level | Marker Style |
|---|---|
| Level 1 | Simple colored circle (category color) |
| Level 2 | Circle with white border + tiny name label |
| Level 3 | Animated pulse circle + category icon |
| Level 4 | Golden border + category icon + rating stars |
| Level 5 | Golden animated marker + sparkle effect |

### 5.2 Demand Pulses

Demand signals show as expanding/fading rings on the map:

- Ring color: Red (#E24B4A)
- Animation: Expand from 10px to 40px radius over 2 seconds, opacity fades from 0.8 to 0
- Loop: Continuous until demand is fulfilled
- On hover: Shows demand query text in a pixel tooltip

### 5.3 Connection Lines (Active Matches)

When a match is found, an animated dashed line connects buyer and seller on the map:

- Line style: Dashed, animated (CSS `stroke-dashoffset` animation)
- Color: White during negotiation, green when deal reached
- Animation speed: Increases as negotiation progresses (faster pulses = more intense)
- On deal: Line turns solid green, small explosion particles at both endpoints

### 5.4 Deal Celebration on Map

When a booking is confirmed:

1. Connection line turns solid gold
2. Both endpoints burst with pixel confetti (small colored squares)
3. A small NES "DEAL!" badge appears at the midpoint for 3 seconds
4. The supply bubble updates (spots remaining decreases)
5. The demand pulse disappears (fulfilled)

---

## 6. Negotiation Theater — Detailed Design

### Layout

The negotiation theater is the visual centerpiece of the demo. It's a bottom panel that slides up and shows two agents arguing in real-time using NES speech balloons.

### Message Rendering

```tsx
// components/agents/AgentMessage.tsx

interface AgentMessageProps {
  agent: 'buyer' | 'seller';
  message: string;
  agentName: string;
  agentColor: string;
  animate?: boolean; // typewriter effect
}

// Buyer messages: left-aligned with blue speech balloon
// Seller messages: right-aligned with amber speech balloon
// Each message has:
//   1. Agent pixel avatar (32x32)
//   2. Agent name label (NES Badge)
//   3. NES Balloon component containing the message text
//   4. Typewriter animation if animate=true
```

### Typewriter Effect

Messages stream character-by-character to simulate real-time conversation:

```tsx
// 30ms per character for readable typing speed
// Punctuation: 100ms pause after periods and commas
// The scroll container auto-scrolls to keep the latest message visible
// While typing is in progress, a small pixel cursor blinks at the end
```

### Negotiation Theater States

| State | Visual |
|---|---|
| **Waiting** | "Connecting agents..." with loading animation |
| **Active** | Messages streaming, agents bouncing when they speak |
| **Deal reached** | Both agents do a jump animation, green checkmarks appear |
| **Abandoned** | Agents do a shrug animation, "No deal this time" message |
| **Pending approval** | "Waiting for your approval..." with two buttons |

---

## 7. Sound Design (Optional Stretch)

If time permits, retro 8-bit sound effects enhance the game feel:

| Event | Sound | Duration |
|---|---|---|
| App loaded | Retro power-on chime | 1s |
| Agent starts working | Soft blip | 0.3s |
| Opportunity found | Discovery fanfare | 0.8s |
| Match found | Sparkle/magic | 0.5s |
| Negotiation message | Typewriter click per char | ongoing |
| Deal reached | Victory fanfare (short) | 1.5s |
| Level up | 8-bit level up jingle | 2s |
| XP gained | Coin collect sound | 0.3s |

Use the Web Audio API with pre-generated 8-bit sound files (or generate via jsfxr.io). Sounds should be off by default with a mute/unmute toggle.

---

## 8. Implementation Priority

### Must Have for Demo
- [ ] Agent pixel avatars (emoji fallback is fine)
- [ ] NES speech balloons in negotiation theater
- [ ] Typewriter message animation
- [ ] Agent activity toasts in bottom bar
- [ ] Deal celebration dialog (NES styled)
- [ ] Map supply bubbles with category colors

### Nice to Have
- [ ] Proper 32x32 pixel sprites
- [ ] XP bar and level display
- [ ] Confetti animation on deal
- [ ] Demand pulse animation on map
- [ ] Connection line animation

### Stretch Goals
- [ ] Sprite idle/active animations
- [ ] Sound effects
- [ ] Level-up celebration sequence
- [ ] Borough leaderboard
- [ ] Achievement badges
