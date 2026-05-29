'use client';

import { API_URL } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function InfluencerLoginPage() {
  const router = useRouter();
  const setUser = useAuthStore(s => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/influencer-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please verify your credentials.');
        return;
      }

      if (data.token) {
        localStorage.setItem('adrex_token', data.token);
      }

      setUser(data.user);
      // Force hard redirect to rehydrate stores and trigger AuthGuard check
      window.location.href = '/influencer/dashboard';
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-pink-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="z-10 w-full max-w-md p-8 glassmorphism rounded-2xl border border-white/10"
      >
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 mb-4 shadow-lg shadow-purple-500/20">
            <Sparkles size={24} className="text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Creator Portal
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Access your campaigns, deliverables, and payouts
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2.5 mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
          >
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </motion.div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="creator-email">Email</label>
            <input
              id="creator-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-white placeholder-zinc-500"
              placeholder="creator@partner.com"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="block text-sm font-medium" htmlFor="creator-password">Password</label>
            </div>
            <div className="relative">
              <input
                id="creator-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-white placeholder-zinc-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            id="creator-login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)] flex items-center justify-center gap-2 border-0"
          >
            {loading ? (
              <><Loader2 size={17} className="animate-spin" /> Entering Portal...</>
            ) : (
              'Enter Creator Portal'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Having trouble accessing your account?
          </p>
          <p className="text-xs text-purple-400 mt-1">
            Please contact your agency manager to request portal access.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
