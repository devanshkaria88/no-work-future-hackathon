'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '../../lib/constants';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=neighborhood,locality,place&limit=1&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features?.length > 0) {
      return data.features[0].place_name.replace(/, United Kingdom$/, '');
    }
  } catch { /* fall through */ }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function getBrowserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  });
}

interface AuthScreenProps {
  onAuth: (user: any) => void;
}

interface DetectedLocation {
  area: string;
  lat: number;
  lng: number;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'done' | 'failed'>('idle');

  const detectLocation = useCallback(async () => {
    setLocationStatus('detecting');
    try {
      const coords = await getBrowserLocation();
      const area = await reverseGeocode(coords.lat, coords.lng);
      setDetectedLocation({ area, lat: coords.lat, lng: coords.lng });
      setLocationStatus('done');
    } catch {
      setLocationStatus('failed');
    }
  }, []);

  useEffect(() => {
    if (mode === 'register' && locationStatus === 'idle') {
      detectLocation();
    }
  }, [mode, locationStatus, detectLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? 'login' : 'register';
      const body: any = { email, password };

      if (mode === 'register') {
        body.name = name;

        if (detectedLocation) {
          body.locationArea = detectedLocation.area;
          body.lat = detectedLocation.lat;
          body.lng = detectedLocation.lng;
        }
      }

      const res = await fetch(`${API_URL.replace('/api', '')}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong');
        setLoading(false);
        return;
      }

      localStorage.setItem('borough_user', JSON.stringify(data));
      onAuth(data);
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-[#0a0a0a] flex items-center justify-center">
      <motion.div
        className="w-full max-w-sm mx-4 border-4 border-agent-companion bg-[#0d0d1a] p-6"
        style={{ imageRendering: 'pixelated' as const }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Title */}
        <div className="text-center mb-6">
          <p className="font-pixel text-xs text-agent-companion mb-3">
            ★ BOROUGH ★
          </p>
          <p className="text-white/50 text-sm">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-black/50 border-2 border-nes-border text-white text-sm focus:border-agent-companion outline-none transition-colors"
              />
              <div className="w-full px-4 py-2.5 bg-black/50 border-2 border-nes-border text-sm flex items-center gap-2">
                {locationStatus === 'detecting' && (
                  <span className="text-white/40 animate-pulse">Detecting location...</span>
                )}
                {locationStatus === 'done' && detectedLocation && (
                  <span className="text-agent-companion truncate" title={detectedLocation.area}>
                    {detectedLocation.area}
                  </span>
                )}
                {locationStatus === 'failed' && (
                  <span className="text-white/40 flex items-center gap-2">
                    <span>Location unavailable</span>
                    <button
                      type="button"
                      onClick={detectLocation}
                      className="text-agent-companion underline hover:text-agent-companion/80"
                    >
                      retry
                    </button>
                  </span>
                )}
                {locationStatus === 'idle' && (
                  <span className="text-white/30">Location will auto-detect</span>
                )}
              </div>
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-black/50 border-2 border-nes-border text-white text-sm focus:border-agent-companion outline-none transition-colors"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
              className="w-full px-4 py-2.5 pr-10 bg-black/50 border-2 border-nes-border text-white text-sm focus:border-agent-companion outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 border-2 border-agent-companion text-agent-companion hover:bg-agent-companion/10 transition-colors text-sm disabled:opacity-50"
          >
            {loading
              ? '...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-white/40 text-xs hover:text-white/70 transition-colors"
          >
            {mode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        <p className="text-center text-white/15 text-[9px] mt-4 font-pixel">
          Define The Future of (No) Work — March 2026
        </p>
      </motion.div>
    </div>
  );
}
