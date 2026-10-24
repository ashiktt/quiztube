import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.fullName,
        isAdmin: authUser.isAdmin,
      },
    });
  } catch (err: any) {
    console.error('[Auth API] GET /me error:', err?.message || err);
    return NextResponse.json(
      { authenticated: false, error: getDatabaseErrorMessage(err) },
      { status: 500 }
    );
  }
}

// Update password or profile
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { newPassword, fullName } = body;

    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error('[Auth API] PATCH /me DB error:', dbErr?.message || dbErr);
      return NextResponse.json(
        { error: getDatabaseErrorMessage(dbErr) },
        { status: 503 }
      );
    }

    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (fullName && typeof fullName === 'string' && fullName.trim()) {
      user.name = fullName.trim().slice(0, 80);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.name,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err: any) {
    console.error('[Auth API] PATCH /me error:', err?.message || err);
    return NextResponse.json(
      { error: getDatabaseErrorMessage(err) },
      { status: 500 }
    );
  }
}

// Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Signed out' });
  response.cookies.delete('saberio_auth_token');
  return response;
}
