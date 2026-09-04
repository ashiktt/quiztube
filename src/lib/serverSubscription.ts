import { getSupabaseClient } from './supabase';
import { AiFeatureType, UserPlan, UserSubscription, UserUsageSummary } from '@/types';
import { isUserAdmin } from '@/config/admin';

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
    // Fallback if Intl timeZone is unsupported
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + 5.5 * 3600000);
    return istTime.toISOString().split('T')[0];
  }
}

/**
 * Check if student has an active QuizTube Pro subscription or Admin access
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
  // 1. Check if email matches Admin Whitelist (e.g., akm007ab@gmail.com)
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

  const supabase = getSupabaseClient();
  if (!supabase || !userId) {
    return { isPro: false, plan: 'free', subscription: null };
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { isPro: false, plan: 'free', subscription: null };
    }

    // Check expiry
    if (data.expiry_date && new Date(data.expiry_date).getTime() < Date.now()) {
      // Mark as expired in background
      await supabase
        .from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', data.id);

      return { isPro: false, plan: 'free', subscription: null };
    }

    const sub: UserSubscription = {
      id: data.id,
      userId: data.user_id,
      plan: 'pro',
      status: data.status,
      paymentProvider: data.payment_provider,
      orderId: data.order_id,
      paymentId: data.payment_id,
      subscriptionId: data.subscription_id,
      amount: data.amount || 14900,
      currency: data.currency || 'INR',
      startDate: data.start_date || data.created_at,
      expiryDate: data.expiry_date,
      autoRenew: data.auto_renew,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { isPro: true, plan: 'pro', subscription: sub };
  } catch (err) {
    console.error('Error querying subscription:', err);
    return { isPro: false, plan: 'free', subscription: null };
  }
}

/**
 * Get comprehensive usage summary for a user
 */
export async function getUserUsageSummary(
  userId?: string,
  userEmail?: string
): Promise<UserUsageSummary> {
  const dateStr = getKolkataDateString();

  // Admin whitelist check (akm007ab@gmail.com)
  if (userEmail && isUserAdmin(userEmail)) {
    const { subscription } = await checkUserSubscription(userId, userEmail);
    return {
      userId,
      userEmail,
      plan: 'pro',
      isPro: true,
      isAdmin: true,
      subscription,
      quizAiUsed: 0,
      quizAiLimit: 1000,
      quizAiRemaining: 1000,
      questionSolverUsed: 0,
      questionSolverLimit: 1000,
      questionSolverRemaining: 1000,
      tutorAllowed: true,
      timezone: 'Asia/Kolkata',
      date: dateStr,
    };
  }

  if (!userId) {
    return {
      plan: 'free',
      isPro: false,
      subscription: null,
      quizAiUsed: 0,
      quizAiLimit: 2,
      quizAiRemaining: 2,
      questionSolverUsed: 0,
      questionSolverLimit: 2,
      questionSolverRemaining: 2,
      tutorAllowed: false,
      timezone: 'Asia/Kolkata',
      date: dateStr,
    };
  }

  const { isPro, plan, subscription, isAdmin } = await checkUserSubscription(userId, userEmail);

  if (isPro) {
    return {
      userId,
      userEmail,
      plan: 'pro',
      isPro: true,
      isAdmin: Boolean(isAdmin),
      subscription,
      quizAiUsed: 0,
      quizAiLimit: isAdmin ? 1000 : 100, // Reasonable fair-use limit
      quizAiRemaining: isAdmin ? 1000 : 100,
      questionSolverUsed: 0,
      questionSolverLimit: isAdmin ? 1000 : 100, // Reasonable fair-use limit
      questionSolverRemaining: isAdmin ? 1000 : 100,
      tutorAllowed: true,
      timezone: 'Asia/Kolkata',
      date: dateStr,
    };
  }

  const supabase = getSupabaseClient();
  let quizUsed = 0;
  let solverUsed = 0;

  if (supabase) {
    try {
      const { data } = await supabase
        .from('daily_ai_usage')
        .select('feature_type, prompt_count')
        .eq('user_id', userId)
        .eq('usage_date', dateStr);

      if (data && data.length > 0) {
        data.forEach(item => {
          if (item.feature_type === 'quiz_ai') quizUsed = item.prompt_count;
          if (item.feature_type === 'question_solver') solverUsed = item.prompt_count;
        });
      }
    } catch (err) {
      console.error('Error fetching usage counts:', err);
    }
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
    tutorAllowed: false,
    timezone: 'Asia/Kolkata',
    date: dateStr,
  };
}

/**
 * Check and reserve quota before calling Gemini API
 * Returns allowed = true if request can proceed.
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

  // Custom user API key bypasses server limits
  if (hasCustomApiKey) {
    return { allowed: true, isPro: true };
  }

  // Admin access whitelist check (e.g., akm007ab@gmail.com)
  if (userEmail && isUserAdmin(userEmail)) {
    return { allowed: true, isPro: true, isAdmin: true };
  }

  // Must be signed in to access server AI quotas
  if (!userId) {
    return {
      allowed: false,
      reason: 'auth_required',
      message: 'Please sign in to QuizTube to use your free daily AI prompts.',
    };
  }

  // Check Pro subscription / Admin status
  const { isPro, isAdmin } = await checkUserSubscription(userId, userEmail);

  // AI Tutor is exclusive to QuizTube Pro
  if (featureType === 'tutor') {
    if (isPro) {
      return { allowed: true, isPro: true, isAdmin };
    }
    return {
      allowed: false,
      reason: 'pro_required',
      message: 'QuizTube AI Tutor is a Pro feature. Upgrade to QuizTube Pro (₹149/month) for 24/7 AI tutoring.',
    };
  }

  // Pro users have high fair-use limits
  if (isPro) {
    return { allowed: true, isPro: true, isAdmin };
  }

  // Free Tier: Enforce 2 prompts / day limit in Asia/Kolkata timezone
  const dateStr = getKolkataDateString();
  const supabase = getSupabaseClient();
  const limit = 2;

  if (!supabase) {
    // If Supabase is unreachable, allow with caution
    return { allowed: true, isPro: false, remaining: 1, limit };
  }

  try {
    // Check current usage count
    const { data: usageRow } = await supabase
      .from('daily_ai_usage')
      .select('prompt_count')
      .eq('user_id', userId)
      .eq('feature_type', featureType)
      .eq('usage_date', dateStr)
      .maybeSingle();

    const currentCount = usageRow?.prompt_count || 0;

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
    const { error: rpcError } = await supabase.rpc('increment_daily_usage', {
      p_user_id: userId,
      p_feature_type: featureType,
      p_usage_date: dateStr,
    });

    // If RPC is missing, fallback to direct upsert
    if (rpcError) {
      await supabase
        .from('daily_ai_usage')
        .upsert(
          {
            user_id: userId,
            feature_type: featureType,
            usage_date: dateStr,
            prompt_count: currentCount + 1,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,feature_type,usage_date' }
        );
    }

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

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const dateStr = getKolkataDateString();

  try {
    const { error: rpcError } = await supabase.rpc('decrement_daily_usage', {
      p_user_id: userId,
      p_feature_type: featureType,
      p_usage_date: dateStr,
    });

    if (rpcError) {
      // Fallback
      const { data } = await supabase
        .from('daily_ai_usage')
        .select('prompt_count')
        .eq('user_id', userId)
        .eq('feature_type', featureType)
        .eq('usage_date', dateStr)
        .maybeSingle();

      if (data && data.prompt_count > 0) {
        await supabase
          .from('daily_ai_usage')
          .update({
            prompt_count: Math.max(0, data.prompt_count - 1),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('feature_type', featureType)
          .eq('usage_date', dateStr);
      }
    }
  } catch (err) {
    console.error('Error rolling back quota:', err);
  }
}
