import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/models/User';
import { enforceRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await enforceRateLimit(ip, {
      keyPrefix: 'rl:verify-otp',
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

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

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { success: false, error: 'Verification code must be exactly 6 digits' },
        { status: 400 }
      );
    }

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
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return NextResponse.json(
        { success: false, error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Brute-force protection: lock out after 5 consecutive failed attempts
    if ((user.resetPasswordAttempts || 0) >= 5) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      user.resetPasswordAttempts = 0;
      await user.save();
      return NextResponse.json(
        { success: false, error: 'Too many incorrect attempts. For security, please request a new verification code.' },
        { status: 429 }
      );
    }

    // Compare hashed OTP using timing-safe comparison
    const expectedHash = user.resetPasswordOtp;
    const computedHash = crypto
      .createHash('sha256')
      .update(cleanOtp + user._id.toString())
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    const isMatch =
      expectedBuffer.length === computedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, computedBuffer);

    if (!isMatch) {
      user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
      await user.save();
      const remainingAttempts = 5 - user.resetPasswordAttempts;
      return NextResponse.json(
        {
          success: false,
          error: `Invalid verification code. ${remainingAttempts > 0 ? `${remainingAttempts} attempts remaining.` : 'Code locked.'}`,
        },
        { status: 400 }
      );
    }

    // OTP is valid! Invalidate OTP to prevent replay and issue a single-use 10-minute reset token
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordAttempts = 0;
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Verification code verified successfully',
      resetToken: rawResetToken,
    });
  } catch (err: any) {
    console.error('[Auth API] Verify OTP error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: getDatabaseErrorMessage(err) },
      { status: 500 }
    );
  }
}

