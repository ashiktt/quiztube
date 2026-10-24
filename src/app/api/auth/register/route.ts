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

    const { email, password, fullName } = body;

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

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
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
      console.error('[Auth API] Register DB connection failure:', dbErr?.message || dbErr);
      return NextResponse.json(
        { success: false, error: getDatabaseErrorMessage(dbErr) },
        { status: 503 }
      );
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please switch to Sign In.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sanitizedName =
      typeof fullName === 'string' && fullName.trim().length > 0
        ? fullName.trim().slice(0, 80)
        : normalizedEmail.split('@')[0];
    const isAdmin = isUserAdmin(normalizedEmail);

    const newUser = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: sanitizedName,
      isAdmin,
      provider: 'credentials',
    });

    const studentUser = {
      id: newUser._id.toString(),
      email: newUser.email,
      fullName: newUser.name,
      avatarUrl: newUser.avatarUrl || '',
      isAdmin: newUser.isAdmin,
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
      message: 'Account created successfully',
    });

    // Set secure HTTP-only cookie
    response.cookies.set('saberio_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('[Auth API] Registration error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: getDatabaseErrorMessage(err) },
      { status: 500 }
    );
  }
}
