import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import '../styles/minimal-design-system.css';

interface UltraMinimalChatProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (message: string) => void;
}

export const UltraMinimalChat: React.FC<UltraMinimalChatProps> = ({
  messages,
  loading,
  onSendMessage
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col" style={{ height: '100%', background: 'var(--color-bg)' }}>
      {/* Messages */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto', 
        padding: 'var(--space-md)'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.type === 'user' ? 'message-user' : 'message-assistant'}`}
            style={{ marginBottom: 'var(--space-md)' }}
          >
            {message.content}
          </div>
        ))}
        
        {loading && (
          <div className="message message-assistant">
            <span className="loading">Thinking</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ 
        padding: 'var(--space-md)',
        borderTop: '1px solid var(--color-border)'
      }}>
        <div className="flex gap-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type message..."
            className="input"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
          >
            →
          </button>
        </div>
      </form>
    </div>
  );
};