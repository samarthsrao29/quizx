import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, logout } = body;
    const cookieStore = await cookies();

    // If logout action is requested, clear the cookie
    if (logout) {
      cookieStore.delete('admin_session');
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    }

    // Validate the password
    if (password === 'SAM29@') {
      const secureToken = generateToken();
      
      cookieStore.set('admin_session', secureToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
