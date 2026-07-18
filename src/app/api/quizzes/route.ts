import { NextRequest, NextResponse } from 'next/server';
import { getQuizzes, saveQuiz, Quiz, Question } from '@/lib/db';

// Helper to generate a short unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function GET(req: NextRequest) {
  try {
    const adminId = req.headers.get('x-admin-id');
    const quizzes = await getQuizzes(adminId || undefined);
    // Return quizzes sorted by creation date descending
    const sorted = [...quizzes].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json({ success: true, quizzes: sorted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, duration, questions, startDate, endDate } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ success: false, error: 'Quiz title is required' }, { status: 400 });
    }

    if (duration === undefined || typeof duration !== 'number') {
      return NextResponse.json({ success: false, error: 'Duration is required and must be a number' }, { status: 400 });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one question is required' }, { status: 400 });
    }

    // Validate questions
    const validatedQuestions: Question[] = questions.map((q: any, index: number) => {
      if (!q.text || typeof q.text !== 'string') {
        throw new Error(`Question ${index + 1} has invalid text.`);
      }
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        throw new Error(`Question ${index + 1} must have at least 2 options.`);
      }
      const correctAnswer = parseInt(q.correctAnswer);
      if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= q.options.length) {
        throw new Error(`Question ${index + 1} has an invalid correct answer choice.`);
      }

      return {
        id: q.id || generateId(),
        text: q.text.trim(),
        options: q.options.map((opt: any) => String(opt).trim()),
        correctAnswer
      };
    });

    const adminId = req.headers.get('x-admin-id') || undefined;
    const newQuiz: Quiz = {
      id: generateId(),
      title: title.trim(),
      duration,
      questions: validatedQuestions,
      createdAt: new Date().toISOString(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      creatorId: adminId
    };

    await saveQuiz(newQuiz);

    return NextResponse.json({ success: true, quiz: newQuiz });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
