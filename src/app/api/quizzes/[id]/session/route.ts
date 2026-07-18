import { NextRequest, NextResponse } from 'next/server';
import { getQuiz, createSession, getSession, StudentSession, hasStudentSubmitted } from '@/lib/db';

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

    // Date availability validation
    const now = new Date();
    if (quiz.startDate && new Date(quiz.startDate) > now) {
      const formattedDate = new Date(quiz.startDate).toLocaleString();
      return NextResponse.json({ 
        success: false, 
        error: `This quiz is not available yet. It will open on ${formattedDate}.` 
      }, { status: 403 });
    }
    if (quiz.endDate && new Date(quiz.endDate) < now) {
      const formattedDate = new Date(quiz.endDate).toLocaleString();
      return NextResponse.json({ 
        success: false, 
        error: `This quiz has closed. The deadline was ${formattedDate}.` 
      }, { status: 403 });
    }

    const body = await req.json();
    const { studentName, rollNumber } = body;

    if (!studentName || typeof studentName !== 'string' || !studentName.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    if (!rollNumber || typeof rollNumber !== 'string' || !rollNumber.trim()) {
      return NextResponse.json({ success: false, error: 'Roll number is required' }, { status: 400 });
    }

    // Check for duplicate submission (anti-retake check)
    const hasSubmitted = await hasStudentSubmitted(id, rollNumber);
    if (hasSubmitted) {
      return NextResponse.json({
        success: false,
        error: `Roll Number "${rollNumber}" has already submitted this quiz. Retaking is not allowed.`
      }, { status: 400 });
    }

    const sessionId = generateSessionId();
    const startedAt = new Date().toISOString();

    const newSession: StudentSession = {
      id: sessionId,
      quizId: id,
      studentName: studentName.trim(),
      rollNumber: rollNumber.trim(),
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
      rollNumber: session.rollNumber,
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
