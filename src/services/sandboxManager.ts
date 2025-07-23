// Sandbox Manager - Manages the FigBud Sandbox frame where all components are created
export class SandboxManager {
  private static SANDBOX_NAME = 'FigBud Sandbox';
  private static GRID_SPACING = 40;
  private static COMPONENTS_PER_ROW = 5;
  private sandboxFrame: FrameNode | null = null;
  private componentCount = 0;

  // Initialize sandbox - find or create the sandbox frame
  async initialize(): Promise<FrameNode> {
    console.log('[SandboxManager] Initializing sandbox...');
    
    // First, try to find existing sandbox
    const pages = figma.root.children;
    for (const page of pages) {
      const sandbox = this.findSandboxInPage(page as PageNode);
      if (sandbox) {
        this.sandboxFrame = sandbox;
        this.componentCount = sandbox.children.length;
        console.log('[SandboxManager] Found existing sandbox with', this.componentCount, 'components');
        return sandbox;
      }
    }

    // If not found, create new sandbox on current page
    return this.createSandbox();
  }

  // Find sandbox frame in a page
  private findSandboxInPage(page: PageNode): FrameNode | null {
    try {
      // For current page, we can use findAll directly
      if (page === figma.currentPage) {
        const frames = page.findAll(node => 
          node.type === 'FRAME' && node.name === SandboxManager.SANDBOX_NAME
        );
        return frames[0] as FrameNode || null;
      }
      
      // For other pages, just check direct children to avoid loadAsync requirement
      for (const child of page.children) {
        if (child.type === 'FRAME' && child.name === SandboxManager.SANDBOX_NAME) {
          return child as FrameNode;
        }
      }
      
      return null;
    } catch (error) {
      console.log('[SandboxManager] Error finding sandbox:', error);
      return null;
    }
  }

  // Create new sandbox frame
  private createSandbox(): FrameNode {
    console.log('[SandboxManager] Creating new sandbox frame...');
    
    const sandbox = figma.createFrame();
    sandbox.name = SandboxManager.SANDBOX_NAME;
    sandbox.resize(1200, 800);
    
    // Position it in viewport
    const viewportCenter = figma.viewport.center;
    sandbox.x = Math.round(viewportCenter.x - 600);
    sandbox.y = Math.round(viewportCenter.y - 400);
    
    // Style the sandbox - transparent with blue dotted border
    sandbox.fills = []; // No fill = transparent
    
    // Add blue dotted border
    sandbox.strokes = [{
      type: 'SOLID',
      color: { r: 0.129, g: 0.588, b: 0.953 } // #2196F3 - nice blue
    }];
    sandbox.strokeWeight = 2;
    sandbox.dashPattern = [8, 4]; // Dotted pattern
    sandbox.cornerRadius = 12;
    sandbox.clipsContent = false;
    
    // Add a title with teaching note
    this.addSandboxTitle(sandbox);
    
    this.sandboxFrame = sandbox;
    this.componentCount = 0;
    
    // Focus on the new sandbox
    figma.currentPage.selection = [sandbox];
    figma.viewport.scrollAndZoomIntoView([sandbox]);
    
    figma.notify('🎓 Created FigBud Sandbox - Your learning playground!');
    
    return sandbox;
  }

  // Add title to sandbox
  private addSandboxTitle(sandbox: FrameNode) {
    const title = figma.createText();
    title.characters = '🎓 FigBud Sandbox - Learn by Creating';
    title.fontSize = 28;
    title.fontName = { family: 'Inter', style: 'Bold' };
    title.fills = [{ type: 'SOLID', color: { r: 0.129, g: 0.588, b: 0.953 } }]; // Blue to match border
    title.x = sandbox.x;
    title.y = sandbox.y - 60;
    
    // Add subtitle with instructions
    const subtitle = figma.createText();
    subtitle.characters = 'Components you create will appear here with explanations. Try: "Create a primary button"';
    subtitle.fontSize = 16;
    subtitle.fontName = { family: 'Inter', style: 'Regular' };
    subtitle.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
    subtitle.x = sandbox.x;
    subtitle.y = sandbox.y - 30;
    
    // Don't group - keep them separate for easier management
  }

  // Add component to sandbox with smart positioning
  async addComponent(component: SceneNode, metadata?: {
    description?: string;
    createdBy?: string;
    prompt?: string;
    teacherNote?: string;
  }): Promise<void> {
    if (!this.sandboxFrame) {
      await this.initialize();
    }

    if (!this.sandboxFrame) {
      throw new Error('Failed to initialize sandbox');
    }

    // Calculate position in grid
    const row = Math.floor(this.componentCount / SandboxManager.COMPONENTS_PER_ROW);
    const col = this.componentCount % SandboxManager.COMPONENTS_PER_ROW;
    
    const x = 40 + (col * (240 + SandboxManager.GRID_SPACING));
    const y = 100 + (row * (280 + SandboxManager.GRID_SPACING));

    // Create teaching container frame for component + metadata
    const container = figma.createFrame();
    container.name = `Learning Card ${this.componentCount + 1}`;
    container.resize(240, 280);
    container.x = x;
    container.y = y;
    container.fills = [{
      type: 'SOLID',
      color: { r: 0.98, g: 0.99, b: 1 } // Very light blue background
    }];
    container.strokes = [{
      type: 'SOLID',
      color: { r: 0.129, g: 0.588, b: 0.953 } // Blue border
    }];
    container.strokeWeight = 1;
    container.cornerRadius = 12;
    container.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.08 },
      offset: { x: 0, y: 4 },
      radius: 16,
      visible: true,
      blendMode: 'NORMAL'
    }];
    container.clipsContent = false;
    container.layoutMode = 'VERTICAL';
    container.itemSpacing = 16;
    container.paddingTop = 20;
    container.paddingBottom = 20;
    container.paddingLeft = 20;
    container.paddingRight = 20;

    // Add component to container
    if ('x' in component && 'y' in component) {
      component.x = (200 - component.width) / 2;
      component.y = 20;
    }
    
    this.sandboxFrame.appendChild(container);
    container.appendChild(component);

    // Add component title
    const title = figma.createText();
    title.characters = metadata?.description || 'Component';
    title.fontSize = 16;
    title.fontName = { family: 'Inter', style: 'Medium' };
    title.fills = [{ type: 'SOLID', color: { r: 0.129, g: 0.588, b: 0.953 } }]; // Blue
    title.textAlignHorizontal = 'CENTER';
    title.layoutAlign = 'STRETCH';
    container.appendChild(title);

    // Add teaching note if provided
    if (metadata?.teacherNote) {
      const teacherNote = figma.createText();
      teacherNote.characters = `💡 ${metadata.teacherNote}`;
      teacherNote.fontSize = 12;
      teacherNote.fontName = { family: 'Inter', style: 'Regular' };
      teacherNote.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
      teacherNote.layoutAlign = 'STRETCH';
      teacherNote.textAutoResize = 'HEIGHT';
      container.appendChild(teacherNote);
    }

    // Add prompt info
    if (metadata?.prompt) {
      const promptInfo = figma.createText();
      promptInfo.characters = `📝 "${metadata.prompt}"`;
      promptInfo.fontSize = 11;
      promptInfo.fontName = { family: 'Inter', style: 'Regular' };
      promptInfo.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
      promptInfo.layoutAlign = 'STRETCH';
      promptInfo.textAutoResize = 'HEIGHT';
      container.appendChild(promptInfo);
    }

    // Add timestamp
    const timestamp = figma.createText();
    timestamp.characters = `⏰ ${new Date().toLocaleTimeString()}`;
    timestamp.fontSize = 10;
    timestamp.fontName = { family: 'Inter', style: 'Regular' };
    timestamp.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
    timestamp.textAlignHorizontal = 'CENTER';
    timestamp.layoutAlign = 'STRETCH';
    container.appendChild(timestamp);

    this.componentCount++;
    
    // Scroll to show new component
    figma.viewport.scrollAndZoomIntoView([container]);
    
    console.log('[SandboxManager] Added component to sandbox at position', col, row);
  }

  // Clear all components from sandbox
  async clearSandbox(): Promise<void> {
    if (!this.sandboxFrame) return;

    // Keep the first title if it exists
    const children = [...this.sandboxFrame.children];
    for (const child of children) {
      if (child.type !== 'TEXT') {
        child.remove();
      }
    }

    this.componentCount = 0;
    figma.notify('🧹 Cleared sandbox');
  }

  // Get sandbox statistics
  getStats(): { componentCount: number; sandboxExists: boolean } {
    return {
      componentCount: this.componentCount,
      sandboxExists: this.sandboxFrame !== null
    };
  }

  // Focus on sandbox
  focusSandbox(): void {
    if (this.sandboxFrame) {
      figma.currentPage.selection = [this.sandboxFrame];
      figma.viewport.scrollAndZoomIntoView([this.sandboxFrame]);
    }
  }
}

// Export singleton instance
export const sandboxManager = new SandboxManager();