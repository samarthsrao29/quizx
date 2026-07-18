import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1. Protect Admin pages
  if (pathname.startsWith('/admin')) {
    // Exclude the login page from protection to avoid redirect loop
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const session = req.cookies.get('admin_session');
    if (!session || !verifyToken(session.value)) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Admin API endpoints
  if (pathname.startsWith('/api/quizzes')) {
    const parts = pathname.split('/').filter(Boolean); // e.g. ["api", "quizzes", "ID", "responses"]
    let isProtected = false;

    if (parts.length === 2) {
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

    if (isProtected) {
      const session = req.cookies.get('admin_session');
      if (!session || !verifyToken(session.value)) {
        return new NextResponse(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  return NextResponse.next();
}

// Configure path matching to avoid running on static assets
export const config = {
  matcher: ['/admin/:path*', '/api/quizzes/:path*'],
};
