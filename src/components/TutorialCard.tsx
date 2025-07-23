import React from 'react';
import { TutorialResult } from '../types';
import '../styles/tutorial-cards.css';

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
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FF9800';
      case 'advanced':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const handleCardClick = () => {
    window.open(tutorial.url, '_blank');

    // Track analytics
    parent.postMessage(
      {
        pluginMessage: {
          type: 'track-analytics',
          payload: {
            event: 'tutorial_clicked',
            tutorialId: tutorial.id,
            videoId: tutorial.videoId,
          },
        },
      },
      '*'
    );
  };

  // Ensure YouTube thumbnail URL is in the correct format
  const getThumbnailUrl = () => {
    if (!tutorial.thumbnailUrl) {
      // Use YouTube's direct thumbnail API as fallback
      return `https://i.ytimg.com/vi/${tutorial.videoId}/hqdefault.jpg`;
    }
    
    // If it's already a YouTube thumbnail URL, use it
    if (tutorial.thumbnailUrl.includes('ytimg.com') || 
        tutorial.thumbnailUrl.includes('youtube.com')) {
      return tutorial.thumbnailUrl;
    }
    
    // For mock data (picsum), return as is
    if (tutorial.thumbnailUrl.includes('picsum.photos')) {
      return tutorial.thumbnailUrl;
    }
    
    // Default to YouTube's thumbnail API
    return `https://i.ytimg.com/vi/${tutorial.videoId}/hqdefault.jpg`;
  };

  return (
    <div className="tutorial-card" onClick={handleCardClick}>
      <div className="tutorial-thumbnail">
        <img
          src={getThumbnailUrl()}
          alt={tutorial.title}
          loading="lazy"
          onError={(e) => {
            console.error('[TutorialCard] Image failed to load:', getThumbnailUrl());
            const img = e.target as HTMLImageElement;
            // Use a better fallback image
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjMUUxRTFFIi8+CjxyZWN0IHg9IjEiIHk9IjEiIHdpZHRoPSIxNTgiIGhlaWdodD0iODgiIHN0cm9rZT0iIzJEMkQyRCIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjgwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjMkQyRDJEIi8+CjxwYXRoIGQ9Ik03NCAzN0w5MiA0NUw3NCA1M1YzN1oiIGZpbGw9IiNGRkZGRkYiLz4KPHRleHQgeD0iODAiIHk9Ijc1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2NjY2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiPlZpZGVvIFVuYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4=';
          }}
          onLoad={() => {
            console.log('[TutorialCard] Image loaded successfully');
          }}
        />
        <div className="tutorial-duration">
          {tutorial.duration ? (
            typeof tutorial.duration === 'number' 
              ? formatDuration(tutorial.duration) 
              : tutorial.duration
          ) : '0:00'}
        </div>
        <div className="play-overlay">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
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
            {tutorial.relevanceScore ? Math.round(tutorial.relevanceScore * 100) : 80}% match
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
                    {timestamp.seconds ? formatDuration(timestamp.seconds) : timestamp.time}
                  </span>
                  <span className="timestamp-topic">{timestamp.topic || timestamp.title}</span>
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
