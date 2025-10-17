import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Registration: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
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

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setMessage('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');
      
      const response = await axios.post('/api/users', {
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 201) {
        setMessage('Registration successful! You can now log in.');
        
        // Clear form after successful registration
        setFormData({
          email: '',
          password: '',
          confirmPassword: ''
        });
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
          <p className="login-subtitle">Create your account to get started.</p>
        </div>

        <form onSubmit={handleRegistration} className="login-form">
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
              placeholder="Create a password (min. 6 characters)"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>

          {message && (
            <div className={`message ${message.includes('Error') || message.includes('match') || message.includes('characters') ? 'error' : 'success'}`}>
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
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
