import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { email, newPassword, otp } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error('[Auth API] Reset password DB connection failure:', dbErr?.message || dbErr);
      return NextResponse.json(
        { success: false, error: getDatabaseErrorMessage(dbErr) },
        { status: 503 }
      );
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User account not found' }, { status: 404 });
    }

    // If an OTP is required/supplied, verify it
    if (otp) {
      const cleanOtp = String(otp).trim();
      if (
        !user.resetPasswordOtp ||
        !user.resetPasswordExpires ||
        new Date() > new Date(user.resetPasswordExpires) ||
        user.resetPasswordOtp !== cleanOtp
      ) {
        return NextResponse.json(
          { success: false, error: 'Verification code is invalid or has expired' },
          { status: 400 }
        );
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully. You can now sign in.',
    });
  } catch (err: any) {
    console.error('[Auth API] Reset password error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: getDatabaseErrorMessage(err) },
      { status: 500 }
    );
  }
}
