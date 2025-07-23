import React, { useState, useEffect } from 'react';
import { consoleErrorTracker, ConsoleError } from '../services/consoleErrorTracker';
import '../styles/minimal-design-system.css';

interface ConsoleErrorViewProps {
  isVisible: boolean;
  onClose?: () => void;
}

export const ConsoleErrorView: React.FC<ConsoleErrorViewProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const [errors, setErrors] = useState<ConsoleError[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    // Get initial errors
    setErrors(consoleErrorTracker.getRecentErrors(20));

    // Listen for new errors
    const handleError = (error: ConsoleError) => {
      setErrors(prev => [...prev.slice(-19), error]);
    };

    consoleErrorTracker.onError(handleError);

    return () => {
      // Cleanup would go here if we had a way to remove handlers
    };
  }, []);

  if (!isVisible || errors.length === 0) return null;

  const getErrorIcon = (type: ConsoleError['type']) => {
    switch (type) {
      case 'error': return '🔴';
      case 'warn': return '🟡';
      default: return '⚪';
    }
  };

  const summary = consoleErrorTracker.getErrorSummary();

  return (
    <div className="console-error-view" style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '400px',
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontSize: '12px',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-sm) var(--space-md)',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span>Console Errors</span>
          <span style={{ 
            padding: '2px 6px', 
            borderRadius: '4px',
            background: summary.errors > 0 ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
            color: summary.errors > 0 ? '#f44336' : '#4CAF50'
          }}>
            {summary.errors} errors
          </span>
          {summary.warnings > 0 && (
            <span style={{ 
              padding: '2px 6px', 
              borderRadius: '4px',
              background: 'rgba(255, 152, 0, 0.2)',
              color: '#FF9800'
            }}>
              {summary.warnings} warnings
            </span>
          )}
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Error list */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 'var(--space-sm)'
      }}>
        {errors.map((error) => (
          <div 
            key={error.id}
            style={{
              padding: 'var(--space-sm)',
              marginBottom: 'var(--space-xs)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
            onClick={() => setShowDetails(showDetails === error.id ? null : error.id)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
              <span>{getErrorIcon(error.type)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: 'var(--color-text)',
                  wordBreak: 'break-word',
                  lineHeight: '1.4'
                }}>
                  {error.message.substring(0, 100)}
                  {error.message.length > 100 && '...'}
                </div>
                {error.suggestion && (
                  <div style={{
                    marginTop: 'var(--space-xs)',
                    padding: '4px 8px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '4px',
                    color: 'var(--color-accent)',
                    fontSize: '11px'
                  }}>
                    💡 {error.suggestion}
                  </div>
                )}
                <div style={{ 
                  color: 'var(--color-text-secondary)',
                  fontSize: '10px',
                  marginTop: '4px'
                }}>
                  {new Date(error.timestamp).toLocaleTimeString()}
                  {error.source && ` • ${error.source.split('/').pop()}`}
                  {error.lineNumber && `:${error.lineNumber}`}
                </div>
              </div>
            </div>

            {/* Expanded details */}
            {showDetails === error.id && error.stack && (
              <div style={{
                marginTop: 'var(--space-sm)',
                padding: 'var(--space-sm)',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {error.stack}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Common patterns */}
      {summary.patterns.length > 0 && (
        <div style={{
          padding: 'var(--space-sm) var(--space-md)',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            Common patterns:
            {summary.patterns.slice(0, 3).map((pattern, i) => (
              <span key={i} style={{ marginLeft: '8px' }}>
                {pattern.pattern}... ({pattern.count}x)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};