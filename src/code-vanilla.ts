// FigBud - Vanilla JS Implementation
console.log('[FigBud] Starting vanilla implementation...');

// Font preloading
async function preloadFonts(): Promise<void> {
  console.log('[FigBud] Preloading fonts...');
  const fonts = [
    { family: 'Inter', style: 'Regular' },
    { family: 'Inter', style: 'Medium' },
    { family: 'Inter', style: 'Bold' },
  ];
  
  for (const font of fonts) {
    try {
      await figma.loadFontAsync(font as FontName);
      console.log(`[FigBud] Loaded font: ${font.family} ${font.style}`);
    } catch (error) {
      console.warn(`[FigBud] Could not load font: ${font.family} ${font.style}`, error);
    }
  }
}

// Component creation functions
async function createButton(props: any = {}) {
  const button = figma.createFrame();
  button.name = 'Button';
  button.resize(120, 40);
  button.cornerRadius = 8;
  button.fills = [{ type: 'SOLID', color: { r: 0.388, g: 0.4, b: 0.945 } }];
  
  // Auto-layout
  button.layoutMode = 'HORIZONTAL';
  button.paddingLeft = 16;
  button.paddingRight = 16;
  button.paddingTop = 8;
  button.paddingBottom = 8;
  button.primaryAxisAlignItems = 'CENTER';
  button.counterAxisAlignItems = 'CENTER';
  
  // Add text
  const text = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  text.characters = props.text || "Button";
  text.fontSize = 14;
  text.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  
  button.appendChild(text);
  
  // Position at viewport center
  button.x = figma.viewport.center.x - 60;
  button.y = figma.viewport.center.y - 20;
  
  // Select and focus
  figma.currentPage.selection = [button];
  figma.viewport.scrollAndZoomIntoView([button]);
  
  return button;
}

async function createCard(props: any = {}) {
  const card = figma.createFrame();
  card.name = 'Card';
  card.resize(320, 200);
  card.cornerRadius = 12;
  card.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
  card.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
  card.strokeWeight = 1;
  
  // Auto-layout
  card.layoutMode = 'VERTICAL';
  card.paddingLeft = 24;
  card.paddingRight = 24;
  card.paddingTop = 24;
  card.paddingBottom = 24;
  card.itemSpacing = 16;
  
  // Title
  const title = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  title.characters = props.title || "Card Title";
  title.fontSize = 18;
  title.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
  
  // Description
  const description = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  description.characters = props.description || "This is a card component created with FigBud";
  description.fontSize = 14;
  description.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
  description.layoutSizingHorizontal = 'FILL';
  
  card.appendChild(title);
  card.appendChild(description);
  
  // Position
  card.x = figma.viewport.center.x - 160;
  card.y = figma.viewport.center.y - 100;
  
  // Select and focus
  figma.currentPage.selection = [card];
  figma.viewport.scrollAndZoomIntoView([card]);
  
  return card;
}

async function createInput(props: any = {}) {
  const container = figma.createFrame();
  container.name = 'Input Field';
  container.resize(280, 72);
  container.layoutMode = 'VERTICAL';
  container.itemSpacing = 8;
  container.fills = [];
  
  // Label
  const label = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  label.characters = props.label || "Label";
  label.fontSize = 12;
  label.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
  
  // Input field
  const input = figma.createFrame();
  input.resize(280, 40);
  input.cornerRadius = 8;
  input.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
  input.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
  input.strokeWeight = 1;
  
  // Auto-layout for input
  input.layoutMode = 'HORIZONTAL';
  input.paddingLeft = 16;
  input.paddingRight = 16;
  input.paddingTop = 8;
  input.paddingBottom = 8;
  input.primaryAxisAlignItems = 'CENTER';
  
  // Placeholder text
  const placeholder = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  placeholder.characters = props.placeholder || "Enter text...";
  placeholder.fontSize = 14;
  placeholder.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
  
  input.appendChild(placeholder);
  container.appendChild(label);
  container.appendChild(input);
  
  // Position
  container.x = figma.viewport.center.x - 140;
  container.y = figma.viewport.center.y - 36;
  
  // Select and focus
  figma.currentPage.selection = [container];
  figma.viewport.scrollAndZoomIntoView([container]);
  
  return container;
}

async function createNavbar(props: any = {}) {
  const navbar = figma.createFrame();
  navbar.name = 'Navbar';
  navbar.resize(800, 64);
  navbar.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
  navbar.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.1 }];
  navbar.strokeWeight = 1;
  navbar.strokeAlign = 'INSIDE';
  
  // Auto-layout
  navbar.layoutMode = 'HORIZONTAL';
  navbar.paddingLeft = 24;
  navbar.paddingRight = 24;
  navbar.primaryAxisAlignItems = 'CENTER';
  navbar.counterAxisAlignItems = 'CENTER';
  navbar.primaryAxisSizingMode = 'FIXED';
  navbar.layoutAlign = 'STRETCH';
  
  // Brand
  const brand = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  brand.characters = props.brand || "Brand";
  brand.fontSize = 18;
  brand.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
  
  // Spacer
  const spacer = figma.createFrame();
  spacer.layoutGrow = 1;
  spacer.fills = [];
  
  // Links container
  const linksContainer = figma.createFrame();
  linksContainer.layoutMode = 'HORIZONTAL';
  linksContainer.itemSpacing = 32;
  linksContainer.fills = [];
  
  // Create links
  const links = props.links || ['Home', 'About', 'Contact'];
  for (const linkText of links) {
    const link = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    link.characters = linkText;
    link.fontSize = 14;
    link.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
    linksContainer.appendChild(link);
  }
  
  navbar.appendChild(brand);
  navbar.appendChild(spacer);
  navbar.appendChild(linksContainer);
  
  // Position
  navbar.x = figma.viewport.center.x - 400;
  navbar.y = figma.viewport.center.y - 32;
  
  // Select and focus
  figma.currentPage.selection = [navbar];
  figma.viewport.scrollAndZoomIntoView([navbar]);
  
  return navbar;
}

// Initialize plugin
async function init() {
  try {
    // Preload fonts
    await preloadFonts();
    console.log('[FigBud] Fonts loaded');
    
    // Show UI
    figma.showUI(__html__, {
      width: 400,
      height: 600,
      title: 'FigBud'
    });
    
    console.log('[FigBud] UI shown');
  } catch (error) {
    console.error('[FigBud] Initialization error:', error);
    figma.notify('Failed to initialize FigBud');
    figma.closePlugin();
  }
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  console.log('[FigBud] Message from UI:', msg);
  
  try {
    switch (msg.type) {
      case 'create-component':
        switch (msg.component) {
          case 'button':
            await createButton(msg.props);
            break;
          case 'card':
            await createCard(msg.props);
            break;
          case 'input':
            await createInput(msg.props);
            break;
          case 'navbar':
            await createNavbar(msg.props);
            break;
        }
        
        // Send success message back
        figma.ui.postMessage({
          type: 'component-created',
          component: msg.component
        });
        
        figma.notify(`${msg.component} created!`);
        break;
        
      case 'close':
        figma.closePlugin();
        break;
    }
  } catch (error) {
    console.error('[FigBud] Error handling message:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    figma.ui.postMessage({
      type: 'error',
      error: errorMessage
    });
    figma.notify('Error: ' + errorMessage);
  }
};

// Start the plugin
init();