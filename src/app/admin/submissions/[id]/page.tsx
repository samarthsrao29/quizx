'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface Submission {
  id: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  completedInSeconds: number;
}

export default function QuizSubmissions({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/quizzes/${id}/responses`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions);
        setQuizTitle(data.quizTitle);
        setTotalQuestions(data.totalQuestions);
      }
    } catch (error) {
      console.error('Failed to fetch responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins}m ${remainingSec}s`;
  };

  const handleDownloadCSV = () => {
    if (submissions.length === 0) return;

    const headers = [
      'Student Name',
      'Student Email',
      'Score Obtained',
      'Total Questions',
      'Percentage (%)',
      'Time Taken (Seconds)',
      'Formatted Time',
      'Date Submitted'
    ];

    const rows = submissions.map((sub) => [
      sub.studentName,
      sub.studentEmail,
      sub.score,
      sub.totalQuestions,
      Math.round((sub.score / sub.totalQuestions) * 100),
      sub.completedInSeconds,
      formatDuration(sub.completedInSeconds),
      new Date(sub.submittedAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${quizTitle.replace(/[\s/\\?%*:|"<>]/g, '_')}_Student_Marks.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Computations
  const totalSubmissions = submissions.length;
  const averageScore = totalSubmissions
    ? (submissions.reduce((sum, s) => sum + s.score, 0) / totalSubmissions).toFixed(1)
    : '0';
  const highestScore = totalSubmissions
    ? Math.max(...submissions.map((s) => s.score))
    : 0;
  const lowestScore = totalSubmissions
    ? Math.min(...submissions.map((s) => s.score))
    : 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--primary)', textDecoration: 'none', marginBottom: '0.5rem', fontWeight: 600 }}>
            &larr; Back to Dashboard
          </Link>
          <h1 style={{ fontSize: '2rem' }}>{quizTitle || 'Quiz Submissions'}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Quiz Code: <strong className="text-gradient">{id}</strong> | Total Questions: <strong>{totalQuestions}</strong>
          </p>
        </div>
        <div>
          <button
            onClick={handleDownloadCSV}
            disabled={totalSubmissions === 0}
            className="btn btn-success"
          >
            Download Grades (CSV)
          </button>
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
      ) : (
        <>
          {/* Summary Dashboard Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}>
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Students
              </span>
              <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }} className="text-gradient">
                {totalSubmissions}
              </h2>
            </div>
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Average Score
              </span>
              <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: 'var(--secondary)' }}>
                {averageScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalQuestions}</span>
              </h2>
            </div>
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Highest Score
              </span>
              <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: 'var(--success)' }}>
                {highestScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalQuestions}</span>
              </h2>
            </div>
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Lowest Score
              </span>
              <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: 'var(--danger)' }}>
                {lowestScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalQuestions}</span>
              </h2>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <h2 className="mb-4" style={{ fontSize: '1.4rem' }}>Student Responses</h2>
            
            {submissions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No students have completed this quiz yet. Share the code or link to collect responses!
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '1rem 0.5rem' }}>Rank</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Name</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Email</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Score</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Percentage</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Time Taken</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Date Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, index) => {
                    const percentage = Math.round((sub.score / sub.totalQuestions) * 100);
                    let badgeClass = 'badge-primary';
                    if (percentage >= 80) badgeClass = 'badge-success';
                    else if (percentage < 50) badgeClass = 'badge-danger';

                    return (
                      <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>#{index + 1}</td>
                        <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>{sub.studentName}</td>
                        <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>{sub.studentEmail}</td>
                        <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>{sub.score} / {sub.totalQuestions}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span className={`badge ${badgeClass}`}>{percentage}%</span>
                        </td>
                        <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>
                          {formatDuration(sub.completedInSeconds)}
                        </td>
                        <td style={{ padding: '1rem 0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
