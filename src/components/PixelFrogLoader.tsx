import React from 'react';
import '../styles/pixel-frog.css';

interface PixelFrogLoaderProps {
  progress: number; // 0-100
  statusMessage: string;
  elapsedTime: number;
  currentStep?: string;
}

export const PixelFrogLoader: React.FC<PixelFrogLoaderProps> = ({ 
  progress, 
  statusMessage,
  elapsedTime,
  currentStep 
}) => {
  // Determine which frame of the frog animation to show based on progress
  const frameIndex = Math.floor((progress / 100) * 3) % 4;
  
  return (
    <div className="pixel-frog-container">
      {/* Pixelated frog using CSS - more detailed pixel art */}
      <div className="pixel-frog-wrapper">
        <div className="pixel-frog">
          {/* Row 1 - Top of head */}
          <div className="pixel-row">
            <div className="pixel green" style={{ gridColumn: '4/5' }}></div>
            <div className="pixel green" style={{ gridColumn: '7/8' }}></div>
          </div>
          {/* Row 2 - Head top */}
          <div className="pixel-row">
            <div className="pixel green" style={{ gridColumn: '3/6' }}></div>
            <div className="pixel green" style={{ gridColumn: '6/9' }}></div>
          </div>
          {/* Row 3 - Eyes */}
          <div className="pixel-row">
            <div className="pixel green" style={{ gridColumn: '2/3' }}></div>
            <div className="pixel light-green" style={{ gridColumn: '3/4' }}></div>
            <div className="pixel black eye" style={{ gridColumn: '4/5' }}></div>
            <div className="pixel green" style={{ gridColumn: '5/6' }}></div>
            <div className="pixel green" style={{ gridColumn: '6/7' }}></div>
            <div className="pixel black eye" style={{ gridColumn: '7/8' }}></div>
            <div className="pixel light-green" style={{ gridColumn: '8/9' }}></div>
            <div className="pixel green" style={{ gridColumn: '9/10' }}></div>
          </div>
          {/* Row 4 - Nostrils and mouth */}
          <div className="pixel-row">
            <div className="pixel green" style={{ gridColumn: '2/4' }}></div>
            <div className="pixel black" style={{ gridColumn: '4/5' }}></div>
            <div className="pixel dark-green" style={{ gridColumn: '5/6' }}></div>
            <div className="pixel black" style={{ gridColumn: '6/7' }}></div>
            <div className="pixel green" style={{ gridColumn: '7/10' }}></div>
          </div>
          {/* Row 5 - Mouth/Chin */}
          <div className="pixel-row">
            <div className="pixel green" style={{ gridColumn: '3/4' }}></div>
            <div className="pixel dark-green" style={{ gridColumn: '4/8' }}></div>
            <div className="pixel green" style={{ gridColumn: '8/9' }}></div>
          </div>
          {/* Row 6 - Body */}
          <div className="pixel-row">
            <div className="pixel green" style={{ gridColumn: '2/4' }}></div>
            <div className="pixel light-green" style={{ gridColumn: '4/5' }}></div>
            <div className="pixel light-green" style={{ gridColumn: '5/7' }}></div>
            <div className="pixel light-green" style={{ gridColumn: '7/8' }}></div>
            <div className="pixel green" style={{ gridColumn: '8/10' }}></div>
          </div>
          {/* Row 7 - Lower body */}
          <div className="pixel-row">
            <div className="pixel green" style={{ gridColumn: '3/4' }}></div>
            <div className="pixel light-green" style={{ gridColumn: '4/8' }}></div>
            <div className="pixel green" style={{ gridColumn: '8/9' }}></div>
          </div>
          {/* Row 8 - Feet */}
          <div className="pixel-row">
            <div className="pixel dark-green" style={{ gridColumn: '2/4' }}></div>
            <div className="pixel dark-green" style={{ gridColumn: '8/10' }}></div>
          </div>
        </div>
      </div>

      {/* Status text with detailed info */}
      <div className="pixel-status">
        <p className="pixel-text">{statusMessage}</p>
        {currentStep && (
          <p className="pixel-step">{currentStep}</p>
        )}
        <div className="pixel-progress-wrapper">
          <div className="pixel-progress-bar">
            <div 
              className="pixel-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="pixel-progress-percent">{Math.round(progress)}%</span>
        </div>
        {elapsedTime > 0 && (
          <p className="pixel-time">{Math.floor(elapsedTime)}s</p>
        )}
      </div>
    </div>
  );
};