import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { 
  Flex, 
  Text, 
  Input, 
  Card,
  IconButton,
  Spinner,
  Switch,
  Textarea,
  Button
} from '@once-ui-system/core';

interface MinimalChatViewProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  user: UserProfile | null;
  onSendMessage: (message: string) => void;
  onNavigate: (view: 'chat' | 'settings' | 'premium' | 'onboarding') => void;
  playgroundActive?: boolean;
}

export const MinimalChatView: React.FC<MinimalChatViewProps> = ({
  messages,
  loading,
  error,
  user,
  onSendMessage,
  onNavigate,
  playgroundActive = false,
}) => {
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(true);
  const [personalizeEnabled, setPersonalizeEnabled] = useState(true);
  const [inspirations, setInspirations] = useState('');
  const [digestInfo, setDigestInfo] = useState('');
  const [writeStyle, setWriteStyle] = useState('');
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

  if (showSettings) {
    return (
      <Flex 
        direction="column" 
        fillHeight 
        style={{ 
          height: '100%', 
          background: '#0A0A0A',
          color: '#E5E5E5',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif'
        }}
      >
        {/* Settings Content */}
        <Flex 
          direction="column" 
          gap="l" 
          padding="l"
          style={{ 
            flex: 1, 
            overflowY: 'auto'
          }}
        >
          {/* Personalize Answers Section */}
          <Card
            padding="m"
            radius="m"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Flex direction="column" gap="m">
              <Flex horizontal="space-between" vertical="start">
                <Flex direction="column" gap="xs">
                  <Text variant="heading-strong-s" style={{ fontSize: '0.875rem' }}>
                    Personalize answers
                  </Text>
                  <Text variant="body-default-s" style={{ opacity: 0.6, fontSize: '0.75rem', lineHeight: '1.4' }}>
                    When enabled, Dia tailors its responses based on what you teach it here.
                  </Text>
                </Flex>
                <Switch
                  isChecked={personalizeEnabled}
                  onToggle={() => setPersonalizeEnabled(!personalizeEnabled)}
                />
              </Flex>
            </Flex>
          </Card>

          {/* Inspirations Section */}
          <Card
            padding="m"
            radius="m"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Flex direction="column" gap="s">
              <Flex direction="column" gap="xs">
                <Text variant="heading-strong-s" style={{ fontSize: '0.875rem' }}>
                  Who inspires you or shapes your taste?
                </Text>
                <Text variant="body-default-s" style={{ opacity: 0.6, fontSize: '0.75rem', lineHeight: '1.4' }}>
                  List people, brands, or products that should influence Dia's taste.
                </Text>
              </Flex>
              <Textarea
                id="inspirations"
                value={inspirations}
                onChange={(e) => setInspirations(e.target.value)}
                placeholder="Share a few writers, public figures or brands you love."
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minHeight: '60px',
                  fontSize: '0.75rem',
                  padding: '8px',
                  color: '#E5E5E5'
                }}
              />
            </Flex>
          </Card>

          {/* Digest Information Section */}
          <Card
            padding="m"
            radius="m"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Flex direction="column" gap="s">
              <Flex direction="column" gap="xs">
                <Text variant="heading-strong-s" style={{ fontSize: '0.875rem' }}>
                  How do you best digest information?
                </Text>
                <Text variant="body-default-s" style={{ opacity: 0.6, fontSize: '0.75rem', lineHeight: '1.4' }}>
                  Share a bit about yourself and your learning style.
                </Text>
              </Flex>
              <Textarea
                id="digest"
                value={digestInfo}
                onChange={(e) => setDigestInfo(e.target.value)}
                placeholder="I like short answers with bullets. Use analogies. I live in Brooklyn."
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minHeight: '60px',
                  fontSize: '0.75rem',
                  padding: '8px',
                  color: '#E5E5E5'
                }}
              />
            </Flex>
          </Card>

          {/* Write Skill Section */}
          <Card
            padding="m"
            radius="m"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Flex direction="column" gap="s">
              <Flex direction="column" gap="xs">
                <Flex gap="xs" vertical="center">
                  <Text style={{ fontSize: '0.875rem' }}>✍️</Text>
                  <Text variant="heading-strong-s" style={{ fontSize: '0.875rem' }}>
                    Write Skill
                  </Text>
                </Flex>
                <Text variant="heading-strong-m" style={{ fontSize: '1rem' }}>
                  How do you want Dia to write?
                </Text>
                <Text variant="body-default-s" style={{ opacity: 0.6, fontSize: '0.75rem', lineHeight: '1.4' }}>
                  Teach the Write Skill how to draft in your preferred style.
                </Text>
              </Flex>
              <Textarea
                id="write-style"
                value={writeStyle}
                onChange={(e) => setWriteStyle(e.target.value)}
                placeholder="Casual and witty, but emails should be concise and professional."
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minHeight: '80px',
                  fontSize: '0.75rem',
                  padding: '8px',
                  color: '#E5E5E5'
                }}
              />
              <Card
                padding="s"
                radius="s"
                style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.15)'
                }}
              >
                <Flex gap="xs" vertical="start">
                  <Text style={{ fontSize: '0.7rem' }}>ℹ️</Text>
                  <Text variant="body-default-xs" style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    The Write Skill shows up when you start drafting or editing text. You can also
                    access it by typing /write at the start of your request.
                  </Text>
                </Flex>
              </Card>
            </Flex>
          </Card>

          {/* Start Chat Button */}
          <Button
            variant="primary"
            onClick={() => setShowSettings(false)}
            style={{
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '8px 16px',
              fontSize: '0.875rem'
            }}
          >
            Start Chat →
          </Button>
        </Flex>
      </Flex>
    );
  }

  // Chat View
  return (
    <Flex 
      direction="column" 
      fillHeight 
      style={{ 
        height: '100%', 
        background: '#0A0A0A',
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
          minHeight: '36px'
        }}
      >
        <Text variant="heading-strong-s" style={{ fontSize: '0.875rem' }}>
          FigBud AI
        </Text>
        
        <IconButton
          onClick={() => setShowSettings(true)}
          variant="tertiary"
          size="s"
          tooltip="Settings"
          style={{ 
            width: '28px', 
            height: '28px',
            fontSize: '0.7rem'
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
        {messages.map((message) => (
          <Flex
            key={message.id}
            direction="column"
            gap="xs"
            style={{
              alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}
          >
            <Card
              padding="xs"
              radius="m"
              style={{
                background: message.type === 'user' 
                  ? 'rgba(99, 102, 241, 0.1)' 
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${message.type === 'user' 
                  ? 'rgba(99, 102, 241, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)'}`,
                wordBreak: 'break-word',
              }}
            >
              <Text variant="body-default-s" style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                {message.content}
              </Text>
            </Card>
          </Flex>
        ))}

        {loading && (
          <Flex gap="xs" vertical="center" style={{ alignSelf: 'flex-start' }}>
            <Spinner size="s" />
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Thinking...
            </Text>
          </Flex>
        )}

        <div ref={messagesEndRef} />
      </Flex>

      {/* Input Area */}
      <Flex
        padding="xs"
        style={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <Flex gap="xs">
            <Input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to create UI components..."
              disabled={loading}
              style={{ 
                flex: 1,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.75rem',
                height: '32px',
                padding: '0 8px'
              }}
            />
            <IconButton
              type="submit"
              variant="primary"
              size="s"
              disabled={!input.trim() || loading}
              tooltip="Send"
              style={{ 
                width: '32px', 
                height: '32px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontSize: '0.75rem'
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