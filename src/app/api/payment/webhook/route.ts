import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { Subscription } from '@/models/Subscription';

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

    await connectDB();

    // Process payment.captured event
    if (event === 'payment.captured' && userId) {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      await Subscription.findOneAndUpdate(
        { paymentId: payment.id },
        {
          $set: {
            id: subId,
            userId,
            plan: 'pro',
            status: 'active',
            paymentProvider: 'razorpay',
            orderId: payment.order_id,
            paymentId: payment.id,
            amount: payment.amount || 14900,
            currency: payment.currency || 'INR',
            startDate: now,
            expiryDate,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Process subscription.cancelled or payment.failed
    if ((event === 'subscription.cancelled' || event === 'payment.failed') && userId) {
      await Subscription.updateMany(
        { userId, status: 'active' },
        { $set: { status: 'cancelled' } }
      );
    }

    return NextResponse.json({ received: true, event });
  } catch (error: any) {
    console.error('Razorpay webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
