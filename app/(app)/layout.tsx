import type { ReactNode } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';

// Layout for the authenticated route group: the client guard protects every
// page inside it, and AppShell provides the shared nav chrome.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
