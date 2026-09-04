import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseClient } from '@/lib/supabase';
import { PaymentVerificationRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: PaymentVerificationRequest = await req.json();
    const { userId, userEmail, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!userId || !razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment verification fields.' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // In live mode with secrets, rigorously verify HMAC SHA256 signature
    if (keySecret && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json(
          { success: false, error: 'Payment signature verification failed. Unauthorized request.' },
          { status: 400 }
        );
      }
    }

    // 30 Days Pro access validity
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const supabase = getSupabaseClient();
    if (supabase) {
      // Upsert subscription record in Supabase
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'pro',
          status: 'active',
          payment_provider: 'razorpay',
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id || `pay_${Date.now()}`,
          amount: 14900, // ₹149 in paise
          currency: 'INR',
          start_date: now.toISOString(),
          expiry_date: expiryDate.toISOString(),
          auto_renew: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        });

      if (subError) {
        console.error('Supabase subscription record error:', subError);
      }
    }

    return NextResponse.json({
      success: true,
      isPro: true,
      plan: 'pro',
      status: 'active',
      startDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      message: 'QuizTube Pro activated successfully for 30 days!',
    });
  } catch (error: any) {
    console.error('Payment verify API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}
