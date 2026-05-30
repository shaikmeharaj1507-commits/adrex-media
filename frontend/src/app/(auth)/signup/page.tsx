'use client';

import { API_URL } from '@/lib/api';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building2, Loader2, Sparkles, Users, BarChart3, ShieldCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAuthStore(state => state.setUser);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    agencyName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adrex_token', data.token);
        setUser(data.user);
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden bg-background text-foreground">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[130px] rounded-full pointer-events-none opacity-20"
        style={{ background: 'var(--aurora-1)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[130px] rounded-full pointer-events-none opacity-20"
        style={{ background: 'var(--aurora-2)' }} />

      {/* Left Column: Premium Feature Banner / Info */}
      <div className="hidden md:flex md:w-1/2 p-12 lg:p-20 flex-col justify-between relative border-r border-border/40 bg-muted/10">
        <div className="space-y-8 relative z-10">
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Adrex Media" className="w-10 h-10 rounded-xl object-contain shadow-lg" />
            <span className="font-extrabold text-xl tracking-tight text-foreground">
              ADREX<span className="text-primary font-light">MEDIA</span>
            </span>
          </div>

          <div className="space-y-4 max-w-lg pt-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold text-primary">
              <Sparkles size={12} />
              <span>Next-Gen Operating System</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-none text-foreground">
              Unleash Your Agency's <span className="text-gradient">Full Potential</span>.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Unify your influencer relations, campaign workflows, financial pipelines, and live client reporting. Built from the ground up for high-velocity media teams.
            </p>
          </div>

          {/* Features preview cards */}
          <div className="space-y-4 max-w-md pt-8">
            <div className="glassmorphism p-4 rounded-2xl border border-border/60 hover:border-primary/30 transition-all flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users size={16} className="text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Premium Influencer CRM</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Invite creators, chat in real-time, collect campaign deliverables, and dispatch payouts seamlessly.</p>
              </div>
            </div>

            <div className="glassmorphism p-4 rounded-2xl border border-border/60 hover:border-primary/30 transition-all flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BarChart3 size={16} className="text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Flawless Invoice & Reporting PDFs</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Export beautiful, fully customized operations summaries and professional invoices with a single click.</p>
              </div>
            </div>

            <div className="glassmorphism p-4 rounded-2xl border border-border/60 hover:border-primary/30 transition-all flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} className="text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Granular Role Boundaries</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Secure workspace segregation with custom rules for Super Admins, Managers, and Creator partners.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground relative z-10">
          © {new Date().getFullYear()} Adrex Media OS. Built for modern enterprise performance marketing.
        </div>
      </div>

      {/* Right Column: Form Panel */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 md:p-20 relative min-h-screen md:min-h-0">
        {/* Top bar containing Theme Switcher */}
        <div className="flex justify-end items-center gap-3 w-full shrink-0">
          <ThemeSwitcher size="sm" showLabel />
        </div>

        {/* Form container */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full space-y-6"
          >
            {/* Logo display on mobile only */}
            <div className="md:hidden flex items-center gap-2.5 mb-8 justify-center">
              <img src="/logo.png" alt="Adrex Media" className="w-9 h-9 rounded-xl object-contain shadow-lg" />
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                ADREX<span className="text-primary font-light">MEDIA</span>
              </span>
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Create Agency Workspace</h1>
              <p className="text-muted-foreground text-sm">Register your enterprise workspace for free</p>
            </div>

            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-muted-foreground" />
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={formData.firstName} 
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                      placeholder="John" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Last Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.lastName} 
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="block w-full px-3 py-3 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                    placeholder="Doe" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Agency Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 size={16} className="text-muted-foreground" />
                  </div>
                  <input 
                    type="text" 
                    required 
                    value={formData.agencyName} 
                    onChange={e => setFormData({ ...formData, agencyName: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                    placeholder="Acme Marketing" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Work Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-muted-foreground" />
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                    placeholder="john@example.com" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-muted-foreground" />
                  </div>
                  <input 
                    type="password" 
                    required 
                    value={formData.password} 
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/95 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(124,92,255,0.3)] flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : <span className="flex items-center gap-1.5 justify-center">Create Workspace <ChevronRight size={15} /></span>}
              </button>
            </form>

            <p className="text-center md:text-left text-sm text-muted-foreground pt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Footer on mobile */}
        <div className="md:hidden text-center text-[10px] text-muted-foreground mt-8 shrink-0">
          © {new Date().getFullYear()} Adrex Media OS.
        </div>
      </div>
    </div>
  );
}
