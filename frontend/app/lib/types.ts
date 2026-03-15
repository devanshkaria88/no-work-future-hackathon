import { AgentType } from './agents';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  skills: string[];
  locationArea: string;
  lat: number;
  lng: number;
  status: string;
  previousRole?: string;
}

export interface MapBubble {
  id: string;
  type: 'supply' | 'demand';
  lat: number;
  lng: number;
  title: string;
  category: string;
  price?: number;
  capacity?: number;
  booked?: number;
  description?: string;
  tags?: string[];
  userName?: string;
  timeSlot?: string;
  query?: string;
  budgetMax?: number;
}

export interface AgentActivity {
  id: string;
  agent: AgentType;
  action: string;
  text: string;
  type: 'working' | 'success' | 'negotiation' | 'celebration';
  timestamp: number;
}

export interface NegotiationMessage {
  id: string;
  from: 'buyer' | 'seller';
  message: string;
  agentName: string;
  agentColor: string;
  timestamp: number;
}

export interface NegotiationState {
  negotiationId: string;
  buyerLocation?: { lat: number; lng: number };
  sellerLocation?: { lat: number; lng: number };
  status: 'connecting' | 'active' | 'deal-reached' | 'abandoned' | 'pending-approval';
}

export interface DealTerms {
  negotiationId: string;
  listingTitle: string;
  location: string;
  agreedTime: string;
  pricePerPerson: number;
  quantity: number;
  total: number;
  specialConditions?: string[];
}
