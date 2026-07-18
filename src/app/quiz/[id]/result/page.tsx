'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function QuizResult({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [score, setScore] = useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [percentage, setPercentage] = useState<number | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem(`quiz_${id}_student_name`);
    const finalScore = sessionStorage.getItem(`quiz_${id}_score`);
    const totalQ = sessionStorage.getItem(`quiz_${id}_total_questions`);
    const pct = sessionStorage.getItem(`quiz_${id}_percentage`);
    const duration = sessionStorage.getItem(`quiz_${id}_time_taken`);

    if (finalScore === null || totalQ === null || pct === null) {
      router.replace(`/quiz/${id}`);
      return;
    }

    setStudentName(name || 'Student');
    setScore(parseInt(finalScore));
    setTotalQuestions(parseInt(totalQ));
    setPercentage(parseInt(pct));
    setTimeTaken(duration ? parseInt(duration) : null);

    // Clean up student session storage so they can't re-take immediately by navigating back
    return () => {
      sessionStorage.removeItem(`quiz_${id}_student_name`);
      sessionStorage.removeItem(`quiz_${id}_student_email`);
      sessionStorage.removeItem(`quiz_${id}_started_at`);
      sessionStorage.removeItem(`quiz_${id}_score`);
      sessionStorage.removeItem(`quiz_${id}_total_questions`);
      sessionStorage.removeItem(`quiz_${id}_percentage`);
      sessionStorage.removeItem(`quiz_${id}_time_taken`);
    };
  }, []);

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec} seconds`;
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    if (remainingSec === 0) return `${mins} minute${mins > 1 ? 's' : ''}`;
    return `${mins} min ${remainingSec} sec`;
  };

  const getFeedbackMessage = (pct: number) => {
    if (pct >= 90) return 'Outstanding! You mastered this topic.';
    if (pct >= 75) return 'Great job! You have a solid understanding.';
    if (pct >= 50) return 'Good effort! Keep studying to improve your score.';
    return 'Keep practicing. Review the material and try again!';
  };

  if (score === null || totalQuestions === null || percentage === null) {
    return null; // or loading
  }

  return (
    <div className="animate-fade-in flex-center" style={{ minHeight: '65vh', flexDirection: 'column' }}>
      <div className="card text-center" style={{ width: '100%', maxWidth: '500px', borderTop: `4px solid ${percentage >= 50 ? 'var(--success)' : 'var(--danger)'}` }}>
        
        {/* Animated Trophy/Celebration Icon */}
        <div style={{ fontSize: '4rem', marginBottom: '1rem', display: 'inline-block' }}>
          {percentage >= 75 ? '🏆' : percentage >= 50 ? '🎉' : '📚'}
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Quiz Completed!</h1>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Thank you for completing the assessment, <strong>{studentName}</strong>.
        </p>

        {/* Results Dial */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '2rem 1rem',
            marginBottom: '1.5rem'
          }}
        >
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your Score
          </span>
          <h2 style={{ fontSize: '3rem', margin: '0.5rem 0', color: percentage >= 50 ? 'var(--success)' : 'var(--danger)' }}>
            {score} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>/ {totalQuestions}</span>
          </h2>
          <div style={{ display: 'inline-flex', padding: '0.25rem 1rem', borderRadius: '999px', background: percentage >= 50 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: percentage >= 50 ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
            {percentage}%
          </div>
        </div>

        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            {getFeedbackMessage(percentage)}
          </p>
          {timeTaken !== null && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Completed in <strong>{formatDuration(timeTaken)}</strong>
            </p>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Your grades have been submitted. The admin can access them in the submissions log.
          </p>
          <div className="flex-center mt-2">
            <Link href="/" className="btn btn-outline" style={{ width: '100%' }}>
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
