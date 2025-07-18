import React from 'react';
import { DemoResult } from '../types';

interface DemoCardProps {
  demo: DemoResult;
  onSelect: (demoId: string) => void;
}

export const DemoCard: React.FC<DemoCardProps> = ({ demo, onSelect }) => {
  const handleSelect = () => {
    onSelect(demo.id);
    
    // Track analytics
    parent.postMessage({
      pluginMessage: {
        type: 'track-analytics',
        payload: {
          event: 'demo_selected',
          demoId: demo.id,
          category: demo.category
        }
      }
    }, '*');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ecommerce': return '🛒';
      case 'mobile-app': return '📱';
      case 'website': return '🌐';
      case 'dashboard': return '📊';
      default: return '🎨';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ecommerce': return '#4CAF50';
      case 'mobile-app': return '#2196F3';
      case 'website': return '#FF9800';
      case 'dashboard': return '#9C27B0';
      default: return '#666';
    }
  };

  return (
    <div className="demo-card">
      <div className="demo-thumbnail">
        <img 
          src={demo.thumbnailUrl} 
          alt={demo.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjRjVGNUY1IiByeD0iNCIvPgo8cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjAiIGZpbGw9IiNEREREREQiIHJ4PSIyIi8+CjxyZWN0IHg9IjEwIiB5PSI0MCIgd2lkdGg9IjcwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRERERUREIiByeD0iMiIvPgo8cmVjdCB4PSIxMCIgeT0iNjAiIHdpZHRoPSI5MCIgaGVpZ2h0PSIxMCIgZmlsbD0iI0RERERERCIgcng9IjIiLz4KPC9zdmc+';
          }}
        />
        
        {demo.isPremium && (
          <div className="premium-badge">
            ⭐ Premium
          </div>
        )}
        
        <div className="demo-category" style={{ backgroundColor: getCategoryColor(demo.category) }}>
          <span className="category-icon">{getCategoryIcon(demo.category)}</span>
          <span className="category-name">{demo.category}</span>
        </div>
      </div>
      
      <div className="demo-content">
        <h4 className="demo-title">{demo.name}</h4>
        <p className="demo-description">{demo.description}</p>
        
        <button
          className={`demo-select-button ${demo.isPremium ? 'premium' : 'free'}`}
          onClick={handleSelect}
        >
          {demo.isPremium ? 'Create (Premium)' : 'Create Demo'}
        </button>
      </div>
    </div>
  );
};