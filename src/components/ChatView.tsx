import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile } from '../types';
import { AnimatedDots } from './AnimatedDots';
import { LinkPreview } from './LinkPreview';
import { LoadingInsights } from './LoadingInsights';
import { TutorialGrid } from './TutorialGrid';
import { parseLinksFromText } from '../utils/linkParser';
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
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (loading && !loadingStartTime) {
      setLoadingStartTime(Date.now());
    } else if (!loading && loadingStartTime) {
      setLoadingStartTime(null);
    }
  }, [loading, loadingStartTime]);

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
            wordBreak: 'break-word',
          }}
          className={isUser ? 'message-user-glass message-glass' : 'message-assistant-glass message-glass'}
        >
          <Flex direction="column" gap="xs">
            {/* Parse and render message content with links */}
            {(() => {
              const segments = parseLinksFromText(message.content);
              const hasLinks = segments.some(s => s.type === 'link');
              
              return (
                <>
                  {/* Text content with inline links */}
                  <Text variant="body-default-s" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {segments.map((segment, idx) => {
                      if (segment.type === 'text') {
                        return <span key={idx}>{segment.content}</span>;
                      } else if (segment.type === 'link' && segment.linkData) {
                        // Render compact link inline
                        return (
                          <LinkPreview
                            key={idx}
                            url={segment.content}
                            linkData={segment.linkData}
                            compact={true}
                          />
                        );
                      }
                      return null;
                    })}
                  </Text>
                  
                  {/* Full link preview cards below text */}
                  {!isUser && hasLinks && (
                    <Flex direction="column" gap="xs" style={{ marginTop: '0.5rem' }}>
                      {segments
                        .filter(s => s.type === 'link' && s.linkData)
                        .map((segment, idx) => (
                          <LinkPreview
                            key={`preview-${idx}`}
                            url={segment.content}
                            linkData={segment.linkData!}
                          />
                        ))}
                    </Flex>
                  )}
                </>
              );
            })()}
          </Flex>
        </Card>
        
        {/* Step by Step Instructions */}
        {message.metadata?.stepByStep && message.metadata.stepByStep.length > 0 && (
          <Card
            padding="xs"
            radius="m"
            style={{
              marginTop: '0.5rem',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.1)',
            }}
          >
            <Flex direction="column" gap="xs">
              <Text variant="body-default-xs" style={{ 
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'rgba(16, 185, 129, 0.9)'
              }}>
                📝 Step-by-step guide:
              </Text>
              {message.metadata.stepByStep.map((step: string, idx: number) => (
                <Text 
                  key={idx} 
                  variant="body-default-xs" 
                  style={{ 
                    fontSize: '0.7rem',
                    paddingLeft: '0.5rem',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  {step}
                </Text>
              ))}
            </Flex>
          </Card>
        )}
        
        {/* Detected Components */}
        {message.metadata?.components && message.metadata.components.length > 0 && (
          <Flex direction="column" gap="xs" style={{ marginTop: '0.5rem' }}>
            <Text variant="body-default-xs" style={{ opacity: 0.7 }}>
              📦 Detected components:
            </Text>
            <Flex gap="xs" wrap>
              {message.metadata.components.map((comp: any, idx: number) => (
                <Badge 
                  key={idx}
                  color="primary" 
                  style={{ fontSize: '0.65rem' }}
                >
                  {comp.type || comp.name}
                </Badge>
              ))}
            </Flex>
          </Flex>
        )}
        
        {/* Tutorials */}
        {message.metadata?.tutorials && message.metadata.tutorials.length > 0 && (
          <Flex direction="column" gap="xs" style={{ marginTop: '0.5rem' }}>
            <Text variant="body-default-xs" style={{ opacity: 0.7, marginBottom: '8px' }}>
              📹 Related tutorials:
            </Text>
            <TutorialGrid tutorials={message.metadata.tutorials} />
          </Flex>
        )}
        
        {/* Intent Info */}
        {message.metadata?.intent && (
          <Flex gap="xs" style={{ marginTop: '0.25rem' }}>
            {message.metadata.intent.action && (
              <Badge 
                color="neutral" 
                style={{ fontSize: '0.65rem', opacity: 0.7 }}
              >
                {message.metadata.intent.action}
              </Badge>
            )}
            {message.metadata.intent.confidence > 0.7 && (
              <Badge 
                color="success" 
                style={{ fontSize: '0.65rem', opacity: 0.7 }}
              >
                High confidence
              </Badge>
            )}
          </Flex>
        )}
        
        {/* Actionable Steps */}
        {message.metadata?.actionableSteps && message.metadata.actionableSteps.length > 0 && (
          <Flex direction="column" gap="xs" style={{ marginTop: '0.5rem' }}>
            <Text variant="body-default-xs" style={{ opacity: 0.7 }}>
              ✅ Steps to follow:
            </Text>
            {message.metadata.actionableSteps.map((step: any, idx: number) => (
              <Text key={idx} variant="body-default-xs" style={{ fontSize: '0.7rem', paddingLeft: '1rem' }}>
                {step.step}. {step.description}
              </Text>
            ))}
          </Flex>
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
        background: 'transparent',
        position: 'relative'
      }}
      className="glass-container"
    >
      {/* Minimal Header */}
      <Flex 
        horizontal="space-between" 
        vertical="center"
        padding="xs"
        style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          minHeight: '40px'
        }}
        className="glass-header"
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

        {loading && loadingStartTime && (
          <LoadingInsights 
            startTime={loadingStartTime}
            currentModel={messages[messages.length - 1]?.metadata?.model}
          />
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
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        className="glass-surface"
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