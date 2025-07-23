import React from 'react';
import { BackendProcess } from './BackendStatus';
import '../styles/minimal-design-system.css';

interface MinimalBackendStatusProps {
  processes: BackendProcess[];
}

export const MinimalBackendStatus: React.FC<MinimalBackendStatusProps> = ({ processes }) => {
  // Only show active processes
  const activeProcess = processes.find(p => p.status === 'active');
  
  if (!activeProcess) return null;

  return (
    <div className="status-inline fade-in">
      {activeProcess.message || 'Processing...'}
      {activeProcess.details?.responseTime && (
        <span style={{ marginLeft: 'var(--space-xs)' }}>
          ({activeProcess.details.responseTime}ms)
        </span>
      )}
    </div>
  );
};