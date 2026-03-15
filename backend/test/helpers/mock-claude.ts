export const MOCK_CLAUDE_RESPONSES = {
  scout: JSON.stringify({
    opportunities: [
      {
        id: 'opp-1',
        category: 'food_experience',
        title: 'South Indian Cooking Class',
        demand_score: 0.87,
        reasoning: 'High demand for cooking classes in area',
        competition_level: 'low',
        suggested_price_range: { min_pence: 2500, max_pence: 4000 },
        best_time_windows: ['Saturday afternoon', 'Sunday morning'],
        location_suggestion: 'Your home kitchen in Shoreditch',
        why_this_user: 'Professional cooking background and local demand',
      },
    ],
    local_context: {
      weather: 'Mild, 16°C',
      nearby_events: ['Shoreditch Food Festival'],
      transport_notes: 'Good bus and overground links',
      neighborhood_vibe: 'Creative and foodie-friendly',
    },
    meta: {
      total_demand_signals_analyzed: 8,
      total_existing_supply_analyzed: 10,
      gaps_identified: 3,
    },
  }),

  packager: JSON.stringify({
    listing: {
      title: 'South Indian Cooking Experience',
      description: 'Learn to make dosa and sambar from scratch',
      short_description: 'Hands-on South Indian cooking class',
      price_per_person_pence: 3000,
      minimum_price_pence: 2200,
      capacity: 4,
      duration_minutes: 120,
      category: 'food',
      tags: ['cooking', 'south_indian'],
      suggested_times: ['Saturday 2pm', 'Sunday 11am'],
      location_type: 'host_home',
      whats_included: ['All ingredients', 'Recipe cards', 'Chai tea'],
      what_to_bring: ['Appetite', 'Apron (optional)'],
      host_credential: 'Former Sous Chef',
      cancellation_policy: '24h free cancellation',
      accessibility_notes: 'Ground floor kitchen, wheelchair accessible',
    },
  }),

  matchmaker: JSON.stringify({
    matches: [
      {
        listing_id: 'LISTING_ID_PLACEHOLDER',
        demand_id: 'DEMAND_ID_PLACEHOLDER',
        confidence: 0.92,
        reasoning: 'Strong semantic match for food experience',
        compatibility: {
          proximity_meters: 800,
          price: 'within_budget',
          timing: 'flexible',
          semantic: 'strong',
          group_size: 'fits',
        },
        trigger_negotiation: true,
        suggested_opening:
          'Great news! A cooking experience is available nearby.',
      },
    ],
    unmatched_demand: [],
  }),

  matchmakerNoMatch: JSON.stringify({
    matches: [],
    unmatched_demand: [
      { demand_id: 'DEMAND_ID_PLACEHOLDER', reason: 'No matching listings' },
    ],
  }),

  buyerNegotiator: [
    "My person is interested but their budget is £25. Any flexibility on the £30 price?",
    "What about £25 each for 2 spots? That's £50 total, which is a deal.",
    "Deal at £26 each. Confirmed. That works for my human.",
  ],

  sellerNegotiator: [
    "£28 is already fair for a hands-on cooking experience with all ingredients included.",
    "I'll do £26 each for 2 guaranteed spots. That's my final offer.",
    "Agreed. £26 each for 2 spots. Sending confirmation to both parties.",
  ],

  dealExtraction: JSON.stringify({
    price_per_person_pence: 2600,
    quantity: 2,
    total_pence: 5200,
    special_conditions: ['Group rate for 2 people'],
    agreed_time: 'Saturday 2pm',
  }),

  neverAgree:
    "I need at least £35. This is non-negotiable. The quality of ingredients justifies the price.",
};

/**
 * Creates a mock ClaudeService that returns canned responses.
 * The callIndex tracks sequential calls for negotiation flows.
 */
export function createMockClaudeService() {
  let callIndex = 0;
  const calls: Array<{ system: string; messages: any[] }> = [];

  return {
    calls,
    resetCalls() {
      callIndex = 0;
      calls.length = 0;
    },
    chat: jest.fn().mockImplementation(async (params) => {
      calls.push(params);
      const system = params.system?.toLowerCase() || '';

      if (system.includes('buyer') || system.includes('negotiat')) {
        if (system.includes('buyer')) {
          const buyerIdx = Math.min(
            Math.floor(callIndex / 2),
            MOCK_CLAUDE_RESPONSES.buyerNegotiator.length - 1,
          );
          callIndex++;
          return MOCK_CLAUDE_RESPONSES.buyerNegotiator[buyerIdx];
        }
        if (system.includes('seller')) {
          const sellerIdx = Math.min(
            Math.floor(callIndex / 2),
            MOCK_CLAUDE_RESPONSES.sellerNegotiator.length - 1,
          );
          callIndex++;
          return MOCK_CLAUDE_RESPONSES.sellerNegotiator[sellerIdx];
        }
      }

      if (system.includes('extract') || system.includes('deal')) {
        return MOCK_CLAUDE_RESPONSES.dealExtraction;
      }

      return 'Mock Claude response';
    }),
    chatJSON: jest.fn().mockImplementation(async (params) => {
      calls.push(params);
      const system = params.system?.toLowerCase() || '';

      if (system.includes('scout') || system.includes('opportunit')) {
        return JSON.parse(MOCK_CLAUDE_RESPONSES.scout);
      }
      if (system.includes('packager') || system.includes('listing draft')) {
        return JSON.parse(MOCK_CLAUDE_RESPONSES.packager);
      }
      if (system.includes('match')) {
        return JSON.parse(MOCK_CLAUDE_RESPONSES.matchmaker);
      }
      if (system.includes('extract') || system.includes('deal')) {
        return JSON.parse(MOCK_CLAUDE_RESPONSES.dealExtraction);
      }

      return {};
    }),
  };
}
