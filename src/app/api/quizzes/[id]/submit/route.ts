import { NextRequest, NextResponse } from 'next/server';
import { getQuiz, getSession, deleteSession, saveSubmission, Submission } from '@/lib/db';

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
    const { sessionId, answers } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ success: false, error: 'Answers are required' }, { status: 400 });
    }

    // Retrieve active student attempt from database
    const session = await getSession(sessionId);

    if (!session || session.quizId !== id) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired quiz attempt. Your answers may have already been submitted.'
      }, { status: 400 });
    }

    const submittedAt = new Date().toISOString();
    const startTime = new Date(session.startedAt).getTime();
    const endTime = new Date(submittedAt).getTime();
    const completedInSeconds = Math.max(0, Math.round((endTime - startTime) / 1000));

    // Anti-Cheat: If they exceeded the limit plus a small 30-second buffer
    const maxAllowedSeconds = quiz.duration * 60 + 30; // 30s buffer for network latency
    const isLate = quiz.duration > 0 && completedInSeconds > maxAllowedSeconds;

    // Calculate score
    let score = 0;
    quiz.questions.forEach((question) => {
      const selectedOptionIndex = answers[question.id];
      if (selectedOptionIndex !== undefined && selectedOptionIndex === question.correctAnswer) {
        // If it was late, we can choose to ignore correct answers or count them but flag it.
        // Standard behavior: count the correct answers but we can flag. We will count them.
        score++;
      }
    });

    const newSubmission: Submission = {
      id: sessionId, // Use session ID as submission ID to prevent duplication
      quizId: id,
      studentName: session.studentName,
      rollNumber: session.rollNumber,
      answers: answers as Record<string, number>,
      score,
      totalQuestions: quiz.questions.length,
      startedAt: session.startedAt,
      submittedAt,
      completedInSeconds
    };

    // Save the submission grades
    await saveSubmission(newSubmission);

    // Delete the active attempt session so they cannot submit again
    await deleteSession(sessionId);

    return NextResponse.json({
      success: true,
      submission: {
        id: newSubmission.id,
        score: newSubmission.score,
        totalQuestions: newSubmission.totalQuestions,
        percentage: Math.round((newSubmission.score / newSubmission.totalQuestions) * 100),
        completedInSeconds: newSubmission.completedInSeconds,
        isLate
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
