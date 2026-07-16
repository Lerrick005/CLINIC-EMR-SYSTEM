'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Routes that don't require authentication
  const publicRoutes = ['/login', '/setup'];

  // Routes that only clinic admin can access
  const adminRoutes = ['/admin'];

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const currentPath = pathname || '';
    const isPublicRoute = publicRoutes.includes(currentPath);
    const isAdminRoute = adminRoutes.some(route => currentPath.startsWith(route));

    if (!token && !isPublicRoute) {
      router.push('/login');
      return;
    }

    if (token && isPublicRoute) {
      router.push('/dashboard');
      return;
    }

    // Check role for admin routes
    if (isAdminRoute && token) {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role !== 'CLINIC_ADMIN' && user.role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
            return;
          }
        }
      } catch (e) {
        router.push('/dashboard');
        return;
      }
    }

    setIsAuthorized(true);
  }, [pathname, router]);

  if (isAuthorized === null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1A1A1A',
        color: '#FFD700'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}