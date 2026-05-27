import Link from "next/link";
import { Sparkles, Megaphone, Users, DollarSign, ArrowRight, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="aurora-glass bg-background text-foreground min-h-screen relative overflow-hidden flex flex-col justify-between">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles size={20} className="text-white" />
          </span>
          <span className="font-extrabold text-xl tracking-tight text-white">ADREX<span className="text-cyan-400 font-light">MEDIA</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/signup" className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all text-sm shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-1">
        
        {/* Left Column: Copy & CTA */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-medium text-purple-300">
            <Sparkles size={12} className="text-cyan-400" />
            <span>Next-Gen Agency Management System</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-white">
            The OS for Modern <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400">Marketing Agencies</span>
          </h1>
          
          <p className="text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed">
            Unify your influencer relations, campaign workflows, financials, and client reporting under one premium workspace. Built with real-time analytics and optional secure OTP protection.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link 
              href="/login" 
              className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/95 transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.5)] text-sm group"
            >
              Access OS Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/signup" 
              className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all text-sm"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Right Column: Visual Dashboard Glassmorphism Cards */}
        <div className="relative space-y-6">
          
          {/* Main Mockup Card */}
          <div className="glassmorphism rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/75" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/75" />
                <div className="w-3 h-3 rounded-full bg-green-500/75" />
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Active Workspace</span>
            </div>

            {/* KPI Grid mockup */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Monthly Revenue</span>
                <p className="text-xl font-extrabold text-white mt-1">₹42,85,000</p>
                <span className="text-[9px] text-emerald-400 font-semibold block mt-1">+14.2% from last month</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active Campaigns</span>
                <p className="text-xl font-extrabold text-white mt-1">36 Ongoing</p>
                <span className="text-[9px] text-cyan-400 font-semibold block mt-1">12 Creator deliverables due</span>
              </div>
            </div>

            {/* Task list mockup */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-white/3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <div>
                    <span className="text-xs font-bold text-white block">Generate AI Marketing Strategy</span>
                    <span className="text-[9px] text-zinc-500 block">Assigned to Lead Marketer</span>
                  </div>
                </div>
                <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-bold">AI TOOL</span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-white/3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <div>
                    <span className="text-xs font-bold text-white block">Approve Creator Video Deliverables</span>
                    <span className="text-[9px] text-zinc-500 block">Influencer Portal Submission</span>
                  </div>
                </div>
                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-bold">PORTAL</span>
              </div>
            </div>
          </div>

          {/* Floating small card */}
          <div className="absolute bottom-[-20px] left-[-20px] bg-gradient-to-r from-purple-900/90 to-indigo-900/90 border border-purple-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-[240px] backdrop-blur-md hidden sm:flex">
            <span className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Shield size={16} className="text-emerald-400" />
            </span>
            <div>
              <span className="text-[10px] text-zinc-400 block font-semibold">Security Shield</span>
              <span className="text-[11px] text-white block font-bold">OTP Authentication Verified</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-white/5 text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} Adrex Media. All rights reserved. Powered by Advanced Agentic OS technology.
      </footer>
    </div>
  );
}
