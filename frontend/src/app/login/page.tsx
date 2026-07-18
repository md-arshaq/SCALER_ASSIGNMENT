'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/hosted-zones');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      router.push('/hosted-zones');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__logo">
          <span className="login-card__logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.9"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.8"/>
            </svg>
          </span>
          <span>Route 53</span>
        </div>

        <h1 className="login-card__title">Sign in to your account</h1>

        {error && (
          <div className="login-card__error" id="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-group__label form-group__label--required" htmlFor="username">
              IAM user name
            </label>
            <input
              className="form-input"
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-group__label form-group__label--required" htmlFor="password">
              Password
            </label>
            <input
              className="form-input"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn--cta login-card__submit"
            disabled={isSubmitting}
            id="login-submit"
          >
            {isSubmitting ? (
              <>
                <span className="spinner spinner--sm" /> Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="login-card__footer">
          <p>Demo credentials: <strong>admin</strong> / <strong>password</strong></p>
        </div>
      </div>
    </div>
  );
}
