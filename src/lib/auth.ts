import { StudentUser } from '@/types';
import { isUserAdmin } from '@/config/admin';

const TOKEN_KEY = 'saberio_auth_token';
const USER_KEY = 'saberio_auth_user';
const AUTH_EVENT = 'saberio_auth_state_change';

function sanitizeClientError(err: any, fallbackMessage: string): string {
  if (!err) return fallbackMessage;
  const raw = typeof err === 'string' ? err : err?.message || '';
  const lower = raw.toLowerCase();

  if (
    lower.includes('connect econnrefused') ||
    lower.includes('127.0.0.1:27017') ||
    lower.includes('localhost:27017') ||
    lower.includes('serverselectionerror') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('couldn\'t connect') ||
    lower.includes('ssl alert') ||
    lower.includes('ip that isn\'t whitelisted')
  ) {
    return "We couldn't connect to the service. Please try again shortly.";
  }

  return raw || fallbackMessage;
}

function dispatchAuthChange(user: StudentUser | null) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent(AUTH_EVENT, { detail: { user } });
  window.dispatchEvent(event);
}

function saveSession(token: string, user: StudentUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  dispatchAuthChange(user);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  dispatchAuthChange(null);
}

/**
 * Sign in existing student with email and password via MongoDB API
 */
export async function signInStudent(
  email: string,
  password: string
): Promise<{ user: StudentUser | null; error: string | null }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      const err = sanitizeClientError(data.error, 'Failed to sign in. Please check your credentials.');
      return { user: null, error: err };
    }

    const student: StudentUser = {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.fullName,
      avatarUrl: data.user.avatarUrl || '',
      isAdmin: data.user.isAdmin || isUserAdmin(data.user.email),
    };

    saveSession(data.token, student);
    return { user: student, error: null };
  } catch (err: any) {
    console.error('signInStudent error:', err);
    return {
      user: null,
      error: sanitizeClientError(err, "We couldn't connect to the service. Please try again shortly."),
    };
  }
}

/**
 * Sign up a new student with email and password via MongoDB API
 */
export async function signUpStudent(
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: StudentUser | null; error: string | null; requiresEmailVerification?: boolean }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password,
        fullName: fullName?.trim(),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      const err = sanitizeClientError(data.error, 'Registration failed. Please try again.');
      return { user: null, error: err };
    }

    const student: StudentUser = {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.fullName,
      avatarUrl: data.user.avatarUrl || '',
      isAdmin: data.user.isAdmin || isUserAdmin(data.user.email),
    };

    saveSession(data.token, student);
    return { user: student, error: null, requiresEmailVerification: false };
  } catch (err: any) {
    console.error('signUpStudent error:', err);
    return {
      user: null,
      error: sanitizeClientError(err, "We couldn't connect to the service. Please try again shortly."),
    };
  }
}

/**
 * Sign in with Google (OAuth initiation or verified profile payload)
 */
export async function signInWithGoogle(googleProfile?: {
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<{ error: string | null }> {
  try {
    // 1. If called without a profile, initiate Google OAuth redirect in browser
    if (!googleProfile) {
      if (typeof window !== 'undefined') {
        window.location.href = '/api/auth/google';
        return { error: null };
      }
      return { error: 'Google sign-in requires an active browser session.' };
    }

    // 2. If called with profile payload (e.g. Google One-Tap or native client)
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleProfile),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        error: sanitizeClientError(data.error, 'Google sign-in could not be completed.'),
      };
    }

    const student: StudentUser = {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.fullName,
      avatarUrl: data.user.avatarUrl || '',
      isAdmin: data.user.isAdmin || isUserAdmin(data.user.email),
    };

    saveSession(data.token, student);
    return { error: null };
  } catch (err: any) {
    return {
      error: sanitizeClientError(err, "We couldn't connect to the service. Please try again shortly."),
    };
  }
}

/**
 * Request password recovery email for student
 */
export async function resetStudentPassword(email: string): Promise<{ error: string | null; success: boolean }> {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        error: sanitizeClientError(data.error, 'Failed to request password reset'),
        success: false,
      };
    }

    return { error: null, success: true };
  } catch (err: any) {
    return {
      error: sanitizeClientError(err, "We couldn't connect to the service. Please try again shortly."),
      success: false,
    };
  }
}

/**
 * Verify OTP / token for password recovery
 */
export async function verifyPasswordResetOtp(
  email: string,
  otp: string
): Promise<{ error: string | null; success: boolean }> {
  if (!otp || otp.trim().length !== 6) {
    return { error: 'Please enter all 6 digits of your verification code.', success: false };
  }

  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return {
        error: sanitizeClientError(data.error, 'Invalid or expired verification code'),
        success: false,
      };
    }

    return { error: null, success: true };
  } catch (err: any) {
    return {
      error: sanitizeClientError(err, "We couldn't connect to the service. Please try again shortly."),
      success: false,
    };
  }
}

/**
 * Update student password (when logged in or from reset screen)
 */
export async function updateStudentPassword(
  newPassword: string,
  email?: string,
  otp?: string
): Promise<{ error: string | null; success: boolean }> {
  try {
    const authToken = await getCurrentSessionToken();

    if (authToken) {
      // Logged in user: use PATCH /api/auth/me
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          error: sanitizeClientError(data.error, 'Failed to update password'),
          success: false,
        };
      }
      return { error: null, success: true };
    }

    // Not logged in: use reset-password endpoint with email & OTP
    if (email) {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), newPassword, otp }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          error: sanitizeClientError(data.error, 'Failed to reset password'),
          success: false,
        };
      }
      return { error: null, success: true };
    }

    return { error: 'Could not verify session to update password', success: false };
  } catch (err: any) {
    return {
      error: sanitizeClientError(err, "We couldn't connect to the service. Please try again shortly."),
      success: false,
    };
  }
}

/**
 * Sign out current student session
 */
export async function signOutStudent(): Promise<{ error: string | null }> {
  try {
    await fetch('/api/auth/me', { method: 'DELETE' }).catch(() => {});
  } finally {
    clearSession();
  }
  return { error: null };
}

/**
 * Sign out of all devices/sessions
 */
export async function signOutAllSessions(): Promise<{ error: string | null }> {
  return signOutStudent();
}

/**
 * Get current session token for authenticating protected API calls
 */
export async function getCurrentSessionToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || null;
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
 * Get connected providers (e.g. ['email', 'mongodb'])
 */
export async function getConnectedProviders(): Promise<string[]> {
  const user = await getCurrentStudent();
  if (!user) return [];
  return ['email', 'google', 'mongodb'];
}

/**
 * Get current authenticated student user with background verification
 */
export async function getCurrentStudent(): Promise<StudentUser | null> {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(TOKEN_KEY);
  const cached = localStorage.getItem(USER_KEY);

  let cachedUser: StudentUser | null = null;
  if (cached) {
    try {
      cachedUser = JSON.parse(cached);
      if (cachedUser) {
        cachedUser.isAdmin = isUserAdmin(cachedUser.email);
      }
    } catch {
      // Ignore parse failure
    }
  }

  // If no token exists, user is definitely signed out
  if (!token) {
    if (cached) clearSession();
    return null;
  }

  // Asynchronously verify session in background
  fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(async (res) => {
      if (res.status === 401) {
        // Token has expired or been revoked
        clearSession();
      } else if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.authenticated && data?.user) {
          const freshUser: StudentUser = {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.fullName,
            avatarUrl: data.user.avatarUrl || '',
            isAdmin: data.user.isAdmin || isUserAdmin(data.user.email),
          };
          localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        }
      }
    })
    .catch(() => {
      // Ignore background network failure; rely on cached user
    });

  return cachedUser;
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback: (user: StudentUser | null) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  getCurrentStudent().then(callback);

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{ user: StudentUser | null }>;
    callback(customEvent.detail?.user ?? null);
  };

  const storageHandler = (e: StorageEvent) => {
    if (e.key === TOKEN_KEY || e.key === USER_KEY) {
      getCurrentStudent().then(callback);
    }
  };

  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener('storage', storageHandler);
  };
}
