import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken } from '@/lib/jwt';
import { isUserAdmin } from '@/config/admin';

/**
 * GET /api/auth/google
 * Initiates the Google OAuth 2.0 redirection flow
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const errorMsg = encodeURIComponent(
      'Google Sign-In is not configured yet. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.'
    );
    const host = req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    return NextResponse.redirect(`${proto}://${host}/?auth_error=${errorMsg}`);
  }

  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const redirectUri = `${proto}://${host}/api/auth/google/callback`;

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
 * Authenticates user from verified Google profile or client credential
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { email, name, avatarUrl } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address provided' },
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

    let user = await User.findOne({ email: normalizedEmail });
    const isAdmin = isUserAdmin(normalizedEmail);

    if (!user) {
      const sanitizedName =
        typeof name === 'string' && name.trim().length > 0
          ? name.trim().slice(0, 80)
          : normalizedEmail.split('@')[0];

      user = await User.create({
        email: normalizedEmail,
        name: sanitizedName,
        avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : '',
        isAdmin,
        provider: 'google',
      });
    } else {
      let updated = false;
      if (typeof avatarUrl === 'string' && avatarUrl && !user.avatarUrl) {
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
    console.error('[Auth API] Google Auth error:', err?.message || err);
    return NextResponse.json(
      { success: false, error: getDatabaseErrorMessage(err) },
      { status: 500 }
    );
  }
}
