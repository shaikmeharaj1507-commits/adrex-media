'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);
  const _hasHydrated = useAuthStore(s => s._hasHydrated);

  useEffect(() => {
    if (_hasHydrated) {
      if (!isAuthenticated) {
        if (pathname?.startsWith('/influencer')) {
          if (pathname !== '/influencer/login') {
            router.replace('/influencer/login');
          }
        } else {
          if (pathname !== '/login' && pathname !== '/signup') {
            router.replace('/login');
          }
        }
      } else if (user) {
        if (user.role === 'INFLUENCER') {
          if (!pathname?.startsWith('/influencer')) {
            router.replace('/influencer/dashboard');
          }
        } else {
          if (pathname?.startsWith('/influencer') && pathname !== '/influencer/login') {
            router.replace('/dashboard');
          }
        }
      }
    }
  }, [_hasHydrated, isAuthenticated, user, pathname, router]);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user) {
    if (user.role === 'INFLUENCER' && !pathname?.startsWith('/influencer')) {
      return null;
    }
    if (user.role !== 'INFLUENCER' && pathname?.startsWith('/influencer') && pathname !== '/influencer/login') {
      return null;
    }
  }

  return <>{children}</>;
}

