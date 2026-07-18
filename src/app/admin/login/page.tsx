'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Both username and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (data.success) {
        // Successful login, redirect to admin dashboard
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid password.');
      }
    } catch (err: any) {
      console.error('Login error details:', err);
      setError(err?.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex-center" style={{ minHeight: '65vh', flexDirection: 'column' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔒</div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Admin Access</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Enter username and password to unlock your subject dashboard.
          </p>
        </div>

        {error && (
          <div className="badge-danger mb-3" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.9rem', display: 'block', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Username</label>
            <input
              type="text"
              placeholder="e.g. physics or math"
              className="input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Unlock Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
