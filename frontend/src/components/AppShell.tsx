'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Don't show shell on login page
  const isLoginPage = pathname === '/login';

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--color-bg-primary)',
      }}>
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <TopNav />
      <div className="main-layout">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShellInner>{children}</AppShellInner>
      </ToastProvider>
    </AuthProvider>
  );
}
