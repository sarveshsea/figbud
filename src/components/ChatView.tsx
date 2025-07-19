import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { 
  Button, 
  Input, 
  Text, 
  Card, 
  Flex, 
  Heading, 
  Badge, 
  IconButton,
  Spinner
} from '@once-ui-system/core';

interface ChatViewProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  user: UserProfile | null;
  onSendMessage: (message: string) => void;
  onNavigate: (view: 'chat' | 'settings' | 'premium' | 'onboarding') => void;
  playgroundActive?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  loading,
  error,
  user,
  onSendMessage,
  onNavigate,
  playgroundActive = false,
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
    const isUser = message.type === 'user';
    
    return (
      <Flex
        direction="column"
        gap="xs"
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '75%',
          width: 'auto',
        }}
      >
        <Card
          padding="xs"
          radius="m"
          style={{
            background: isUser 
              ? 'rgba(99, 102, 241, 0.1)' 
              : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isUser 
              ? 'rgba(99, 102, 241, 0.2)' 
              : 'rgba(255, 255, 255, 0.05)'}`,
            wordBreak: 'break-word',
          }}
        >
          <Text variant="body-default-s" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {message.content}
          </Text>
        </Card>
        
        {message.metadata?.action && (
          <Badge 
            color="neutral" 
            style={{ 
              alignSelf: 'flex-start',
              fontSize: '0.7rem',
              opacity: 0.7
            }}
          >
            {message.metadata.action}
          </Badge>
        )}
        
        {message.metadata?.model && (
          <Text 
            variant="body-default-xs" 
            style={{ 
              fontSize: '0.65rem',
              opacity: 0.5,
              marginTop: '2px'
            }}
          >
            {message.metadata.isFree ? '🆓 Free AI' : '💎 Premium AI'} • {message.metadata.model}
          </Text>
        )}
      </Flex>
    );
  };

  return (
    <Flex 
      direction="column" 
      fillHeight 
      style={{ 
        height: '100%', 
        background: '#1a1a1a',
        position: 'relative'
      }}
    >
      {/* Minimal Header */}
      <Flex 
        horizontal="space-between" 
        vertical="center"
        padding="xs"
        style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(255, 255, 255, 0.02)',
          minHeight: '40px'
        }}
      >
        <Flex vertical="center" gap="xs">
          <Text variant="heading-strong-s" style={{ fontSize: '1rem' }}>
            FigBud
          </Text>
          {playgroundActive && (
            <Badge color="success">
              Playground Active
            </Badge>
          )}
        </Flex>
        
        <IconButton
          onClick={() => onNavigate('settings')}
          variant="tertiary"
          size="s"
          tooltip="Settings"
          style={{ 
            width: '32px', 
            height: '32px',
            fontSize: '0.8rem'
          }}
        >
          ⚙️
        </IconButton>
      </Flex>

      {/* Messages Area */}
      <Flex 
        direction="column" 
        fillHeight 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '0.5rem',
          gap: '0.5rem'
        }}
      >
        {messages.length === 0 && (
          <Flex 
            direction="column" 
            align="center" 
            fillHeight
            style={{ textAlign: 'center', opacity: 0.7, justifyContent: 'center' }}
          >
            <Text variant="body-default-s" onBackground="neutral-weak">
              Ask me to create UI components!
            </Text>
            <Text variant="body-default-xs" onBackground="neutral-weak" style={{ marginTop: '0.5rem' }}>
              Try: "Create a button" or "Make a card"
            </Text>
          </Flex>
        )}

        {messages.map((message) => (
          <React.Fragment key={message.id}>
            {renderMessage(message)}
          </React.Fragment>
        ))}

        {loading && (
          <Flex 
            gap="xs" 
            vertical="center"
            style={{ alignSelf: 'flex-start' }}
          >
            <Spinner size="s" />
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Creating...
            </Text>
          </Flex>
        )}

        <div ref={messagesEndRef} />
      </Flex>

      {/* Teacher Bubble - Floating */}
      {messages.some(m => m.metadata?.teacherNote) && (
        <Card
          padding="xs"
          radius="m"
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '0.5rem',
            maxWidth: '180px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            zIndex: 10,
            fontSize: '0.7rem'
          }}
        >
          <Flex gap="xs" vertical="start">
            <Text variant="body-default-xs" style={{ fontSize: '0.65rem' }}>
              💡 Pro tip
            </Text>
            <Text variant="body-default-xs" style={{ fontSize: '0.7rem', opacity: 0.9 }}>
              {messages.filter(m => m.metadata?.teacherNote).pop()?.metadata?.teacherNote}
            </Text>
          </Flex>
        </Card>
      )}

      {/* Input Area */}
      <Flex
        padding="xs"
        style={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <form onSubmit={handleSubmit}>
          <Flex gap="xs">
            <Input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Create a button..."
              disabled={loading}
              className="glass-input"
              style={{ 
                flex: 1,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.875rem',
                height: '36px'
              }}
            />
            <IconButton
              type="submit"
              variant="primary"
              size="s"
              disabled={!input.trim() || loading}
              tooltip="Send"
              style={{ 
                width: '36px', 
                height: '36px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              →
            </IconButton>
          </Flex>
        </form>
      </Flex>
    </Flex>
  );
};