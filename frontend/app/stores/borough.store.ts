import { create } from 'zustand';
import type { UserProfile, MapBubble, AgentActivity, NegotiationMessage, NegotiationState, DealTerms } from '../lib/types';

interface BoroughState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;

  supplyBubbles: MapBubble[];
  demandPulses: MapBubble[];
  addBubble: (bubble: MapBubble) => void;
  removeBubble: (id: string) => void;
  setBubbles: (supply: MapBubble[], demand: MapBubble[]) => void;

  agentActivity: AgentActivity[];
  addAgentActivity: (activity: AgentActivity) => void;
  removeAgentActivity: (id: string) => void;

  activeNegotiation: NegotiationState | null;
  negotiationMessages: NegotiationMessage[];
  setActiveNegotiation: (neg: NegotiationState | null) => void;
  addNegotiationMessage: (msg: NegotiationMessage) => void;
  clearNegotiation: () => void;

  dealTerms: DealTerms | null;
  setDealTerms: (terms: DealTerms | null) => void;

  xp: number;
  level: number;
  addXP: (amount: number) => void;

  isNegotiationTheaterOpen: boolean;
  setNegotiationTheaterOpen: (open: boolean) => void;
  selectedBubble: MapBubble | null;
  setSelectedBubble: (bubble: MapBubble | null) => void;
  isDealDialogOpen: boolean;
  setDealDialogOpen: (open: boolean) => void;

  voiceStatus: 'idle' | 'connecting' | 'connected' | 'error';
  setVoiceStatus: (status: 'idle' | 'connecting' | 'connected' | 'error') => void;
  voiceTranscript: Array<{ role: 'user' | 'agent'; text: string }>;
  addVoiceTranscript: (entry: { role: 'user' | 'agent'; text: string }) => void;
  clearVoiceTranscript: () => void;
}

export const useBoroughStore = create<BoroughState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  supplyBubbles: [],
  demandPulses: [],
  addBubble: (bubble) =>
    set((state) => {
      if (bubble.type === 'supply') {
        return { supplyBubbles: [...state.supplyBubbles, bubble] };
      }
      return { demandPulses: [...state.demandPulses, bubble] };
    }),
  removeBubble: (id) =>
    set((state) => ({
      supplyBubbles: state.supplyBubbles.filter((b) => b.id !== id),
      demandPulses: state.demandPulses.filter((b) => b.id !== id),
    })),
  setBubbles: (supply, demand) => set({ supplyBubbles: supply, demandPulses: demand }),

  agentActivity: [],
  addAgentActivity: (activity) =>
    set((state) => ({
      agentActivity: [...state.agentActivity.slice(-4), activity],
    })),
  removeAgentActivity: (id) =>
    set((state) => ({
      agentActivity: state.agentActivity.filter((a) => a.id !== id),
    })),

  activeNegotiation: null,
  negotiationMessages: [],
  setActiveNegotiation: (neg) => set({ activeNegotiation: neg }),
  addNegotiationMessage: (msg) =>
    set((state) => ({
      negotiationMessages: [...state.negotiationMessages, msg],
    })),
  clearNegotiation: () =>
    set({ activeNegotiation: null, negotiationMessages: [], isNegotiationTheaterOpen: false }),

  dealTerms: null,
  setDealTerms: (terms) => set({ dealTerms: terms }),

  xp: 0,
  level: 1,
  addXP: (amount) =>
    set((state) => {
      const newXP = state.xp + amount;
      let newLevel = state.level;
      if (newXP >= 2000) newLevel = 5;
      else if (newXP >= 1000) newLevel = 4;
      else if (newXP >= 500) newLevel = 3;
      else if (newXP >= 200) newLevel = 2;
      return { xp: newXP, level: newLevel };
    }),

  isNegotiationTheaterOpen: false,
  setNegotiationTheaterOpen: (open) => set({ isNegotiationTheaterOpen: open }),
  selectedBubble: null,
  setSelectedBubble: (bubble) => set({ selectedBubble: bubble }),
  isDealDialogOpen: false,
  setDealDialogOpen: (open) => set({ isDealDialogOpen: open }),

  voiceStatus: 'idle',
  setVoiceStatus: (status) => set({ voiceStatus: status }),
  voiceTranscript: [],
  addVoiceTranscript: (entry) =>
    set((state) => ({ voiceTranscript: [...state.voiceTranscript, entry] })),
  clearVoiceTranscript: () => set({ voiceTranscript: [] }),
}));
