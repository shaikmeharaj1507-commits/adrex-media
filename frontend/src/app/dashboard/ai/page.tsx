'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, Zap, FileText, MessageSquare, Loader2, Copy, Check, 
  Lightbulb, Target, PenTool, Clock, Trash2, X, CheckSquare, 
  Calendar, ChevronDown, Download, RefreshCw
} from 'lucide-react';

type Tool = 'campaign' | 'caption' | 'outreach' | 'strategy' | 'workflow' | 'calendar';

const tools: { id: Tool; label: string; desc: string; icon: React.ElementType; color: string; placeholder: string }[] = [
  { id: 'campaign', label: 'Campaign Brief', desc: 'AI-powered campaign briefs', icon: Target, color: 'from-purple-500 to-blue-500', placeholder: 'e.g. Summer fashion launch for Gen Z audience on Instagram and TikTok with ₹5L budget' },
  { id: 'caption', label: 'Caption Generator', desc: 'Viral captions with hashtags', icon: PenTool, color: 'from-pink-500 to-rose-500', placeholder: 'e.g. A flatlay of our new skincare line on marble background for Instagram' },
  { id: 'outreach', label: 'Influencer Outreach', desc: 'Personalized DMs and email pitches', icon: MessageSquare, color: 'from-blue-500 to-cyan-500', placeholder: 'e.g. Reach out to a fitness influencer (200K followers) for a protein supplement brand collab' },
  { id: 'strategy', label: 'Strategy Advisor', desc: 'Data-backed strategy recommendations', icon: Lightbulb, color: 'from-amber-500 to-orange-500', placeholder: 'e.g. We run performance marketing for a D2C skincare brand with 3L monthly ad budget. Suggest an influencer strategy.' },
  { id: 'workflow', label: 'Workflow Planner', desc: 'Prioritized campaign action steps', icon: CheckSquare, color: 'from-green-500 to-emerald-500', placeholder: 'e.g. Action steps for setting up a multi-influencer cosmetic product launch' },
  { id: 'calendar', label: 'Content Calendar', desc: 'Weekly schedule grid builder', icon: Calendar, color: 'from-teal-500 to-cyan-500', placeholder: 'e.g. 1-week calendar for a high-intensity energy drink campaign on YouTube & IG' },
];

interface ChatRecord {
  id: string;
  tool: string;
  prompt: string;
  result: string;
  createdAt: string;
}

interface CampaignOption {
  id: string;
  name: string;
  description: string | null;
  budget: number;
}

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>('campaign');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<ChatRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Smart Context Injection state
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/ai/history`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setHistory(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/campaigns`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setCampaigns(await res.json());
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { 
    fetchHistory(); 
    fetchCampaigns();
  }, [fetchHistory, fetchCampaigns]);

  const currentTool = tools.find(t => t.id === activeTool)!;

  const handleCampaignContextChange = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    if (!campaignId) return;
    const camp = campaigns.find(c => c.id === campaignId);
    if (camp) {
      const contextText = `Campaign: ${camp.name}\nDescription: ${camp.description || 'Not provided'}\nBudget: ₹${camp.budget.toLocaleString('en-IN')}`;
      setPrompt(prev => prev ? `${prev}\n\n[Context]\n${contextText}` : contextText);
    }
  };

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
        workflow: '/api/ai/workflow',
        calendar: '/api/ai/content-calendar',
      };
      
      const payload: any = { prompt, brief: prompt, context: prompt };
      if (activeTool === 'calendar') {
        payload.campaignName = prompt;
        payload.durationWeeks = 1;
        payload.platforms = ['Instagram', 'TikTok'];
      }

      const res = await fetch(`${API_URL}${endpointMap[activeTool]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult(`⚠️ ${data.error || 'AI generation failed. Please try again.'}`);
        return;
      }

      setResult(data.result || 'No response generated.');
      await fetchHistory();
    } catch (err: any) {
      setResult('⚠️ Failed to connect to AI. Make sure the backend is running and GROQ_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const token = localStorage.getItem('adrex_token');
      await fetch(`${API_URL}/api/ai/history/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    if (!result) return;
    // Simple browser print-friendly layout trigger or plain content save
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
        <head>
          <title>Adrex Media AI - Generated Report</title>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.6; padding: 40px; color: #1f2937; }
            h1 { color: #6b21a8; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px; }
            pre { background: #f3f4f6; padding: 20px; border-radius: 8px; font-size: 14px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>AI Generated Output: ${currentTool.label}</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          <pre>${result}</pre>
          <script>window.print();</script>
        </body>
        </html>
      `);
      win.document.close();
    }
  };

  // Basic markdown compiler function to display beautiful styled layout
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-foreground font-bold text-sm mt-4 mb-2 first:mt-0">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-primary font-extrabold text-base mt-5 mb-2.5 first:mt-0">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-foreground font-black text-lg mt-6 mb-3 first:mt-0">{line.replace('# ', '')}</h2>;
      }
      // Bullets
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const content = line.substring(2);
        return <li key={idx} className="text-muted-foreground text-sm ml-4 list-disc mb-1.5 leading-relaxed">{compileInlineStyles(content)}</li>;
      }
      // Standard line
      return <p key={idx} className="text-muted-foreground text-sm mb-2 leading-relaxed min-h-[1rem]">{compileInlineStyles(line)}</p>;
    });
  };

  const compileInlineStyles = (text: string) => {
    // Bold compilation **text**
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="text-foreground font-semibold">{part}</strong>;
      }
      return part;
    });
  };

  // Calendar Grid parser helper
  let calendarParsedData: any[] | null = null;
  if (activeTool === 'calendar' && result && !result.startsWith('⚠️')) {
    try {
      // Find JSON block if it is wrapped in markdown code blocks
      let cleanedResult = result.trim();
      const match = cleanedResult.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        cleanedResult = match[0];
      }
      const parsed = JSON.parse(cleanedResult);
      if (Array.isArray(parsed)) {
        calendarParsedData = parsed;
      }
    } catch (e) {
      // Failed parsing, display markdown fallback
    }
  }

  const toolIcon: Record<string, React.ElementType> = {
    campaign: Target, caption: PenTool, outreach: MessageSquare, strategy: Lightbulb, 
    workflow: CheckSquare, calendar: Calendar, chat: Sparkles
  };

  const toolColors: Record<string, string> = {
    campaign: 'bg-purple-500/20 text-purple-400',
    caption: 'bg-pink-500/20 text-pink-400',
    outreach: 'bg-blue-500/20 text-blue-400',
    strategy: 'bg-amber-500/20 text-amber-400',
    workflow: 'bg-green-500/20 text-green-400',
    calendar: 'bg-teal-500/20 text-teal-400',
    chat: 'bg-zinc-500/20 text-zinc-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles size={18} className="text-white animate-spin-slow" />
            </span>
            AI Assistant & Tools
          </h1>
          <p className="text-muted-foreground mt-1 ml-12">Powered by Groq AI — generate briefs, content calendars, workflow lists, and strategies.</p>
        </div>
        <button onClick={() => setShowHistory(p => !p)} className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-all shadow-sm">
          <Clock size={16} /> History ({history.length})
        </button>
      </div>

      {/* Tool Selector Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResult(''); setPrompt(''); setSelectedCampaignId(''); }}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[140px] ${isActive ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className={`font-semibold text-xs ${isActive ? 'text-foreground' : 'text-foreground/90'}`}>{tool.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{tool.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentTool.color} flex items-center justify-center`}>
                  <currentTool.icon size={15} className="text-white" />
                </div>
                <h3 className="font-semibold text-foreground">{currentTool.label} Inputs</h3>
              </div>
            </div>

            {/* Smart Context Dropdown selector */}
            {campaigns.length > 0 && (
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Sparkles size={11} className="text-primary" /> Autofill Campaign Context
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={e => handleCampaignContextChange(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="" className="bg-card text-foreground">-- Choose active campaign --</option>
                  {campaigns.map(c => (
                    <option key={c.id} className="bg-card text-foreground" value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">Describe requirements</label>
              <textarea
                rows={8}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={currentTool.placeholder}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary transition-all resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full mt-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Querying Engine...</> : <><Zap size={16} /> Generate suggestions</>}
          </button>
        </div>

        {/* Output */}
        <div className="bg-card border border-border rounded-2xl p-6 relative flex flex-col justify-between min-h-[380px] shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Generated Strategy Output</h3>
              </div>
              {result && (
                <div className="flex gap-2">
                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted rounded-lg text-xs text-muted-foreground border border-border hover:text-foreground transition-all shadow-sm">
                    <Download size={12} /> PDF
                  </button>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted rounded-lg text-xs text-muted-foreground border border-border hover:text-foreground transition-all shadow-sm">
                    {copied ? <><Check size={12} className="text-emerald-600" /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-background border border-border rounded-xl p-5 overflow-y-auto max-h-[480px] min-h-[290px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center animate-pulse">
                    <Sparkles size={22} className="text-primary animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground animate-pulse">AI strategist building suggestions...</p>
                </div>
              ) : calendarParsedData ? (
                /* Beautiful structured content calendar weekly grid */
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkles size={12} className="text-primary" /> Structured Schedule Grid
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-semibold uppercase">
                          <th className="pb-2">Day</th>
                          <th className="pb-2">Platform</th>
                          <th className="pb-2">Format</th>
                          <th className="pb-2">Topic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calendarParsedData.map((item, idx) => (
                          <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/30">
                            <td className="py-2.5 font-bold text-foreground">{item.day}</td>
                            <td className="py-2.5 text-primary font-semibold">{item.platform}</td>
                            <td className="py-2.5 text-foreground/80 font-semibold">{item.format}</td>
                            <td className="py-2.5 text-foreground/75" title={item.description}>{item.topic}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : result ? (
                <div className="prose max-w-none">
                  {renderMarkdown(result)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-center opacity-50">
                  <Sparkles size={32} className="text-muted-foreground/60 animate-bounce" />
                  <p className="text-sm text-muted-foreground">Your AI-generated deliverables recommendations show here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="relative z-10 w-full max-w-md bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right shadow-2xl">
            <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">AI Query Archive</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No queries recorded.</p>
              ) : (
                history.map((chat) => {
                  const Icon = toolIcon[chat.tool] || Sparkles;
                  return (
                    <div key={chat.id} className="p-4 rounded-xl bg-background border border-border/80 hover:border-border transition-all group shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-muted text-foreground`}>
                            <Icon size={13} />
                          </div>
                          <span className="text-xs font-medium text-foreground capitalize">{chat.tool}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{new Date(chat.createdAt).toLocaleDateString()}</span>
                          <button onClick={() => handleDeleteHistory(chat.id)} className="p-1 hover:bg-red-50 rounded text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-2">{chat.prompt}</p>
                      <details className="text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">Show output</summary>
                        <pre className="mt-2 whitespace-pre-wrap font-sans bg-muted/50 p-2.5 rounded-lg border border-border/60 text-[11px] text-foreground/90">{chat.result}</pre>
                      </details>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
