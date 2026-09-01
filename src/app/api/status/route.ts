import { NextResponse } from 'next/server';

export async function GET() {
  const hasServerKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0
  );

  return NextResponse.json({
    hasServerKey,
    status: 'ok',
  });
}
