import React from 'react';
import './once-ui-theme.css';

interface OnceUIProviderProps {
  children: React.ReactNode;
}

// Once UI doesn't require a provider - it uses CSS variables for theming
// We'll create a simple wrapper that applies our theme
export const OnceUIProvider: React.FC<OnceUIProviderProps> = ({ children }) => {
  return (
    <div className="once-ui-root" data-theme="dark">
      {children}
    </div>
  );
};