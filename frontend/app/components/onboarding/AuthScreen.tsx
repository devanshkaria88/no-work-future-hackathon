'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '../../lib/constants';

interface AuthScreenProps {
  onAuth: (user: any) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? 'login' : 'register';
      const body: any = { email, password };
      if (mode === 'register') body.name = name;

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
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-black/50 border-2 border-nes-border text-white text-sm focus:border-agent-companion outline-none transition-colors"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-black/50 border-2 border-nes-border text-white text-sm focus:border-agent-companion outline-none transition-colors"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
            className="w-full px-4 py-2.5 bg-black/50 border-2 border-nes-border text-white text-sm focus:border-agent-companion outline-none transition-colors"
          />

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
