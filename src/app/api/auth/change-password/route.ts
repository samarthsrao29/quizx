import { NextRequest, NextResponse } from 'next/server';
import { updateAdminPassword } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const adminId = req.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || !newPassword.trim()) {
      return NextResponse.json({ success: false, error: 'New password is required' }, { status: 400 });
    }

    const success = await updateAdminPassword(adminId, newPassword.trim());
    if (success) {
      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to update password' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
