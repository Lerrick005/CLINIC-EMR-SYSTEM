import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  
  // Public routes (no auth required)
  const publicRoutes = ['/login', '/setup', '/forgot-password', '/reset-password', '/auth'];
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // All other routes - check if authenticated
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/dashboard/:path*',
    '/patients/:path*',
    '/admin/:path*',
    '/pharmacy/:path*',
    '/consultations/:path*',
    '/staff/:path*',
    '/lab/:path*',
    '/referrals/:path*',
  ],
};
