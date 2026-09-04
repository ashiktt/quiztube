'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
  ArrowRight,
  X,
  CreditCard,
  Lock,
  Star,
  Brain,
  GraduationCap,
  Award,
  BookOpen,
} from 'lucide-react';
import { StudentUser } from '@/types';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: StudentUser | null;
  user?: StudentUser | null;
  onOpenAuthModal?: () => void;
  onPaymentSuccess?: () => void;
  onUpgradeSuccess?: () => void;
  featureTriggerName?: string;
}

const PRO_FEATURES = [
  {
    title: 'High AI Usage Limits',
    desc: 'Generate quizzes from full-length university lectures with higher fair-use capacity.',
    icon: '⚡',
  },
  {
    title: 'Advanced Question Solver',
    desc: 'Step-by-step model solutions (2, 5, 10, 15 Marks), Mermaid diagrams & examiner scoring criteria.',
    icon: '📝',
  },
  {
    title: 'Full AI Tutor Access',
    desc: '24/7 Socratic mentor, mistake diagnosis, ELI5 simple analogies, and voice input.',
    icon: '🧠',
  },
  {
    title: 'AI Flashcards & Smart Revision',
    desc: 'Active-recall spaced repetition deck generation with mastery tracking.',
    icon: '📇',
  },
  {
    title: 'Visual Flowcharts & Cheatsheets',
    desc: 'Interactive Mermaid architecture charts, printable formula booklets, and PDF exports.',
    icon: '📊',
  },
  {
    title: 'IELTS English Speaking Practice',
    desc: 'Interactive voice practice with real-time pronunciation and academic feedback.',
    icon: '🗣️',
  },
];

export function ProUpgradeModal({
  isOpen,
  onClose,
  currentUser,
  user,
  onOpenAuthModal,
  onPaymentSuccess,
  onUpgradeSuccess,
  featureTriggerName,
}: ProUpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeStudent = currentUser ?? user ?? null;
  const notifySuccess = onUpgradeSuccess ?? onPaymentSuccess;

  if (!isOpen) return null;

  const handleUpgradeClick = async () => {
    if (!activeStudent) {
      onClose();
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Create Order on Backend
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeStudent.id,
          userEmail: activeStudent.email,
          userName: activeStudent.fullName,
          plan: 'pro',
          period: 'monthly_30d',
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment order.');
      }

      // 2. If Sandbox Demo Mode (when live Razorpay keys are not yet provided)
      if (orderData.isTestMode) {
        // Direct sandbox confirmation
        const verifyRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: activeStudent.id,
            userEmail: activeStudent.email,
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_sandbox_${Date.now()}`,
            razorpay_signature: 'sandbox_verified_signature',
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          if (notifySuccess) notifySuccess();
          onClose();
          return;
        }
      }

      // 3. Load Razorpay Checkout Script
      const loadScript = () => {
        return new Promise<boolean>(resolve => {
          if ((window as any).Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const scriptLoaded = await loadScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load payment gateway. Please check your internet connection.');
      }

      // 4. Open Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'QuizTube AI',
        description: 'QuizTube Pro 30-Day Subscription (₹149/month)',
        image: '/icon-192.png',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: activeStudent.id,
                userEmail: activeStudent.email,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              if (notifySuccess) notifySuccess();
              onClose();
            } else {
              setErrorMessage(verifyData.error || 'Payment verification failed.');
            }
          } catch (err: any) {
            setErrorMessage(err.message || 'Verification error.');
          }
        },
        prefill: {
          name: activeStudent.fullName || '',
          email: activeStudent.email || '',
        },
        theme: {
          color: '#4f46e5',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Payment initiation error:', err);
      setErrorMessage(err.message || 'Payment initiation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Hero Gradient Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-tr from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden shrink-0">
          <div className="space-y-2 relative z-10 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-amber-950 font-extrabold text-[10px] uppercase tracking-wider rounded-full shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>QuizTube Pro</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Unlock the full QuizTube AI learning experience.
            </h2>

            {featureTriggerName && (
              <p className="text-xs text-amber-200 font-semibold flex items-center gap-1">
                <span>{featureTriggerName} is available with QuizTube Pro.</span>
              </p>
            )}

            <div className="flex items-baseline gap-2 pt-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight">₹149</span>
              <span className="text-sm text-indigo-200 font-medium">/ month (30 days access)</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Features Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Everything Included in QuizTube Pro:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRO_FEATURES.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{feat.icon}</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {feat.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Comparison Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2.5 text-xs">
            <div className="grid grid-cols-3 font-bold border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-slate-500">Feature</span>
              <span className="text-slate-600 dark:text-slate-400 text-center">Free (₹0)</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-center">Pro (₹149/mo)</span>
            </div>

            <div className="grid grid-cols-3 text-[11px] py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300">Quiz AI</span>
              <span className="text-center text-slate-500">2 prompts/day</span>
              <span className="text-center font-bold text-emerald-600 dark:text-emerald-400">High Limits</span>
            </div>

            <div className="grid grid-cols-3 text-[11px] py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300">Question Solver</span>
              <span className="text-center text-slate-500">2 prompts/day</span>
              <span className="text-center font-bold text-emerald-600 dark:text-emerald-400">Advanced 15M</span>
            </div>

            <div className="grid grid-cols-3 text-[11px] py-1">
              <span className="text-slate-700 dark:text-slate-300">24/7 AI Tutor</span>
              <span className="text-center text-slate-400">—</span>
              <span className="text-center font-bold text-emerald-600 dark:text-emerald-400">Full Access</span>
            </div>
          </div>

          {/* Secure Trust Guarantee */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Instant Activation on Web & APK</span>
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Razorpay 256-Bit SSL Secure</span>
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 transition text-center"
          >
            Maybe Later
          </button>

          <button
            type="button"
            onClick={handleUpgradeClick}
            disabled={isLoading}
            className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Processing...' : 'Upgrade to Pro — ₹149/month'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
