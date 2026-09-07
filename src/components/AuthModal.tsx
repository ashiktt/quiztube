'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  BookOpen,
  ArrowLeft,
  KeyRound,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  signInStudent,
  signUpStudent,
  resetStudentPassword,
  verifyPasswordResetOtp,
  updateStudentPassword,
  signInWithGoogle,
  verifySignupOtp,
  resendSignupOtp,
} from '@/lib/auth';
import { StudentUser } from '@/types';

export type AuthModalMode =
  | 'signin'
  | 'signup'
  | 'signup_otp'
  | 'forgot_email'
  | 'forgot_otp'
  | 'forgot_new_password'
  | 'forgot_success';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: StudentUser) => void;
  initialMode?: 'signin' | 'signup' | 'forgot' | 'new_password';
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}: AuthModalProps) {
  const getStartingMode = (): AuthModalMode => {
    if (initialMode === 'forgot') return 'forgot_email';
    if (initialMode === 'new_password') return 'forgot_new_password';
    return initialMode;
  };

  const [mode, setMode] = useState<AuthModalMode>(getStartingMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [otpAttempts, setOtpAttempts] = useState<number>(0);

  // Loading & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(getStartingMode());
      setError(null);
      setSuccessMsg(null);
      setVerificationNotice(null);
    }
  }, [isOpen, initialMode]);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if ((mode !== 'forgot_otp' && mode !== 'signup_otp') || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, resendCooldown]);

  if (!isOpen) return null;

  // Handle Google OAuth sign in
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);

    try {
      const { error: err } = await signInWithGoogle();
      if (err) {
        setError(err);
        setIsGoogleLoading(false);
      }
      // On success, the browser will redirect to Google's consent screen
    } catch (err: any) {
      setError(err?.message || 'Google sign-in could not be completed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // User pasted multiple digits
      const pasted = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup_otp') {
        const { success, error: err } = await resendSignupOtp(email.trim());
        if (err) {
          setError(err);
        } else if (success) {
          setResendCooldown(60);
          setOtpAttempts(0);
          setSuccessMsg(`A new 6-digit verification code has been sent to ${email.trim()}.`);
        }
      } else {
        const { success, error: err } = await resetStudentPassword(email.trim());
        if (err) {
          setError(err);
        } else if (success) {
          setResendCooldown(60);
          setOtpAttempts(0);
          setSuccessMsg('A new 6-digit code has been sent to your email.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // ==========================================
    // 1. FORGOT STEP 1: REQUEST OTP VIA EMAIL
    // ==========================================
    if (mode === 'forgot_email') {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }

      setIsLoading(true);
      try {
        const { error: err } = await resetStudentPassword(email.trim());
        if (err) {
          setError(err);
        } else {
          setResendCooldown(60);
          setOtpAttempts(0);
          setOtpDigits(['', '', '', '', '', '']);
          setMode('forgot_otp');
          setSuccessMsg("If an account exists for this email, we've sent a 6-digit verification code.");
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to send recovery code.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ==========================================
    // 2. FORGOT STEP 2: VERIFY 6-DIGIT OTP
    // ==========================================
    if (mode === 'forgot_otp') {
      const otp = otpDigits.join('');
      if (otp.length < 6) {
        setError('Please enter all 6 digits of your verification code.');
        return;
      }

      if (otpAttempts >= 5) {
        setError('Too many invalid attempts. Please request a new verification code.');
        return;
      }

      setIsLoading(true);
      try {
        const { success, error: err } = await verifyPasswordResetOtp(email.trim(), otp);
        if (err) {
          setOtpAttempts((prev) => prev + 1);
          setError(err);
        } else if (success) {
          setPassword('');
          setConfirmPassword('');
          setMode('forgot_new_password');
          setSuccessMsg('Code verified! Now create your new password.');
        }
      } catch (err: any) {
        setOtpAttempts((prev) => prev + 1);
        setError(err?.message || 'Verification failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ==========================================
    // 2B. SIGNUP STEP 2: VERIFY 6-DIGIT SIGNUP OTP
    // ==========================================
    if (mode === 'signup_otp') {
      const otp = otpDigits.join('');
      if (otp.length < 6) {
        setError('Please enter all 6 digits of your verification code.');
        return;
      }

      if (otpAttempts >= 5) {
        setError('Too many invalid attempts. Please request a new verification code.');
        return;
      }

      setIsLoading(true);
      try {
        const { user, error: err } = await verifySignupOtp(email.trim(), otp);
        if (err) {
          setOtpAttempts((prev) => prev + 1);
          setError(err);
        } else if (user) {
          setSuccessMsg('Email verified successfully! Welcome to Saberio AI.');
          onAuthSuccess(user);
          setTimeout(() => onClose(), 800);
        } else {
          setError('Could not confirm verification. Please check your code or try signing in.');
        }
      } catch (err: any) {
        setOtpAttempts((prev) => prev + 1);
        setError(err?.message || 'Verification failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ==========================================
    // 3. FORGOT STEP 3: SET NEW PASSWORD
    // ==========================================
    if (mode === 'forgot_new_password') {
      if (!password.trim()) {
        setError('Please enter a new password.');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }

      setIsLoading(true);
      try {
        const { success, error: err } = await updateStudentPassword(password);
        if (err) {
          setError(err);
        } else if (success) {
          setMode('forgot_success');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to update password.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ==========================================
    // 4. SIGN IN OR SIGN UP
    // ==========================================
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your confirmation password.');
        return;
      }

      setIsLoading(true);
      try {
        const { user, error: err, requiresEmailVerification } = await signUpStudent(
          email.trim(),
          password,
          fullName.trim()
        );

        if (err) {
          setError(err);
        } else if (requiresEmailVerification) {
          setOtpDigits(['', '', '', '', '', '']);
          setResendCooldown(60);
          setOtpAttempts(0);
          setMode('signup_otp');
          setSuccessMsg(`We've sent a 6-digit verification code to ${email.trim()}. Enter it below to activate your account.`);
        } else if (user) {
          setSuccessMsg('Account created successfully!');
          onAuthSuccess(user);
          setTimeout(() => onClose(), 800);
        } else {
          setOtpDigits(['', '', '', '', '', '']);
          setResendCooldown(60);
          setOtpAttempts(0);
          setMode('signup_otp');
          setSuccessMsg(`We've sent a 6-digit verification code to ${email.trim()}.`);
        }
      } catch (err: any) {
        setError(err?.message || 'Sign up failed.');
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'signin') {
      setIsLoading(true);
      try {
        const { user, error: err } = await signInStudent(email.trim(), password);
        if (err) {
          if (err.toLowerCase().includes('verify your email')) {
            setError('Please verify your email before signing in. Check your inbox for the verification code.');
            setVerificationNotice('Need to verify your account with a 6-digit code?');
          } else {
            setError(err);
          }
        } else if (user) {
          setSuccessMsg('Welcome back, student!');
          onAuthSuccess(user);
          setTimeout(() => onClose(), 800);
        }
      } catch (err: any) {
        setError(err?.message || 'Authentication error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isForgotFlow =
    mode === 'forgot_email' ||
    mode === 'forgot_otp' ||
    mode === 'forgot_new_password' ||
    mode === 'forgot_success';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-5 sm:p-8 bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl space-y-5 sm:space-y-6 text-slate-800 dark:text-slate-100 max-h-[92vh] overflow-y-auto pb-safe">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 rounded-2xl text-white shadow-md shadow-indigo-500/20 shrink-0">
            {isForgotFlow ? (
              <KeyRound className="w-6 h-6 sm:w-7 sm:h-7" />
            ) : mode === 'signup_otp' ? (
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
            ) : (
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            )}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              {mode === 'signin'
                ? 'Welcome to Saberio AI'
                : mode === 'signup'
                ? 'Create Student Account'
                : mode === 'signup_otp'
                ? 'Verify Your Email'
                : mode === 'forgot_email'
                ? 'Reset Password'
                : mode === 'forgot_otp'
                ? 'Verify 6-Digit Code'
                : mode === 'forgot_new_password'
                ? 'Set New Password'
                : 'Password Reset Complete'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'signin'
                ? 'Sign in to access your quizzes, exams, and AI Tutor'
                : mode === 'signup'
                ? 'Start learning smarter with AI-powered study tools'
                : mode === 'signup_otp'
                ? `Enter the 6-digit code sent to ${email || 'your email'}`
                : mode === 'forgot_email'
                ? 'Enter your email to receive a secure recovery code'
                : mode === 'forgot_otp'
                ? `Enter the 6-digit code sent to ${email || 'your email'}`
                : mode === 'forgot_new_password'
                ? 'Choose a strong password for your Saberio AI account'
                : 'Your password has been successfully updated'}
            </p>
          </div>
        </div>

        {/* Mode Switcher / Navigation */}
        {mode === 'signup_otp' ? (
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              setSuccessMsg(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign Up (Edit Info)</span>
          </button>
        ) : !isForgotFlow ? (
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMsg(null);
                setVerificationNotice(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMsg(null);
                setVerificationNotice(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              New Student (Sign Up)
            </button>
          </div>
        ) : mode !== 'forgot_success' ? (
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setSuccessMsg(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        ) : null}

        {/* Unverified Email Notice Alert */}
        {verificationNotice && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col gap-2 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />
              <p className="leading-relaxed">{verificationNotice}</p>
            </div>
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => {
                  setOtpDigits(['', '', '', '', '', '']);
                  setResendCooldown(60);
                  setOtpAttempts(0);
                  setMode('signup_otp');
                  setError(null);
                }}
                className="self-start text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
              >
                <span>Enter 6-digit verification code &rarr;</span>
              </button>
            )}
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500 mt-0.5" />
            <p className="leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* Google OAuth Button (Shown in Sign In & Sign Up only) */}
        {!isForgotFlow && mode !== 'signup_otp' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-100 font-semibold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition active:scale-[0.99] disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Authentic Official Google Logo SVG */}
                  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                or
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD SUCCESS VIEW */}
        {mode === 'forgot_success' ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Password Updated Successfully
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can now sign in with your new password to access your Saberio AI library.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setPassword('');
                setConfirmPassword('');
                setError(null);
                setSuccessMsg(null);
              }}
              className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md transition hover:scale-[1.01]"
            >
              Sign In with New Password
            </button>
          </div>
        ) : (
          /* Main Auth Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Sign Up only) */}
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Email Field (Sign In, Sign Up, or Forgot Step 1) */}
            {(mode === 'signin' || mode === 'signup' || mode === 'forgot_email') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Student Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* 6-DIGIT OTP INPUT (Signup Step 2 or Forgot Step 2) */}
            {(mode === 'forgot_otp' || mode === 'signup_otp') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'signup_otp' ? 'signup' : 'forgot_email')}
                    className="text-[11px] text-indigo-500 hover:underline"
                  >
                    Change Email
                  </button>
                </div>

                {/* 6 Individual Digit Boxes */}
                <div className="flex items-center justify-between gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={idx === 0 ? 6 : 1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 sm:w-12 sm:h-13 text-center text-lg sm:text-xl font-bold font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      placeholder="•"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                {/* Resend Cooldown Counter */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Didn't receive code?
                  </span>
                  {resendCooldown > 0 ? (
                    <span className="text-slate-400 font-mono text-[11px]">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend code</span>
                    </button>
                  )}
                </div>

                {mode === 'signup_otp' && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center pt-1">
                    Please check your Gmail inbox and spam folder for the verification code.
                  </p>
                )}
              </div>
            )}

            {/* Password Field (Sign In, Sign Up, or Set New Password) */}
            {(mode === 'signin' || mode === 'signup' || mode === 'forgot_new_password') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {mode === 'forgot_new_password' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_email');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field (Sign Up & Set New Password) */}
            {(mode === 'signup' || mode === 'forgot_new_password') && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-500/20 transition disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'signin'
                      ? 'Sign In to Library'
                      : mode === 'signup'
                      ? 'Continue & Send Code'
                      : mode === 'signup_otp'
                      ? 'Verify Code & Create Account'
                      : mode === 'forgot_email'
                      ? 'Send 6-Digit Code'
                      : mode === 'forgot_otp'
                      ? 'Verify Code'
                      : 'Update Password'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation Switchers */}
        {!isForgotFlow && mode !== 'signup_otp' && (
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccessMsg(null);
                    setVerificationNotice(null);
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccessMsg(null);
                    setVerificationNotice(null);
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>
        )}

        {/* Benefits Note */}
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Your quizzes, cheatsheets, and scores sync securely to your private account across Web & Android.</span>
        </div>
      </div>
    </div>
  );
}
