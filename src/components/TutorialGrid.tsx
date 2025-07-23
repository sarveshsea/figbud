import React from 'react';
import { TutorialCard } from './TutorialCard';
import { TutorialResult } from '../types';
import '../styles/tutorial-cards.css';

interface TutorialGridProps {
  tutorials: TutorialResult[];
  loading?: boolean;
}

export const TutorialGrid: React.FC<TutorialGridProps> = ({ tutorials, loading }) => {
  if (loading) {
    return (
      <div className="tutorials-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="tutorial-skeleton">
            <div className="skeleton-thumbnail" />
            <div className="skeleton-content">
              <div className="skeleton-title" />
              <div className="skeleton-channel" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tutorials || tutorials.length === 0) {
    return (
      <div className="no-tutorials">
        <div className="no-tutorials-icon">🎥</div>
        <p>No tutorials found for this topic.</p>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>
          Try rephrasing your question or search for a different topic.
        </p>
      </div>
    );
  }

  return (
    <div className="tutorials-grid">
      {tutorials.map((tutorial) => (
        <TutorialCard key={tutorial.id} tutorial={tutorial} />
      ))}
    </div>
  );
};

// Skeleton loader component for individual tutorial card
export const TutorialCardSkeleton: React.FC = () => (
  <div className="tutorial-skeleton">
    <div className="skeleton-thumbnail" />
    <div className="skeleton-content">
      <div className="skeleton-title" />
      <div className="skeleton-channel" />
    </div>
  </div>
);