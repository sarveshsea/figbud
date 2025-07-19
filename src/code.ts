// FigBud Plugin - Modern AI Assistant for Figma
console.log('[FigBud Plugin] Initializing...');

// Plugin state management
interface PluginState {
  isUIVisible: boolean;
  sandboxActive: boolean;
  currentUser: User | null;
}

const state: PluginState = {
  isUIVisible: false,
  sandboxActive: false,
  currentUser: null,
};

// Initialize plugin
figma.showUI(__html__, { 
  width: 420, 
  height: 640,
  title: 'FigBud AI Assistant',
  visible: false // Start hidden
});

// Handle plugin commands
if (figma.command) {
  switch (figma.command) {
    case 'open':
      figma.ui.show();
      state.isUIVisible = true;
      figma.ui.postMessage({ type: 'navigate', view: 'chat' });
      break;
      
    case 'open-sandbox':
      figma.ui.show();
      state.isUIVisible = true;
      state.sandboxActive = true;
      figma.ui.postMessage({ type: 'navigate', view: 'sandbox' });
      break;
      
    case 'quick-button':
      createButtonComponent();
      break;
      
    case 'quick-card':
      createCardComponent();
      break;
      
    case 'quick-input':
      createInputComponent();
      break;
      
    default:
      figma.ui.show();
      state.isUIVisible = true;
  }
}

// Message handler with error boundaries
figma.ui.onmessage = async (msg: any) => {
  console.log('[FigBud Plugin] Received message:', msg.type);
  
  try {
    switch (msg.type) {
      case 'get-context':
        handleGetContext();
        break;
        
      case 'create-component':
        await handleCreateComponent(msg.payload);
        break;
        
      case 'create-sandbox-component':
        await handleSandboxComponent(msg.payload);
        break;
        
      case 'chat-message':
        await handleChatMessage(msg.message);
        break;
        
      case 'resize':
        figma.ui.resize(msg.width || 420, msg.height || 640);
        break;
        
      case 'close':
        figma.closePlugin();
        break;
        
      case 'get-user':
        getCurrentUser();
        break;
        
      default:
        console.warn('[FigBud Plugin] Unknown message type:', msg.type);
    }
  } catch (error) {
    console.error('[FigBud Plugin] Error handling message:', error);
    figma.ui.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

// Get current Figma context
function handleGetContext() {
  const context = {
    selection: figma.currentPage.selection.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      // Add more properties as needed
    })),
    currentPage: {
      id: figma.currentPage.id,
      name: figma.currentPage.name,
    },
    viewport: {
      center: figma.viewport.center,
      zoom: figma.viewport.zoom,
    },
    user: figma.currentUser,
  };
  
  figma.ui.postMessage({
    type: 'context-response',
    payload: context,
  });
}

// Get current user info
function getCurrentUser() {
  figma.ui.postMessage({
    type: 'user-response',
    payload: figma.currentUser,
  });
}

// Handle chat message and component creation
async function handleChatMessage(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Check for component creation keywords
  if (lowerMessage.includes('create') || lowerMessage.includes('make') || lowerMessage.includes('build')) {
    if (lowerMessage.includes('button')) {
      createButtonComponent();
      figma.ui.postMessage({
        type: 'bot-response',
        message: '✅ Created a button component! Check your canvas.',
        metadata: { action: 'component_created', componentType: 'button' }
      });
    } else if (lowerMessage.includes('card')) {
      createCardComponent();
      figma.ui.postMessage({
        type: 'bot-response',
        message: '✅ Created a card component! Check your canvas.',
        metadata: { action: 'component_created', componentType: 'card' }
      });
    } else if (lowerMessage.includes('input')) {
      createInputComponent();
      figma.ui.postMessage({
        type: 'bot-response',
        message: '✅ Created an input field! Check your canvas.',
        metadata: { action: 'component_created', componentType: 'input' }
      });
    }
  }
}

// Handle generic component creation
async function handleCreateComponent(payload: any) {
  const { type, properties } = payload;
  
  switch (type) {
    case 'button':
      createButtonComponent(properties);
      break;
    case 'card':
      createCardComponent(properties);
      break;
    case 'input':
      createInputComponent(properties);
      break;
    default:
      throw new Error(`Unknown component type: ${type}`);
  }
  
  figma.ui.postMessage({
    type: 'component-created',
    payload: { type, success: true }
  });
}

// Handle sandbox component creation with step tracking
async function handleSandboxComponent(payload: any) {
  const { template, step } = payload;
  
  try {
    // Execute the step code safely
    if (step && step.code) {
      // For now, we'll use predefined creation functions
      // In a real implementation, you'd parse and execute the step code
      console.log('[FigBud Sandbox] Executing step:', step.title);
      
      // Create components based on template ID
      switch (template.id) {
        case 'button':
          if (step.id === 'button-1') {
            const rect = figma.createRectangle();
            rect.resize(120, 48);
            rect.cornerRadius = 8;
            rect.fills = [{ type: 'SOLID', color: { r: 0.388, g: 0.4, b: 0.965 } }];
            positionNearViewport(rect);
          }
          break;
        case 'card':
          if (step.id === 'card-1') {
            const card = figma.createFrame();
            card.resize(320, 400);
            card.cornerRadius = 16;
            card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
            positionNearViewport(card);
          }
          break;
        case 'input':
          if (step.id === 'input-1') {
            const inputContainer = figma.createFrame();
            inputContainer.layoutMode = 'VERTICAL';
            inputContainer.itemSpacing = 8;
            positionNearViewport(inputContainer);
          }
          break;
      }
      
      figma.notify(`✅ Step completed: ${step.title}`);
    }
    
    figma.ui.postMessage({
      type: 'sandbox-step-complete',
      payload: { templateId: template.id, stepId: step.id }
    });
  } catch (error) {
    console.error('[FigBud Sandbox] Error:', error);
    figma.notify('❌ Failed to complete step', { error: true });
  }
}

// Component creation functions
async function createButtonComponent(properties?: any) {
  const button = figma.createFrame();
  button.name = 'FigBud Button';
  button.resize(properties?.width || 120, properties?.height || 48);
  button.cornerRadius = 8;
  button.fills = [{ 
    type: 'SOLID', 
    color: properties?.color || { r: 0.388, g: 0.4, b: 0.965 } 
  }];
  
  // Auto Layout
  button.layoutMode = 'HORIZONTAL';
  button.paddingLeft = 24;
  button.paddingRight = 24;
  button.paddingTop = 12;
  button.paddingBottom = 12;
  button.primaryAxisAlignItems = 'CENTER';
  button.counterAxisAlignItems = 'CENTER';
  
  // Add text - properly await font loading
  try {
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    const text = figma.createText();
    text.characters = properties?.label || "Click me";
    text.fontSize = 16;
    text.fontName = { family: "Inter", style: "Medium" };
    text.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    button.appendChild(text);
  } catch (error) {
    console.error('[FigBud] Font loading error:', error);
  }
  
  positionNearViewport(button);
  figma.currentPage.selection = [button];
  figma.viewport.scrollAndZoomIntoView([button]);
  figma.notify('✅ Button created!');
}

async function createCardComponent(properties?: any) {
  const card = figma.createFrame();
  card.name = 'FigBud Card';
  card.resize(properties?.width || 320, properties?.height || 240);
  card.cornerRadius = 16;
  card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  card.effects = [{
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.1 },
    offset: { x: 0, y: 2 },
    radius: 8,
    visible: true,
    blendMode: 'NORMAL',
  }];
  
  // Auto Layout
  card.layoutMode = 'VERTICAL';
  card.paddingLeft = 24;
  card.paddingRight = 24;
  card.paddingTop = 24;
  card.paddingBottom = 24;
  card.itemSpacing = 16;
  
  // Add title and description with proper font loading
  try {
    // Load both fonts
    await Promise.all([
      figma.loadFontAsync({ family: "Inter", style: "Bold" }),
      figma.loadFontAsync({ family: "Inter", style: "Regular" })
    ]);
    
    // Add title
    const title = figma.createText();
    title.characters = properties?.title || "Card Title";
    title.fontSize = 18;
    title.fontName = { family: "Inter", style: "Bold" };
    title.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
    card.appendChild(title);
    
    // Add description
    const description = figma.createText();
    description.characters = properties?.description || "This is a card component created by FigBud AI.";
    description.fontSize = 14;
    description.fontName = { family: "Inter", style: "Regular" };
    description.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
    description.layoutAlign = 'STRETCH';
    card.appendChild(description);
  } catch (error) {
    console.error('[FigBud] Font loading error:', error);
  }
  
  positionNearViewport(card);
  figma.currentPage.selection = [card];
  figma.viewport.scrollAndZoomIntoView([card]);
  figma.notify('✅ Card created!');
}

async function createInputComponent(properties?: any) {
  const inputContainer = figma.createFrame();
  inputContainer.name = 'FigBud Input';
  inputContainer.layoutMode = 'VERTICAL';
  inputContainer.itemSpacing = 8;
  
  try {
    // Load both fonts we need
    await Promise.all([
      figma.loadFontAsync({ family: "Inter", style: "Medium" }),
      figma.loadFontAsync({ family: "Inter", style: "Regular" })
    ]);
    
    // Create label
    const label = figma.createText();
    label.characters = properties?.label || "Email address";
    label.fontSize = 14;
    label.fontName = { family: "Inter", style: "Medium" };
    label.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
    inputContainer.appendChild(label);
    
    // Create input field
    const input = figma.createFrame();
    input.resize(320, 48);
    input.cornerRadius = 8;
    input.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.98 } }];
    input.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
    input.strokeWeight = 1;
    input.layoutMode = 'HORIZONTAL';
    input.paddingLeft = 16;
    input.paddingRight = 16;
    input.primaryAxisAlignItems = 'CENTER';
    
    // Placeholder text
    const placeholder = figma.createText();
    placeholder.characters = properties?.placeholder || "Enter your email";
    placeholder.fontSize = 14;
    placeholder.fontName = { family: "Inter", style: "Regular" };
    placeholder.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
    input.appendChild(placeholder);
    
    inputContainer.appendChild(input);
  } catch (error) {
    console.error('[FigBud] Font loading error:', error);
  }
  
  positionNearViewport(inputContainer);
  figma.currentPage.selection = [inputContainer];
  figma.viewport.scrollAndZoomIntoView([inputContainer]);
  figma.notify('✅ Input field created!');
}

// Helper function to position elements near viewport center
function positionNearViewport(node: SceneNode) {
  const viewport = figma.viewport.center;
  if ('x' in node && 'y' in node) {
    node.x = Math.round(viewport.x - node.width / 2);
    node.y = Math.round(viewport.y - node.height / 2);
  }
}

// Show a message when plugin starts
console.log('[FigBud Plugin] Ready! Use the menu commands or open the UI.');