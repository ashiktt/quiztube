import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userEmail, userName } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User must be authenticated to create a subscription order.' },
        { status: 401 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const amountInPaise = 14900; // ₹149.00

    // If Razorpay live/test API keys are configured, create order via Razorpay API
    if (keyId && keySecret) {
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const orderPayload = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_pro_${Date.now()}`,
        notes: {
          userId,
          userEmail: userEmail || '',
          userName: userName || '',
          plan: 'pro',
          description: 'QuizTube Pro 30-Day Access (₹149/month)',
        },
      };

      const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await razorpayRes.json();

      if (!razorpayRes.ok || !orderData.id) {
        console.error('Razorpay order creation failed:', orderData);
        throw new Error(orderData.error?.description || 'Failed to initialize payment with Razorpay.');
      }

      return NextResponse.json({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId,
        isTestMode: false,
      });
    }

    // Fallback Sandbox Mode (Allows testing & development before production Razorpay keys are supplied)
    const mockOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: 'rzp_test_mock_quiztube',
      isTestMode: true,
      message: 'Running in sandbox payment mode.',
    });
  } catch (error: any) {
    console.error('Create order API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment initiation failed.' },
      { status: 500 }
    );
  }
}
