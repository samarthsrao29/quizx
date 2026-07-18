'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Quiz {
  id: string;
  title: string;
  duration: number;
  createdAt: string;
  questions: any[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrQuizTitle, setQrQuizTitle] = useState<string>('');

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logout: true }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes');
      const data = await res.json();
      if (data.success) {
        setQuizzes(data.quizzes);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (quizId: string) => {
    const shareUrl = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(quizId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleShowQr = (quizId: string) => {
    const shareUrl = `${window.location.origin}/quiz/${quizId}`;
    setQrCodeUrl(shareUrl);
    const quizTitle = quizzes.find((q) => q.id === quizId)?.title || 'Quiz';
    setQrQuizTitle(quizTitle);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? All student submissions will also be deleted.')) {
      return;
    }

    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      } else {
        alert('Failed to delete quiz: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('An error occurred while deleting the quiz.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Admin Dashboard</h1>
          <p>Manage your active assessments and view student performance.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
          <Link href="/admin/create" className="btn btn-primary">
            Create New Quiz
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '30vh' }}>
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
      ) : quizzes.length === 0 ? (
        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
          <h3 className="mb-2" style={{ fontSize: '1.5rem' }}>No quizzes found</h3>
          <p className="mb-4">Get started by creating your first interactive quiz or copy-pasting from ChatGPT.</p>
          <div className="flex-center">
            <Link href="/admin/create" className="btn btn-secondary">
              Create a Quiz
            </Link>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem',
          marginTop: '1.5rem'
        }}>
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card" style={{ padding: '1.5rem 2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ minWidth: '250px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary" style={{ letterSpacing: '0.05em', fontWeight: 'bold' }}>{quiz.id}</span>
                  <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{quiz.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>Questions: <strong>{quiz.questions.length}</strong></span>
                  <span>Duration: <strong>{quiz.duration > 0 ? `${quiz.duration} mins` : 'No limit'}</strong></span>
                  <span>Created: <strong>{new Date(quiz.createdAt).toLocaleDateString()}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleCopyLink(quiz.id)}
                  className={`btn btn-sm ${copiedId === quiz.id ? 'btn-success' : 'btn-outline'}`}
                  style={{ minWidth: '130px' }}
                >
                  {copiedId === quiz.id ? 'Link Copied!' : 'Copy Share Link'}
                </button>
                <button
                  onClick={() => handleShowQr(quiz.id)}
                  className="btn btn-outline btn-sm"
                  title="Show QR Code"
                >
                  QR Code
                </button>
                <Link href={`/admin/submissions/${quiz.id}`} className="btn btn-secondary btn-sm">
                  View Submissions
                </Link>
                <button
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  className="btn btn-danger btn-sm"
                  style={{ padding: '0.5rem 0.75rem' }}
                  title="Delete Quiz"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal Overlay */}
      {qrCodeUrl && (
        <div className="flex-center" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(9, 6, 22, 0.85)',
          zIndex: 1000,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="card text-center" style={{
            width: '90%',
            maxWidth: '400px',
            padding: '2.5rem',
            position: 'relative',
            border: '1px solid var(--border-focus)',
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)'
          }}>
            <button
              onClick={() => setQrCodeUrl(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '2rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1
              }}
              title="Close"
            >
              &times;
            </button>
            <h2 className="mb-2" style={{ fontSize: '1.5rem', wordBreak: 'break-word' }}>{qrQuizTitle}</h2>
            <p className="mb-4" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Scan the QR code to join this quiz.
            </p>
            <div style={{
              background: '#ffffff',
              padding: '1.25rem',
              borderRadius: 'var(--border-radius-md)',
              display: 'inline-block',
              boxShadow: '0 0 25px rgba(139, 92, 246, 0.2)',
              marginBottom: '1.5rem'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                alt="Quiz QR Code"
                width="200"
                height="200"
                style={{ display: 'block' }}
              />
            </div>
            <div style={{ wordBreak: 'break-all', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Link: <a href={qrCodeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>{qrCodeUrl}</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
