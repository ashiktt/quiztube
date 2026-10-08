import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken } from '@/lib/jwt';
import { isUserAdmin } from '@/config/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, name, avatarUrl } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    const isAdmin = isUserAdmin(normalizedEmail);

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        name: name?.trim() || normalizedEmail.split('@')[0],
        avatarUrl: avatarUrl || '',
        isAdmin,
        provider: 'google',
      });
    } else {
      let updated = false;
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
        updated = true;
      }
      if (isAdmin && !user.isAdmin) {
        user.isAdmin = true;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const studentUser = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.name,
      avatarUrl: user.avatarUrl || '',
      isAdmin: user.isAdmin,
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
      message: 'Signed in with Google',
    });

    response.cookies.set('saberio_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('Google Auth API error:', err);
    return NextResponse.json({ error: err.message || 'Google authentication failed' }, { status: 500 });
  }
}
