'use client';

import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AccessRestricted() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
        >
          <ShieldX size={40} className="text-red-400" />
        </motion.div>

        {/* Text */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white mb-3"
        >
          Access Restricted
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-zinc-400 text-sm leading-relaxed mb-8"
        >
          You don&apos;t have permission to view this resource. Only assigned team members, 
          influencers, and administrators can access this project or task.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-3"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-zinc-300 rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            Dashboard
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
