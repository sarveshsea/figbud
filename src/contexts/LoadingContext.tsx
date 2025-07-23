import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingProcess {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  description?: string;
  startTime?: number;
  endTime?: number;
}

interface LoadingContextType {
  processes: LoadingProcess[];
  startTime: number | null;
  currentModel: string | null;
  retryCount: number;
  startLoading: () => void;
  stopLoading: () => void;
  updateProcess: (id: string, updates: Partial<LoadingProcess>) => void;
  setCurrentModel: (model: string) => void;
  incrementRetry: () => void;
  resetRetry: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [processes, setProcesses] = useState<LoadingProcess[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const startLoading = useCallback(() => {
    setStartTime(Date.now());
    setProcesses([
      { id: 'analyze', name: 'Request Analysis', status: 'active' },
      { id: 'model', name: 'AI Model Selection', status: 'pending' },
      { id: 'search', name: 'Tutorial Search', status: 'pending' },
      { id: 'generate', name: 'Response Generation', status: 'pending' }
    ]);
  }, []);

  const stopLoading = useCallback(() => {
    setStartTime(null);
    setProcesses([]);
    setCurrentModel(null);
    setRetryCount(0);
  }, []);

  const updateProcess = useCallback((id: string, updates: Partial<LoadingProcess>) => {
    setProcesses(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  }, []);

  const incrementRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  const resetRetry = useCallback(() => {
    setRetryCount(0);
  }, []);

  const value: LoadingContextType = {
    processes,
    startTime,
    currentModel,
    retryCount,
    startLoading,
    stopLoading,
    updateProcess,
    setCurrentModel,
    incrementRetry,
    resetRetry
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};