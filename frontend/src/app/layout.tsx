'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import ActionToolbar from '../components/Layout/ActionToolbar';
import TopNavbar from '../components/Layout/TopNavbar';
import SuperAdminIndicator from '../components/SuperAdminIndicator';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show navbar on login or setup pages
  const hideNavbar = pathname === '/login' || pathname === '/setup';

  return (
    <html lang="en">
      <body>
        {!hideNavbar && <ActionToolbar />}
        {!hideNavbar && <TopNavbar />}
        <main>{children}</main>
        <SuperAdminIndicator />
      </body>
    </html>
  );
}
