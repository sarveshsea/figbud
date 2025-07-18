// Main Figma widget code
/// <reference types="@figma/plugin-typings" />

declare global {
  interface PluginAPI {
    widget: any;
  }
}

const { widget } = figma;
const { useSyncedState, usePropertyMenu, AutoLayout, Text, SVG } = widget;

interface WidgetData {
  isVisible: boolean;
  position: { x: number; y: number };
}

function FigBudWidget() {
  const [data, setData] = useSyncedState('widgetData', {
    isVisible: true,
    position: { x: 0, y: 0 }
  });

  const propertyMenu: any[] = [
    {
      itemType: 'action',
      tooltip: 'Toggle FigBud Chat',
      propertyName: 'toggle'
    },
    {
      itemType: 'action',
      tooltip: 'Open Settings',
      propertyName: 'settings'
    }
  ];

  usePropertyMenu(propertyMenu, ({ propertyName }: any) => {
    if (propertyName === 'toggle') {
      setData({ ...data, isVisible: !data.isVisible });
      if (data.isVisible) {
        figma.showUI(__html__, { 
          width: 320, 
          height: 480
        });
      } else {
        figma.closePlugin();
      }
    } else if (propertyName === 'settings') {
      figma.showUI(__html__, { 
        width: 320, 
        height: 480
      });
      // Send message to UI to show settings
      figma.ui.postMessage({ 
        type: 'navigate', 
        payload: { view: 'settings' } 
      });
    }
  });

  // Handle messages from UI
  figma.ui.onmessage = async (msg) => {
    try {
      switch (msg.type) {
        case 'resize':
          figma.ui.resize(msg.width, msg.height);
          break;

        case 'close':
          figma.closePlugin();
          break;

        case 'get-context':
          const context = await getFigmaContext();
          figma.ui.postMessage({
            type: 'context-response',
            payload: context
          });
          break;

        case 'create-demo':
          await handleCreateDemo(msg.payload);
          break;

        case 'add-guidance':
          await handleAddGuidance(msg.payload);
          break;

        case 'track-analytics':
          // Analytics tracking can be handled here
          console.log('Analytics:', msg.payload);
          break;

        default:
          console.log('Unknown message type:', msg.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      figma.ui.postMessage({
        type: 'error',
        payload: { message: 'An error occurred. Please try again.' }
      });
    }
  };

  // Auto-show UI on widget creation
  if (data.isVisible) {
    figma.showUI(__html__, { 
      width: 320, 
      height: 480
    });
  }

  return (
    <AutoLayout
      direction="vertical"
      spacing={8}
      padding={16}
      fill="#F24E1E"
      cornerRadius={8}
      effect={{
        type: 'drop-shadow',
        color: '#00000020',
        offset: { x: 0, y: 2 },
        blur: 8,
      }}
    >
      <SVG
        src={`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
<path d="M12 22L13.09 15.74L20 15L13.09 14.26L12 8L10.91 14.26L4 15L10.91 15.74L12 22Z" fill="white"/>
</svg>`}
      />
      <Text
        fontSize={14}
        fontWeight={600}
        fill="#FFFFFF"
        horizontalAlignText="center"
      >
        FigBud
      </Text>
      <Text
        fontSize={11}
        fill="#FFFFFF80"
        horizontalAlignText="center"
      >
        AI Assistant
      </Text>
    </AutoLayout>
  );
}

// Helper functions
async function getFigmaContext() {
  const selection = figma.currentPage.selection;
  const viewport = figma.viewport;
  
  return {
    selectedNodes: selection.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      width: 'width' in node ? (node as any).width : undefined,
      height: 'height' in node ? (node as any).height : undefined,
    })),
    currentPage: figma.currentPage.name,
    viewport: {
      center: viewport.center,
      zoom: viewport.zoom,
    },
    canvasSize: {
      width: figma.currentPage.children.length > 0 ? 
        Math.max(...figma.currentPage.children.map(child => 
          'width' in child ? (child as any).x + (child as any).width : 0)) : 0,
      height: figma.currentPage.children.length > 0 ? 
        Math.max(...figma.currentPage.children.map(child => 
          'height' in child ? (child as any).y + (child as any).height : 0)) : 0,
    },
    user: figma.currentUser ? {
      id: figma.currentUser.id,
      name: figma.currentUser.name,
      photoUrl: figma.currentUser.photoUrl,
    } : null,
  };
}

async function handleCreateDemo(payload: any) {
  try {
    const { templateId, position, customizations } = payload;
    
    // This would integrate with your template system
    // For now, create a simple placeholder
    const frame = figma.createFrame();
    frame.name = `Demo: ${templateId}`;
    frame.x = position?.x || figma.viewport.center.x - 200;
    frame.y = position?.y || figma.viewport.center.y - 150;
    frame.resize(400, 300);
    frame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
    
    // Add to current page
    figma.currentPage.appendChild(frame);
    
    // Focus on the new frame
    figma.viewport.scrollAndZoomIntoView([frame]);
    
    figma.ui.postMessage({
      type: 'demo-created',
      payload: { nodeId: frame.id, name: frame.name }
    });
    
  } catch (error) {
    console.error('Error creating demo:', error);
    figma.ui.postMessage({
      type: 'error',
      payload: { message: 'Failed to create demo. Please try again.' }
    });
  }
}

async function handleAddGuidance(payload: any) {
  try {
    const { steps, targetNodeId } = payload;
    
    // Add guidance annotations to the canvas
    // This is a simplified implementation
    let targetNode: BaseNode | null = null;
    if (targetNodeId) {
      targetNode = figma.getNodeById(targetNodeId);
    }
    
    figma.ui.postMessage({
      type: 'guidance-added',
      payload: { success: true, steps }
    });
    
  } catch (error) {
    console.error('Error adding guidance:', error);
    figma.ui.postMessage({
      type: 'error',
      payload: { message: 'Failed to add guidance. Please try again.' }
    });
  }
}

widget.register(FigBudWidget);