import { NextResponse } from 'next/server';
import { connectDB, isMongoConfigured } from '@/lib/mongodb';

export async function GET() {
  const hasServerKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0
  );

  let mongoStatus = 'unconfigured';
  if (isMongoConfigured()) {
    try {
      await connectDB();
      mongoStatus = 'connected';
    } catch {
      mongoStatus = 'disconnected';
    }
  }

  return NextResponse.json({
    hasServerKey,
    mongoStatus,
    status: 'ok',
  });
}
