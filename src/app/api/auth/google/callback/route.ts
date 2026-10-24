import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getDatabaseErrorMessage } from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken } from '@/lib/jwt';
import { isUserAdmin } from '@/config/admin';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    const errorMsg = encodeURIComponent(`Google authentication was cancelled: ${error}`);
    return NextResponse.redirect(`${origin}/?auth_error=${errorMsg}`);
  }

  if (!code) {
    const errorMsg = encodeURIComponent('Authorization code was missing from Google callback');
    return NextResponse.redirect(`${origin}/?auth_error=${errorMsg}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const errorMsg = encodeURIComponent(
      'Google OAuth credentials are not configured on the server. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
    );
    return NextResponse.redirect(`${origin}/?auth_error=${errorMsg}`);
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;

    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('[Google OAuth] Token exchange error:', tokenData);
      const errorMsg = encodeURIComponent('Failed to exchange authorization code with Google');
      return NextResponse.redirect(`${origin}/?auth_error=${errorMsg}`);
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userInfoResponse.json();
    if (!userInfoResponse.ok || !profile.email) {
      console.error('[Google OAuth] UserInfo fetch error:', profile);
      const errorMsg = encodeURIComponent('Failed to retrieve user profile from Google');
      return NextResponse.redirect(`${origin}/?auth_error=${errorMsg}`);
    }

    // 3. Persist or update user in MongoDB
    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error('[Google OAuth] DB connection error:', dbErr?.message || dbErr);
      const errorMsg = encodeURIComponent(getDatabaseErrorMessage(dbErr));
      return NextResponse.redirect(`${origin}/?auth_error=${errorMsg}`);
    }

    const normalizedEmail = profile.email.trim().toLowerCase();
    const isAdmin = isUserAdmin(normalizedEmail);

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        name: profile.name || normalizedEmail.split('@')[0],
        avatarUrl: profile.picture || '',
        isAdmin,
        provider: 'google',
      });
    } else {
      let updated = false;
      if (profile.picture && !user.avatarUrl) {
        user.avatarUrl = profile.picture;
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

    const redirectUrl = new URL(`${origin}/auth/callback`);
    redirectUrl.searchParams.set('token', token);

    const response = NextResponse.redirect(redirectUrl.toString());

    // Set secure HTTP-only cookie
    response.cookies.set('saberio_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[Google OAuth] Unexpected callback error:', err?.message || err);
    const errorMsg = encodeURIComponent(getDatabaseErrorMessage(err));
    return NextResponse.redirect(`${origin}/?auth_error=${errorMsg}`);
  }
}
