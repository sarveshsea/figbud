import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { LoadingInsights } from './LoadingInsights';
import { BackendStatus, BackendProcess } from './BackendStatus';
import { MinimalProcessView } from './MinimalProcessView';
import { TutorialCarousel } from './TutorialCarousel';
import '../styles/backend-status.css';

interface ChatWindowProps {
  isMinimized: boolean;
  messages: ChatMessage[];
  loading: boolean;
  backendProcesses?: BackendProcess[];
  agents?: Array<{ name: string; status: string; task: string }>;
  showBackendStatus?: boolean;
  onSendMessage: (message: string) => void;
  onMinimize: () => void;
  onResize: (width: number, height: number) => void;
  onShowComponentLibrary?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isMinimized,
  messages,
  loading,
  backendProcesses = [],
  agents = [],
  showBackendStatus = false,
  onSendMessage,
  onMinimize,
  onResize,
  onShowComponentLibrary,
}) => {
  const [input, setInput] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState({ width: window.innerWidth || 600, height: window.innerHeight || 800 });
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.classList.contains('resize-handle')) {
      e.preventDefault();
      setIsResizing(true);
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const newWidth = Math.min(Math.max(300, e.clientX), 600);
      const newHeight = Math.min(Math.max(400, e.clientY), 800);
      
      setSize({ width: newWidth, height: newHeight });
      onResize(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onResize]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input);
      setInput('');
    }
  };


  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full rounded-window shadow-2xl animate-maximize glass-container"
      style={{ 
        width: '100%', 
        height: '100%',
        maxWidth: size.width,
        maxHeight: size.height,
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-figbud-border glass-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            {/* Minimal Pixel Frog */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              {/* Frog body - simplified pixel style */}
              <rect x="6" y="8" width="8" height="8" fill="#4CAF50" opacity="0.9"/>
              {/* Eyes */}
              <rect x="7" y="6" width="2" height="3" fill="#4CAF50" opacity="0.9"/>
              <rect x="11" y="6" width="2" height="3" fill="#4CAF50" opacity="0.9"/>
              <rect x="7" y="7" width="2" height="2" fill="#FFFFFF"/>
              <rect x="11" y="7" width="2" height="2" fill="#FFFFFF"/>
              <rect x="8" y="8" width="1" height="1" fill="#000000"/>
              <rect x="12" y="8" width="1" height="1" fill="#000000"/>
              {/* Minimal features */}
              <rect x="8" y="12" width="4" height="1" fill="#388E3C" opacity="0.7"/>
            </svg>
          </div>
          <h2 className="text-figbud-text font-semibold">FigBud</h2>
        </div>
        <div className="flex items-center gap-2">
          {onShowComponentLibrary && (
            <button
              onClick={onShowComponentLibrary}
              className="p-2 hover:bg-figbud-bg-secondary rounded transition-colors"
              aria-label="Component Library"
              title="Component Library"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" stroke="#999999" strokeWidth="1.5"/>
                <rect x="9" y="2" width="5" height="5" rx="1" stroke="#999999" strokeWidth="1.5"/>
                <rect x="2" y="9" width="5" height="5" rx="1" stroke="#999999" strokeWidth="1.5"/>
                <rect x="9" y="9" width="5" height="5" rx="1" stroke="#999999" strokeWidth="1.5"/>
              </svg>
            </button>
          )}
          <button
            onClick={onMinimize}
            className="p-2 hover:bg-figbud-bg-secondary rounded transition-colors"
            aria-label="Minimize"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8H12" stroke="#999999" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>


      {/* Backend Status - Removed from here, will be shown below frog */}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-figbud-text-secondary py-8">
            <p className="text-lg mb-2">Welcome to FigBud! 👋</p>
            <p>I'm here to help you design better and faster.</p>
            <p className="mt-4 text-sm">Try asking me to:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Create a button component</li>
              <li>• Design a card layout</li>
              <li>• Build an input field</li>
            </ul>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] p-bubble rounded-bubble ${
                message.type === 'user'
                  ? 'message-user-glass message-glass'
                  : 'message-assistant-glass message-glass'
              }`}
            >
              <p className="text-body whitespace-pre-wrap">{message.content}</p>
              
              {/* Show step-by-step instructions if available */}
              {message.metadata?.stepByStep && message.metadata.stepByStep.length > 0 && (
                <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-xs font-medium text-green-400 mb-2">📝 Step-by-step guide:</p>
                  <div className="space-y-1">
                    {message.metadata.stepByStep.map((step: string, idx: number) => (
                      <p key={idx} className="text-xs text-figbud-text pl-3">
                        {step}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show teacher note if available */}
              {message.metadata?.teacherNote && (
                <div className="mt-2 p-2 bg-figbud-accent/10 border border-figbud-accent/20 rounded-lg">
                  <p className="text-xs text-figbud-accent">💡 {message.metadata.teacherNote}</p>
                </div>
              )}
              
              {/* Show tutorials if available */}
              {message.metadata?.tutorials && message.metadata.tutorials.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-figbud-text-secondary mb-2">📹 Related tutorials:</p>
                  <TutorialCarousel tutorials={message.metadata.tutorials} />
                </div>
              )}
              
              {/* Show suggestions if available */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(suggestion)}
                      className="block w-full text-left px-2 py-1 text-xs hover:bg-figbud-bg-secondary rounded transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Show model info for debugging */}
              {message.metadata?.model && (
                <p className="text-xs opacity-30 mt-2">
                  {message.metadata.isFree ? '🆓' : '💎'} {message.metadata.model}
                </p>
              )}
              <span className="text-xs opacity-50 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}
        
        {loading && loadingStartTime && (
          <div className="flex flex-col justify-start w-full max-w-[90%] gap-2">
            <LoadingInsights 
              startTime={loadingStartTime}
              currentModel={messages[messages.length - 1]?.metadata?.model}
            />
            {/* Backend processing shown below frog */}
            {showBackendStatus && backendProcesses.length > 0 && (
              <div className="w-full">
                <BackendStatus 
                  processes={backendProcesses} 
                  isVisible={showBackendStatus}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Minimal process view for when not loading */}
        {!loading && (backendProcesses.length > 0 || agents.length > 0) && (
          <div className="flex justify-start w-full max-w-[90%] mb-2">
            <MinimalProcessView 
              processes={backendProcesses}
              agents={agents}
              isVisible={true}
            />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Icons Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-figbud-border glass-surface">
        <button
          className="p-2 hover:bg-figbud-bg-secondary rounded transition-colors"
          aria-label="Add"
          title="Add element"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V16M4 10H16" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8"/>
          </svg>
        </button>
        <button
          className="p-2 hover:bg-figbud-bg-secondary rounded transition-colors"
          aria-label="Help"
          title="Get help"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.8"/>
            <path d="M8 8C8 6.89543 8.89543 6 10 6C11.1046 6 12 6.89543 12 8C12 9.10457 11.1046 10 10 10V12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8"/>
            <circle cx="10" cy="15" r="0.5" fill="#FFFFFF" fillOpacity="0.8"/>
          </svg>
        </button>
        <button
          className="p-2 hover:bg-figbud-bg-secondary rounded transition-colors"
          aria-label="AI Action"
          title="AI suggestions"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L12 8H18L13 11L15 17L10 14L5 17L7 11L2 8H8L10 2Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8"/>
          </svg>
        </button>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-figbud-border glass-surface">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={loading}
            className="flex-1 px-4 py-2 glass-input text-figbud-text placeholder-figbud-text-secondary rounded-lg border border-figbud-border focus:border-figbud-border-hover focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 glass-surface hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-xl transition-all duration-200 flex items-center justify-center group"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Modern minimal arrow icon */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:scale-110 transition-transform duration-200">
              <path 
                d="M14 8L2 14L6 8L2 2L14 8Z" 
                stroke="#FFFFFF" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="none"
                opacity="0.9"
              />
              <circle cx="14" cy="8" r="1" fill="#FFFFFF" opacity="0.6"/>
            </svg>
          </button>
        </div>
      </form>

      {/* Resize Handle */}
      <div className="resize-handle" />
    </div>
  );
};