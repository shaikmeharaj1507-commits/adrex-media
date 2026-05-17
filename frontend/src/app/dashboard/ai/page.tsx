'use client';

import { API_URL } from '@/lib/api';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, FileText, MessageSquare, Loader2, Copy, Check, Lightbulb, Target, PenTool } from 'lucide-react';

type Tool = 'campaign' | 'caption' | 'outreach' | 'strategy';

const tools: { id: Tool; label: string; desc: string; icon: React.ElementType; color: string; placeholder: string }[] = [
  { id: 'campaign', label: 'Campaign Brief Generator', desc: 'AI-powered campaign briefs from a simple idea', icon: Target, color: 'from-purple-500 to-blue-500', placeholder: 'e.g. Summer fashion launch for Gen Z audience on Instagram and TikTok with ₹5L budget' },
  { id: 'caption', label: 'Caption Generator', desc: 'Viral captions with hashtags for any platform', icon: PenTool, color: 'from-pink-500 to-rose-500', placeholder: 'e.g. A flatlay of our new skincare line on marble background for Instagram' },
  { id: 'outreach', label: 'Influencer Outreach', desc: 'Personalized DMs and email pitches', icon: MessageSquare, color: 'from-blue-500 to-cyan-500', placeholder: 'e.g. Reach out to a fitness influencer (200K followers) for a protein supplement brand collab' },
  { id: 'strategy', label: 'Strategy Advisor', desc: 'Data-backed strategy recommendations', icon: Lightbulb, color: 'from-amber-500 to-orange-500', placeholder: 'e.g. We run performance marketing for a D2C skincare brand with 3L monthly ad budget. Suggest an influencer strategy.' },
];

function formatOutput(data: any, tool: Tool): string {
  if (tool === 'campaign') {
    const parts: string[] = [];
    if (data.name) parts.push(`## ${data.name}`);
    if (data.tagline) parts.push(`_${data.tagline}_`);
    if (data.description) parts.push(`\n${data.description}`);
    if (data.targetAudience) parts.push(`\n**Target:** ${data.targetAudience}`);
    if (data.recommendedPlatforms?.length) parts.push(`\n**Platforms:** ${data.recommendedPlatforms.join(', ')}`);
    if (data.contentPillars?.length) parts.push(`\n**Content Pillars:**\n${data.contentPillars.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}`);
    if (data.kpis?.length) parts.push(`\n**KPIs:**\n${data.kpis.map((k: string, i: number) => `• ${k}`).join('\n')}`);
    return parts.join('\n') || JSON.stringify(data, null, 2);
  }
  return data.result || data.idea || data.caption || data.email || data.strategy || JSON.stringify(data, null, 2);
}

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>('campaign');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentTool = tools.find(t => t.id === activeTool)!;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const token = localStorage.getItem('adrex_token');
      const endpointMap: Record<Tool, string> = {
        campaign: '/api/ai/campaign-idea',
        caption: '/api/ai/caption',
        outreach: '/api/ai/outreach',
        strategy: '/api/ai/strategy',
      };
      const res = await fetch(`${API_URL}${endpointMap[activeTool]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ prompt, brief: prompt, context: prompt }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult(`⚠️ ${data.error || 'AI generation failed. Please try again.'}`);
        return;
      }

      setResult(formatOutput(data, activeTool));
    } catch (err: any) {
      setResult('⚠️ Failed to connect to AI. Make sure the backend is running and GROQ_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </span>
          AI Tools
        </h1>
        <p className="text-muted-foreground mt-1 ml-12">Powered by Groq AI — generate campaigns, captions, outreach & strategy in seconds.</p>
      </div>

      {/* Tool Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <motion.button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResult(''); setPrompt(''); }}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className={`p-5 rounded-2xl border text-left transition-all ${isActive ? 'border-purple-500/50 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5'}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-zinc-300'}`}>{tool.label}</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{tool.desc}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Generator Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div className="glassmorphism rounded-2xl p-6" layout>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentTool.color} flex items-center justify-center`}>
              <currentTool.icon size={15} className="text-white" />
            </div>
            <h3 className="font-semibold text-white">{currentTool.label}</h3>
          </div>
          <label className="block text-xs text-zinc-400 mb-2">Describe what you need</label>
          <textarea
            rows={8}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={currentTool.placeholder}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Zap size={16} /> Generate with AI</>}
          </button>
        </motion.div>

        {/* Output */}
        <motion.div className="glassmorphism rounded-2xl p-6 relative" layout>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-zinc-400" />
              <h3 className="font-semibold text-white">AI Output</h3>
            </div>
            {result && (
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-zinc-400 hover:text-white transition-all">
                {copied ? <><Check size={12} className="text-emerald-400" /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            )}
          </div>

          <div className="min-h-[260px] bg-black/30 border border-white/10 rounded-xl p-4 relative overflow-y-auto max-h-[500px]">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center animate-pulse">
                    <Sparkles size={22} className="text-purple-400" />
                  </div>
                  <p className="text-sm text-zinc-500 animate-pulse">AI is thinking...</p>
                </motion.div>
              ) : result ? (
                <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <pre className={`text-sm whitespace-pre-wrap font-sans leading-relaxed ${result.startsWith('⚠️') ? 'text-red-400' : 'text-zinc-200'}`}>{result}</pre>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                  <Sparkles size={32} className="text-zinc-700" />
                  <p className="text-sm text-zinc-600">Your AI-generated content will appear here.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
