import { ShadcnFigmaConverter } from './shadcnFigmaConverter';
import { ComponentRenderer } from './componentRenderer';
import { sandboxManager } from './sandboxManager';
import { ProfessionalTemplates } from './professionalTemplates';

export interface DesignSystemComponent {
  id?: string;
  name: string;
  type: string;
  category: 'atomic' | 'molecule' | 'organism' | 'template';
  library: 'shadcn' | 'onceui' | 'custom';
  description: string;
  props: any;
  defaultProps: any;
  variants?: string[];
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
  usage?: number;
}

export interface ComponentCategory {
  name: string;
  description: string;
  icon: string;
  components: DesignSystemComponent[];
}

export class DesignSystemManager {
  private static components: Map<string, DesignSystemComponent> = new Map();
  private static categories: Map<string, ComponentCategory> = new Map();
  private static isInitialized = false;

  // Initialize the design system with default components
  static async initialize() {
    if (this.isInitialized) return;

    // Initialize categories
    this.initializeCategories();
    
    // Initialize Shadcn components
    this.initializeShadcnComponents();
    
    // Initialize Once UI components
    this.initializeOnceUIComponents();
    
    // Initialize custom professional components
    this.initializeCustomComponents();

    this.isInitialized = true;
    console.log('[DesignSystemManager] Initialized with', this.components.size, 'components');
  }

  // Initialize component categories
  private static initializeCategories() {
    const categories: ComponentCategory[] = [
      {
        name: 'Buttons & Actions',
        description: 'Interactive elements for user actions',
        icon: '🎯',
        components: []
      },
      {
        name: 'Forms & Inputs',
        description: 'Input fields and form controls',
        icon: '📝',
        components: []
      },
      {
        name: 'Layout & Structure',
        description: 'Containers and layout components',
        icon: '📐',
        components: []
      },
      {
        name: 'Data Display',
        description: 'Components for displaying information',
        icon: '📊',
        components: []
      },
      {
        name: 'Navigation',
        description: 'Navigation and menu components',
        icon: '🧭',
        components: []
      },
      {
        name: 'Feedback & Status',
        description: 'Alerts, badges, and status indicators',
        icon: '💬',
        components: []
      },
      {
        name: 'Templates',
        description: 'Pre-built component combinations',
        icon: '🎨',
        components: []
      }
    ];

    categories.forEach(cat => this.categories.set(cat.name, cat));
  }

  // Initialize Shadcn components
  private static initializeShadcnComponents() {
    const shadcnComponents: DesignSystemComponent[] = [
      // Buttons
      {
        name: 'Shadcn Button',
        type: 'button',
        category: 'atomic',
        library: 'shadcn',
        description: 'A versatile button with multiple variants',
        props: {
          variant: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
          size: ['default', 'sm', 'lg', 'icon'],
          disabled: false,
          children: 'Button'
        },
        defaultProps: {
          variant: 'default',
          size: 'default',
          children: 'Click me',
          library: 'shadcn'
        },
        variants: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
        tags: ['button', 'action', 'shadcn', 'interactive']
      },
      // Cards
      {
        name: 'Shadcn Card',
        type: 'card',
        category: 'molecule',
        library: 'shadcn',
        description: 'A flexible card container with header and content areas',
        props: {
          className: '',
          shadow: true
        },
        defaultProps: {
          className: 'p-6',
          library: 'shadcn'
        },
        tags: ['card', 'container', 'layout', 'shadcn']
      },
      // Inputs
      {
        name: 'Shadcn Input',
        type: 'input',
        category: 'atomic',
        library: 'shadcn',
        description: 'A text input field with consistent styling',
        props: {
          placeholder: 'Enter text...',
          size: ['default', 'sm', 'lg'],
          disabled: false
        },
        defaultProps: {
          placeholder: 'Type here...',
          size: 'default',
          library: 'shadcn'
        },
        tags: ['input', 'form', 'text', 'shadcn']
      },
      // Badges
      {
        name: 'Shadcn Badge',
        type: 'badge',
        category: 'atomic',
        library: 'shadcn',
        description: 'A small label for status or categorization',
        props: {
          variant: ['default', 'secondary', 'destructive', 'outline'],
          size: ['default', 'sm', 'lg'],
          children: 'Badge'
        },
        defaultProps: {
          variant: 'default',
          size: 'default',
          children: 'New',
          library: 'shadcn'
        },
        variants: ['default', 'secondary', 'destructive', 'outline'],
        tags: ['badge', 'label', 'status', 'shadcn']
      },
      // Switch/Toggle
      {
        name: 'Shadcn Switch',
        type: 'switch',
        category: 'atomic',
        library: 'shadcn',
        description: 'A toggle switch for on/off states',
        props: {
          checked: false,
          disabled: false
        },
        defaultProps: {
          checked: false,
          disabled: false,
          library: 'shadcn'
        },
        tags: ['switch', 'toggle', 'input', 'form', 'shadcn']
      },
      // Checkbox
      {
        name: 'Shadcn Checkbox',
        type: 'checkbox',
        category: 'atomic',
        library: 'shadcn',
        description: 'A checkbox for selecting options',
        props: {
          checked: false,
          label: 'Checkbox',
          disabled: false
        },
        defaultProps: {
          checked: false,
          label: 'Checkbox',
          disabled: false,
          library: 'shadcn'
        },
        tags: ['checkbox', 'input', 'form', 'shadcn']
      },
      // Select/Dropdown
      {
        name: 'Shadcn Select',
        type: 'select',
        category: 'atomic',
        library: 'shadcn',
        description: 'A dropdown select component',
        props: {
          placeholder: 'Select an option',
          value: '',
          size: ['default', 'sm', 'lg'],
          disabled: false
        },
        defaultProps: {
          placeholder: 'Select an option',
          size: 'default',
          disabled: false,
          library: 'shadcn'
        },
        tags: ['select', 'dropdown', 'input', 'form', 'shadcn']
      },
      // Avatar
      {
        name: 'Shadcn Avatar',
        type: 'avatar',
        category: 'atomic',
        library: 'shadcn',
        description: 'User avatar with image or initials',
        props: {
          size: ['sm', 'default', 'lg'],
          initials: 'JD',
          src: '',
          alt: ''
        },
        defaultProps: {
          size: 'default',
          initials: 'JD',
          library: 'shadcn'
        },
        tags: ['avatar', 'user', 'profile', 'image', 'shadcn']
      },
      // Alert
      {
        name: 'Shadcn Alert',
        type: 'alert',
        category: 'molecule',
        library: 'shadcn',
        description: 'Alert message component with variants',
        props: {
          variant: ['default', 'destructive', 'success', 'warning'],
          title: 'Alert',
          description: ''
        },
        defaultProps: {
          variant: 'default',
          title: 'Heads up!',
          description: 'You can add components to your app using the cli.',
          library: 'shadcn'
        },
        variants: ['default', 'destructive', 'success', 'warning'],
        tags: ['alert', 'notification', 'message', 'feedback', 'shadcn']
      },
      // Progress
      {
        name: 'Shadcn Progress',
        type: 'progress',
        category: 'atomic',
        library: 'shadcn',
        description: 'Progress bar component',
        props: {
          value: 50
        },
        defaultProps: {
          value: 60,
          library: 'shadcn'
        },
        tags: ['progress', 'loading', 'status', 'shadcn']
      },
      // Skeleton
      {
        name: 'Shadcn Skeleton',
        type: 'skeleton',
        category: 'atomic',
        library: 'shadcn',
        description: 'Loading skeleton placeholder',
        props: {
          variant: ['text', 'title', 'avatar', 'button', 'card']
        },
        defaultProps: {
          variant: 'text',
          library: 'shadcn'
        },
        variants: ['text', 'title', 'avatar', 'button', 'card'],
        tags: ['skeleton', 'loading', 'placeholder', 'shadcn']
      },
      // Tabs
      {
        name: 'Shadcn Tabs',
        type: 'tabs',
        category: 'molecule',
        library: 'shadcn',
        description: 'Tab navigation component',
        props: {
          tabs: ['Tab 1', 'Tab 2', 'Tab 3'],
          activeTab: 0
        },
        defaultProps: {
          tabs: ['Account', 'Password', 'Settings'],
          activeTab: 0,
          library: 'shadcn'
        },
        tags: ['tabs', 'navigation', 'shadcn']
      }
    ];

    // Add components to map and categories
    shadcnComponents.forEach(comp => {
      this.components.set(`${comp.library}-${comp.type}`, comp);
      this.addComponentToCategory(comp);
    });
  }

  // Initialize Once UI components
  private static initializeOnceUIComponents() {
    const onceUIComponents: DesignSystemComponent[] = [
      {
        name: 'Once UI Button',
        type: 'button',
        category: 'atomic',
        library: 'onceui',
        description: 'Once UI styled button',
        props: {
          text: 'Button',
          variant: ['primary', 'secondary', 'danger'],
          size: ['small', 'medium', 'large']
        },
        defaultProps: {
          text: 'Click me',
          variant: 'primary',
          size: 'medium'
        },
        tags: ['button', 'action', 'onceui']
      },
      {
        name: 'Once UI Card',
        type: 'card',
        category: 'molecule',
        library: 'onceui',
        description: 'Once UI card with elevation',
        props: {
          title: 'Card Title',
          description: 'Card description',
          elevation: ['small', 'medium', 'large']
        },
        defaultProps: {
          title: 'Card Title',
          description: 'This is a card component',
          elevation: 'medium'
        },
        tags: ['card', 'container', 'onceui']
      }
    ];

    onceUIComponents.forEach(comp => {
      this.components.set(`${comp.library}-${comp.type}`, comp);
      this.addComponentToCategory(comp);
    });
  }

  // Initialize custom professional components
  private static initializeCustomComponents() {
    const customComponents: DesignSystemComponent[] = [
      // Basic Components
      {
        name: 'Hero Section',
        type: 'hero',
        category: 'organism',
        library: 'custom',
        description: 'A hero section with headline and CTA',
        props: {
          headline: 'Welcome to FigBud',
          subheadline: 'Design faster with AI',
          ctaText: 'Get Started'
        },
        defaultProps: {
          headline: 'Build Amazing Designs',
          subheadline: 'With the power of AI and modern components',
          ctaText: 'Start Building'
        },
        tags: ['hero', 'landing', 'template', 'custom']
      },
      {
        name: 'Navigation Bar',
        type: 'navigationBar',
        category: 'organism',
        library: 'custom',
        description: 'A professional navigation bar with logo and links',
        props: {},
        defaultProps: {
          type: 'navigationBar'
        },
        tags: ['navigation', 'menu', 'header', 'custom', 'template']
      },
      {
        name: 'Feature Card',
        type: 'featureCard',
        category: 'molecule',
        library: 'custom',
        description: 'A card showcasing a feature with icon',
        props: {
          icon: '✨',
          title: 'Feature Title',
          description: 'Feature description'
        },
        defaultProps: {
          icon: '🚀',
          title: 'Fast Development',
          description: 'Build components quickly with our AI-powered tools'
        },
        tags: ['card', 'feature', 'showcase', 'custom']
      },
      // Professional Templates
      {
        name: 'Login Form',
        type: 'loginForm',
        category: 'template',
        library: 'custom',
        description: 'A complete login form with email, password, and social login',
        props: {},
        defaultProps: {
          type: 'loginForm'
        },
        tags: ['form', 'login', 'authentication', 'template', 'custom']
      },
      {
        name: 'Pricing Card',
        type: 'pricingCard',
        category: 'template',
        library: 'custom',
        description: 'A pricing card with features and CTA button',
        props: {
          plan: ['free', 'pro', 'enterprise']
        },
        defaultProps: {
          type: 'pricingCard',
          plan: 'pro'
        },
        tags: ['pricing', 'card', 'subscription', 'template', 'custom']
      },
      {
        name: 'Feature Section',
        type: 'featureSection',
        category: 'template',
        library: 'custom',
        description: 'A complete feature section with grid layout',
        props: {},
        defaultProps: {
          type: 'featureSection'
        },
        tags: ['features', 'section', 'grid', 'template', 'custom']
      },
      {
        name: 'Dashboard Layout',
        type: 'dashboardLayout',
        category: 'template',
        library: 'custom',
        description: 'Complete dashboard layout with sidebar and stats cards',
        props: {},
        defaultProps: {
          type: 'dashboardLayout'
        },
        tags: ['dashboard', 'layout', 'admin', 'template', 'custom']
      },
      {
        name: 'Data Table',
        type: 'dataTable',
        category: 'template',
        library: 'custom',
        description: 'Data table with sortable columns and status badges',
        props: {},
        defaultProps: {
          type: 'dataTable'
        },
        tags: ['table', 'data', 'grid', 'template', 'custom']
      },
      {
        name: 'User Profile Card',
        type: 'userProfileCard',
        category: 'template',
        library: 'custom',
        description: 'User profile card with avatar, stats, and actions',
        props: {},
        defaultProps: {
          type: 'userProfileCard'
        },
        tags: ['profile', 'user', 'card', 'social', 'template', 'custom']
      }
    ];

    customComponents.forEach(comp => {
      this.components.set(`${comp.library}-${comp.type}`, comp);
      this.addComponentToCategory(comp);
    });
  }

  // Add component to appropriate category
  private static addComponentToCategory(component: DesignSystemComponent) {
    let categoryName = '';
    
    // Determine category based on component type and tags
    if (component.type === 'button' || component.tags.includes('action')) {
      categoryName = 'Buttons & Actions';
    } else if (component.type === 'input' || component.type === 'checkbox' || component.type === 'switch' || 
               component.type === 'select' || component.type === 'dropdown' || component.tags.includes('form')) {
      categoryName = 'Forms & Inputs';
    } else if (component.type === 'card' || component.tags.includes('container') || component.tags.includes('layout')) {
      categoryName = 'Layout & Structure';
    } else if (component.type === 'avatar' || component.type === 'skeleton' || component.tags.includes('data') || 
               component.tags.includes('table') || component.tags.includes('list')) {
      categoryName = 'Data Display';
    } else if (component.type === 'navbar' || component.type === 'tabs' || component.tags.includes('navigation') || 
               component.tags.includes('menu')) {
      categoryName = 'Navigation';
    } else if (component.type === 'badge' || component.type === 'alert' || component.type === 'progress' || 
               component.tags.includes('status') || component.tags.includes('feedback')) {
      categoryName = 'Feedback & Status';
    } else if (component.category === 'template' || component.tags.includes('template')) {
      categoryName = 'Templates';
    } else {
      categoryName = 'Layout & Structure'; // Default category
    }

    const category = this.categories.get(categoryName);
    if (category) {
      category.components.push(component);
    }
  }

  // Get all components
  static getAllComponents(): DesignSystemComponent[] {
    return Array.from(this.components.values());
  }

  // Get components by category
  static getComponentsByCategory(categoryName: string): DesignSystemComponent[] {
    const category = this.categories.get(categoryName);
    return category ? category.components : [];
  }

  // Get all categories
  static getAllCategories(): ComponentCategory[] {
    return Array.from(this.categories.values());
  }

  // Search components
  static searchComponents(query: string): DesignSystemComponent[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllComponents().filter(comp => 
      comp.name.toLowerCase().includes(lowerQuery) ||
      comp.description.toLowerCase().includes(lowerQuery) ||
      comp.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      comp.type.toLowerCase().includes(lowerQuery)
    );
  }

  // Get component by ID
  static getComponent(id: string): DesignSystemComponent | undefined {
    return this.components.get(id);
  }

  // Create component instance
  static async createComponentInstance(
    componentId: string, 
    customProps?: any,
    context?: { x?: number; y?: number }
  ): Promise<SceneNode | null> {
    const component = this.components.get(componentId);
    if (!component) {
      console.error(`[DesignSystemManager] Component not found: ${componentId}`);
      return null;
    }

    // Merge default props with custom props
    const props = { ...component.defaultProps, ...customProps };

    try {
      // Create the component
      await ComponentRenderer.createComponent(component.type, props, context);
      
      // Track usage
      if (component.usage !== undefined) {
        component.usage++;
      } else {
        component.usage = 1;
      }

      return null; // ComponentRenderer handles positioning
    } catch (error) {
      console.error(`[DesignSystemManager] Error creating component ${componentId}:`, error);
      return null;
    }
  }

  // Create component with sandbox integration
  static async createComponentInSandbox(
    componentId: string,
    customProps?: any,
    teachingNote?: string
  ): Promise<void> {
    const component = this.components.get(componentId);
    if (!component) {
      figma.notify(`❌ Component not found: ${componentId}`, { error: true });
      return;
    }

    try {
      // Merge props
      const props = { ...component.defaultProps, ...customProps };
      
      // Create component based on library
      let figmaComponent: SceneNode | null = null;
      
      if (component.library === 'shadcn') {
        figmaComponent = await ShadcnFigmaConverter.createComponent(component.type, props);
      } else if (component.library === 'custom' && component.category === 'template') {
        // Use ProfessionalTemplates for custom templates
        figmaComponent = await ProfessionalTemplates.createTemplate(component.type);
      } else {
        // Use ComponentRenderer for other libraries
        await ComponentRenderer.createComponent(component.type, props, { x: 0, y: 0 });
        // ComponentRenderer handles positioning, so we don't need to return anything
        return;
      }

      if (figmaComponent) {
        // Add to sandbox with metadata
        await sandboxManager.addComponent(figmaComponent, {
          description: component.name,
          teacherNote: teachingNote || `This is a ${component.library} ${component.type} component. ${component.description}`,
          prompt: `Create ${component.name}`
        });
      }
    } catch (error) {
      console.error(`[DesignSystemManager] Error creating component in sandbox:`, error);
      figma.notify(`❌ Failed to create ${component.name}`, { error: true });
    }
  }

  // Get popular components
  static getPopularComponents(limit: number = 10): DesignSystemComponent[] {
    return this.getAllComponents()
      .sort((a, b) => (b.usage || 0) - (a.usage || 0))
      .slice(0, limit);
  }

  // Get recent components
  static getRecentComponents(limit: number = 10): DesignSystemComponent[] {
    return this.getAllComponents()
      .filter(comp => comp.createdAt)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  // Export design system as JSON
  static exportDesignSystem(): string {
    const designSystem = {
      version: '1.0.0',
      components: this.getAllComponents(),
      categories: this.getAllCategories().map(cat => ({
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        componentCount: cat.components.length
      })),
      metadata: {
        totalComponents: this.components.size,
        exportDate: new Date().toISOString()
      }
    };

    return JSON.stringify(designSystem, null, 2);
  }
}

// Initialize on load
DesignSystemManager.initialize();