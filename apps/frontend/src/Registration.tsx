import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      if (response.ok) {
        navigate('/login');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
          <div style={{
            width: '4rem',
            height: '4rem',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)',
            color: 'white'
          }}>
            <UserPlus size={32} />
          </div>
          <h1 style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 'var(--space-2)'
          }}>
            Join EventPass Pro
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Create your account to get started
          </p>
        </div>

        <div className="card-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                minLength={6}
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
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={16} style={{ marginRight: 'var(--space-2)' }} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              <ArrowLeft size={14} style={{ marginRight: 'var(--space-1)' }} />
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;