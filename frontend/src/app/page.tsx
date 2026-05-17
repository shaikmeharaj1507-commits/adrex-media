import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-4xl glassmorphism p-12 rounded-3xl">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Welcome to <br />
          <span className="text-gradient">Adrex Media OS</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          The ultimate multi-tenant SaaS platform for modern Influencer & Performance Marketing Agencies. Scale your brand with enterprise-grade tools.
        </p>
        
        <div className="flex gap-4 pt-8">
          <Link 
            href="/login" 
            className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            Access Dashboard
          </Link>
          <Link 
            href="/signup" 
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-semibold hover:bg-white/10 transition-all"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
