'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeSwitcherProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function ThemeSwitcher({ size = 'md', showLabel = false, className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    // Render a placeholder that matches size to prevent layout shift
    const sz = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
    return <div className={`${sz} rounded-xl bg-muted animate-pulse ${className}`} />;
  }

  const isDark = theme !== 'ivory-luxe';
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 17;
  const btnSize = size === 'sm'
    ? 'h-7 px-2 text-xs'
    : size === 'lg'
    ? 'h-10 px-4 text-sm'
    : 'h-8 px-3 text-xs';

  return (
    <button
      id="theme-switcher-btn"
      onClick={() => setTheme(isDark ? 'ivory-luxe' : 'space-deep-black')}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`
        inline-flex items-center gap-1.5 rounded-xl font-medium transition-all
        border border-border hover:border-primary/40
        bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground
        ${btnSize} ${className}
      `}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
          transition={{ duration: 0.18 }}
          className="flex items-center"
        >
          {isDark
            ? <Sun size={iconSize} className="text-amber-400" />
            : <Moon size={iconSize} className="text-violet-500" />
          }
        </motion.span>
      </AnimatePresence>
      {showLabel && (
        <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
}
