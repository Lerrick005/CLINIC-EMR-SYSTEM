import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const userCookie = request.cookies.get('user')?.value;
  
  // Public routes (no auth required)
  const publicRoutes = ['/login', '/setup', '/forgot-password', '/reset-password'];
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Super Admin routes - check if user is SUPER_ADMIN
  if (request.nextUrl.pathname.startsWith('/super-admin')) {
    if (!userCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    try {
      const user = JSON.parse(userCookie);
      if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
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
