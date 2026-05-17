'use client';

import { API_URL } from '@/lib/api';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to verify email');
        
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="text-center">
      {status === 'loading' && (
        <div className="py-8">
          <Loader2 className="animate-spin text-purple-500 mx-auto mb-4" size={40} />
          <h2 className="text-xl font-bold text-white mb-2">Verifying your email...</h2>
          <p className="text-zinc-400 text-sm">Please wait while we confirm your account.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-8">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-green-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Email Verified!</h2>
          <p className="text-zinc-400 text-sm mb-8">Your account has been successfully verified.</p>
          <Link href="/login" className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-8 rounded-xl transition-colors">
            Continue to Login
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="py-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
          <p className="text-zinc-400 text-sm mb-8">{errorMsg}</p>
          <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium">
            Return to login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
        <div className="glassmorphism rounded-2xl p-8 shadow-2xl border border-white/10">
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-500" size={32}/></div>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
