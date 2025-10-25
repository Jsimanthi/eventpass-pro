import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        onLogin();
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div className="card-header" style={{ textAlign: 'center', borderBottom: 'none' }}>
          <h1 style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 'var(--space-2)'
          }}>
            EventPass Pro
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Professional Event Management System
          </p>
        </div>

        <div className="card-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div style={{
                padding: 'var(--space-3)',
                background: 'var(--error-50)',
                border: '1px solid var(--error-200)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--error-600)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-size-sm)'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ marginBottom: 'var(--space-4)' }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }}></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            padding: 'var(--space-4)',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)'
          }}>
            <strong>Demo Credentials:</strong><br />
            Email: user@example.com<br />
            Password: password123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;