'use client';

import { useEffect } from 'react';
import { useBoroughStore } from '../stores/borough.store';
import { API_URL } from '../lib/constants';

export function useMapBubbles() {
  const setBubbles = useBoroughStore((s) => s.setBubbles);

  useEffect(() => {
    async function fetchBubbles() {
      try {
        const res = await fetch(
          `${API_URL}/map/bubbles?lat=51.5074&lng=-0.1276&radius=5000`
        );
        if (!res.ok) return;
        const data = await res.json();
        const supply = (data.supply || []).map((l: any) => ({
          id: l.id,
          type: 'supply' as const,
          lat: Number(l.lat),
          lng: Number(l.lng),
          title: l.title,
          category: l.category,
          price: l.pricePence ? l.pricePence / 100 : l.price,
          capacity: l.capacity,
          booked: l.booked || 0,
          description: l.description,
          tags: l.tags,
          userName: l.user?.name || l.userName,
          timeSlot: l.timeSlot,
        }));
        const demand = (data.demand || []).map((d: any) => ({
          id: d.id,
          type: 'demand' as const,
          lat: Number(d.lat),
          lng: Number(d.lng),
          title: d.query || 'Demand',
          category: 'default',
          query: d.query,
          budgetMax: d.budgetMaxPence ? d.budgetMaxPence / 100 : d.budgetMax,
        }));
        setBubbles(supply, demand);
      } catch {
        // Backend may not be running yet — use mock data for dev
      }
    }
    fetchBubbles();
  }, [setBubbles]);
}
