// Simple Figma plugin that actually works
console.log('[Simple Plugin] Starting...');

// Show UI immediately
figma.showUI(__html__, {
  width: 400,
  height: 600
});

// Handle messages from UI
figma.ui.onmessage = msg => {
  console.log('[Simple Plugin] Received:', msg);
  
  if (msg.type === 'create-rectangle') {
    const rect = figma.createRectangle();
    rect.x = figma.viewport.center.x - 50;
    rect.y = figma.viewport.center.y - 50;
    rect.resize(100, 100);
    rect.fills = [{type: 'SOLID', color: {r: 0.5, g: 0.5, b: 1}}];
    
    figma.currentPage.selection = [rect];
    figma.viewport.scrollAndZoomIntoView([rect]);
    
    figma.ui.postMessage({
      type: 'rectangle-created'
    });
  }
  
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};

console.log('[Simple Plugin] Ready');