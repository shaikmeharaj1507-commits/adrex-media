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
  DRAFT:   'text-zinc-600 bg-zinc-100 border-zinc-200',
  SENT:    'text-blue-600 bg-blue-100 border-blue-200',
  PAID:    'text-emerald-600 bg-emerald-100 border-emerald-200',
  OVERDUE: 'text-red-600 bg-red-100 border-red-200',
};

export default function FinancePage() {
  const [tab, setTab] = useState<'invoices' | 'expenses'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [invoiceForm, setInvoiceForm] = useState({ clientId: '', amount: '', status: 'DRAFT', dueDate: '', description: '' });
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '', date: '' });
  const [submitting, setSubmitting] = useState(false);

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
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/finance/invoices`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(invoiceForm) });
      if (res.ok) { const d = await res.json(); setInvoices(p => [d, ...p]); setShowModal(false); setInvoiceForm({ clientId: '', amount: '', status: 'DRAFT', dueDate: '', description: '' }); }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/finance/expenses`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(expenseForm) });
      if (res.ok) { const d = await res.json(); setExpenses(p => [d, ...p]); setShowModal(false); setExpenseForm({ category: '', amount: '', description: '', date: '' }); }
    } finally {
      setSubmitting(false);
    }
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

  const getPdfUrl = (path: string) => {
    const token = localStorage.getItem('adrex_token');
    return `${API_URL}${path}?token=${token}`;
  };

  const handleExportCSV = () => {
    if (tab === 'invoices') {
      const headers = ['Client', 'Amount', 'Status', 'Due Date'];
      const rows = invoices.map(i => [
        `"${(i.client?.companyName || '').replace(/"/g, '""')}"`,
        i.amount,
        i.status,
        new Date(i.dueDate).toLocaleDateString()
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `adrex-invoices-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Category', 'Amount', 'Description', 'Date'];
      const rows = expenses.map(e => [
        `"${e.category.replace(/"/g, '""')}"`,
        e.amount,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        new Date(e.date).toLocaleDateString()
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `adrex-expenses-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border hover:bg-muted text-foreground rounded-xl font-semibold transition-all shadow-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:opacity-95 transition-all shadow-sm">
            <Plus size={18} /> {tab === 'invoices' ? 'New Invoice' : 'Add Expense'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', glow: 'shadow-sm' },
          { label: 'Outstanding', value: `₹${outstanding.toLocaleString('en-IN')}`, icon: Receipt, color: 'text-amber-600 bg-amber-50 border-amber-200', glow: 'shadow-sm' },
          { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, icon: TrendingDown, color: 'text-red-600 bg-red-50 border-red-200', glow: 'shadow-sm' },
          { label: 'Net Profit', value: `₹${profit.toLocaleString('en-IN')}`, icon: TrendingUp, color: profit >= 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200', glow: 'shadow-sm' },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`p-4 sm:p-5 rounded-2xl bg-card border border-border flex items-center gap-3 sm:gap-4 ${k.glow} min-w-0`}>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border border-border/20 ${k.color}`}>
              <k.icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">{k.label}</p>
              <p className="text-base sm:text-xl font-bold text-foreground truncate" title={k.value}>{k.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['invoices', 'expenses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      {tab === 'invoices' && (
        <motion.div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/40">
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Client</th>
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Amount</th>
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Status</th>
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Due Date</th>
              <th className="px-6 py-4"></th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground animate-pulse">Loading...</td></tr>
               : invoices.length === 0 ? <tr><td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">No invoices yet. Create your first one!</td></tr>
               : invoices.map(inv => (
                <tr key={inv.id} className="border-b border-border hover:bg-muted/30 group transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{inv.client?.companyName}</td>
                  <td className="px-6 py-4 text-emerald-600 font-semibold">₹{inv.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4">
                    <select value={inv.status} onChange={e => updateInvoiceStatus(inv.id, e.target.value)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer bg-card ${statusColors[inv.status]}`}>
                      {['DRAFT','SENT','PAID','OVERDUE'].map(s => <option key={s} className="bg-card text-foreground" value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => window.open(getPdfUrl(`/api/pdf/invoice/${inv.id}`), '_blank')} className="p-2 rounded-lg text-muted-foreground hover:bg-blue-50 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all mr-1"><Download size={16} /></button>
                    <button onClick={() => deleteInvoice(inv.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Expenses Table */}
      {tab === 'expenses' && (
        <motion.div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/40">
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Category</th>
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Amount</th>
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Description</th>
              <th className="text-left px-6 py-4 text-muted-foreground font-semibold">Date</th>
              <th className="px-6 py-4"></th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground animate-pulse">Loading...</td></tr>
               : expenses.length === 0 ? <tr><td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">No expenses tracked yet.</td></tr>
               : expenses.map(exp => (
                <tr key={exp.id} className="border-b border-border hover:bg-muted/30 group transition-colors">
                  <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-600 text-xs font-semibold">{exp.category}</span></td>
                  <td className="px-6 py-4 text-red-600 font-semibold">-₹{exp.amount.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{exp.description || '—'}</td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => deleteExpense(exp.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button></td>
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowModal(false); setSubmitting(false); }} />
            <motion.div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl p-6" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">{tab === 'invoices' ? 'New Invoice' : 'Add Expense'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground"><X size={18} /></button>
              </div>

              {tab === 'invoices' ? (
                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Client*</label>
                    <select required value={invoiceForm.clientId} onChange={e => setInvoiceForm(p => ({...p, clientId: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                      <option value="" className="bg-card text-foreground">Select client...</option>
                      {clients.map(c => <option key={c.id} className="bg-card text-foreground" value={c.id}>{c.companyName}</option>)}
                    </select></div>
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Amount (₹)*</label>
                    <input type="number" required value={invoiceForm.amount} onChange={e => setInvoiceForm(p => ({...p, amount: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Purpose / Description</label>
                    <input type="text" placeholder="e.g. Influencer Marketing Services" value={invoiceForm.description} onChange={e => setInvoiceForm(p => ({...p, description: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs text-muted-foreground mb-1.5">Status</label>
                      <select value={invoiceForm.status} onChange={e => setInvoiceForm(p => ({...p, status: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                        {['DRAFT','SENT','PAID','OVERDUE'].map(s => <option key={s} className="bg-card text-foreground" value={s}>{s}</option>)}
                      </select></div>
                    <div><label className="block text-xs text-muted-foreground mb-1.5">Due Date*</label>
                      <input type="date" required value={invoiceForm.dueDate} onChange={e => setInvoiceForm(p => ({...p, dueDate: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? 'Creating...' : 'Create Invoice'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateExpense} className="space-y-4">
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Category*</label>
                    <select required value={expenseForm.category} onChange={e => setExpenseForm(p => ({...p, category: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary">
                      <option value="" className="bg-card text-foreground">Select category...</option>
                      {['Influencer Payout','Advertising','Software','Salaries','Office','Travel','Marketing','Other'].map(c => <option key={c} className="bg-card text-foreground" value={c}>{c}</option>)}
                    </select></div>
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Amount (₹)*</label>
                    <input type="number" required value={expenseForm.amount} onChange={e => setExpenseForm(p => ({...p, amount: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Description</label>
                    <input value={expenseForm.description} onChange={e => setExpenseForm(p => ({...p, description: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1.5">Date</label>
                    <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({...p, date: e.target.value}))} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" /></div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? 'Adding...' : 'Add Expense'}
                    </button>
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
