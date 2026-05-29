'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Building2, CreditCard, Bell, Shield,
  Save, Camera, Check, ChevronRight, Settings, Upload, Loader2
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useSearchParams } from 'next/navigation';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'agency', label: 'Agency', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${saved
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          : 'bg-primary text-white hover:opacity-95 shadow-sm'
        }`}
    >
      {saved ? <Check size={16} /> : <Save size={16} />}
      {saved ? 'Saved!' : 'Save Changes'}
    </button>
  );
}

function InputField({ label, value, onChange, type = 'text', disabled = false }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`shrink-0 w-11 h-6 rounded-full transition-all relative ${value ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full transition-all border border-border/20 shadow-sm ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function SettingsContent() {
  const { user, setUser } = useAuthStore();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(tabParam);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    role: user?.role ?? '',
    bio: user?.bio ?? '',
    phone: user?.phone ?? '',
  });

  const [agency, setAgency] = useState({
    name: 'Adrex Media Agency',
    website: '',
    industry: '',
    teamSize: '10-50',
    country: '',
  });

  const [notifs, setNotifs] = useState({
    emailCampaigns: true,
    emailTasks: true,
    emailInfluencers: false,
    browserAlerts: true,
    weeklyDigest: true,
  });
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [agencyLogoUrl, setAgencyLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      if (activeTab === 'profile') {
        const res = await fetch(`${API_URL}/api/user/profile`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ firstName: profile.firstName, lastName: profile.lastName, bio: profile.bio, phone: profile.phone })
        });
        if (res.ok) {
          const updatedUser = await res.json();
          setUser(updatedUser);
        }
      } else if (activeTab === 'agency') {
        await fetch(`${API_URL}/api/agency`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(agency)
        });
      } else if (activeTab === 'notifications') {
        setLoadingNotifs(true);
        await fetch(`${API_URL}/api/notifications/preferences`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            emailCampaigns: notifs.emailCampaigns,
            emailTasks: notifs.emailTasks,
            emailInfluencers: notifs.emailInfluencers,
            browserAlerts: notifs.browserAlerts,
            weeklyDigest: notifs.weeklyDigest,
          })
        });
        setLoadingNotifs(false);
      } else if (activeTab === 'security') {
        if (!passwords.current || !passwords.newPass || !passwords.confirm) {
          alert('Please fill out all password fields');
          return;
        }
        if (passwords.newPass !== passwords.confirm) {
          alert('New passwords do not match');
          return;
        }
        const res = await fetch(`${API_URL}/api/auth/change-password`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass })
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Failed to change password');
          return;
        }
        setPasswords({ current: '', newPass: '', confirm: '' });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setAvatarUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/user/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatarUrl);
        setUser({ ...user!, avatar: data.avatarUrl });
      }
    } catch (error) {
      console.error('Avatar upload failed', error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setLogoUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/agency/logo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setAgencyLogoUrl(data.logoUrl);
      }
    } catch (error) {
      console.error('Logo upload failed', error);
    } finally {
      setLogoUploading(false);
    }
  };

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  // Sync profile and fetch agency
  useEffect(() => {
    const fetchAgency = async () => {
      try {
        const token = localStorage.getItem('adrex_token');
        const res = await fetch(`${API_URL}/api/agency`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAgency(prev => ({
            ...prev,
            name: data.name || prev.name,
            website: data.website || '',
            industry: data.industry || '',
            teamSize: data.teamSize || '10-50',
            country: data.country || ''
          }));
          if (data.logo) setAgencyLogoUrl(data.logo);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifPrefs = async () => {
      try {
        const token = localStorage.getItem('adrex_token');
        const res = await fetch(`${API_URL}/api/notifications/preferences`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const prefs = await res.json();
          setNotifs({
            emailCampaigns: prefs.emailCampaigns ?? true,
            emailTasks: prefs.emailTasks ?? true,
            emailInfluencers: prefs.emailInfluencers ?? false,
            browserAlerts: prefs.browserAlerts ?? true,
            weeklyDigest: prefs.weeklyDigest ?? true,
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchAgency();
    fetchNotifPrefs();
  }, []);

  useEffect(() => {
    if (user?.avatar) setAvatarUrl(user.avatar);
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfile(p => ({
        ...p,
        firstName: user.firstName ?? p.firstName,
        lastName: user.lastName ?? p.lastName,
        email: user.email ?? p.email,
        role: user.role ?? p.role,
        bio: user.bio ?? p.bio,
        phone: user.phone ?? p.phone,
      }));
    }
  }, [user]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Nav */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border rounded-2xl p-3 h-fit shadow-sm">
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={active ? 'text-primary' : 'text-muted-foreground'} />
                  {tab.label}
                </div>
                <ChevronRight size={14} className={active ? 'text-primary' : 'text-muted-foreground/60'} />
              </button>
            );
          })}
        </nav>
      </motion.div>
 
      {/* Content Panel */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="lg:col-span-3 bg-card border border-border rounded-2xl p-8 space-y-8 shadow-sm"
      >
        {/* PROFILE */}
        {activeTab === 'profile' && (
          <>
            <div>
              <h2 className="text-xl font-bold mb-1 text-foreground">Profile Information</h2>
              <p className="text-sm text-muted-foreground">Update your personal details.</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
                    {profile.firstName[0]?.toUpperCase() ?? 'D'}
                  </div>
                )}
                <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} className="absolute -bottom-1 -right-1 w-7 h-7 bg-muted border border-border rounded-lg flex items-center justify-center hover:bg-muted/80 transition-all disabled:opacity-50 text-foreground">
                  {avatarUploading ? <Loader2 size={13} className="text-foreground animate-spin" /> : <Camera size={13} className="text-foreground" />}
                </button>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{profile.firstName} {profile.lastName}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <span className="text-xs mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  {profile.role || 'Super Admin'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="First Name" value={profile.firstName} onChange={v => setProfile(p => ({ ...p, firstName: v }))} />
              <InputField label="Last Name" value={profile.lastName} onChange={v => setProfile(p => ({ ...p, lastName: v }))} />
              <InputField label="Email Address" value={profile.email} type="email" onChange={v => setProfile(p => ({ ...p, email: v }))} />
              <InputField label="Phone Number" value={profile.phone} onChange={v => setProfile(p => ({ ...p, phone: v }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Bio</label>
              <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3}
                placeholder="Tell us a little about yourself..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-all resize-none" />
            </div>
            <div className="flex justify-end"><SaveButton onClick={handleSave} saved={saved} /></div>
          </>
        )}

        {/* AGENCY */}
        {activeTab === 'agency' && (
          <>
            <div>
              <h2 className="text-xl font-bold mb-1 text-foreground">Agency Settings</h2>
              <p className="text-sm text-muted-foreground">Configure your agency-level preferences.</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="relative">
                {agencyLogoUrl ? (
                  <img src={agencyLogoUrl} alt="Agency Logo" className="w-20 h-20 rounded-2xl object-cover border border-border" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center">
                    <Building2 size={32} className="text-muted-foreground" />
                  </div>
                )}
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={logoUploading} className="absolute -bottom-1 -right-1 w-7 h-7 bg-muted border border-border rounded-lg flex items-center justify-center hover:bg-muted/80 transition-all disabled:opacity-50 text-foreground">
                  {logoUploading ? <Loader2 size={13} className="text-foreground animate-spin" /> : <Upload size={13} className="text-foreground" />}
                </button>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Agency Logo</p>
                <p className="text-xs text-muted-foreground">PNG or JPG, max 2MB</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Agency Name" value={agency.name} onChange={v => setAgency(p => ({ ...p, name: v }))} />
              <InputField label="Website" value={agency.website} onChange={v => setAgency(p => ({ ...p, website: v }))} />
              <InputField label="Industry" value={agency.industry} onChange={v => setAgency(p => ({ ...p, industry: v }))} />
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Team Size</label>
                <select value={agency.teamSize} onChange={e => setAgency(p => ({ ...p, teamSize: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-all">
                  {['1-10', '10-50', '50-100', '100-500', '500+'].map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
              <InputField label="Country" value={agency.country} onChange={v => setAgency(p => ({ ...p, country: v }))} />
            </div>
            <div className="flex justify-end"><SaveButton onClick={handleSave} saved={saved} /></div>
          </>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <>
            <div>
              <h2 className="text-xl font-bold mb-1 text-foreground">Notifications</h2>
              <p className="text-sm text-muted-foreground">Choose what you hear about.</p>
            </div>
            <div className="space-y-5">
              <div className="pb-3 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Email Notifications</p>
                <div className="space-y-4">
                  <ToggleRow label="Campaign Updates" desc="Get notified when campaign status changes." value={notifs.emailCampaigns} onChange={v => setNotifs(p => ({ ...p, emailCampaigns: v }))} />
                  <ToggleRow label="Task Reminders" desc="Receive email reminders for overdue tasks." value={notifs.emailTasks} onChange={v => setNotifs(p => ({ ...p, emailTasks: v }))} />
                  <ToggleRow label="Influencer Requests" desc="Get alerts for new influencer collaborations." value={notifs.emailInfluencers} onChange={v => setNotifs(p => ({ ...p, emailInfluencers: v }))} />
                  <ToggleRow label="Weekly Digest" desc="A summary of your agency's performance each Monday." value={notifs.weeklyDigest} onChange={v => setNotifs(p => ({ ...p, weeklyDigest: v }))} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Browser Notifications</p>
                <ToggleRow label="Real-time Alerts" desc="Get instant browser notifications for critical events." value={notifs.browserAlerts} onChange={v => setNotifs(p => ({ ...p, browserAlerts: v }))} />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={loadingNotifs}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${saved
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-primary text-white hover:opacity-95 shadow-sm disabled:opacity-50'
                }`}
              >
                {loadingNotifs ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
                {loadingNotifs ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </>
        )}

        {/* SECURITY */}
        {activeTab === 'security' && (
          <>
            <div>
              <h2 className="text-xl font-bold mb-1 text-foreground">Security</h2>
              <p className="text-sm text-muted-foreground">Manage your password and account access.</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-sm text-emerald-600 font-semibold">✓ Account Secured</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your account is protected with JWT authentication.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
              <InputField label="Current Password" value={passwords.current} onChange={v => setPasswords(p => ({ ...p, current: v }))} type="password" />
              <InputField label="New Password" value={passwords.newPass} onChange={v => setPasswords(p => ({ ...p, newPass: v }))} type="password" />
              <InputField label="Confirm New Password" value={passwords.confirm} onChange={v => setPasswords(p => ({ ...p, confirm: v }))} type="password" />
            </div>
            <div className="flex justify-end"><SaveButton onClick={handleSave} saved={saved} /></div>
          </>
        )}        {/* BILLING */}
        {activeTab === 'billing' && (
          <>
            <div>
              <h2 className="text-xl font-bold mb-1 text-foreground">Billing & Subscription</h2>
              <p className="text-sm text-muted-foreground">Manage your plan and payment methods.</p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">Current Plan</span>
                  <h3 className="text-2xl font-bold text-foreground mt-1">Pro Agency</h3>
                  <p className="text-sm text-muted-foreground mt-1">₹12,375 / month · Billed annually</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-25">Active</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[{ label: 'Campaigns', value: 'Unlimited' }, { label: 'Influencers', value: 'Unlimited' }, { label: 'Team Members', value: '25' }].map(f => (
                  <div key={f.label} className="p-3 rounded-xl bg-muted/65 border border-border/50">
                    <p className="text-sm font-bold text-foreground">{f.value}</p>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-primary text-white hover:opacity-90 transition-all shadow-sm">Upgrade Plan</button>
              <button className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-card border border-border text-foreground hover:bg-muted transition-all">Manage Billing</button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
 
// Main export wraps the inner component in Suspense (required for useSearchParams in Next.js 15)
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, agency, and preferences.</p>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      }>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
