import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, decodeToken } from '@/lib/auth';

export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const session = req.cookies.get('admin_session');
  
  let adminId: string | null = null;
  if (session && verifyToken(session.value)) {
    const decoded = decodeToken(session.value);
    if (decoded && decoded.adminId) {
      adminId = decoded.adminId;
    }
  }

  // 1. Protect Admin pages
  if (pathname.startsWith('/admin')) {
    // Exclude the login page from protection to avoid redirect loop
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    if (!adminId) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Admin API endpoints
  if (pathname.startsWith('/api/quizzes') || pathname === '/api/auth/change-password') {
    const parts = pathname.split('/').filter(Boolean); // e.g. ["api", "quizzes", "ID", "responses"]
    let isProtected = false;

    if (pathname === '/api/auth/change-password') {
      isProtected = true;
    } else if (parts.length === 2) {
      // Path: /api/quizzes (GET list, POST create) -> Protected
      isProtected = true;
    } else if (parts.length === 3) {
      // Path: /api/quizzes/[id]
      if (req.method === 'DELETE') {
        isProtected = true;
      } else if (req.method === 'GET') {
        // Only allow student role to bypass
        const role = searchParams.get('role');
        if (role !== 'student') {
          isProtected = true;
        }
      }
    } else if (parts.length === 4 && parts[3] === 'responses') {
      // Path: /api/quizzes/[id]/responses -> Protected
      isProtected = true;
    }

    if (isProtected && !adminId) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Propagate the x-admin-id header downstream if authenticated
  if (adminId) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-admin-id', adminId);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// Configure path matching to avoid running on static assets
export const config = {
  matcher: ['/admin/:path*', '/api/quizzes/:path*', '/api/auth/change-password'],
};
