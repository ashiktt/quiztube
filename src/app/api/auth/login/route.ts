import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import { isUserAdmin } from '@/config/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error('[Auth API] Login DB connection failure:', dbErr?.message || dbErr);
      return NextResponse.json(
        { success: false, error: getDatabaseErrorMessage(dbErr) },
        { status: 503 }
      );
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Incorrect email or password.' },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'This account was registered via Google. Please sign in with Google.' },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Incorrect email or password.' },
        { status: 401 }
      );
    }

    // Refresh admin status if email is in admin config
    const isAdmin = user.isAdmin || isUserAdmin(normalizedEmail);
    if (isAdmin !== user.isAdmin) {
      user.isAdmin = isAdmin;
      await user.save();
    }

    const studentUser = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.name,
      avatarUrl: user.avatarUrl || '',
      isAdmin,
    };

    const token = signToken({
      userId: studentUser.id,
      email: studentUser.email,
      fullName: studentUser.fullName,
      isAdmin: studentUser.isAdmin,
    });

    const response = NextResponse.json({
      success: true,
      user: studentUser,
      token,
      message: 'Signed in successfully',
    });

    response.cookies.set('saberio_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('[Auth API] Unexpected login error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: getDatabaseErrorMessage(err) },
      { status: 500 }
    );
  }
}
