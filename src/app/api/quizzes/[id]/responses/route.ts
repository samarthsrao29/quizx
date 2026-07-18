import { NextRequest, NextResponse } from 'next/server';
import { getSubmissions, getQuiz } from '@/lib/db';

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

    // Security check: Only allow the creator admin to fetch submissions
    const adminId = req.headers.get('x-admin-id');
    if (quiz.creatorId && quiz.creatorId !== adminId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not own this quiz.' }, { status: 403 });
    }

    const submissions = await getSubmissions(id);
    
    // Sort submissions by score descending, then by completion time
    const sortedSubmissions = [...submissions].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.completedInSeconds - b.completedInSeconds;
    });

    return NextResponse.json({ 
      success: true, 
      quizTitle: quiz.title,
      totalQuestions: quiz.questions.length,
      submissions: sortedSubmissions 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
