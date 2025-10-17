import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setMessage('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');
      
      const response = await axios.post('/api/login', {
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        setMessage('Login successful! Redirecting...');
        
        // Redirect to the management page after a short delay
        setTimeout(() => {
          window.location.href = '/management';
        }, 1000);
      } else {
        setMessage(`Error: ${response.data.message}`);
      }
    } catch (error: any) {
      if (error.response) {
        setMessage(`Error: ${error.response.data.message}`);
      } else {
        setMessage(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-icon">🎫</span>
            <h1 className="logo-text">EventPass</h1>
          </div>
          <p className="login-subtitle">Welcome back! Please sign in to your account.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="login-link">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
