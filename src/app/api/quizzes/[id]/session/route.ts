import { NextRequest, NextResponse } from 'next/server';
import { getQuiz, createSession, getSession, StudentSession } from '@/lib/db';

function generateSessionId(): string {
  return 'SESS_' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quiz = await getQuiz(id);

    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    const body = await req.json();
    const { studentName, studentEmail } = body;

    if (!studentName || typeof studentName !== 'string' || !studentName.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    if (!studentEmail || typeof studentEmail !== 'string' || !studentEmail.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const sessionId = generateSessionId();
    const startedAt = new Date().toISOString();

    const newSession: StudentSession = {
      id: sessionId,
      quizId: id,
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim(),
      startedAt
    };

    await createSession(newSession);

    // Sanitize questions for student view
    const sanitizedQuestions = quiz.questions.map(({ id, text, options }) => ({
      id,
      text,
      options
    }));

    return NextResponse.json({
      success: true,
      sessionId,
      startedAt,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        duration: quiz.duration,
        questions: sanitizedQuestions
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    const session = await getSession(sessionId);

    if (!session || session.quizId !== id) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session' }, { status: 404 });
    }

    const quiz = await getQuiz(id);
    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    // Calculate elapsed time and time remaining
    const startTime = new Date(session.startedAt).getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
    
    const limitSeconds = quiz.duration * 60;
    const timeLeft = quiz.duration > 0
      ? Math.max(0, limitSeconds - elapsedSeconds)
      : null;

    // Sanitize questions for student view
    const sanitizedQuestions = quiz.questions.map(({ id, text, options }) => ({
      id,
      text,
      options
    }));

    return NextResponse.json({
      success: true,
      studentName: session.studentName,
      studentEmail: session.studentEmail,
      startedAt: session.startedAt,
      timeLeft,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        duration: quiz.duration,
        questions: sanitizedQuestions
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
