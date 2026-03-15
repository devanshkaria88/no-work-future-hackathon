export enum BlackboardSection {
  USER_PROFILES = 'userProfiles',
  OPPORTUNITIES = 'opportunities',
  ACTIVE_LISTINGS = 'activeListings',
  DEMAND_SIGNALS = 'demandSignals',
  MATCHES = 'matches',
  NEGOTIATIONS = 'negotiations',
  TRANSACTIONS = 'transactions',
}

export interface BlackboardState {
  userProfiles: Map<string, any>;
  opportunities: any[];
  activeListings: any[];
  demandSignals: any[];
  matches: any[];
  negotiations: Map<string, any>;
  transactions: any[];
}

export interface BlackboardEvent {
  section: BlackboardSection;
  action: 'write' | 'update' | 'delete' | 'clear';
  data: any;
  timestamp: Date;
}
