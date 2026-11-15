import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken } from '@/lib/jwt';
import { isUserAdmin } from '@/config/admin';
import { enforceRateLimit, getClientIp, rateLimitResponse } from '@/lib/rateLimit';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client();

/**
 * GET /api/auth/google
 * Initiates the Google OAuth 2.0 redirection flow
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  if (!clientId) {
    const errorMsg = encodeURIComponent(
      'Google Sign-In is not configured yet. Please configure GOOGLE_CLIENT_ID in server environment.'
    );
    return NextResponse.redirect(`${origin}/?auth_error=${errorMsg}`);
  }

  const redirectUri = `${origin}/api/auth/google/callback`;

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('access_type', 'offline');

  return NextResponse.redirect(googleAuthUrl.toString());
}

/**
 * POST /api/auth/google
 * Authenticates user from verified Google ID token or credential
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = await enforceRateLimit(`google_auth:${ip}`, 15, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Google Sign-In is not configured on this server' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const idToken = body.idToken || body.credential;
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Google ID token or credential is required' },
        { status: 400 }
      );
    }

    // Verify token using Google's official public keys via OAuth2Client
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired Google authentication token' },
        { status: 401 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Failed to extract payload from Google token' },
        { status: 401 }
      );
    }

    // Validate Issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      return NextResponse.json(
        { success: false, error: 'Invalid token issuer' },
        { status: 401 }
      );
    }

    // Ensure email is verified by Google
    if (!payload.email_verified) {
      return NextResponse.json(
        { success: false, error: 'Google email address is not verified' },
        { status: 403 }
      );
    }

    const email = payload.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email not present in Google token payload' },
        { status: 400 }
      );
    }

    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error('[Auth API] Google DB connection failure:', dbErr?.message || dbErr);
      return NextResponse.json(
        { success: false, error: getDatabaseErrorMessage(dbErr) },
        { status: 503 }
      );
    }

    const isAdmin = isUserAdmin(email);
    let user = await User.findOne({ email });

    if (!user) {
      const sanitizedName = payload.name?.trim().slice(0, 80) || email.split('@')[0];
      user = await User.create({
        email,
        name: sanitizedName,
        avatarUrl: payload.picture || '',
        isAdmin,
        provider: 'google',
      });
    } else {
      let updated = false;
      if (payload.picture && !user.avatarUrl) {
        user.avatarUrl = payload.picture;
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
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[Auth API] Google Auth error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: getDatabaseErrorMessage(err) },
      { status: 500 }
    );
  }
}
