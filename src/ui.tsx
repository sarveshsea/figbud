import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { WidgetState, ChatMessage, UserProfile } from './types';
import { AuthView } from './components/AuthView';
import { ChatView } from './components/ChatView';
import { OnboardingView } from './components/OnboardingView';
import { SettingsView } from './components/SettingsView';
import { PremiumView } from './components/PremiumView';
import { SandboxView } from './components/SandboxView';
import { OnceUIProvider } from './providers/OnceUIProvider';
import { storage } from './utils/storage';
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
      const token = storage.getItem('figbud_token');
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
            storage.removeItem('figbud_token');
            storage.removeItem('figbud_refresh_token');
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
        case 'bot-response':
          handleBotResponse(event.data.pluginMessage);
          break;
        case 'playground-activated':
          setState(prev => ({ ...prev, playgroundActive: true }));
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
    storage.setItem('figbud_token', token);
    storage.setItem('figbud_refresh_token', refreshToken);
    
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      user,
      currentView: user.preferences?.skillLevel ? 'chat' : 'onboarding',
      error: null,
    }));
  };

  const handleLogout = () => {
    storage.removeItem('figbud_token');
    storage.removeItem('figbud_refresh_token');
    
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
    // Check for sandbox/playground keywords
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('sandbox') || lowerContent.includes('playground') || lowerContent.includes('practice')) {
      setState(prev => ({ ...prev, currentView: 'sandbox' }));
      return;
    }
    
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
      const token = storage.getItem('figbud_token');
      // Use localhost for development - update for production
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/chat/message' 
        : 'http://localhost:3000/api/chat/message';
      
      console.log('[FigBud] Sending message to:', apiUrl);
      
      const response = await fetch(apiUrl, {
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

        // If AI suggests creating a component, send message to Figma
        if (data.metadata?.action === 'component_created' && data.metadata?.componentType) {
          parent.postMessage({
            pluginMessage: {
              type: 'chat-message',
              message: `create ${data.metadata.componentType}`
            }
          }, '*');
        }

        // Show provider info in console for debugging
        console.log(`AI Response from: ${data.provider || 'unknown'}`);
        console.log(`Model: ${data.model} (${data.isFree ? 'FREE' : 'PAID'})`);
        if (data.attempts && data.attempts.length > 1) {
          console.log('Model cascade:', data.attempts);
        }
      } else {
        const errorText = await response.text();
        console.error('[FigBud] API error:', response.status, errorText);
        throw new Error(`Failed to get response: ${response.status}`);
      }
    } catch (error) {
      console.error('[FigBud] Message error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send message. ';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage += 'Make sure the backend server is running on http://localhost:3000';
        } else {
          errorMessage += error.message;
        }
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      
      // Add a fallback response when API is unavailable
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm currently unable to connect to the AI service. However, I can still help you create components! Try saying 'create a button' or 'make a card' to get started.",
        timestamp: new Date(),
        metadata: {
          model: 'fallback',
          isFree: true
        }
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, fallbackMessage],
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

  const handleBotResponse = (pluginMessage: any) => {
    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content: pluginMessage.message || pluginMessage.payload,
      timestamp: new Date(),
      metadata: pluginMessage.metadata
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, botMessage],
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
      const token = storage.getItem('figbud_token');
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
      case 'sandbox':
        return (
          <SandboxView
            onCreateComponent={(template, step) => {
              // Send message to Figma plugin
              parent.postMessage({
                pluginMessage: {
                  type: 'create-sandbox-component',
                  payload: { template, step }
                }
              }, '*');
            }}
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
            onNavigate={(view: 'chat' | 'settings' | 'premium' | 'onboarding' | 'sandbox') => setState(prev => ({ ...prev, currentView: view }))}
            playgroundActive={state.playgroundActive || false}
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
  root.render(
    <OnceUIProvider>
      <App />
    </OnceUIProvider>
  );
}