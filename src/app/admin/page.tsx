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
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

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
    fetchCurrentAdmin();
    fetchQuizzes();
  }, []);

  const fetchCurrentAdmin = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.success) {
        setCurrentAdmin(data.username);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setChangePasswordError('Password cannot be empty');
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError('');
    setChangePasswordSuccess('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPassword.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setChangePasswordSuccess('Password updated successfully!');
        setNewPassword('');
        setTimeout(() => {
          setShowChangePassword(false);
          setChangePasswordSuccess('');
        }, 1500);
      } else {
        setChangePasswordError(data.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      setChangePasswordError('An error occurred. Please try again.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

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

  const executeDeleteQuiz = async (quizId: string) => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      } else {
        setAlertMessage(data.error || 'Failed to delete quiz.');
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      setAlertMessage('An error occurred while deleting the quiz.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', textTransform: 'capitalize' }}>
            {currentAdmin ? `${currentAdmin} Quiz Admin` : 'Admin Dashboard'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage {currentAdmin || 'your'} active assessments and view student performance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowChangePassword(true)} className="btn btn-outline">
            Change Password
          </button>
          <button onClick={handleLogout} className="btn btn-outline" style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}>
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
                  onClick={() => setDeleteTargetId(quiz.id)}
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

      {/* Delete Quiz Confirmation Modal */}
      {deleteTargetId && (
        <div className="flex-center animate-fade-in" style={{
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
            border: '1px solid var(--danger)',
            boxShadow: '0 0 40px rgba(239, 68, 68, 0.25)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 className="mb-2" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>Delete Quiz?</h2>
            <p className="mb-4" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete this quiz? This will permanently delete the quiz and all student submissions. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteTargetId(null)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const idToDelete = deleteTargetId;
                  setDeleteTargetId(null);
                  executeDeleteQuiz(idToDelete);
                }}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Notification Modal */}
      {alertMessage && (
        <div className="flex-center animate-fade-in" style={{
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
            maxWidth: '380px',
            padding: '2rem',
            border: '1px solid var(--border-focus)',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>ℹ️</div>
            <h2 className="mb-2" style={{ fontSize: '1.25rem' }}>Notification</h2>
            <p className="mb-4" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {alertMessage}
            </p>
            <button
              onClick={() => setAlertMessage(null)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="flex-center animate-fade-in" style={{
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
          <div className="card" style={{
            width: '90%',
            maxWidth: '400px',
            padding: '2.5rem',
            position: 'relative',
            border: '1px solid var(--border-focus)',
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.25)'
          }}>
            <button
              onClick={() => {
                setShowChangePassword(false);
                setChangePasswordError('');
                setChangePasswordSuccess('');
                setNewPassword('');
              }}
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
            <h2 className="mb-2" style={{ fontSize: '1.5rem', textAlign: 'center' }}>Change Password</h2>
            <p className="mb-4" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Update credentials for <strong>{currentAdmin}</strong> admin account.
            </p>

            {changePasswordError && (
              <div className="badge-danger mb-3" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.9rem', display: 'block', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                {changePasswordError}
              </div>
            )}

            {changePasswordSuccess && (
              <div className="badge-success mb-3" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.9rem', display: 'block', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
                {changePasswordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={changePasswordLoading}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setChangePasswordError('');
                    setChangePasswordSuccess('');
                    setNewPassword('');
                  }}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  disabled={changePasswordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={changePasswordLoading}
                >
                  {changePasswordLoading ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
