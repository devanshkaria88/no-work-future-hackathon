export type AgentType =
  | 'scout'
  | 'packager'
  | 'matchmaker'
  | 'buyerNegotiator'
  | 'sellerNegotiator'
  | 'companion';

export interface AgentDef {
  id: AgentType;
  name: string;
  emoji: string;
  color: string;
  shortName: string;
  sprite: string;
}

export const AGENTS: Record<AgentType, AgentDef> = {
  scout: { id: 'scout', name: 'Scout Agent', emoji: '🔭', color: '#1D9E75', shortName: 'Scout', sprite: '/sprites/scout.png' },
  packager: { id: 'packager', name: 'Packager Agent', emoji: '🎨', color: '#7F77DD', shortName: 'Packager', sprite: '/sprites/packager.png' },
  matchmaker: { id: 'matchmaker', name: 'Matchmaker Agent', emoji: '💘', color: '#D85A30', shortName: 'Matchmaker', sprite: '/sprites/matchmaker.png' },
  buyerNegotiator: { id: 'buyerNegotiator', name: 'Buyer Agent', emoji: '💰', color: '#378ADD', shortName: 'Buyer', sprite: '/sprites/buyer.png' },
  sellerNegotiator: { id: 'sellerNegotiator', name: 'Seller Agent', emoji: '🔨', color: '#EF9F27', shortName: 'Seller', sprite: '/sprites/seller.png' },
  companion: { id: 'companion', name: 'Companion', emoji: '👋', color: '#FAC775', shortName: 'Companion', sprite: '/sprites/companion.png' },
};

export function getAgentForRole(role: 'buyer' | 'seller'): AgentDef {
  return role === 'buyer' ? AGENTS.buyerNegotiator : AGENTS.sellerNegotiator;
}
