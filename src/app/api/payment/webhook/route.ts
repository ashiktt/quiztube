import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Signature verification if webhook secret is configured
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('Invalid Razorpay webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const payment = payload.payload?.payment?.entity;
    const notes = payment?.notes || {};
    const userId = notes.userId;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ received: true });
    }

    // Process payment.captured event
    if (event === 'payment.captured' && userId) {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Idempotent insertion
      await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          plan: 'pro',
          status: 'active',
          payment_provider: 'razorpay',
          order_id: payment.order_id,
          payment_id: payment.id,
          amount: payment.amount || 14900,
          currency: payment.currency || 'INR',
          start_date: now.toISOString(),
          expiry_date: expiryDate.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'payment_id' }
      );
    }

    // Process subscription.cancelled or payment.failed
    if ((event === 'subscription.cancelled' || event === 'payment.failed') && userId) {
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'active');
    }

    return NextResponse.json({ received: true, event });
  } catch (error: any) {
    console.error('Razorpay webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
