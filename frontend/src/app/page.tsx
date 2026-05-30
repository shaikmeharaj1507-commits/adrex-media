'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const features = [
  { icon: Zap, title: 'Real-time Analytics', desc: 'Live campaign tracking and performance dashboards' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Granular permissions for every team member' },
  { icon: BarChart3, title: 'Influencer CRM', desc: 'Full lifecycle management for creator partnerships' },
];

export default function Home() {
  return (
    <div className="bg-background text-foreground min-h-screen relative overflow-hidden flex flex-col">
      {/* Decorative Orbs — theme-aware via CSS vars */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] blur-[130px] rounded-full pointer-events-none"
        style={{ background: 'var(--aurora-1)' }} />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] blur-[130px] rounded-full pointer-events-none"
        style={{ background: 'var(--aurora-2)' }} />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] blur-[100px] rounded-full pointer-events-none"
        style={{ background: 'var(--aurora-1)' }} />

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-border/40 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Adrex Media" className="w-9 h-9 rounded-xl object-contain shadow-lg" />
          <span className="font-extrabold text-lg tracking-tight text-foreground">
            ADREX<span className="text-primary font-light">MEDIA</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher size="sm" showLabel />
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Login
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all text-sm shadow-[0_0_15px_rgba(124,92,255,0.35)]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 max-w-4xl mx-auto w-full space-y-8">
        <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 px-3.5 py-1.5 rounded-full text-xs font-medium text-primary">
          <Sparkles size={11} />
          <span>Next-Gen Agency Management System</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-foreground">
          The OS for Modern <br />
          <span className="text-gradient">Marketing Agencies</span>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Unify your influencer relations, campaign workflows, financials, and client reporting
          under one premium workspace. Built with real-time analytics and AI tools.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/login"
            className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(124,92,255,0.4)] text-sm group"
          >
            Access OS Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/signup"
            className="px-8 py-4 bg-muted border border-border text-foreground rounded-xl font-bold hover:bg-muted/80 transition-all text-sm"
          >
            Create Account
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 w-full max-w-3xl">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="glassmorphism p-4 text-left rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon size={16} className="text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-5 border-t border-border/40 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Adrex Media. All rights reserved. Powered by Advanced Agentic OS technology.
      </footer>
    </div>
  );
}
