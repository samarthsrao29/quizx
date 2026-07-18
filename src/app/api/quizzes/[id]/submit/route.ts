import { NextRequest, NextResponse } from 'next/server';
import { getQuiz, saveSubmission, Submission } from '@/lib/db';

// Helper to generate a short unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
    const { studentName, studentEmail, answers, startedAt } = body;

    if (!studentName || typeof studentName !== 'string' || !studentName.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    if (!studentEmail || typeof studentEmail !== 'string' || !studentEmail.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ success: false, error: 'Answers are required' }, { status: 400 });
    }

    const submittedAt = new Date().toISOString();
    const startTime = startedAt ? new Date(startedAt).getTime() : new Date().getTime();
    const endTime = new Date(submittedAt).getTime();
    const completedInSeconds = Math.max(0, Math.round((endTime - startTime) / 1000));

    // Calculate score on server side
    let score = 0;
    quiz.questions.forEach((question) => {
      const selectedOptionIndex = answers[question.id];
      if (selectedOptionIndex !== undefined && selectedOptionIndex === question.correctAnswer) {
        score++;
      }
    });

    const newSubmission: Submission = {
      id: generateId(),
      quizId: id,
      studentName: studentName.trim(),
      studentEmail: studentEmail.trim(),
      answers: answers as Record<string, number>,
      score,
      totalQuestions: quiz.questions.length,
      startedAt: startedAt || submittedAt,
      submittedAt,
      completedInSeconds
    };

    await saveSubmission(newSubmission);

    return NextResponse.json({
      success: true,
      submission: {
        id: newSubmission.id,
        score: newSubmission.score,
        totalQuestions: newSubmission.totalQuestions,
        percentage: Math.round((newSubmission.score / newSubmission.totalQuestions) * 100),
        completedInSeconds: newSubmission.completedInSeconds
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
