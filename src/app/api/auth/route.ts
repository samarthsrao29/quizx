import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateToken } from '@/lib/auth';
import { getAdminUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, logout } = body;
    const cookieStore = await cookies();

    // If logout action is requested, clear the cookie
    if (logout) {
      cookieStore.delete('admin_session');
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    }

    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    // Validate the credentials against database
    const admin = await getAdminUser(username.trim());
    if (admin && admin.passwordHash === password) {
      const secureToken = generateToken(admin.username);
      
      cookieStore.set('admin_session', secureToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return NextResponse.json({ success: true, username: admin.username });
    }

    return NextResponse.json({ success: false, error: 'Incorrect username or password' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (session) {
      const { decodeToken } = await import('@/lib/auth');
      const decoded = decodeToken(session.value);
      if (decoded && decoded.adminId) {
        return NextResponse.json({ success: true, username: decoded.adminId });
      }
    }
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
