import { NextRequest } from 'next/server';
import { connectDB } from './mongodb';
import { verifyToken } from './jwt';
import { User, Subscription, DailyUsage } from '@/models';
import { AiFeatureType, UserPlan, UserSubscription, UserUsageSummary } from '@/types';
import { isUserAdmin } from '@/config/admin';
import { SUBSCRIPTION_ENABLED } from '@/config/subscription';

/**
 * Verifies JWT token from incoming request Authorization header or Cookie.
 * Returns the authentic user ID and email verified via MongoDB.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<{
  id: string;
  email?: string;
  fullName?: string;
  isAdmin: boolean;
} | null> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  let token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;

  // Fallback to cookie if present
  if (!token) {
    token = req.cookies.get('saberio_auth_token')?.value || null;
  }

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return null;
    }

    await connectDB();
    const user = await User.findById(payload.userId).select('name email isAdmin');
    if (!user) {
      return null;
    }

    const email = user.email || payload.email || '';
    const fullName = user.name || payload.fullName || email.split('@')[0];
    const isAdmin = user.isAdmin || isUserAdmin(email);

    return {
      id: user._id.toString(),
      email,
      fullName,
      isAdmin,
    };
  } catch (err) {
    console.error('getAuthenticatedUser error:', err);
    return null;
  }
}

/**
 * Returns today's date in Asia/Kolkata (IST, UTC+5:30) timezone in 'YYYY-MM-DD' format
 */
export function getKolkataDateString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + 5.5 * 3600000);
    return istTime.toISOString().split('T')[0];
  }
}

/**
 * Check if student has an active Saberio AI Pro subscription or Admin access in MongoDB
 */
export async function checkUserSubscription(
  userId?: string,
  userEmail?: string
): Promise<{
  isPro: boolean;
  plan: UserPlan;
  isAdmin?: boolean;
  subscription: UserSubscription | null;
}> {
  // 1. Check if email matches Admin Whitelist
  if (userEmail && isUserAdmin(userEmail)) {
    const adminSub: UserSubscription = {
      id: `sub_admin_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      userId: userId || 'admin',
      plan: 'pro',
      status: 'active',
      paymentProvider: 'manual',
      amount: 0,
      currency: 'INR',
      startDate: new Date().toISOString(),
      expiryDate: '2099-12-31T23:59:59.999Z',
      autoRenew: true,
      isAdmin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { isPro: true, plan: 'pro', isAdmin: true, subscription: adminSub };
  }

  if (!userId) {
    return { isPro: false, plan: 'free', subscription: null };
  }

  try {
    await connectDB();
    const data = await Subscription.findOne({
      userId,
      status: 'active',
    }).sort({ createdAt: -1 });

    if (!data) {
      return { isPro: false, plan: 'free', subscription: null };
    }

    // Check expiry
    if (data.expiryDate && new Date(data.expiryDate).getTime() < Date.now()) {
      data.status = 'expired';
      await data.save();
      return { isPro: false, plan: 'free', subscription: null };
    }

    const sub: UserSubscription = {
      id: data.id || data._id.toString(),
      userId: data.userId,
      plan: 'pro',
      status: data.status,
      paymentProvider: (data.paymentProvider as any) || 'razorpay',
      orderId: data.orderId || '',
      paymentId: data.paymentId || '',
      amount: data.amount ?? 0,
      currency: data.currency || 'INR',
      startDate: data.startDate?.toISOString() || new Date().toISOString(),
      expiryDate: data.expiryDate?.toISOString() || new Date().toISOString(),
      autoRenew: Boolean(data.autoRenew),
      isAdmin: false,
      createdAt: data.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toISOString() || new Date().toISOString(),
    };

    return { isPro: true, plan: 'pro', isAdmin: false, subscription: sub };
  } catch (err) {
    console.error('Error checking user subscription:', err);
    return { isPro: false, plan: 'free', subscription: null };
  }
}

/**
 * Get comprehensive daily AI quota summary for student
 */
export async function getDailyUsageSummary(
  userId?: string,
  userEmail?: string
): Promise<UserUsageSummary> {
  const dateStr = getKolkataDateString();

  if (!userId) {
    return {
      userId: undefined,
      userEmail,
      plan: 'free',
      isPro: false,
      isAdmin: false,
      subscription: null,
      quizAiUsed: 0,
      quizAiLimit: 2,
      quizAiRemaining: 2,
      questionSolverUsed: 0,
      questionSolverLimit: 2,
      questionSolverRemaining: 2,
      tutorAllowed: !SUBSCRIPTION_ENABLED,
      timezone: 'Asia/Kolkata',
      date: dateStr,
    };
  }

  const { isPro, plan, isAdmin, subscription } = await checkUserSubscription(userId, userEmail);

  if (isPro) {
    return {
      userId,
      userEmail,
      plan,
      isPro: true,
      isAdmin: Boolean(isAdmin),
      subscription,
      quizAiUsed: 0,
      quizAiLimit: isAdmin ? 1000 : 100,
      quizAiRemaining: isAdmin ? 1000 : 100,
      questionSolverUsed: 0,
      questionSolverLimit: isAdmin ? 1000 : 100,
      questionSolverRemaining: isAdmin ? 1000 : 100,
      tutorAllowed: true,
      timezone: 'Asia/Kolkata',
      date: dateStr,
    };
  }

  let quizUsed = 0;
  let solverUsed = 0;

  try {
    await connectDB();
    const data = await DailyUsage.find({
      userId,
      usageDate: dateStr,
    });

    if (data && data.length > 0) {
      data.forEach((item) => {
        if (item.featureType === 'quiz_ai') quizUsed = item.promptCount;
        if (item.featureType === 'question_solver') solverUsed = item.promptCount;
      });
    }
  } catch (err) {
    console.error('Error fetching usage counts:', err);
  }

  return {
    userId,
    userEmail,
    plan: 'free',
    isPro: false,
    isAdmin: false,
    subscription: null,
    quizAiUsed: quizUsed,
    quizAiLimit: 2,
    quizAiRemaining: Math.max(0, 2 - quizUsed),
    questionSolverUsed: solverUsed,
    questionSolverLimit: 2,
    questionSolverRemaining: Math.max(0, 2 - solverUsed),
    tutorAllowed: !SUBSCRIPTION_ENABLED,
    timezone: 'Asia/Kolkata',
    date: dateStr,
  };
}

export const getUserUsageSummary = getDailyUsageSummary;

/**
 * Check and reserve quota before calling Gemini API
 */
export async function checkAndReserveDailyQuota(params: {
  userId?: string;
  userEmail?: string;
  featureType: AiFeatureType;
  hasCustomApiKey?: boolean;
}): Promise<{
  allowed: boolean;
  isPro?: boolean;
  isAdmin?: boolean;
  currentUsed?: number;
  remaining?: number;
  limit?: number;
  reason?: 'limit_reached' | 'pro_required' | 'auth_required';
  message?: string;
}> {
  const { userId, userEmail, featureType, hasCustomApiKey } = params;

  if (hasCustomApiKey) {
    return { allowed: true, isPro: true };
  }

  if (userEmail && isUserAdmin(userEmail)) {
    return { allowed: true, isPro: true, isAdmin: true };
  }

  if (!userId) {
    return {
      allowed: false,
      reason: 'auth_required',
      message: 'Please sign in to Saberio AI to use your free daily AI prompts.',
    };
  }

  const { isPro, isAdmin } = await checkUserSubscription(userId, userEmail);

  if (!SUBSCRIPTION_ENABLED) {
    return { allowed: true, isPro: false, isAdmin };
  }

  if (featureType === 'tutor') {
    if (isPro) {
      return { allowed: true, isPro: true, isAdmin };
    }
    return {
      allowed: false,
      reason: 'pro_required',
      message: 'Saberio AI Tutor is a Pro feature. Upgrade to Pro (₹149/month) for 24/7 AI tutoring.',
    };
  }

  if (isPro) {
    return { allowed: true, isPro: true, isAdmin };
  }

  // Free Tier: Enforce 2 prompts / day limit in Asia/Kolkata timezone
  const dateStr = getKolkataDateString();
  const limit = 2;

  try {
    await connectDB();
    const usageRow = await DailyUsage.findOne({
      userId,
      featureType,
      usageDate: dateStr,
    });

    const currentCount = usageRow?.promptCount || 0;

    if (currentCount >= limit) {
      const featureName = featureType === 'quiz_ai' ? 'Quiz AI' : 'Question Solver';
      return {
        allowed: false,
        reason: 'limit_reached',
        currentUsed: currentCount,
        remaining: 0,
        limit,
        message: `You've used your 2 free ${featureName} prompts for today. Upgrade to Pro (₹149/month) for higher AI usage.`,
      };
    }

    // Atomically increment usage
    await DailyUsage.findOneAndUpdate(
      { userId, featureType, usageDate: dateStr },
      { $inc: { promptCount: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return {
      allowed: true,
      isPro: false,
      currentUsed: currentCount + 1,
      remaining: Math.max(0, limit - (currentCount + 1)),
      limit,
    };
  } catch (err) {
    console.error('Error reserving daily quota:', err);
    return { allowed: true, isPro: false, remaining: 1, limit };
  }
}

/**
 * Rollback daily quota if AI generation fails
 */
export async function rollbackDailyQuota(params: {
  userId?: string;
  featureType: AiFeatureType;
}): Promise<void> {
  const { userId, featureType } = params;
  if (!userId) return;

  const dateStr = getKolkataDateString();

  try {
    await connectDB();
    await DailyUsage.findOneAndUpdate(
      { userId, featureType, usageDate: dateStr, promptCount: { $gt: 0 } },
      { $inc: { promptCount: -1 } }
    );
  } catch (err) {
    console.error('Error rolling back quota:', err);
  }
}
