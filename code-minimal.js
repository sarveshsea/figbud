// FigBud Plugin - Minimal Test Version
console.log('[FigBud Plugin] Starting minimal test version...');

// Show UI
figma.showUI(__html__, {
  width: 420,
  height: 640,
  title: 'FigBud AI Assistant'
});

// Handle commands
if (figma.command === 'quick-button') {
  console.log('[FigBud Plugin] Quick button command');
  const button = figma.createFrame();
  button.name = 'Test Button';
  button.resize(120, 48);
  button.fills = [{type: 'SOLID', color: {r: 0.388, g: 0.4, b: 0.965}}];
  
  const viewport = figma.viewport.center;
  button.x = Math.round(viewport.x - 60);
  button.y = Math.round(viewport.y - 24);
  
  figma.currentPage.appendChild(button);
  figma.notify('✅ Test button created!');
  figma.closePlugin();
}

// Message handler
figma.ui.onmessage = msg => {
  console.log('[FigBud Plugin] Message received:', msg);
  
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};

console.log('[FigBud Plugin] Minimal version ready!');