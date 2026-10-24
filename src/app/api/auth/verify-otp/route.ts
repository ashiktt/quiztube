import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error('[Auth API] Verify OTP DB connection failure:', dbErr?.message || dbErr);
      return NextResponse.json(
        { success: false, error: getDatabaseErrorMessage(dbErr) },
        { status: 503 }
      );
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    if (!user.resetPasswordOtp || !user.resetPasswordExpires) {
      return NextResponse.json(
        { success: false, error: 'No verification code was requested for this account' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      return NextResponse.json(
        { success: false, error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (user.resetPasswordOtp !== cleanOtp) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code verified successfully',
    });
  } catch (err: any) {
    console.error('[Auth API] Verify OTP error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: getDatabaseErrorMessage(err) },
      { status: 500 }
    );
  }
}
