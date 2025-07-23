import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  Sparkles, 
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  Gamepad2
} from 'lucide-react';
import { AnimatedDots } from './AnimatedDots';
import { PixelFrogLoader } from './PixelFrogLoader';

interface LoadingProcess {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  icon: React.ElementType;
  description?: string;
}

interface LoadingInsightsProps {
  startTime: number;
  processes?: LoadingProcess[];
  currentModel?: string;
  retryCount?: number;
  usePixelFrog?: boolean;
}

export const LoadingInsights: React.FC<LoadingInsightsProps> = ({ 
  startTime, 
  processes = [],
  currentModel,
  retryCount = 0,
  usePixelFrog = true // Default to showing pixel frog
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState('FigBud AI is thinking');
  const [showProcesses, setShowProcesses] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      // Update status message based on elapsed time
      if (elapsed < 3) {
        setStatusMessage('FigBud AI is thinking');
        setShowProcesses(false);
      } else if (elapsed < 8) {
        setStatusMessage('Analyzing your request');
        setShowProcesses(false);
      } else if (elapsed < 15) {
        setStatusMessage('Searching for the best AI model');
        setShowProcesses(true);
      } else if (elapsed < 25) {
        setStatusMessage('Processing with advanced AI');
        setShowProcesses(true);
      } else if (elapsed < 35) {
        setStatusMessage('Finding relevant tutorials');
        setShowProcesses(true);
      } else if (elapsed < 45) {
        setStatusMessage('Almost there! Finalizing response');
        setShowProcesses(true);
      } else {
        setStatusMessage('Taking longer than usual. Quality takes time!');
        setShowProcesses(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  // Default processes if none provided
  const defaultProcesses: LoadingProcess[] = [
    { 
      id: 'analyze', 
      name: 'Request Analysis', 
      status: elapsedTime > 2 ? 'completed' : elapsedTime > 0 ? 'active' : 'pending',
      icon: Brain,
      description: 'Understanding your question'
    },
    { 
      id: 'model', 
      name: 'AI Model Selection', 
      status: elapsedTime > 12 ? 'completed' : elapsedTime > 5 ? 'active' : 'pending',
      icon: Sparkles,
      description: currentModel || 'Finding best model'
    },
    { 
      id: 'search', 
      name: 'Tutorial Search', 
      status: elapsedTime > 25 ? 'completed' : elapsedTime > 15 ? 'active' : 'pending',
      icon: Search,
      description: 'Searching YouTube & docs'
    },
    { 
      id: 'generate', 
      name: 'Response Generation', 
      status: elapsedTime > 30 ? 'active' : 'pending',
      icon: Zap,
      description: 'Creating helpful response'
    }
  ];

  const activeProcesses = processes.length > 0 ? processes : defaultProcesses;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Calculate progress based on elapsed time
  const progress = Math.min((elapsedTime / 45) * 100, 95);

  // If pixel frog is enabled, show the pixel loader
  if (usePixelFrog) {
    // Get current active process for detailed step info
    const activeProcess = activeProcesses.find(p => p.status === 'active');
    const currentStep = activeProcess ? `${activeProcess.name}: ${activeProcess.description || ''}` : undefined;
    
    return (
      <PixelFrogLoader 
        progress={progress}
        statusMessage={statusMessage}
        elapsedTime={elapsedTime}
        currentStep={currentStep}
      />
    );
  }

  // Otherwise show the standard loader
  return (
    <div className="flex flex-col gap-2 max-w-[90%] w-full">
      {/* Main loading message */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="loading-spinner">
          <Sparkles size={16} className="loading-icon-pulse text-figbud-accent" />
        </div>
        <span className="text-sm text-figbud-text-secondary">
          {statusMessage}<AnimatedDots />
        </span>
        {elapsedTime > 5 && (
          <span className="px-2 py-0.5 text-xs bg-figbud-card-hover rounded-full text-figbud-text-secondary">
            {formatTime(elapsedTime)}
          </span>
        )}
      </div>

      {/* Process insights */}
      {showProcesses && (
        <div className="bg-figbud-ai-bubble border border-figbud-border rounded-lg p-3 ml-2 loading-insights-card">
          <div className="flex flex-col gap-2">
            {/* Progress bar */}
            {elapsedTime > 10 && (
              <div className="w-full h-1 bg-figbud-card-hover rounded-full mb-2 overflow-hidden">
                <div 
                  className="h-full bg-figbud-accent rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((elapsedTime / 45) * 100, 90)}%`
                  }}
                />
              </div>
            )}

            {/* Active processes */}
            {activeProcesses.map((process) => (
              <div 
                key={process.id}
                className={`flex items-center gap-2 transition-opacity duration-300 ${
                  process.status === 'pending' ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div className={`process-icon ${process.status}`}>
                  {process.status === 'completed' ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : process.status === 'failed' ? (
                    <AlertCircle size={14} className="text-red-500" />
                  ) : (
                    <process.icon size={14} />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${
                    process.status === 'active' ? 'font-medium text-figbud-text' : 'text-figbud-text-secondary'
                  }`}>
                    {process.name}
                  </p>
                  {process.description && process.status === 'active' && (
                    <p className="text-xs text-figbud-text-tertiary">
                      {process.description}
                    </p>
                  )}
                </div>
                {process.status === 'active' && (
                  <div className="process-loading-dots">
                    <AnimatedDots />
                  </div>
                )}
              </div>
            ))}

            {/* Model info */}
            {currentModel && elapsedTime > 15 && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-figbud-border">
                <span className="text-xs text-figbud-text-tertiary">
                  Using: {currentModel}
                </span>
                {currentModel.includes('free') && (
                  <span className="px-1.5 py-0.5 text-xs bg-green-500/10 text-green-500 rounded">
                    Free
                  </span>
                )}
              </div>
            )}

            {/* Retry info */}
            {retryCount > 0 && (
              <p className="text-xs text-figbud-text-tertiary mt-2">
                Retry attempt {retryCount}
              </p>
            )}

            {/* Long wait message */}
            {elapsedTime > 45 && (
              <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-figbud-border">
                <p className="text-xs text-figbud-text">
                  ⚡ We're using multiple AI models to ensure the best response quality
                </p>
                <p className="text-xs text-figbud-text-tertiary">
                  This sometimes takes a bit longer, but it's worth the wait!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};