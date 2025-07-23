import React from 'react';
import { AnimatedDots } from './AnimatedDots';

export interface BackendProcess {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cached';
  message?: string;
  duration?: number;
  details?: {
    model?: string;
    cacheHit?: boolean;
    apiCalls?: number;
    tokensUsed?: number;
    cost?: number;
    error?: string;
    responseTime?: number;
  };
}

interface BackendStatusProps {
  processes: BackendProcess[];
  isVisible: boolean;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({ processes, isVisible }) => {
  if (!isVisible || processes.length === 0) return null;

  const getStatusIcon = (status: BackendProcess['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'active': return '⚡';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cached': return '💾';
      default: return '•';
    }
  };

  const getStatusColor = (status: BackendProcess['status']) => {
    switch (status) {
      case 'pending': return 'rgba(255, 255, 255, 0.3)';
      case 'active': return 'rgba(99, 102, 241, 0.9)';
      case 'completed': return 'rgba(16, 185, 129, 0.9)';
      case 'failed': return 'rgba(239, 68, 68, 0.9)';
      case 'cached': return 'rgba(251, 191, 36, 0.9)';
      default: return 'rgba(255, 255, 255, 0.5)';
    }
  };

  return (
    <div className="backend-status-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '2px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          Backend Processing
        </div>
        
        <div className="backend-processes">
          {processes.map((process) => (
            <div key={process.id} className="backend-process-item">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span 
                  className="process-status-icon"
                  style={{ color: getStatusColor(process.status) }}
                >
                  {getStatusIcon(process.status)}
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '12px',
                      color: process.status === 'active' 
                        ? 'rgba(255, 255, 255, 0.95)' 
                        : 'rgba(255, 255, 255, 0.7)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                      {process.name}
                    </span>
                    
                    {process.status === 'active' && <AnimatedDots />}
                    
                    {process.duration && (
                      <span style={{ 
                        fontSize: '10px', 
                        color: 'rgba(255, 255, 255, 0.4)' 
                      }}>
                        {process.duration}ms
                      </span>
                    )}
                  </div>
                  
                  {process.message && (
                    <span style={{ 
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontStyle: 'italic'
                    }}>
                      {process.message}
                    </span>
                  )}
                  
                  {process.details && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {process.details.model && (
                        <span style={{ 
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          {process.details.model}
                        </span>
                      )}
                      
                      {process.details.cacheHit !== undefined && (
                        <span style={{ 
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: process.details.cacheHit ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                          color: process.details.cacheHit ? 'rgba(251, 191, 36, 0.9)' : 'rgba(255, 255, 255, 0.7)'
                        }}>
                          {process.details.cacheHit ? 'Cache Hit' : 'Cache Miss'}
                        </span>
                      )}
                      
                      {process.details.tokensUsed && (
                        <span style={{ 
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          {process.details.tokensUsed} tokens
                        </span>
                      )}
                      
                      {process.details.cost && (
                        <span style={{ 
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                          ${process.details.cost.toFixed(4)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Status message component for inline display
export const StatusMessage: React.FC<{ 
  icon?: string; 
  message: string; 
  details?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}> = ({ icon = '🔄', message, details, type = 'info' }) => {
  const getTypeColor = () => {
    switch (type) {
      case 'success': return 'rgba(16, 185, 129, 0.1)';
      case 'warning': return 'rgba(251, 191, 36, 0.1)';
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(99, 102, 241, 0.1)';
    }
  };

  return (
    <div className="status-message" style={{
      background: getTypeColor(),
      border: `1px solid ${getTypeColor().replace('0.1', '0.2')}`,
      borderRadius: '8px',
      padding: '8px 12px',
      marginBottom: '8px'
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '12px' }}>
            {message}
          </span>
          {details && (
            <span style={{ 
              fontSize: '11px', 
              color: 'rgba(255, 255, 255, 0.6)' 
            }}>
              {details}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};