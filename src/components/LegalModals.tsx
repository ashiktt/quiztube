'use client';

import React from 'react';

export type LegalModalType = 'terms' | 'privacy' | 'refund' | null;

interface LegalModalsProps {
  type: LegalModalType;
  onClose: () => void;
}

export function LegalModals({ type, onClose }: LegalModalsProps) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              {type === 'terms' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {type === 'privacy' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {type === 'refund' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {type === 'terms' && 'Terms of Service'}
                {type === 'privacy' && 'Privacy Policy'}
                {type === 'refund' && 'Subscription & Refund Policy'}
              </h2>
              <p className="text-xs text-slate-400">
                Official QuizTube Policies &middot; Last updated: September 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
          {type === 'terms' && (
            <>
              <section className="space-y-2">
                <h3 className="text-base font-semibold text-white">1. Acceptance of Terms</h3>
                <p>
                  By accessing or using the QuizTube website, web application, or official Android APK, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not use our services.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-semibold text-white">2. Educational Use & AI Disclaimers</h3>
                <p>
                  QuizTube utilizes Google Gemini AI models to generate quizzes, summaries, cheatsheets, model exam answers, and conversational tutoring explanations. While we strive for high educational accuracy, AI outputs may contain occasional inaccuracies or hallucinations. Students are encouraged to cross-reference AI-generated solutions with official academic syllabi and textbooks.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-semibold text-white">3. User Quotas & Fair Use</h3>
                <p>
                  Free accounts receive 2 daily successful Quiz AI generations and 2 daily University Question Solver generations calculated in the <span className="text-indigo-300 font-mono">Asia/Kolkata (IST)</span> timezone. Pro accounts receive high AI usage limits designed for intensive personal study. Automated scraping, reverse-engineering, or commercial API reselling of QuizTube endpoints is strictly prohibited.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-semibold text-white">4. User Account & Multi-Device Sync</h3>
                <p>
                  Your account unlocks synchronized access across the web platform and the official Android APK. You are responsible for safeguarding your login credentials.
                </p>
              </section>
            </>
          )}

          {type === 'privacy' && (
            <>
              <section className="space-y-2">
                <h3 className="text-base font-semibold text-white">1. Information We Collect</h3>
                <p>
                  We collect your email address and profile name when you sign in via Supabase authentication. When you generate study sets or ask AI Tutor questions, we process YouTube video URLs, transcript snippets, and student queries to synthesize educational content.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-semibold text-white">2. Data Security & Storage</h3>
                <p>
                  Your study sets and subscription statuses are encrypted and securely stored using Supabase PostgreSQL with Row Level Security (RLS). We never sell your personal data or study history to third parties or advertisers.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-semibold text-white">3. Third-Party AI & Payment Services</h3>
                <p>
                  Content generation requests are securely processed via the Google Gemini API. Payments are handled via Razorpay&apos;s PCI-DSS compliant secure infrastructure. QuizTube never stores your credit card, debit card, or UPI credentials on our servers.
                </p>
              </section>
            </>
          )}

          {type === 'refund' && (
            <>
              <section className="space-y-2">
                <h3 className="text-base font-semibold text-white">1. QuizTube Pro Subscription & Billing</h3>
                <p>
                  QuizTube Pro is priced at <strong className="text-white">₹149 / month</strong> (standard 30-day Pro access period). Subscriptions are activated immediately upon successful payment verification through Razorpay.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-semibold text-white">2. 30-Day Pro Access Validity</h3>
                <p>
                  Each purchase provides a full 30 days of QuizTube Pro benefits including High AI usage limits, Advanced Question Solver, full AI Tutor access, and synchronized multi-device usage.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-semibold text-white">3. Refund Policy</h3>
                <p>
                  If you experience any technical difficulties or are unsatisfied with QuizTube Pro, you may request a refund within <strong className="text-white">48 hours of purchase</strong> by emailing support with your Razorpay payment ID. Refunds are processed back to the original payment method within 5-7 business days.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/20"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
