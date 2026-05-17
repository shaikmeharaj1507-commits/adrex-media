'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface CalEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: string;
  color: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);
  
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'meeting', color: 'bg-blue-500/80' });

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch('http://localhost:5000/api/calendar', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch('http://localhost:5000/api/calendar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEvent)
      });
      
      if (res.ok) {
        const created = await res.json();
        setEvents(prev => [...prev, created]);
        setNewEvent({ title: '', date: '', type: 'meeting', color: 'bg-blue-500/80' });
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to create event', error);
    }
  };

  const daysInMonth = getDaysInMonth(current.year, current.month);
  const firstDay = getFirstDayOfMonth(current.year, current.month);

  const prev = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  const getEventsForDay = (day: number) => {
    const dateStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const selectedDate = selected;
  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

  const upcomingEvents = events
    .filter(e => e.date >= today.toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">View campaigns, deadlines, and meetings at a glance.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
        >
          <Plus size={18} /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar */}
        <motion.div className="lg:col-span-2 glassmorphism rounded-2xl p-6"
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          {/* Month Nav */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{MONTHS[current.month]} {current.year}</h2>
            <div className="flex items-center gap-2">
              <button onClick={prev} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrent({ year: today.getFullYear(), month: today.getMonth() })}
                className="px-3 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all font-medium">
                Today
              </button>
              <button onClick={next} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first day offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 rounded-lg" />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = getEventsForDay(day);
              const isToday = day === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();
              const isSelected = dateStr === selected;

              return (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelected(isSelected ? null : dateStr)}
                  className={`h-20 rounded-lg p-1.5 cursor-pointer transition-all border ${
                    isSelected ? 'border-primary/60 bg-primary/10' :
                    isToday ? 'border-primary/30 bg-primary/5' :
                    'border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    isToday ? 'bg-primary text-white' : 'text-muted-foreground'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} className={`text-[9px] px-1 py-0.5 rounded truncate text-white font-medium ${ev.color}`}>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Selected Day Events */}
          {selected && (
            <motion.div className="mt-4 pt-4 border-t border-border/50"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Events on {selected}</h3>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(ev => (
                    <div key={ev.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${ev.color.replace('/80', '/15')} bg-white/5`}>
                      <div className={`w-2 h-2 rounded-full ${ev.color}`} />
                      <span className="text-sm font-medium">{ev.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground capitalize">{ev.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Upcoming Sidebar */}
        <motion.div className="glassmorphism rounded-2xl p-6 flex flex-col"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-lg font-bold mb-1">Upcoming</h3>
          <p className="text-sm text-muted-foreground mb-5">Next events across all campaigns</p>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { label: 'Launch', color: 'bg-purple-500' },
              { label: 'Campaign', color: 'bg-emerald-500' },
              { label: 'Meeting', color: 'bg-blue-500' },
              { label: 'Deadline', color: 'bg-red-500' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>

          <div className="space-y-3 flex-1">
            {loading ? (
              <div className="text-sm text-muted-foreground animate-pulse">Loading events...</div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-sm text-muted-foreground">No upcoming events.</div>
            ) : upcomingEvents.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-all">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.color}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ev.date}</p>
                </div>
                <span className="text-[10px] capitalize text-muted-foreground shrink-0">{ev.type}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div className="relative z-10 w-full max-w-md glassmorphism rounded-2xl p-8"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">New Event</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>
              <form className="space-y-4" onSubmit={handleCreate}>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Event Title</label>
                  <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                    type="text" placeholder="e.g. Summer Kickoff" required
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date</label>
                  <input value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
                    type="date" required
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Type</label>
                    <select value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
                      <option value="meeting">Meeting</option>
                      <option value="campaign">Campaign</option>
                      <option value="launch">Launch</option>
                      <option value="deadline">Deadline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Color</label>
                    <select value={newEvent.color} onChange={e => setNewEvent(p => ({ ...p, color: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
                      <option value="bg-blue-500/80">Blue</option>
                      <option value="bg-emerald-500/80">Green</option>
                      <option value="bg-purple-500/80">Purple</option>
                      <option value="bg-red-500/80">Red</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] mt-4">
                  Add Event
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
