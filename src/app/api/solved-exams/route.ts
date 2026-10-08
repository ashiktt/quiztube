import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { SolvedExam } from '@/models/SolvedExam';
import { getAuthenticatedUser } from '@/lib/serverSubscription';
import { UniversitySolvedExam } from '@/types';

// Helper to map Mongoose doc to UniversitySolvedExam
function mapDocToSolvedExam(doc: any): UniversitySolvedExam {
  return {
    id: doc.id,
    userId: doc.userId || undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    subject: doc.subject || 'University Examination',
    academicLevel: doc.academicLevel || 'Undergraduate',
    totalMarks: Number(doc.totalMarks) || 0,
    rawQuestionsText: doc.rawQuestionsText || '',
    overallExamSummary: doc.overallExamSummary || '',
    solutions: Array.isArray(doc.solutions) ? doc.solutions : [],
  };
}

/**
 * GET /api/solved-exams?userId=...
 * Fetches solved exam papers from MongoDB
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const userId = authUser?.id || searchParams.get('userId');

    let filter: any = {};
    if (userId) {
      filter = { $or: [{ userId }, { userId: null }, { userId: { $exists: false } }] };
    }

    const docs = await SolvedExam.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const solvedExams = docs.map(mapDocToSolvedExam);
    return NextResponse.json({ connected: true, solvedExams });
  } catch (err: any) {
    console.error('API /api/solved-exams GET error:', err);
    return NextResponse.json({ connected: false, error: err.message, solvedExams: [] }, { status: 500 });
  }
}

/**
 * POST /api/solved-exams
 * Upserts a solved exam paper in MongoDB
 */
export async function POST(req: NextRequest) {
  try {
    const exam: UniversitySolvedExam = await req.json();
    if (!exam || !exam.id || !exam.subject) {
      return NextResponse.json({ error: 'Invalid solved exam payload' }, { status: 400 });
    }

    await connectDB();
    const authUser = await getAuthenticatedUser(req);

    const updateData: any = {
      id: exam.id,
      subject: exam.subject,
      academicLevel: exam.academicLevel || 'Undergraduate',
      totalMarks: exam.totalMarks || 0,
      rawQuestionsText: exam.rawQuestionsText || '',
      overallExamSummary: exam.overallExamSummary || '',
      solutions: exam.solutions || [],
    };

    if (authUser?.id) {
      updateData.userId = authUser.id;
    } else if (exam.userId) {
      updateData.userId = exam.userId;
    }

    const updatedDoc = await SolvedExam.findOneAndUpdate(
      { id: exam.id },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      connected: true,
      saved: true,
      solvedExam: mapDocToSolvedExam(updatedDoc),
    });
  } catch (err: any) {
    console.error('API /api/solved-exams POST error:', err);
    return NextResponse.json({ connected: false, saved: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/solved-exams?id=...
 * Deletes a solved exam paper from MongoDB
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing solved exam id' }, { status: 400 });
    }

    await connectDB();
    await SolvedExam.deleteOne({ id });

    return NextResponse.json({ connected: true, deleted: true });
  } catch (err: any) {
    console.error('API /api/solved-exams DELETE error:', err);
    return NextResponse.json({ connected: false, deleted: false, error: err.message }, { status: 500 });
  }
}
