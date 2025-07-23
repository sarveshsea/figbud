import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/main.css';

// Initialize React app immediately
console.log('[FigBud UI] ui.tsx loaded, initializing...');
console.log('[FigBud UI] Document ready state:', document.readyState);
console.log('[FigBud UI] Available globals:', {
  React: typeof React,
  createRoot: typeof createRoot,
  App: typeof App
});

const initApp = () => {
  console.log('[FigBud UI] initApp called');
  console.log('[FigBud UI] Document body:', document.body);
  console.log('[FigBud UI] Document HTML:', document.documentElement.innerHTML.substring(0, 200));
  
  const container = document.getElementById('root');
  console.log('[FigBud UI] Root container found:', !!container);
  console.log('[FigBud UI] Container content:', container?.innerHTML.substring(0, 100));

  if (container) {
    try {
      // Clear the loading screen
      console.log('[FigBud UI] Clearing container...');
      container.innerHTML = '';
      
      // Add a test element first
      const testDiv = document.createElement('div');
      testDiv.textContent = 'React mounting...';
      testDiv.style.color = '#4CAF50';
      testDiv.style.padding = '20px';
      container.appendChild(testDiv);
      
      console.log('[FigBud UI] Test element added, creating React root...');
      const root = createRoot(container);
      
      console.log('[FigBud UI] Root created, rendering App...');
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      
      console.log('[FigBud UI] React render call completed successfully');
    } catch (error) {
      console.error('[FigBud UI] Failed to render:', error);
      console.error('[FigBud UI] Error stack:', error instanceof Error ? error.stack : 'No stack');
      container.innerHTML = `<div style="color: #FF9800; padding: 20px; font-family: monospace;">
        <h3>Error initializing FigBud</h3>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
        <pre>${error instanceof Error ? error.stack : ''}</pre>
      </div>`;
    }
  } else {
    console.error('[FigBud UI] Root container not found!');
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Root container not found!</div>';
  }
};

// Initialize immediately if document is ready
if (document.readyState !== 'loading') {
  console.log('[FigBud UI] Document already ready, initializing immediately');
  initApp();
} else {
  console.log('[FigBud UI] Document still loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[FigBud UI] DOMContentLoaded fired');
    initApp();
  });
}

// Also log when window loads
window.addEventListener('load', () => {
  console.log('[FigBud UI] Window load event fired');
});