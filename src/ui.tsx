import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { WidgetState, ChatMessage, UserProfile } from './types';
import { AuthView } from './components/AuthView';
import { ChatView } from './components/ChatView';
import { OnboardingView } from './components/OnboardingView';
import { SettingsView } from './components/SettingsView';
import { PremiumView } from './components/PremiumView';
import './styles/main.css';

const App: React.FC = () => {
  const [state, setState] = useState<WidgetState>({
    isVisible: true,
    isAuthenticated: false,
    user: null,
    currentView: 'chat',
    onboardingStep: 0,
    messages: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    // Check for existing authentication
    const checkAuth = async () => {
      const token = localStorage.getItem('figbud_token');
      if (token) {
        try {
          // Validate token with backend
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setState(prev => ({
              ...prev,
              isAuthenticated: true,
              user: data.user,
              currentView: data.user.preferences?.skillLevel ? 'chat' : 'onboarding',
            }));
          } else {
            localStorage.removeItem('figbud_token');
            localStorage.removeItem('figbud_refresh_token');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('figbud_token');
          localStorage.removeItem('figbud_refresh_token');
        }
      }
    };

    checkAuth();

    // Listen for messages from Figma widget
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data.pluginMessage || {};
      
      switch (type) {
        case 'navigate':
          setState(prev => ({ ...prev, currentView: payload.view }));
          break;
        case 'context-response':
          handleContextResponse(payload);
          break;
        case 'demo-created':
          handleDemoCreated(payload);
          break;
        case 'guidance-added':
          handleGuidanceAdded(payload);
          break;
        case 'error':
          setState(prev => ({ ...prev, error: payload.message, loading: false }));
          break;
        default:
          console.log('Unknown message from widget:', type, payload);
      }
    };

    // Add event listener
    window.addEventListener('message', handleMessage);

    // Request initial context from Figma
    parent.postMessage({
      pluginMessage: { type: 'get-context' }
    }, '*');

    // Cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
    };

  }, []);

  const handleAuth = (user: UserProfile, token: string, refreshToken: string) => {
    localStorage.setItem('figbud_token', token);
    localStorage.setItem('figbud_refresh_token', refreshToken);
    
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      user,
      currentView: user.preferences?.skillLevel ? 'chat' : 'onboarding',
      error: null,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('figbud_token');
    localStorage.removeItem('figbud_refresh_token');
    
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      currentView: 'chat',
      messages: [],
      error: null,
    }));
  };

  const handleMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      loading: true,
      error: null,
    }));

    try {
      // Send message to backend for processing
      const token = localStorage.getItem('figbud_token');
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          message: content,
          context: await getFigmaContext(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          metadata: data.metadata,
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          loading: false,
        }));
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Message error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to send message. Please try again.',
        loading: false,
      }));
    }
  };

  const handleContextResponse = (context: any) => {
    // Store context for use in API calls
    (window as any).figmaContext = context;
  };

  const handleDemoCreated = (payload: any) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: `Demo "${payload.name}" created successfully!`,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, systemMessage],
      loading: false,
    }));
  };

  const handleGuidanceAdded = (payload: any) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: 'Guidance steps added to your design!',
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, systemMessage],
      loading: false,
    }));
  };

  const getFigmaContext = async (): Promise<any> => {
    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.pluginMessage?.type === 'context-response') {
          window.removeEventListener('message', handleMessage);
          resolve(event.data.pluginMessage.payload);
        }
      };

      window.addEventListener('message', handleMessage);
      parent.postMessage({
        pluginMessage: { type: 'get-context' }
      }, '*');

      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        resolve({});
      }, 5000);
    });
  };

  const updateUserPreferences = async (preferences: any) => {
    try {
      const token = localStorage.getItem('figbud_token');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          user: data.user,
        }));
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const renderCurrentView = () => {
    if (!state.isAuthenticated) {
      return <AuthView onAuth={handleAuth} />;
    }

    switch (state.currentView) {
      case 'onboarding':
        return (
          <OnboardingView
            user={state.user}
            onComplete={(preferences) => {
              updateUserPreferences(preferences);
              setState(prev => ({ ...prev, currentView: 'chat' }));
            }}
          />
        );
      case 'settings':
        return (
          <SettingsView
            user={state.user}
            onSave={updateUserPreferences}
            onBack={() => setState(prev => ({ ...prev, currentView: 'chat' }))}
            onLogout={handleLogout}
          />
        );
      case 'premium':
        return (
          <PremiumView
            user={state.user}
            onBack={() => setState(prev => ({ ...prev, currentView: 'chat' }))}
          />
        );
      case 'chat':
      default:
        return (
          <ChatView
            messages={state.messages}
            loading={state.loading}
            error={state.error}
            user={state.user}
            onSendMessage={handleMessage}
            onNavigate={(view: 'chat' | 'settings' | 'premium' | 'onboarding') => setState(prev => ({ ...prev, currentView: view }))}
          />
        );
    }
  };

  return (
    <div className="app">
      {renderCurrentView()}
    </div>
  );
};

// Initialize React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}