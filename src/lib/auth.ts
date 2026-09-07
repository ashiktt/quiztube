import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { StudentUser } from '@/types';
import { isUserAdmin } from '@/config/admin';

/**
 * Format user from Supabase auth session/user object
 */
function formatStudentUser(user: any): StudentUser {
  const metadata = user.user_metadata || {};
  const email = user.email || '';
  const fullName =
    metadata.full_name ||
    metadata.name ||
    (email ? email.split('@')[0] : 'Student');
  const avatarUrl = metadata.avatar_url || metadata.picture || undefined;

  return {
    id: user.id,
    email,
    fullName,
    avatarUrl,
    isAdmin: isUserAdmin(email),
  };
}

/**
 * Initiate official Google OAuth sign-in flow
 */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return {
      error: 'Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to environment variables.',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Database connection failed' };

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTo = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Google OAuth error:', error);
      return { error: error.message || 'Google sign-in could not be completed. Please try again.' };
    }

    return { error: null };
  } catch (err: any) {
    console.error('Google sign-in exception:', err);
    return { error: err?.message || 'Google sign-in could not be completed. Please try again.' };
  }
}

/**
 * Sign up a new student with email and password
 */
export async function signUpStudent(
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: StudentUser | null; error: string | null; requiresEmailVerification?: boolean }> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: 'Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to environment variables.',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, error: 'Database connection failed' };

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const emailRedirectTo = `${origin}/auth/callback`;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName?.trim() || email.split('@')[0],
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        return {
          user: null,
          error: 'Email confirmation rate limit reached. Please wait a moment or check your Supabase Auth rate limits.',
        };
      }
      return { user: null, error: error.message };
    }

    if (data?.user) {
      // If user is returned but session is null, email verification is required by Supabase
      const requiresVerification = !data.session && (!data.user.confirmed_at && !data.user.email_confirmed_at);
      const student = formatStudentUser(data.user);

      return {
        user: requiresVerification ? null : student,
        requiresEmailVerification: requiresVerification,
        error: null,
      };
    }

    return {
      user: null,
      requiresEmailVerification: true,
      error: 'Account created! Please check your email to verify your account.',
    };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Sign up failed' };
  }
}

/**
 * Sign in existing student with email and password
 */
export async function signInStudent(
  email: string,
  password: string
): Promise<{ user: StudentUser | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: 'Supabase is not configured. Please set up environment variables.',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, error: 'Database connection failed' };

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('email not confirmed')) {
        return { user: null, error: 'Please verify your email before signing in. Check your inbox or spam folder.' };
      }
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        return { user: null, error: 'Incorrect email or password.' };
      }
      return { user: null, error: error.message };
    }

    if (data?.user) {
      return { user: formatStudentUser(data.user), error: null };
    }

    return { user: null, error: 'Invalid credentials' };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Login failed' };
  }
}

/**
 * Request 6-digit OTP / password recovery email for student
 * Uses generic privacy-preserving message to avoid user-account enumeration
 */
export async function resetStudentPassword(email: string): Promise<{ error: string | null; success: boolean }> {
  if (!isSupabaseConfigured()) {
    return {
      error: 'Supabase is not configured. Please set up environment variables.',
      success: false,
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Database connection failed', success: false };

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTo = `${origin}/auth/callback?type=recovery`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      console.warn('resetPasswordForEmail warning/error:', error.message);
      if (error.message.toLowerCase().includes('rate limit')) {
        return { error: 'Too many requests. Please wait a minute before requesting another code.', success: false };
      }
      return { error: error.message, success: false };
    }

    return { error: null, success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to send password recovery code', success: false };
  }
}

/**
 * Verify 6-digit email OTP for password recovery
 * Sets active recovery session upon successful verification
 */
export async function verifyPasswordResetOtp(
  email: string,
  token: string
): Promise<{ error: string | null; success: boolean }> {
  if (!isSupabaseConfigured()) {
    return {
      error: 'Supabase is not configured.',
      success: false,
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Database connection failed', success: false };

  try {
    const cleanToken = token.trim();
    const cleanEmail = email.trim();

    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'recovery',
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('expired')) {
        return { error: 'This verification code has expired. Request a new code.', success: false };
      }
      if (msg.includes('invalid')) {
        return { error: 'Invalid verification code. Please check and try again.', success: false };
      }
      return { error: error.message || 'Verification failed. Please try again.', success: false };
    }

    if (data?.session || data?.user) {
      return { error: null, success: true };
    }

    return { error: 'Verification could not be confirmed.', success: false };
  } catch (err: any) {
    return { error: err?.message || 'Verification failed.', success: false };
  }
}

/**
 * Update student password (when logged in or after password recovery verification)
 */
export async function updateStudentPassword(newPassword: string): Promise<{ error: string | null; success: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Database connection failed', success: false };

  try {
    if (newPassword.length < 6) {
      return { error: 'Password must be at least 6 characters long.', success: false };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: error.message, success: false };
    }

    return { error: null, success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to update password', success: false };
  }
}

/**
 * Sign out current student session on this device
 */
export async function signOutStudent(): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: null };

  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Sign out failed' };
  }
}

/**
 * Sign out of all devices/sessions globally
 */
export async function signOutAllSessions(): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: null };

  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Sign out failed' };
  }
}

/**
 * Get current session token for authenticating protected API calls
 */
export async function getCurrentSessionToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Get Authorization headers for API calls
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getCurrentSessionToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Get connected providers (e.g. ['google', 'email'])
 */
export async function getConnectedProviders(): Promise<string[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const providers: Set<string> = new Set();
    const appMetadata = session.user.app_metadata || {};

    if (appMetadata.provider) {
      providers.add(appMetadata.provider);
    }
    if (Array.isArray(appMetadata.providers)) {
      appMetadata.providers.forEach((p: string) => providers.add(p));
    }
    if (Array.isArray(session.user.identities)) {
      session.user.identities.forEach((id: any) => {
        if (id.provider) providers.add(id.provider);
      });
    }

    if (providers.size === 0) {
      providers.add('email');
    }

    return Array.from(providers);
  } catch {
    return ['email'];
  }
}

/**
 * Get current authenticated student user
 */
export async function getCurrentStudent(): Promise<StudentUser | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;

    return formatStudentUser(session.user);
  } catch {
    return null;
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback: (user: StudentUser | null) => void) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    callback(null);
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback(formatStudentUser(session.user));
    } else {
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}
