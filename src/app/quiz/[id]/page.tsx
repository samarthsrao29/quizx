'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface QuizInfo {
  id: string;
  title: string;
  duration: number;
  questionsCount: number;
  startDate?: string;
  endDate?: string;
}

export default function StudentLobby({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizInfo();
  }, []);

  const fetchQuizInfo = async () => {
    try {
      const res = await fetch(`/api/quizzes/${id}?role=student`);
      const data = await res.json();
      if (data.success) {
        setQuiz({
          id: data.quiz.id,
          title: data.quiz.title,
          duration: data.quiz.duration,
          questionsCount: data.quiz.questions.length,
          startDate: data.quiz.startDate,
          endDate: data.quiz.endDate
        });
      } else {
        setError(data.error || 'Quiz not found.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch quiz details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rollNumber.trim()) {
      setFormError('Please fill in both name and roll number.');
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/quizzes/${id}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: name.trim(),
          rollNumber: rollNumber.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Save the secure session ID in sessionStorage
        sessionStorage.setItem(`quiz_${id}_session_id`, data.sessionId);
        router.push(`/quiz/${id}/take`);
      } else {
        setFormError(data.error || 'Failed to start quiz session.');
      }
    } catch (err) {
      console.error(err);
      setFormError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '50vh' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border-color)',
          borderTop: '4px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in flex-center" style={{ minHeight: '50vh', flexDirection: 'column' }}>
        <div className="card text-center" style={{ maxWidth: '500px', borderTop: '4px solid var(--danger)' }}>
          <h2 className="text-danger mb-2">Quiz Access Error</h2>
          <p className="mb-4">{error}</p>
          <Link href="/" className="btn btn-outline">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
      <div className="card" style={{ width: '100%', maxWidth: '550px' }}>
        <div className="badge badge-primary mb-2">Timed Assessment</div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{quiz?.title}</h1>
        
        <div className="flex-between mb-4" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>QUESTIONS</span>
            <h3 style={{ fontSize: '1.25rem' }}>{quiz?.questionsCount}</h3>
          </div>
          <div style={{ width: '1px', background: 'var(--border-color)', height: '30px' }}></div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>TIME LIMIT</span>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--secondary)' }}>
              {quiz?.duration && quiz.duration > 0 ? `${quiz.duration} Mins` : 'No Limit'}
            </h3>
          </div>
        </div>

        {/* Availability Schedule */}
        {(quiz?.startDate || quiz?.endDate) && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
              🗓️ Availability Schedule
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {quiz.startDate && (
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Opens:</span>
                  <span style={{ fontWeight: 600 }}>{new Date(quiz.startDate).toLocaleString()}</span>
                </div>
              )}
              {quiz.endDate && (
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Closes:</span>
                  <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{new Date(quiz.endDate).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date Availability Validation */}
        {(() => {
          const now = new Date();
          const isNotAvailableYet = !!(quiz?.startDate && new Date(quiz.startDate) > now);
          const isClosed = !!(quiz?.endDate && new Date(quiz.endDate) < now);

          if (isNotAvailableYet) {
            return (
              <div className="card mb-4 animate-fade-in" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)', textAlign: 'center', background: 'rgba(139, 92, 246, 0.08)' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#a78bfa', marginBottom: '0.5rem' }}>🔒 Quiz Not Available Yet</h3>
                <p style={{ fontSize: '0.95rem' }}>
                  This quiz will open on: <br />
                  <strong>{new Date(quiz!.startDate!).toLocaleString()}</strong>
                </p>
                <Link href="/" className="btn btn-outline btn-sm mt-4" style={{ width: '100%' }}>
                  Back to Portal
                </Link>
              </div>
            );
          }

          if (isClosed) {
            return (
              <div className="card mb-4 animate-fade-in" style={{ padding: '1.5rem', borderLeft: '4px solid var(--danger)', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#f87171', marginBottom: '0.5rem' }}>⏳ Quiz Closed</h3>
                <p style={{ fontSize: '0.95rem' }}>
                  This quiz has closed. The deadline was: <br />
                  <strong>{new Date(quiz!.endDate!).toLocaleString()}</strong>
                </p>
                <Link href="/" className="btn btn-outline btn-sm mt-4" style={{ width: '100%' }}>
                  Back to Portal
                </Link>
              </div>
            );
          }

          return (
            <>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Instructions:</h4>
                <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <li>Please enter your official name and email address below.</li>
                  {quiz?.duration && quiz.duration > 0 ? (
                    <>
                      <li>The timer will start as soon as you click <strong>Start Quiz</strong>.</li>
                      <li>If the timer runs out, your answers will be <strong>automatically submitted</strong>.</li>
                    </>
                  ) : (
                    <li>Take your time and submit when ready.</li>
                  )}
                  <li>Do not refresh or navigate away from the page during the quiz.</li>
                </ul>
              </div>

              <form onSubmit={handleStartQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Roll Number / Student ID</label>
                  <input
                    type="text"
                    placeholder="e.g. CS1024 or 22BCE100"
                    className="input"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                {formError && <span className="text-danger" style={{ fontSize: '0.85rem' }}>{formError}</span>}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
                  {submitting ? 'Initializing...' : 'Start Quiz'}
                </button>
              </form>
            </>
          );
        })()}
      </div>
    </div>
  );
}
