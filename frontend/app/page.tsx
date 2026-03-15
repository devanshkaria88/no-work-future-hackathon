'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthScreen from './components/onboarding/AuthScreen';
import WelcomeScreen from './components/onboarding/WelcomeScreen';
import { useBoroughStore } from './stores/borough.store';

export default function Home() {
  const router = useRouter();
  const setUser = useBoroughStore((s) => s.setUser);
  const [phase, setPhase] = useState<'loading' | 'auth' | 'welcome'>('loading');

  useEffect(() => {
    const saved = localStorage.getItem('borough_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setPhase('welcome');
      } catch {
        setPhase('auth');
      }
    } else {
      setPhase('auth');
    }
  }, [setUser]);

  function handleAuth(userData: any) {
    setUser(userData);
    setPhase('welcome');
  }

  function handleExplore() {
    router.push('/map');
  }

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
        <p className="font-pixel text-xs text-agent-companion animate-pulse">★ BOROUGH ★</p>
      </div>
    );
  }

  if (phase === 'auth') {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <WelcomeScreen
      onTalk={handleExplore}
      onType={handleExplore}
      onExplore={handleExplore}
    />
  );
}
