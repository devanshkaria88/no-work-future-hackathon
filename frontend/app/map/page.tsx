'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useBoroughStore } from '../stores/borough.store';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMapBubbles } from '../hooks/useMapBubbles';
import { MOCK_SUPPLY, MOCK_DEMAND } from '../lib/mock-data';
import { API_URL } from '../lib/constants';
import RetroHeader from '../components/shared/RetroHeader';
import AgentActivityBar from '../components/agents/AgentActivityBar';
import NegotiationTheater from '../components/agents/NegotiationTheater';
import DealConfirmation from '../components/agents/DealConfirmation';
import ListingPopup from '../components/listings/ListingPopup';
import VoiceCompanion from '../components/voice/VoiceCompanion';

const BoroughMap = dynamic(() => import('../components/map/BoroughMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center">
      <p className="font-pixel text-xs text-white/40">Loading map...</p>
    </div>
  ),
});

export default function MapPage() {
  const router = useRouter();
  const user = useBoroughStore((s) => s.user);
  const setBubbles = useBoroughStore((s) => s.setBubbles);
  const supplyBubbles = useBoroughStore((s) => s.supplyBubbles);
  const addAgentActivity = useBoroughStore((s) => s.addAgentActivity);
  const [demoRunning, setDemoRunning] = useState(false);

  useWebSocket();
  useMapBubbles();

  // Redirect to login if no user
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem('borough_user');
      if (saved) {
        try {
          useBoroughStore.getState().setUser(JSON.parse(saved));
        } catch {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  // Fallback to mock data if backend returns nothing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (supplyBubbles.length === 0) {
        setBubbles(MOCK_SUPPLY, MOCK_DEMAND);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [supplyBubbles.length, setBubbles]);

  // Trigger a REAL negotiation via the backend — Claude agents will negotiate live
  const triggerRealNegotiation = useCallback(async () => {
    if (demoRunning) return;
    setDemoRunning(true);

    addAgentActivity({
      id: `demo-scout-${Date.now()}`,
      agent: 'scout',
      action: 'scanning',
      text: 'Scanning Shoreditch for opportunities...',
      type: 'working',
      timestamp: Date.now(),
    });

    try {
      // First ensure data is seeded
      await fetch(`${API_URL}/demo/seed`, { method: 'POST' }).catch(() => {});

      setTimeout(() => {
        addAgentActivity({
          id: `demo-match-${Date.now()}`,
          agent: 'matchmaker',
          action: 'matching',
          text: 'Looking for the best match...',
          type: 'working',
          timestamp: Date.now(),
        });
      }, 1500);

      // Trigger a real match + negotiation via the backend
      // This calls Claude matchmaker to find a match, then Claude negotiator agents
      // to have a real conversation. Results stream via WebSocket.
      const res = await fetch(`${API_URL}/demo/trigger-match`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.error) {
        addAgentActivity({
          id: `demo-error-${Date.now()}`,
          agent: 'matchmaker',
          action: 'error',
          text: data.error,
          type: 'working',
          timestamp: Date.now(),
        });
        setDemoRunning(false);
        return;
      }

      addAgentActivity({
        id: `demo-matched-${Date.now()}`,
        agent: 'matchmaker',
        action: 'found',
        text: `Match found for "${data.listingTitle}"! Agents negotiating...`,
        type: 'success',
        timestamp: Date.now(),
      });

      // The negotiation happens on the backend and streams via WebSocket
      // (negotiation:started, negotiation:message, negotiation:deal-reached)
      // So we just wait. Reset the button after a reasonable time.
      setTimeout(() => setDemoRunning(false), 60000);
    } catch (err) {
      console.error('Demo trigger failed:', err);
      addAgentActivity({
        id: `demo-error-${Date.now()}`,
        agent: 'matchmaker',
        action: 'error',
        text: 'Could not connect to backend',
        type: 'working',
        timestamp: Date.now(),
      });
      setDemoRunning(false);
    }
  }, [demoRunning, addAgentActivity]);

  function handleLogout() {
    localStorage.removeItem('borough_user');
    useBoroughStore.getState().setUser(null);
    router.push('/');
  }

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <RetroHeader />

      <div className="absolute inset-0 pt-10">
        <BoroughMap />
      </div>

      <AgentActivityBar />
      <NegotiationTheater />
      <DealConfirmation />
      <ListingPopup />
      <VoiceCompanion />

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-2 px-4 py-2 bg-nes-dark/95 border-t-2 border-nes-border">
        <button
          onClick={triggerRealNegotiation}
          disabled={demoRunning}
          className={`px-3 py-1.5 border-2 font-pixel text-[9px] transition-colors ${
            demoRunning
              ? 'border-agent-companion/50 text-agent-companion/50 animate-pulse cursor-wait'
              : 'border-agent-matchmaker text-agent-matchmaker hover:bg-agent-matchmaker/10'
          }`}
        >
          {demoRunning ? '⏳ Agents working...' : '▶ Demo'}
        </button>
        <button className="px-3 py-1.5 border-2 border-nes-border text-white/50 font-pixel text-[9px] hover:border-white/30 transition-colors">
          Explore
        </button>
        {user && (
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 border-2 border-nes-border text-white/30 font-pixel text-[9px] hover:border-red-500/30 hover:text-red-400/50 transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
