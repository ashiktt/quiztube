import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/models/User';
import { enforceRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { sendOtpEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await enforceRateLimit(ip, {
      keyPrefix: 'rl:forgot-password',
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

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
      // Prevent rapid spamming: 60-second cooldown between OTP generation requests
      const lastRequested = user.resetPasswordRequestedAt ? new Date(user.resetPasswordRequestedAt).getTime() : 0;
      if (Date.now() - lastRequested < 60000) {
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this email, a 6-digit verification code has been sent.',
        });
      }

      // Generate a cryptographically secure 6-digit numeric OTP
      const otpNumber = crypto.randomInt(100000, 1000000).toString();

      // Hash OTP with user ID salt before storing in DB to protect against database compromise
      const hashedOtp = crypto
        .createHash('sha256')
        .update(otpNumber + user._id.toString())
        .digest('hex');

      user.resetPasswordOtp = hashedOtp;
      user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      user.resetPasswordAttempts = 0;
      user.resetPasswordRequestedAt = new Date();
      user.resetPasswordToken = undefined;
      user.resetPasswordTokenExpires = undefined;
      await user.save();

      // Send verification code via configured secure email provider
      await sendOtpEmail(normalizedEmail, otpNumber);
    }

    // Generic success message to prevent user enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a 6-digit verification code has been sent.',
    });
  } catch (err: any) {
    console.error('[Auth API] Forgot password error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: getDatabaseErrorMessage(err) },
      { status: 500 }
    );
  }
}

