'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { API_URL } from '@/lib/api';
import { CheckCircle, UploadCloud, User, Mail, Phone, MapPin, DollarSign, BarChart2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function OnboardingPage() {
  const params = useParams();
  const agencyId = params.agencyId as string;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    niche: '',
    location: '',
    pricing: '',
    audienceStats: ''
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/api/influencers/onboarding/${agencyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMsg(error.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glassmorphism p-8 rounded-3xl text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Application Submitted!</h2>
          <p className="text-zinc-400">
            Thank you for applying. We have received your details and will review them shortly. We will reach out to you if there is a good fit!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 py-12 md:p-12 relative overflow-hidden flex justify-center">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Creator Partner Program</h1>
          <p className="text-zinc-400 text-lg">Join our exclusive network of creators and access premium brand campaigns.</p>
        </div>

        <div className="glassmorphism rounded-3xl p-6 md:p-10 border border-white/5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-xl font-semibold flex items-center gap-2"><User size={20} className="text-purple-400"/> Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Full Name *</label>
                    <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="jane@example.com" />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-xl font-semibold flex items-center gap-2"><Phone size={20} className="text-blue-400"/> Contact Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Phone Number</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="+1 234 567 890" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">WhatsApp Number</label>
                    <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="+1 234 567 890" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-zinc-400 mb-1.5">Location (City, Country)</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-3.5 text-zinc-500" />
                      <input name="location" value={formData.location} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="Los Angeles, USA" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-xl font-semibold flex items-center gap-2"><UploadCloud size={20} className="text-pink-400"/> Social Profiles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Instagram Handle</label>
                    <input name="instagram" value={formData.instagram} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="@username" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">TikTok Handle</label>
                    <input name="tiktok" value={formData.tiktok} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="@username" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">YouTube Channel</label>
                    <input name="youtube" value={formData.youtube} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="Channel URL or Name" />
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="space-y-4 md:col-span-2">
                <h3 className="text-xl font-semibold flex items-center gap-2"><BarChart2 size={20} className="text-emerald-400"/> Professional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Content Niche</label>
                    <input name="niche" value={formData.niche} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="e.g. Tech, Fashion, Fitness" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Average Rates / Pricing</label>
                    <div className="relative">
                      <DollarSign size={18} className="absolute left-4 top-3.5 text-zinc-500" />
                      <input name="pricing" value={formData.pricing} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="e.g. $500 per Reel" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-zinc-400 mb-1.5">Audience Stats & Demographics</label>
                    <textarea name="audienceStats" value={formData.audienceStats} onChange={handleChange} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none" placeholder="Briefly describe your audience (e.g. 60% Female, Top countries: US, UK, Age 18-24)" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {status === 'loading' ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
