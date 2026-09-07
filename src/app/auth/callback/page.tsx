'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { Sparkles, AlertCircle } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState('Connecting to Saberio AI...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        const errorParam = searchParams.get('error') || searchParams.get('error_description');
        if (errorParam) {
          if (isMounted) {
            setErrorMessage(errorParam);
            setTimeout(() => {
              router.replace('/?auth_error=' + encodeURIComponent(errorParam));
            }, 1500);
          }
          return;
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
          router.replace('/');
          return;
        }

        const code = searchParams.get('code');
        const type = searchParams.get('type');

        if (code) {
          setStatusMessage('Completing authentication...');
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
          }
        }

        // Check active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('Session retrieval error:', sessionError);
        }

        if (isMounted) {
          if (type === 'recovery' || (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))) {
            setStatusMessage('Verification successful! Opening password reset...');
            setTimeout(() => {
              router.replace('/?password_reset=true');
            }, 600);
          } else {
            setStatusMessage('Signed in successfully! Redirecting...');
            setTimeout(() => {
              router.replace('/');
            }, 600);
          }
        }
      } catch (err: any) {
        console.error('Auth callback exception:', err);
        if (isMounted) {
          setErrorMessage(err?.message || 'Authentication error. Redirecting to home...');
          setTimeout(() => {
            router.replace('/');
          }, 1500);
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl text-center space-y-5">
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-2xl blur-lg opacity-60 animate-pulse" />
          <div className="relative w-14 h-14 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <Sparkles className="w-7 h-7 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-bold text-white tracking-tight">Saberio AI</h1>
          <p className="text-xs text-slate-400">{statusMessage}</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4">
          <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
