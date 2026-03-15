'use client';

import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../lib/websocket';
import { useBoroughStore } from '../stores/borough.store';
import type { AgentActivity } from '../lib/types';

let idCounter = 0;
function nextId() {
  return `ws-${Date.now()}-${idCounter++}`;
}

export function useWebSocket() {
  const store = useBoroughStore();

  useEffect(() => {
    const socket = connectSocket();
    socket.removeAllListeners();

    socket.on('map:bubble-added', (data: any) => {
      store.addBubble({ id: nextId(), ...data.bubble, type: data.type || 'supply' });
    });

    socket.on('map:bubble-removed', (data: any) => {
      store.removeBubble(data.bubbleId);
    });

    socket.on('agent:scout-scanning', (data: any) => {
      const activity: AgentActivity = {
        id: nextId(),
        agent: 'scout',
        action: 'scanning',
        text: `Scanning ${data.area || 'nearby'} for opportunities...`,
        type: 'working',
        timestamp: Date.now(),
      };
      store.addAgentActivity(activity);
    });

    socket.on('agent:scout-found', (data: any) => {
      const activity: AgentActivity = {
        id: nextId(),
        agent: 'scout',
        action: 'found',
        text: `Found ${data.opportunityCount || 0} opportunities nearby!`,
        type: 'success',
        timestamp: Date.now(),
      };
      store.addAgentActivity(activity);
    });

    socket.on('agent:packager-drafting', () => {
      const activity: AgentActivity = {
        id: nextId(),
        agent: 'packager',
        action: 'drafting',
        text: 'Crafting your listing...',
        type: 'working',
        timestamp: Date.now(),
      };
      store.addAgentActivity(activity);
    });

    socket.on('agent:packager-ready', () => {
      const activity: AgentActivity = {
        id: nextId(),
        agent: 'packager',
        action: 'ready',
        text: 'Your listing is ready for review!',
        type: 'success',
        timestamp: Date.now(),
      };
      store.addAgentActivity(activity);
    });

    socket.on('agent:matchmaker-found', () => {
      const activity: AgentActivity = {
        id: nextId(),
        agent: 'matchmaker',
        action: 'found',
        text: 'Match found! Someone nearby wants what you offer!',
        type: 'success',
        timestamp: Date.now(),
      };
      store.addAgentActivity(activity);
    });

    socket.on('negotiation:started', (data: any) => {
      store.setActiveNegotiation({
        negotiationId: data.negotiationId,
        buyerLocation: data.buyerLocation,
        sellerLocation: data.sellerLocation,
        status: 'active',
      });
      store.setNegotiationTheaterOpen(true);
    });

    socket.on('negotiation:message', (data: any) => {
      store.addNegotiationMessage({
        id: nextId(),
        from: data.from,
        message: data.message,
        agentName: data.agentName,
        agentColor: data.agentColor,
        timestamp: Date.now(),
      });
    });

    socket.on('negotiation:deal-reached', (data: any) => {
      store.setActiveNegotiation({
        ...store.activeNegotiation!,
        negotiationId: data.negotiationId,
        status: 'deal-reached',
      });
      if (data.terms) {
        store.setDealTerms({
          negotiationId: data.negotiationId,
          listingTitle: data.terms.listing_title || 'Skill Exchange',
          location: data.terms.location || '',
          agreedTime: data.terms.agreed_time || '',
          pricePerPerson: (data.terms.price_per_person_pence || 0) / 100,
          quantity: data.terms.quantity || 1,
          total: (data.terms.total_pence || 0) / 100,
          specialConditions: data.terms.special_conditions,
        });
        store.setDealDialogOpen(true);
      }
    });

    socket.on('negotiation:abandoned', (_data: any) => {
      if (store.activeNegotiation) {
        store.setActiveNegotiation({
          ...store.activeNegotiation,
          status: 'abandoned',
        });
      }
    });

    socket.on('booking:confirmed', () => {
      const activity: AgentActivity = {
        id: nextId(),
        agent: 'matchmaker',
        action: 'celebration',
        text: '★ Booking confirmed!',
        type: 'celebration',
        timestamp: Date.now(),
      };
      store.addAgentActivity(activity);
    });

    return () => {
      socket.removeAllListeners();
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
