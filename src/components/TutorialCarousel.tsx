import React, { useState } from 'react';
import { TutorialResult } from '../types';
import '../styles/tutorial-carousel.css';

interface TutorialCarouselProps {
  tutorials: TutorialResult[];
}

export const TutorialCarousel: React.FC<TutorialCarouselProps> = ({ tutorials }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!tutorials || tutorials.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? tutorials.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === tutorials.length - 1 ? 0 : prev + 1));
  };

  const currentTutorial = tutorials[currentIndex];

  const handleClick = () => {
    if (currentTutorial?.url) {
      window.open(currentTutorial.url, '_blank');
    }
  };

  return (
    <div className="tutorial-carousel">
      <div className="carousel-container" onClick={handleClick}>
        {/* Navigation */}
        {tutorials.length > 1 && (
          <>
            <button 
              className="carousel-nav carousel-nav-prev"
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            >
              ‹
            </button>
            <button 
              className="carousel-nav carousel-nav-next"
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
            >
              ›
            </button>
          </>
        )}

        {/* Content */}
        <div className="carousel-content">
          <div className="carousel-thumbnail">
            <img 
              src={currentTutorial?.thumbnailUrl || `https://i.ytimg.com/vi/${currentTutorial?.videoId}/hqdefault.jpg`}
              alt={currentTutorial?.title}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
            <div className="carousel-play-icon">▶</div>
          </div>
          <div className="carousel-info">
            <h5 className="carousel-title">{currentTutorial?.title}</h5>
            <p className="carousel-channel">{currentTutorial?.channelTitle}</p>
            {currentTutorial?.duration && (
              <span className="carousel-duration">{currentTutorial.duration}</span>
            )}
          </div>
        </div>
      </div>

      {/* Indicators */}
      {tutorials.length > 1 && (
        <div className="carousel-indicators">
          {tutorials.map((_, index) => (
            <button
              key={index}
              className={`indicator-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};