import React from 'react';
import { TutorialResult } from '../types';
import '../styles/minimal-design-system.css';

interface MinimalTutorialCardProps {
  tutorial: TutorialResult;
}

export const MinimalTutorialCard: React.FC<MinimalTutorialCardProps> = ({ tutorial }) => {
  const handleClick = () => {
    window.open(tutorial.url, '_blank');
  };

  return (
    <div 
      className="tutorial-minimal" 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && handleClick()}
    >
      {tutorial.thumbnailUrl && (
        <div className="tutorial-thumbnail">
          <img 
            src={tutorial.thumbnailUrl} 
            alt=""
            loading="lazy"
          />
        </div>
      )}
      <div className="tutorial-content">
        <div className="tutorial-title">{tutorial.title}</div>
        <div className="tutorial-meta">
          {tutorial.channelTitle} • {tutorial.duration}
        </div>
      </div>
    </div>
  );
};