import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { TutorialCard } from './TutorialCard';
import { DemoCard } from './DemoCard';

interface ChatViewProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  user: UserProfile | null;
  onSendMessage: (message: string) => void;
  onNavigate: (view: 'chat' | 'settings' | 'premium' | 'onboarding') => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  loading,
  error,
  user,
  onSendMessage,
  onNavigate,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    onSendMessage(input.trim());
    setInput('');
  };

  const renderMessage = (message: ChatMessage) => {
    return (
      <div key={message.id} className={`message ${message.type}`}>
        <div className="message-content">
          <div className="message-text">{message.content}</div>
          
          {message.metadata?.tutorials && (
            <div className="tutorials-grid">
              {message.metadata.tutorials.map((tutorial, index) => (
                <TutorialCard key={index} tutorial={tutorial} />
              ))}
            </div>
          )}
          
          {message.metadata?.demos && (
            <div className="demos-grid">
              {message.metadata.demos.map((demo, index) => (
                <DemoCard 
                  key={index} 
                  demo={demo} 
                  onSelect={(demoId) => {
                    parent.postMessage({
                      pluginMessage: { 
                        type: 'create-demo', 
                        payload: { templateId: demoId } 
                      }
                    }, '*');
                  }}
                />
              ))}
            </div>
          )}
          
          {message.metadata?.guidance && (
            <div className="guidance-steps">
              {message.metadata.guidance.map((step, index) => (
                <div key={index} className="guidance-step">
                  <div className="step-number">{step.order}</div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                    {step.action && (
                      <button 
                        className="step-action"
                        onClick={() => {
                          parent.postMessage({
                            pluginMessage: { 
                              type: 'add-guidance', 
                              payload: { steps: [step] } 
                            }
                          }, '*');
                        }}
                      >
                        {step.action}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="message-time">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  };

  const suggestedQueries = [
    "How do I create a button component?",
    "Show me mobile app design tutorials",
    "Create a checkout flow demo",
    "Help me with design systems",
    "What's the best way to organize layers?",
  ];

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div className="header-left">
          <h2>FigBud</h2>
          <span className="user-status">
            {user?.subscription.tier === 'premium' ? '⭐ Premium' : '🆓 Free'}
          </span>
        </div>
        <div className="header-right">
          <button 
            className="icon-button"
            onClick={() => onNavigate('settings')}
            title="Settings"
          >
            ⚙️
          </button>
          {user?.subscription.tier === 'free' && (
            <button 
              className="premium-button"
              onClick={() => onNavigate('premium')}
            >
              Upgrade
            </button>
          )}
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-content">
              <h3>👋 Welcome to FigBud!</h3>
              <p>I'm your AI assistant for Figma. Ask me anything about design, tutorials, or let me help you create prototypes.</p>
              
              <div className="suggested-queries">
                <p>Try asking:</p>
                {suggestedQueries.map((query, index) => (
                  <button
                    key={index}
                    className="suggestion-chip"
                    onClick={() => onSendMessage(query)}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map(renderMessage)}

        {loading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>❌ {error}</span>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-form">
          <div className="input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FigBud anything..."
              className="chat-input"
              disabled={loading}
            />
            <button
              type="submit"
              className="send-button"
              disabled={!input.trim() || loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>

        {user?.subscription.tier === 'free' && (
          <div className="usage-indicator">
            <small>Free plan: Unlimited basic queries • <button onClick={() => onNavigate('premium')}>Upgrade for advanced features</button></small>
          </div>
        )}
      </div>
    </div>
  );
};