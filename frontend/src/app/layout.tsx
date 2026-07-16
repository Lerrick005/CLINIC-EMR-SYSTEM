'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import ActionToolbar from '../components/Layout/ActionToolbar';
import TopNavbar from '../components/Layout/TopNavbar';
import SuperAdminIndicator from '../components/SuperAdminIndicator';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const publicPages = ['/login', '/setup', '/terms', '/privacy', '/refund', '/forgot-password', '/reset-password', '/auth/success'];
  const hideNavbar = pathname ? publicPages.some(page => pathname.startsWith(page)) : false;

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