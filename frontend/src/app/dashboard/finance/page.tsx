'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, TrendingUp, TrendingDown, Receipt, CreditCard, Trash2, Download } from 'lucide-react';

interface Invoice {
  id: string;
  clientId: string;
  client: { companyName: string };
  amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  dueDate: string;
  issuedDate: string;
}
interface Expense { id: string; category: string; amount: number; description?: string; date: string; }
interface Client { id: string; companyName: string; }

const statusColors: Record<string, string> = {
  DRAFT:   'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  SENT:    'text-blue-400 bg-blue-400/10 border-blue-400/20',
  PAID:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  OVERDUE: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export default function FinancePage() {
  const [tab, setTab] = useState<'invoices' | 'expenses'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [invoiceForm, setInvoiceForm] = useState({ clientId: '', amount: '', status: 'DRAFT', dueDate: '' });
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', date: '' });

  const getHeaders = () => {
    const token = localStorage.getItem('adrex_token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/finance/invoices`, { headers: getHeaders() }).then(r => r.json()),
      fetch(`${API_URL}/api/finance/expenses`, { headers: getHeaders() }).then(r => r.json()),
      fetch(`${API_URL}/api/clients`, { headers: getHeaders() }).then(r => r.json()),
    ]).then(([inv, exp, cls]) => {
      setInvoices(Array.isArray(inv) ? inv : []);
      setExpenses(Array.isArray(exp) ? exp : []);
      setClients(Array.isArray(cls) ? cls : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/finance/invoices`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(invoiceForm) });
    if (res.ok) { const d = await res.json(); setInvoices(p => [d, ...p]); setShowModal(false); setInvoiceForm({ clientId: '', amount: '', status: 'DRAFT', dueDate: '' }); }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/finance/expenses`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(expenseForm) });
    if (res.ok) { const d = await res.json(); setExpenses(p => [d, ...p]); setShowModal(false); setExpenseForm({ category: '', amount: '', description: '', date: '' }); }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Delete invoice?')) return;
    await fetch(`${API_URL}/api/finance/invoices/${id}`, { method: 'DELETE', headers: getHeaders() });
    setInvoices(p => p.filter(i => i.id !== id));
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete expense?')) return;
    await fetch(`${API_URL}/api/finance/expenses/${id}`, { method: 'DELETE', headers: getHeaders() });
    setExpenses(p => p.filter(e => e.id !== id));
  };

  const updateInvoiceStatus = async (id: string, status: string) => {
    const res = await fetch(`${API_URL}/api/finance/invoices/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }) });
    if (res.ok) { const d = await res.json(); setInvoices(p => p.map(i => i.id === id ? d : i)); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground mt-1">Manage invoices, expenses & profitability.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <Plus size={18} /> {tab === 'invoices' ? 'New Invoice' : 'Add Expense'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
          { label: 'Outstanding', value: `₹${outstanding.toLocaleString('en-IN')}`, icon: Receipt, color: 'text-amber-400', glow: 'shadow-amber-500/10' },
          { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, icon: TrendingDown, color: 'text-red-400', glow: 'shadow-red-500/10' },
          { label: 'Net Profit', value: `₹${profit.toLocaleString('en-IN')}`, icon: TrendingUp, color: profit >= 0 ? 'text-emerald-400' : 'text-red-400', glow: 'shadow-purple-500/10' },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`p-5 rounded-2xl glassmorphism flex items-center gap-4 shadow-lg ${k.glow}`}>
            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${k.color}`}><k.icon size={22} /></div>
            <div><p className="text-xs text-zinc-400">{k.label}</p><p className="text-xl font-bold text-white">{k.value}</p></div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['invoices', 'expenses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-primary text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-white/5 text-zinc-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      {tab === 'invoices' && (
        <motion.div className="glassmorphism rounded-2xl overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Client</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Amount</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Status</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Due Date</th>
              <th className="px-6 py-4"></th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="px-6 py-10 text-center text-zinc-500 animate-pulse">Loading...</td></tr>
               : invoices.length === 0 ? <tr><td colSpan={5} className="px-6 py-16 text-center text-zinc-600">No invoices yet. Create your first one!</td></tr>
               : invoices.map(inv => (
                <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 group transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{inv.client?.companyName}</td>
                  <td className="px-6 py-4 text-emerald-400 font-semibold">₹{inv.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <select value={inv.status} onChange={e => updateInvoiceStatus(inv.id, e.target.value)} className={`px-2.5 py-1 rounded-full text-xs font-semibold border bg-transparent cursor-pointer ${statusColors[inv.status]}`}>
                      {['DRAFT','SENT','PAID','OVERDUE'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-xs">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => window.open(`${API_URL}/api/pdf/invoice/${inv.id}`, '_blank')} className="p-2 rounded-lg text-zinc-600 hover:bg-blue-500/10 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all mr-1"><Download size={16} /></button>
                    <button onClick={() => deleteInvoice(inv.id)} className="p-2 rounded-lg text-zinc-600 hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Expenses Table */}
      {tab === 'expenses' && (
        <motion.div className="glassmorphism rounded-2xl overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Category</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Amount</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Description</th>
              <th className="text-left px-6 py-4 text-zinc-400 font-medium">Date</th>
              <th className="px-6 py-4"></th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="px-6 py-10 text-center text-zinc-500 animate-pulse">Loading...</td></tr>
               : expenses.length === 0 ? <tr><td colSpan={5} className="px-6 py-16 text-center text-zinc-600">No expenses tracked yet.</td></tr>
               : expenses.map(exp => (
                <tr key={exp.id} className="border-b border-white/5 hover:bg-white/5 group transition-colors">
                  <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">{exp.category}</span></td>
                  <td className="px-6 py-4 text-red-400 font-semibold">-₹{exp.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-zinc-400 text-xs">{exp.description || '—'}</td>
                  <td className="px-6 py-4 text-zinc-400 text-xs">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => deleteExpense(exp.id)} className="p-2 rounded-lg text-zinc-600 hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div className="relative z-10 w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">{tab === 'invoices' ? 'New Invoice' : 'Add Expense'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400"><X size={18} /></button>
              </div>

              {tab === 'invoices' ? (
                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Client*</label>
                    <select required value={invoiceForm.clientId} onChange={e => setInvoiceForm(p => ({...p, clientId: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50">
                      <option value="">Select client...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select></div>
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Amount (₹)*</label>
                    <input type="number" required value={invoiceForm.amount} onChange={e => setInvoiceForm(p => ({...p, amount: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs text-zinc-400 mb-1.5">Status</label>
                      <select value={invoiceForm.status} onChange={e => setInvoiceForm(p => ({...p, status: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50">
                        {['DRAFT','SENT','PAID','OVERDUE'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select></div>
                    <div><label className="block text-xs text-zinc-400 mb-1.5">Due Date*</label>
                      <input type="date" required value={invoiceForm.dueDate} onChange={e => setInvoiceForm(p => ({...p, dueDate: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" /></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-zinc-400">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90">Create Invoice</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateExpense} className="space-y-4">
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Category*</label>
                    <select required value={expenseForm.category} onChange={e => setExpenseForm(p => ({...p, category: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50">
                      <option value="">Select category...</option>
                      {['Influencer Payout','Advertising','Software','Salaries','Office','Travel','Marketing','Other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select></div>
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Amount (₹)*</label>
                    <input type="number" required value={expenseForm.amount} onChange={e => setExpenseForm(p => ({...p, amount: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" /></div>
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Description</label>
                    <input value={expenseForm.description} onChange={e => setExpenseForm(p => ({...p, description: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" /></div>
                  <div><label className="block text-xs text-zinc-400 mb-1.5">Date</label>
                    <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({...p, date: e.target.value}))} className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" /></div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-zinc-400">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90">Add Expense</button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
