'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Determine the theme: cached theme in localStorage > database theme > default
    const savedTheme = localStorage.getItem('adrex-theme') || user?.theme || 'purple';
    
    const themes = ['theme-purple', 'theme-emerald', 'theme-ocean', 'theme-sunset', 'theme-plum'];
    const root = document.documentElement;
    
    // Clean up existing theme classes
    themes.forEach((t) => root.classList.remove(t));
    
    // Ensure dark utility classes work (since base design is dark)
    root.classList.add('dark');
    
    // Add active theme class
    root.classList.add(`theme-${savedTheme}`);
    
    // Keep localStorage in sync
    localStorage.setItem('adrex-theme', savedTheme);
  }, [user?.theme]);

  return <>{children}</>;
}
