import React from 'react';
import { TutorialResult } from '../types';

interface TutorialCardProps {
  tutorial: TutorialResult;
}

export const TutorialCard: React.FC<TutorialCardProps> = ({ tutorial }) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  const handleCardClick = () => {
    window.open(tutorial.url, '_blank');
    
    // Track analytics
    parent.postMessage({
      pluginMessage: {
        type: 'track-analytics',
        payload: {
          event: 'tutorial_clicked',
          tutorialId: tutorial.id,
          videoId: tutorial.videoId
        }
      }
    }, '*');
  };

  return (
    <div className="tutorial-card" onClick={handleCardClick}>
      <div className="tutorial-thumbnail">
        <img 
          src={tutorial.thumbnailUrl} 
          alt={tutorial.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik00OCA0Mkw2NCA1MEw0OCA1OFY0MloiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+';
          }}
        />
        <div className="tutorial-duration">
          {formatDuration(tutorial.duration)}
        </div>
        <div className="play-overlay">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      
      <div className="tutorial-content">
        <h4 className="tutorial-title">{tutorial.title}</h4>
        <p className="tutorial-channel">{tutorial.channelTitle}</p>
        
        <div className="tutorial-meta">
          <span 
            className="skill-level"
            style={{ backgroundColor: getSkillLevelColor(tutorial.skillLevel) }}
          >
            {tutorial.skillLevel}
          </span>
          <span className="relevance-score">
            {Math.round(tutorial.relevanceScore * 100)}% match
          </span>
        </div>
        
        {tutorial.timestamps && tutorial.timestamps.length > 0 && (
          <div className="tutorial-timestamps">
            <p className="timestamps-label">Key topics:</p>
            <div className="timestamps-list">
              {tutorial.timestamps.slice(0, 3).map((timestamp, index) => (
                <a
                  key={index}
                  href={timestamp.url}
                  className="timestamp-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(timestamp.url, '_blank');
                  }}
                >
                  <span className="timestamp-time">
                    {formatDuration(timestamp.time)}
                  </span>
                  <span className="timestamp-topic">
                    {timestamp.topic}
                  </span>
                </a>
              ))}
              {tutorial.timestamps.length > 3 && (
                <span className="more-timestamps">
                  +{tutorial.timestamps.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};