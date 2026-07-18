import { NextRequest, NextResponse } from 'next/server';
import { getQuiz, getSubmissions } from '@/lib/db';

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

    const submissions = await getSubmissions(id);

    // Sort submissions: 
    // 1. Score (descending)
    // 2. CompletedInSeconds (ascending - faster is better)
    // 3. SubmittedAt (ascending - earlier submission is better)
    const sorted = [...submissions].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.completedInSeconds !== b.completedInSeconds) {
        return a.completedInSeconds - b.completedInSeconds;
      }
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

    // Take top 10 and sanitize (omit email and answers to protect student privacy)
    const sanitizedLeaderboard = sorted.slice(0, 10).map((sub, idx) => ({
      rank: idx + 1,
      id: sub.id,
      studentName: sub.studentName,
      score: sub.score,
      totalQuestions: sub.totalQuestions,
      completedInSeconds: sub.completedInSeconds,
      submittedAt: sub.submittedAt
    }));

    return NextResponse.json({
      success: true,
      quizTitle: quiz.title,
      leaderboard: sanitizedLeaderboard
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
