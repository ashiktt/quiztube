/**
 * Secure Email Delivery Service
 * Dispatches verification codes and notifications using configured server providers.
 * Never logs credentials, secrets, or OTPs.
 */

export async function sendOtpEmail(toEmail: string, otp: string): Promise<{ sent: boolean; reason?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.EMAIL_FROM?.trim() || 'Saberio AI <noreply@saberio.app>';

  // 1. Resend API Integration (Standard for Next.js on Vercel)
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: 'Your Saberio AI Verification Code',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #080D0B; color: #F8FAFC; border-radius: 16px; border: 1px solid #10B98140;">
              <h2 style="color: #10B981; margin-top: 0;">Saberio AI Password Reset</h2>
              <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">You requested a password reset for your Saberio AI student account. Use the 6-digit verification code below to proceed:</p>
              <div style="text-align: center; margin: 24px 0;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #34D399; background: #0c102b; padding: 12px 28px; border-radius: 12px; border: 1px solid #10B98160;">${otp}</span>
              </div>
              <p style="color: #94A3B8; font-size: 12px;">This code will expire in <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
              <hr style="border: 0; border-top: 1px solid #10B98120; margin: 20px 0;" />
              <p style="color: #64748B; font-size: 11px; text-align: center;">Saberio AI &middot; Autonomous Academic Intelligence</p>
            </div>
          `,
        }),
      });

      if (response.ok) {
        return { sent: true };
      }

      const errData = await response.json().catch(() => ({}));
      console.error('[Email Service] Resend API error response:', errData?.message || response.status);
      return { sent: false, reason: 'Provider rejected message delivery' };
    } catch (err: any) {
      console.error('[Email Service] Failed to send email via Resend:', err?.message || err);
      return { sent: false, reason: 'Network failure communicating with email provider' };
    }
  }

  // 2. Fallback when no provider credentials are configured
  console.warn(
    '[Email Service] Notice: Neither RESEND_API_KEY nor SMTP credentials are configured. ' +
    'To send live emails, configure RESEND_API_KEY in your environment variables.'
  );

  return {
    sent: false,
    reason: 'Email provider credentials not configured on the server',
  };
}
