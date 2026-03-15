export interface UserPreferences {
  budgetMax?: number;
  budgetPreferred?: number;
  partySize?: number;
  flexibility?: 'low' | 'medium' | 'high';
  preferredCategories?: string[];
  preferredTimes?: string[];
}

export interface Opportunity {
  id: string;
  category: string;
  title: string;
  demand_score: number;
  reasoning: string;
  competition_level: string;
  suggested_price_range: { min_pence: number; max_pence: number };
  best_time_windows: string[];
  location_suggestion: string;
  why_this_user: string;
}

export interface OpportunityAssessment {
  opportunities: Opportunity[];
  local_context: {
    weather: string;
    nearby_events: string[];
    transport_notes: string;
    neighborhood_vibe: string;
  };
  meta: {
    total_demand_signals_analyzed: number;
    total_existing_supply_analyzed: number;
    gaps_identified: number;
  };
}

export interface ListingDraft {
  title: string;
  description: string;
  short_description: string;
  price_per_person_pence: number;
  minimum_price_pence: number;
  capacity: number;
  duration_minutes: number;
  category: string;
  tags: string[];
  suggested_times: string[];
  location_type: string;
  whats_included: string[];
  what_to_bring: string[];
  host_credential: string;
  cancellation_policy: string;
  accessibility_notes: string;
}

export interface PackagerOutput {
  listing: ListingDraft;
}

export interface MatchResult {
  listing_id: string;
  demand_id: string;
  confidence: number;
  reasoning: string;
  compatibility: {
    proximity_meters: number;
    price: string;
    timing: string;
    semantic: string;
    group_size: string;
  };
  trigger_negotiation: boolean;
  suggested_opening: string;
}

export interface MatchmakerOutput {
  matches: MatchResult[];
  unmatched_demand: { demand_id: string; reason: string }[];
}

export interface NegotiationMessage {
  from: 'buyer' | 'seller';
  text: string;
  timestamp: Date;
}

export interface DealTerms {
  price_per_person_pence: number;
  quantity: number;
  total_pence: number;
  special_conditions: string[];
  agreed_time: string;
}

export interface NegotiationResult {
  outcome: 'deal' | 'abandoned';
  terms?: DealTerms;
  transcript: NegotiationMessage[];
}

export interface MapBubble {
  id: string;
  type: 'supply' | 'demand';
  lat: number;
  lng: number;
  title: string;
  category?: string;
  pricePence?: number;
  capacity?: number;
  booked?: number;
  query?: string;
  budgetMaxPence?: number;
  radiusMeters?: number;
  userId: string;
  userName?: string;
  status?: string;
}
