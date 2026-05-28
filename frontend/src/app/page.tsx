import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background text-foreground min-h-screen relative overflow-hidden flex flex-col justify-between">
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
      <main className="z-10 max-w-4xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center justify-center flex-1 space-y-8">
        
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-medium text-purple-300">
          <Sparkles size={12} className="text-cyan-400" />
          <span>Next-Gen Agency Management System</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-white">
          The OS for Modern <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400">Marketing Agencies</span>
        </h1>
        
        <p className="text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          Unify your influencer relations, campaign workflows, financials, and client reporting under one premium workspace. Built with real-time analytics.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
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
      </main>

      {/* Footer */}
      <footer className="z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-white/5 text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} Adrex Media. All rights reserved. Powered by Advanced Agentic OS technology.
      </footer>
    </div>
  );
}
