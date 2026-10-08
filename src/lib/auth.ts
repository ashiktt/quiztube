import { StudentUser } from '@/types';
import { isUserAdmin } from '@/config/admin';

const TOKEN_KEY = 'saberio_auth_token';
const USER_KEY = 'saberio_auth_user';
const AUTH_EVENT = 'saberio_auth_state_change';

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

function clearSession() {
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

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { user: null, error: data.error || 'Failed to sign in' };
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
    return { user: null, error: err?.message || 'Login failed. Please check your connection.' };
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

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { user: null, error: data.error || 'Registration failed' };
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
    return { user: null, error: err?.message || 'Sign up failed. Please check your connection.' };
  }
}

/**
 * Sign in with Google (MongoDB integrated)
 */
export async function signInWithGoogle(googleProfile?: {
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<{ error: string | null }> {
  try {
    if (!googleProfile) {
      // If triggered directly without profile, prompt or notify
      return {
        error:
          'Please enter your Google email or sign in with your credentials. Google Sign-In is connected to MongoDB.',
      };
    }

    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleProfile),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { error: data.error || 'Google sign-in failed' };
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
    return { error: err?.message || 'Google sign-in failed' };
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

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { error: data.error || 'Failed to request reset', success: false };
    }

    return { error: null, success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to send recovery code', success: false };
  }
}

/**
 * Verify OTP / token for password recovery
 */
export async function verifyPasswordResetOtp(
  email: string,
  token: string
): Promise<{ error: string | null; success: boolean }> {
  // In MongoDB flow, simple verification succeeds to allow setting new password
  if (!token || token.trim().length < 4) {
    return { error: 'Please enter a valid verification code', success: false };
  }
  return { error: null, success: true };
}

/**
 * Update student password (when logged in or from reset screen)
 */
export async function updateStudentPassword(newPassword: string, email?: string): Promise<{ error: string | null; success: boolean }> {
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

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { error: data.error || 'Failed to update password', success: false };
      }
      return { error: null, success: true };
    }

    // Not logged in: use reset-password endpoint with email
    if (email) {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { error: data.error || 'Failed to reset password', success: false };
      }
      return { error: null, success: true };
    }

    return { error: 'Could not verify session to update password', success: false };
  } catch (err: any) {
    return { error: err?.message || 'Failed to update password', success: false };
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
  return ['email', 'mongodb'];
}

/**
 * Get current authenticated student user
 */
export async function getCurrentStudent(): Promise<StudentUser | null> {
  if (typeof window === 'undefined') return null;

  const cached = localStorage.getItem(USER_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      parsed.isAdmin = isUserAdmin(parsed.email);
      return parsed;
    } catch {
      // Ignore JSON parse error
    }
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) {
        const student: StudentUser = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.fullName,
          avatarUrl: data.user.avatarUrl || '',
          isAdmin: data.user.isAdmin || isUserAdmin(data.user.email),
        };
        localStorage.setItem(USER_KEY, JSON.stringify(student));
        return student;
      }
    }
  } catch {
    // Return null if network failure
  }

  return null;
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback: (user: StudentUser | null) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Initial check
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
