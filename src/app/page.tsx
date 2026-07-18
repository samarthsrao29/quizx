'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [quizCode, setQuizCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleJoinQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizCode.trim()) {
      setError('Please enter a quiz code.');
      return;
    }
    setError('');
    router.push(`/quiz/${quizCode.toUpperCase().trim()}`);
  };

  return (
    <div className="animate-fade-in flex-center" style={{ minHeight: '60vh', flexDirection: 'column' }}>
      <div className="mb-4 text-center">
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }} className="text-gradient">
          Interactive Quiz Platform
        </h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Create instant, timed, and user-friendly quizzes from ChatGPT questions.
          Share with students and download grades as Excel.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        width: '100%',
        maxWidth: '800px',
        marginTop: '2rem'
      }}>
        {/* Student Section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="badge badge-success mb-2">For Students</div>
            <h2 className="mb-2" style={{ fontSize: '1.5rem' }}>Take a Quiz</h2>
            <p className="mb-4" style={{ fontSize: '0.95rem' }}>
              Enter the code shared by your teacher or admin to start your timed assessment.
            </p>
          </div>
          <form onSubmit={handleJoinQuiz}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter Quiz Code (e.g. A3B8CD)"
                className="input"
                value={quizCode}
                onChange={(e) => {
                  setQuizCode(e.target.value);
                  setError('');
                }}
                style={{ textAlign: 'center', letterSpacing: '0.1em', fontWeight: 'bold' }}
              />
              {error && <span className="text-danger" style={{ fontSize: '0.85rem' }}>{error}</span>}
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
              Join Quiz
            </button>
          </form>
        </div>

        {/* Admin Section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="badge badge-primary mb-2">For Admins</div>
            <h2 className="mb-2" style={{ fontSize: '1.5rem' }}>Quiz Manager</h2>
            <p className="mb-4" style={{ fontSize: '0.95rem' }}>
              Create quizzes by pasting text from ChatGPT, set timers, track student results, and export spreadsheet grades.
            </p>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <a href="/admin" className="btn btn-primary" style={{ width: '100%' }}>
              Go to Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
