import React from 'react';

interface MinimizedBudProps {
  onClick: () => void;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export const MinimizedBud: React.FC<MinimizedBudProps> = ({ 
  onClick,
  position = 'bottom-left' 
}) => {
  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} w-[50px] h-[50px] animate-minimize`}
      onClick={onClick}
    >
      <button
        className="w-full h-full bg-figbud-bg-secondary hover:bg-figbud-bg-hover rounded-bud shadow-lg cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center group border border-figbud-border glass-surface"
        aria-label="Open FigBud"
      >
        {/* Bud Face Icon */}
        <svg 
          className="w-8 h-8" 
          viewBox="0 0 32 32" 
          fill="none"
        >
          {/* Head */}
          <circle 
            cx="16" 
            cy="16" 
            r="14" 
            className="fill-figbud-text-tertiary group-hover:fill-figbud-green transition-colors duration-200"
          />
          
          {/* Eyes */}
          <circle cx="11" cy="13" r="2" className="fill-figbud-bg" />
          <circle cx="21" cy="13" r="2" className="fill-figbud-bg" />
          
          {/* Smile */}
          <path 
            d="M10 19 Q16 23 22 19" 
            stroke="#1E1E1E" 
            strokeWidth="2" 
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Green accent blob */}
          <circle 
            cx="24" 
            cy="8" 
            r="4" 
            className="fill-figbud-green animate-pulse"
          />
        </svg>
      </button>
    </div>
  );
};