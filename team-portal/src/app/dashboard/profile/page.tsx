'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Check, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    bio: '',
    phone: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.user.getProfile().then(data => {
      if (data && !data.error) {
        setProfile(p => ({
          ...p,
          firstName: data.firstName ?? p.firstName,
          lastName: data.lastName ?? p.lastName,
          email: data.email ?? p.email,
          bio: data.bio ?? '',
          phone: data.phone ?? '',
        }));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      const res = await api.user.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        phone: profile.phone,
      });
      if (res && !res.error) {
        setUser(res);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (error) {
      console.error('Failed to save profile', error);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glassmorphism rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
              {profile.firstName[0]?.toUpperCase() ?? 'U'}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-zinc-800 border border-white/15 rounded-lg flex items-center justify-center hover:bg-zinc-700 transition-all">
              <Camera size={13} className="text-zinc-300" />
            </button>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{profile.firstName} {profile.lastName}</p>
            <p className="text-sm text-zinc-500">{profile.email}</p>
            <span className="text-xs mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 capitalize">
              {user?.role?.replace(/_/g, ' ').toLowerCase() ?? 'Team Member'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">First Name</label>
            <input value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Last Name</label>
            <input value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
            <input value={profile.email} disabled
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Phone</label>
            <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Bio</label>
          <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3}
            placeholder="Tell us about yourself..."
            className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all resize-none" />
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${saved
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
            }`}>
            {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
