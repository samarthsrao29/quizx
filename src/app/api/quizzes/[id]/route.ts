import { NextRequest, NextResponse } from 'next/server';
import { getQuiz, deleteQuiz } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quiz = await getQuiz(id);

    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    // Security check: strip correct answers for students
    if (role === 'student') {
      const sanitizedQuestions = quiz.questions.map(({ id, text, options }) => ({
        id,
        text,
        options
      }));
      return NextResponse.json({
        success: true,
        quiz: {
          id: quiz.id,
          title: quiz.title,
          duration: quiz.duration,
          questions: sanitizedQuestions,
          createdAt: quiz.createdAt
        }
      });
    }

    // Otherwise return full quiz details (for editing or preview)
    return NextResponse.json({ success: true, quiz });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteQuiz(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
