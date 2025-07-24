// FigBud Plugin - Modern AI Assistant for Figma
console.log('[FigBud Plugin] Initializing...');

import { ComponentRenderer } from './services/componentRenderer';
import { FontLoader } from './services/fontLoader';
import { aiService } from './services/aiService';
import { sandboxManager } from './services/sandboxManager';
import { DesignSystemManager } from './services/designSystemManager';
import { ShadcnFigmaConverter } from './services/shadcnFigmaConverter';
import { ProfessionalTemplates } from './services/professionalTemplates';

// Plugin state management
interface PluginState {
  isUIVisible: boolean;
  sandboxActive: boolean;
  currentUser: User | null;
  isMinimized: boolean;
  windowSize: { width: number; height: number };
}

const state: PluginState = {
  isUIVisible: false,
  sandboxActive: false,
  currentUser: null,
  isMinimized: false,
  windowSize: { width: 600, height: 800 },
};

// Component creation functions using Once UI renderer
async function createButtonComponent(properties?: any) {
  const props: any = {
    children: (properties && properties.label) || 'Click me',
    variant: (properties && properties.variant) || 'primary',
    size: (properties && properties.size) || 'medium'
  };
  
  // Copy additional properties without spread
  if (properties) {
    for (const key in properties) {
      if (properties.hasOwnProperty(key) && !props.hasOwnProperty(key)) {
        props[key] = properties[key];
      }
    }
  }
  
  await ComponentRenderer.createComponent('button', props);
}

async function createCardComponent(properties?: any) {
  const props: any = {
    title: (properties && properties.title) || 'Card Title',
    description: (properties && properties.description) || 'This is a card component created by FigBud AI.',
    elevation: (properties && properties.elevation) || 'small',
    radius: (properties && properties.radius) || 16,
    padding: (properties && properties.padding) || 24
  };
  
  // Copy additional properties without spread
  if (properties) {
    for (const key in properties) {
      if (properties.hasOwnProperty(key) && !props.hasOwnProperty(key)) {
        props[key] = properties[key];
      }
    }
  }
  
  await ComponentRenderer.createComponent('card', props);
}

async function createInputComponent(properties?: any) {
  const props: any = {
    label: (properties && properties.label) || 'Email address',
    placeholder: (properties && properties.placeholder) || 'Enter your email',
    size: (properties && properties.size) || 'medium',
    variant: (properties && properties.variant) || 'default'
  };
  
  // Copy additional properties without spread
  if (properties) {
    for (const key in properties) {
      if (properties.hasOwnProperty(key) && !props.hasOwnProperty(key)) {
        props[key] = properties[key];
      }
    }
  }
  
  await ComponentRenderer.createComponent('input', props);
}

// Helper function to position elements near viewport center
function positionNearViewport(node: SceneNode) {
  const viewport = figma.viewport.center;
  if ('x' in node && 'y' in node) {
    node.x = Math.round(viewport.x - node.width / 2);
    node.y = Math.round(viewport.y - node.height / 2);
  }
}

// Initialize plugin with font preloading
async function initializePlugin() {
  try {
    // CRITICAL: Load all fonts before any UI or component operations
    await FontLoader.preloadAllFonts();
    console.log('[FigBud Plugin] Fonts loaded successfully');
    
    // Initialize component renderer
    await ComponentRenderer.initialize();
    
    // Load saved window size
    const savedSize = await figma.clientStorage.getAsync('windowSize');
    if (savedSize) {
      state.windowSize = savedSize;
    }
    
    // Load minimized state
    const savedMinimized = await figma.clientStorage.getAsync('isMinimized');
    if (savedMinimized !== undefined) {
      state.isMinimized = savedMinimized;
    }
    
    // NOW it's safe to show UI
    // Show minimized size if plugin was minimized
    const displayWidth = state.isMinimized ? 70 : state.windowSize.width;
    const displayHeight = state.isMinimized ? 70 : state.windowSize.height;
    
    figma.showUI(__html__, { 
      width: displayWidth, 
      height: displayHeight,
      title: 'FigBud',
      visible: true // Make visible by default for debugging
    });
    
    // Add debug message
    console.log('[FigBud Plugin] UI HTML loaded, window should be visible');
    
    // Send initial state to UI
    figma.ui.postMessage({
      type: 'init-state',
      isMinimized: state.isMinimized,
      windowSize: state.windowSize
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
          await createButtonComponent();
          break;
          
        case 'quick-card':
          await createCardComponent();
          break;
          
        case 'quick-input':
          await createInputComponent();
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
        if (msg.componentId && msg.props) {
          await handleDesignSystemComponent(msg.componentId, msg.props, msg.componentName);
        } else {
          await handleCreateComponent(msg.payload);
        }
        break;
        
      case 'create-sandbox-component':
        await handleSandboxComponent(msg.payload);
        break;
        
      case 'chat-message':
        await handleChatMessage(msg.message);
        break;
        
      case 'resize':
        state.windowSize = { width: msg.width, height: msg.height };
        figma.ui.resize(msg.width, msg.height);
        figma.clientStorage.setAsync('windowSize', state.windowSize);
        break;
        
      case 'minimize':
        state.isMinimized = true;
        // Resize to show only the bubble (50x50 + padding)
        figma.ui.resize(70, 70);
        figma.clientStorage.setAsync('isMinimized', true);
        break;
        
      case 'maximize':
        state.isMinimized = false;
        // Restore to saved size or default
        figma.ui.resize(state.windowSize.width, state.windowSize.height);
        figma.clientStorage.setAsync('isMinimized', false);
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

// Handle chat message with AI service
async function handleChatMessage(message: string) {
  try {
    // Special commands
    const lowerMessage = message.toLowerCase();
    
    // Handle sandbox commands
    if (lowerMessage.includes('clear sandbox') || lowerMessage.includes('clear the sandbox')) {
      await sandboxManager.clearSandbox();
      figma.ui.postMessage({
        type: 'bot-response',
        message: '🧹 Cleared the sandbox!',
        suggestions: ['Create a button', 'Create a card', 'Create an input']
      });
      return;
    }
    
    if (lowerMessage.includes('show sandbox') || lowerMessage.includes('focus sandbox')) {
      sandboxManager.focusSandbox();
      figma.ui.postMessage({
        type: 'bot-response',
        message: '👀 Focused on the sandbox!',
        suggestions: ['Create a component', 'Clear the sandbox']
      });
      return;
    }

    // Process message with AI
    const response = await aiService.processMessage(message, {
      selection: figma.currentPage.selection,
      currentPage: figma.currentPage.name
    });
    
    // Debug logging to understand response structure
    console.log('[FigBud] AI Response structure:', {
      hasMessage: !!response.message,
      hasText: !!(response as any).text,
      messageType: typeof response.message,
      messagePreview: response.message?.substring(0, 100),
      fullResponse: response
    });
    
    // Send response to UI
    figma.ui.postMessage({
      type: 'bot-response',
      message: response.message,
      suggestions: response.suggestions,
      metadata: {
        action: response.action?.type,
        componentSpec: response.componentSpec
      }
    });

    // Handle component creation if needed
    if (response.action?.type === 'create_component' && response.componentSpec) {
      // Component is already created by AIService
      const stats = sandboxManager.getStats();
      console.log('[FigBud] Sandbox stats:', stats);
    }
    
  } catch (error) {
    console.error('[FigBud] Error handling chat message:', error);
    figma.ui.postMessage({
      type: 'bot-response',
      message: `Sorry, I encountered an error: ${error}`,
      suggestions: ['Try a simpler request', 'Create a button', 'Create a card']
    });
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

// Handle design system component creation
async function handleDesignSystemComponent(componentId: string, props: any, componentName?: string) {
  try {
    console.log('[FigBud Plugin] Creating design system component:', componentId, props);
    
    // Initialize design system if needed
    await DesignSystemManager.initialize();
    
    // Create component directly on canvas (not in sandbox)
    const component = DesignSystemManager.getComponent(componentId);
    if (!component) {
      throw new Error(`Component not found: ${componentId}`);
    }

    // Merge props
    const finalProps = { ...component.defaultProps, ...props };
    
    // Create component based on library
    let figmaComponent: SceneNode | null = null;
    
    if (component.library === 'shadcn') {
      figmaComponent = await ShadcnFigmaConverter.createComponent(component.type, finalProps);
    } else if (component.library === 'custom' && component.category === 'template') {
      figmaComponent = await ProfessionalTemplates.createTemplate(component.type);
    } else {
      // Use ComponentRenderer for other libraries
      await ComponentRenderer.createComponent(component.type, finalProps);
    }

    // Position the component in viewport center
    if (figmaComponent) {
      const viewportCenter = figma.viewport.center;
      if ('x' in figmaComponent && 'y' in figmaComponent && 'width' in figmaComponent && 'height' in figmaComponent) {
        figmaComponent.x = Math.round(viewportCenter.x - figmaComponent.width / 2);
        figmaComponent.y = Math.round(viewportCenter.y - figmaComponent.height / 2);
      }
      
      // Select and focus on the new component
      figma.currentPage.selection = [figmaComponent];
      figma.viewport.scrollAndZoomIntoView([figmaComponent]);
    }
    
    // Send success message
    figma.ui.postMessage({
      type: 'component-created',
      componentName: componentName || componentId,
      success: true
    });

    figma.notify(`✨ Created ${componentName || component.name}!`);
  } catch (error) {
    console.error('[FigBud Plugin] Error creating design system component:', error);
    figma.ui.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Failed to create component'
    });
  }
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

    // Show a message when plugin starts
    console.log('[FigBud Plugin] Ready! Use the menu commands or open the UI.');
    
  } catch (error) {
    console.error('[FigBud Plugin] Failed to initialize:', error);
    figma.notify('Failed to initialize FigBud. Please try again.', { error: true });
    figma.closePlugin();
  }
}

// Start the plugin
initializePlugin();