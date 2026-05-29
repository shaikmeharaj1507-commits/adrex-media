'use client';

import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';
import AuthGuard from '@/components/AuthGuard';
import TeamChat from '@/components/chat/TeamChat';
import { useSocketStore } from '@/store/socketStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    const token = localStorage.getItem('adrex_token');
    if (token) {
      connect(token);
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-adrex-aurora flex">
        <Sidebar />
        <div className="flex-1 ml-72 flex flex-col min-h-screen">
          <TopNav />
          <main className="flex-1 p-8 pt-6">
            {children}
          </main>
        </div>
      </div>
      <TeamChat />
    </AuthGuard>
  );
}
