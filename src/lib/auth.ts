import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { StudentUser } from '@/types';

/**
 * Sign up a new student with email and password
 */
export async function signUpStudent(email: string, password: string, fullName?: string): Promise<{ user: StudentUser | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: 'Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to environment variables.',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, error: 'Database connection failed' };

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        return {
          user: null,
          error: 'Supabase email confirmation rate limit reached. Please disable "Confirm email" in your Supabase Auth settings to enable instant student logins without email limits.',
        };
      }
      return { user: null, error: error.message };
    }

    if (data?.user) {
      const student: StudentUser = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || email.split('@')[0],
      };
      return { user: student, error: null };
    }

    return { user: null, error: 'Check your email for confirmation or try signing in.' };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Sign up failed' };
  }
}

/**
 * Sign in existing student with email and password
 */
export async function signInStudent(email: string, password: string): Promise<{ user: StudentUser | null; error: string | null }> {
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
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data?.user) {
      const student: StudentUser = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || email.split('@')[0],
      };
      return { user: student, error: null };
    }

    return { user: null, error: 'Invalid credentials' };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Login failed' };
  }
}

/**
 * Sign out current student
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
 * Get current authenticated student user
 */
export async function getCurrentStudent(): Promise<StudentUser | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;

    return {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
    };
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
      callback({
        id: session.user.id,
        email: session.user.email,
        fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
      });
    } else {
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}
