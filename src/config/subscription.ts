/**
 * QuizTube Subscription & Pro Monetization Configuration
 * 
 * Central switch to enable or disable the entire subscription system.
 * 
 * - When false:
 *   - All PRO and NEW badges are hidden
 *   - Upgrade buttons, pricing, and payment UI are hidden
 *   - Subscription status is hidden from navigation and account menus
 *   - Features like AI Tutor operate freely without paywall restrictions
 *   - The app behaves as a clean, normal free educational product
 * 
 * - When true:
 *   - Restores the full QuizTube Pro subscription system (₹149/month)
 *   - Enables Razorpay payment flows, webhook sync, and quota enforcement
 *   - Restores PRO badges and account subscription tier displays
 */
export const SUBSCRIPTION_ENABLED: boolean = false;

/**
 * Helper to check if subscription system is currently enabled
 */
export function isSubscriptionActive(): boolean {
  return SUBSCRIPTION_ENABLED;
}
