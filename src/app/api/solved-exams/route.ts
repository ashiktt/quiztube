import { NextRequest, NextResponse } from 'next/server';
import { connectDB, isValidId, sanitizeQueryInput } from '@/lib/mongodb';
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
 * GET /api/solved-exams
 * Fetches solved exam papers strictly for the authenticated student
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { connected: false, error: 'Authentication required to access solved exams' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const targetUserIdParam = searchParams.get('userId');

    let targetUserId = authUser.id;
    if (authUser.isAdmin && targetUserIdParam) {
      const sanitized = sanitizeQueryInput(targetUserIdParam);
      if (isValidId(sanitized)) {
        targetUserId = sanitized;
      }
    }

    const docs = await SolvedExam.find({ userId: targetUserId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const solvedExams = docs.map(mapDocToSolvedExam);
    return NextResponse.json({ connected: true, solvedExams });
  } catch (err: any) {
    console.error('API /api/solved-exams GET error:', err);
    return NextResponse.json(
      { connected: false, error: err.message || 'Failed to fetch solved exams', solvedExams: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/solved-exams
 * Upserts a solved exam paper strictly bound to the authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { connected: false, error: 'Authentication required to save solved exams' },
        { status: 401 }
      );
    }

    const exam: UniversitySolvedExam = await req.json().catch(() => null);
    if (!exam || !exam.id || !exam.subject) {
      return NextResponse.json({ error: 'Invalid solved exam payload' }, { status: 400 });
    }

    if (!isValidId(exam.id)) {
      return NextResponse.json({ error: 'Invalid solved exam ID format' }, { status: 400 });
    }

    await connectDB();

    // Check ownership before overwriting an existing solved exam
    const existing = await SolvedExam.findOne({ id: exam.id });
    if (existing && existing.userId && existing.userId !== authUser.id && !authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to modify this solved exam' },
        { status: 403 }
      );
    }

    const updateData: any = {
      id: exam.id,
      userId: authUser.id, // Strictly bound to authenticated session
      subject: typeof exam.subject === 'string' ? exam.subject.slice(0, 200) : 'University Examination',
      academicLevel: exam.academicLevel || 'Undergraduate',
      totalMarks: Number(exam.totalMarks) || 0,
      rawQuestionsText: typeof exam.rawQuestionsText === 'string' ? exam.rawQuestionsText : '',
      overallExamSummary: typeof exam.overallExamSummary === 'string' ? exam.overallExamSummary : '',
      solutions: Array.isArray(exam.solutions) ? exam.solutions : [],
    };

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
    return NextResponse.json(
      { connected: false, saved: false, error: err.message || 'Failed to save solved exam' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/solved-exams?id=...
 * Deletes a solved exam paper with strict ownership verification
 */
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { connected: false, error: 'Authentication required to delete solved exams' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get('id');
    const id = sanitizeQueryInput(rawId);

    if (!id || !isValidId(id)) {
      return NextResponse.json({ error: 'Valid solved exam ID is required' }, { status: 400 });
    }

    await connectDB();

    const existing = await SolvedExam.findOne({ id });
    if (!existing) {
      return NextResponse.json({ error: 'Solved exam not found' }, { status: 404 });
    }

    if (existing.userId && existing.userId !== authUser.id && !authUser.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete this solved exam' },
        { status: 403 }
      );
    }

    await SolvedExam.deleteOne({ id });

    return NextResponse.json({ connected: true, deleted: true });
  } catch (err: any) {
    console.error('API /api/solved-exams DELETE error:', err);
    return NextResponse.json(
      { connected: false, deleted: false, error: err.message || 'Failed to delete solved exam' },
      { status: 500 }
    );
  }
}
