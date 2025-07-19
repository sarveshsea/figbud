import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button, Input, Text, Card, Flex, Heading, Badge } from '@once-ui-system/core';

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
    <Card
      padding="l"
      radius="l"
      style={{
        maxWidth: '400px',
        margin: '2rem auto',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Flex
        direction="column"
        horizontal="center"
        gap="m"
        style={{ marginBottom: '2rem' }}
      >
        <Badge color="brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        </Badge>
        <Heading variant="display-strong-s">Welcome to FigBud</Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          Your AI-powered Figma assistant
        </Text>
      </Flex>

      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="m">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && (
            <Badge color="danger" style={{ width: '100%', justifyContent: 'center' }}>
              {error}
            </Badge>
          )}

          <Button
            type="submit"
            variant="primary"
            size="l"
            fillWidth
            disabled={loading || !email || !password}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>

          <Flex horizontal="center">
            <Button
              variant="tertiary"
              size="s"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Button>
          </Flex>

          <Flex horizontal="center" gap="s" style={{ margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <Text variant="body-default-s" onBackground="neutral-weak">or</Text>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          </Flex>

          <Button
            variant="secondary"
            size="l"
            fillWidth
            onClick={handleTryWithoutAccount}
          >
            Try without account
          </Button>
        </Flex>
      </form>

      <Text
        variant="body-default-xs"
        onBackground="neutral-weak"
        align="center"
        style={{ marginTop: '2rem' }}
      >
        By continuing, you agree to FigBud's Terms of Service and Privacy Policy.
      </Text>
    </Card>
  );
};