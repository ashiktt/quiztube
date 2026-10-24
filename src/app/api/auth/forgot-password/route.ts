import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/models/User';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { email } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
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
      console.error('[Auth API] Forgot password DB connection failure:', dbErr?.message || dbErr);
      return NextResponse.json(
        { success: false, error: getDatabaseErrorMessage(dbErr) },
        { status: 503 }
      );
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Generate a secure 6-digit numeric OTP
      const otpNumber = crypto.randomInt(100000, 999999).toString();
      user.resetPasswordOtp = otpNumber;
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      console.log(`[Password Recovery] Generated reset code for ${normalizedEmail}. Expires in 15 minutes.`);
    }

    // Generic success message to prevent user enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a 6-digit verification code has been generated.',
    });
  } catch (err: any) {
    console.error('[Auth API] Forgot password error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: getDatabaseErrorMessage(err) },
      { status: 500 }
    );
  }
}
