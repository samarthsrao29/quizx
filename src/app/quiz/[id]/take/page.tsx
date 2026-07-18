'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface QuizData {
  id: string;
  title: string;
  duration: number;
  questions: Question[];
}

export default function TakeQuiz({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Student info from session storage
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [startedAt, setStartedAt] = useState('');

  // Quiz progress
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Load student info and quiz questions
  useEffect(() => {
    const name = sessionStorage.getItem(`quiz_${id}_student_name`);
    const email = sessionStorage.getItem(`quiz_${id}_student_email`);
    const start = sessionStorage.getItem(`quiz_${id}_started_at`);

    if (!name || !email || !start) {
      router.replace(`/quiz/${id}`);
      return;
    }

    setStudentName(name);
    setStudentEmail(email);
    setStartedAt(start);

    fetchQuiz();
  }, []);

  // Timer logic
  useEffect(() => {
    if (!quiz || quiz.duration === 0 || !startedAt) return;

    const limitSeconds = quiz.duration * 60;

    const interval = setInterval(() => {
      const startTime = new Date(startedAt).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const remaining = limitSeconds - elapsedSeconds;

      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        handleAutoSubmit();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz, startedAt]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/quizzes/${id}?role=student`);
      const data = await res.json();
      if (data.success) {
        setQuiz(data.quiz);
      } else {
        setError(data.error || 'Failed to load quiz.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while loading questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const submitQuiz = async (answersToSubmit = answers) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/quizzes/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          studentEmail,
          answers: answersToSubmit,
          startedAt
        })
      });

      const data = await res.json();
      if (data.success) {
        // Save score and completion details to session storage
        sessionStorage.setItem(`quiz_${id}_score`, String(data.submission.score));
        sessionStorage.setItem(`quiz_${id}_total_questions`, String(data.submission.totalQuestions));
        sessionStorage.setItem(`quiz_${id}_percentage`, String(data.submission.percentage));
        sessionStorage.setItem(`quiz_${id}_time_taken`, String(data.submission.completedInSeconds));

        // Redirect to results page
        router.push(`/quiz/${id}/result`);
      } else {
        alert('Failed to submit quiz: ' + data.error);
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during submission.');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    // When time expires, submit immediately with whatever answers exist.
    // Use window.alert to notify student, then trigger submit
    alert('Time has expired! Your quiz will be submitted automatically.');
    submitQuiz();
  };

  const handleSubmitClick = () => {
    const unansweredCount = (quiz?.questions.length || 0) - Object.keys(answers).length;
    let message = 'Are you sure you want to submit your quiz?';
    if (unansweredCount > 0) {
      message = `You have ${unansweredCount} unanswered question(s). ${message}`;
    }

    if (confirm(message)) {
      submitQuiz();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  if (error || !quiz) {
    return (
      <div className="flex-center" style={{ minHeight: '50vh', flexDirection: 'column' }}>
        <div className="card text-center" style={{ maxWidth: '500px', borderTop: '4px solid var(--danger)' }}>
          <h2 className="text-danger mb-2">Quiz Load Error</h2>
          <p className="mb-4">{error || 'Something went wrong.'}</p>
          <button onClick={() => router.replace(`/quiz/${id}`)} className="btn btn-outline">
            Go back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex-center animate-fade-in" style={{ minHeight: '60vh', flexDirection: 'column' }}>
        <div className="card text-center" style={{ padding: '3rem', maxWidth: '450px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '5px solid var(--border-color)',
            borderTop: '5px solid var(--success)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }}></div>
          <h2 style={{ marginBottom: '0.5rem' }}>Submitting Quiz...</h2>
          <p>Please wait while we record and grade your assessment.</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isSelectedOption = (optIndex: number) => answers[currentQuestion.id] === optIndex;

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', width: '100%' }}>
      {/* Quiz Header & Timer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{quiz.title}</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Student: <strong>{studentName}</strong> ({studentEmail})
          </span>
        </div>

        {timeLeft !== null && (
          <div
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--border-radius-md)',
              border: `1px solid ${timeLeft < 60 ? 'var(--danger)' : 'var(--border-color)'}`,
              background: timeLeft < 60 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 'bold',
              color: timeLeft < 60 ? 'var(--danger)' : 'var(--text-primary)',
              animation: timeLeft < 60 ? 'pulse 1s infinite alternate' : 'none'
            }}
          >
            <span style={{ fontSize: '0.8rem', color: timeLeft < 60 ? 'var(--danger)' : 'var(--text-muted)' }}>TIME LEFT:</span>
            <span style={{ fontSize: '1.15rem', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</span>
            <style jsx>{`
              @keyframes pulse {
                from { transform: scale(1); opacity: 1; }
                to { transform: scale(1.03); opacity: 0.8; }
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '999px', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--primary-gradient)', transition: 'width 0.3s ease-out' }}></div>
      </div>

      {/* Question Card */}
      <div className="card mb-4" style={{ padding: '2.5rem' }}>
        <div className="flex-between mb-4">
          <span className="badge badge-primary">Question {currentIndex + 1} of {totalQuestions}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{progressPercent}% Complete</span>
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '2rem', whiteSpace: 'pre-wrap' }}>
          {currentQuestion.text}
        </h3>

        {/* Options Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {currentQuestion.options.map((option, optIndex) => (
            <button
              key={optIndex}
              onClick={() => handleSelectOption(currentQuestion.id, optIndex)}
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem',
                borderRadius: 'var(--border-radius-md)',
                background: isSelectedOption(optIndex) ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isSelectedOption(optIndex) ? 'var(--primary)' : 'var(--border-color)'}`,
                color: isSelectedOption(optIndex) ? '#ffffff' : 'var(--text-primary)',
                textAlign: 'left',
                fontFamily: 'var(--font-outfit)',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.2s ease',
                boxShadow: isSelectedOption(optIndex) ? '0 0 15px rgba(139, 92, 246, 0.15)' : 'none'
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelectedOption(optIndex) ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  border: `1px solid ${isSelectedOption(optIndex) ? 'transparent' : 'var(--border-color)'}`
                }}
              >
                {String.fromCharCode(65 + optIndex)}
              </span>
              <span style={{ flex: 1 }}>{option}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="btn btn-outline"
          style={{ visibility: currentIndex === 0 ? 'hidden' : 'visible', minWidth: '120px' }}
        >
          &larr; Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleSubmitClick}
            className="btn btn-success animate-fade-in"
            style={{ minWidth: '150px' }}
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(Math.min(totalQuestions - 1, currentIndex + 1))}
            className="btn btn-primary"
            style={{ minWidth: '120px' }}
          >
            Next &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
