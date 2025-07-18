import React, { useState } from 'react';
import { UserProfile } from '../types';

interface AuthViewProps {
  onAuth: (user: UserProfile, token: string, refreshToken: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuth }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          figmaUserId: (window as any).figmaContext?.user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onAuth(data.user, data.token, data.refreshToken);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTryWithoutAccount = () => {
    // Allow limited functionality without account
    const guestUser: UserProfile = {
      id: 'guest',
      email: 'guest@figbud.com',
      subscription: {
        tier: 'free',
        status: 'active',
      },
      preferences: {
        skillLevel: 'beginner',
        designStyle: 'modern',
        commonUseCases: [],
        preferredTutorialLength: 'any',
        notifications: {
          email: false,
          inApp: true,
          weekly: false,
        },
        theme: 'auto',
      },
    };

    onAuth(guestUser, '', '');
  };

  return (
    <div className="auth-view">
      <div className="auth-header">
        <div className="auth-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="#F24E1E"/>
          </svg>
        </div>
        <h1>Welcome to FigBud</h1>
        <p>Your AI-powered Figma assistant</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="figma-input"
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="figma-input"
            placeholder="Enter your password"
            required
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="figma-button auth-submit"
          disabled={loading || !email || !password}
        >
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        <div className="auth-toggle">
          <button
            type="button"
            className="link-button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="guest-button"
          onClick={handleTryWithoutAccount}
        >
          Try without account
        </button>
      </form>

      <div className="auth-footer">
        <p>By continuing, you agree to FigBud's Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
};