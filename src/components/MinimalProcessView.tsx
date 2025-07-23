import React from 'react';
import '../styles/minimal-design-system.css';

interface Process {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cached';
  message?: string;
  details?: any;
}

interface Agent {
  name: string;
  status: string;
  task: string;
}

interface MinimalProcessViewProps {
  processes: Process[];
  agents?: Agent[];
  isVisible: boolean;
}

export const MinimalProcessView: React.FC<MinimalProcessViewProps> = ({ 
  processes, 
  agents = [],
  isVisible 
}) => {
  if (!isVisible || (processes.length === 0 && agents.length === 0)) return null;

  const getStatusEmoji = (status: Process['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'active': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'cached': return '⚡';
      default: return '•';
    }
  };

  const getAgentEmoji = (agentName: string) => {
    switch (agentName) {
      case 'Manager': return '👔';
      case 'BackendEngineer': return '⚙️';
      case 'FrontendEngineer': return '🎨';
      case 'Debugger': return '🐛';
      case 'SolutionsArchitect': return '🏗️';
      default: return '🤖';
    }
  };

  // Show only active processes in a minimal way
  const activeProcesses = processes.filter(p => p.status === 'active');
  const activeAgents = agents.filter(a => a.status === 'active');

  return (
    <div className="minimal-process-view" style={{
      fontSize: '12px',
      color: 'var(--color-text-secondary)',
      padding: '4px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      {/* Active Agents */}
      {activeAgents.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {activeAgents.map(agent => (
            <span key={agent.name} style={{ opacity: 0.8 }}>
              {getAgentEmoji(agent.name)} {agent.task}
            </span>
          ))}
        </div>
      )}

      {/* Active Processes */}
      {activeProcesses.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {activeProcesses.map(process => (
            <span key={process.id} style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px' 
            }}>
              {getStatusEmoji(process.status)} {process.message || process.name}
            </span>
          ))}
        </div>
      )}

      {/* Show cache hit indicator */}
      {processes.some(p => p.details?.cacheHit) && (
        <span style={{ color: 'var(--color-accent)', fontSize: '11px' }}>
          ⚡ Using cached response
        </span>
      )}

      {/* Show model info if available */}
      {processes.some(p => p.details?.model) && (
        <span style={{ fontSize: '11px', opacity: 0.7 }}>
          Model: {processes.find(p => p.details?.model)?.details.model}
        </span>
      )}
    </div>
  );
};