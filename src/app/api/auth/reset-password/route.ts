import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/models/User';
import { enforceRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await enforceRateLimit(ip, {
      keyPrefix: 'rl:reset-password',
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

    const { email, newPassword, otp, resetToken } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    // Require verification proof: password reset without OTP/token is strictly prohibited
    if (!otp && !resetToken) {
      return NextResponse.json(
        { success: false, error: 'A verified OTP or reset token is required to reset your password' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

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
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification session' },
        { status: 400 }
      );
    }

    let isAuthorized = false;

    // Path A: Verification via single-use resetToken issued by verify-otp
    if (resetToken && typeof resetToken === 'string') {
      if (
        user.resetPasswordToken &&
        user.resetPasswordTokenExpires &&
        new Date() <= new Date(user.resetPasswordTokenExpires)
      ) {
        const hashedInputToken = crypto.createHash('sha256').update(resetToken.trim()).digest('hex');
        const expectedTokenBuffer = Buffer.from(user.resetPasswordToken, 'hex');
        const inputTokenBuffer = Buffer.from(hashedInputToken, 'hex');

        if (
          expectedTokenBuffer.length === inputTokenBuffer.length &&
          crypto.timingSafeEqual(expectedTokenBuffer, inputTokenBuffer)
        ) {
          isAuthorized = true;
        }
      }
    }

    // Path B: Direct verification via 6-digit OTP
    if (!isAuthorized && otp) {
      const cleanOtp = String(otp).trim();
      if (
        user.resetPasswordOtp &&
        user.resetPasswordExpires &&
        new Date() <= new Date(user.resetPasswordExpires) &&
        (user.resetPasswordAttempts || 0) < 5
      ) {
        const expectedOtpHash = user.resetPasswordOtp;
        const computedOtpHash = crypto
          .createHash('sha256')
          .update(cleanOtp + user._id.toString())
          .digest('hex');

        const expectedBuffer = Buffer.from(expectedOtpHash, 'hex');
        const computedBuffer = Buffer.from(computedOtpHash, 'hex');

        if (
          expectedBuffer.length === computedBuffer.length &&
          crypto.timingSafeEqual(expectedBuffer, computedBuffer)
        ) {
          isAuthorized = true;
        } else {
          user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
          await user.save();
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Verification code is invalid, expired, or has exceeded attempts' },
        { status: 400 }
      );
    }

    // Set new password with bcrypt work factor 12
    user.password = await bcrypt.hash(newPassword, 12);

    // Invalidate all reset tokens, OTPs, and attempts to prevent replay
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordAttempts = 0;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpires = undefined;
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

