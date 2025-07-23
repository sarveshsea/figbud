import { FontLoader } from './fontLoader';
import { ShadcnFigmaConverter } from './shadcnFigmaConverter';

interface TemplateComponent {
  type: string;
  props: any;
  position?: { x: number; y: number };
}

export class ProfessionalTemplates {
  // Create a complete login form
  static async createLoginForm(): Promise<FrameNode> {
    const form = figma.createFrame();
    form.name = 'Login Form';
    form.resize(400, 500);
    
    // Set properties
    form.layoutMode = 'VERTICAL';
    form.itemSpacing = 24;
    form.paddingLeft = 40;
    form.paddingRight = 40;
    form.paddingTop = 48;
    form.paddingBottom = 48;
    form.cornerRadius = 16;
    form.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    form.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 4 },
      radius: 20,
      visible: true,
      blendMode: 'NORMAL'
    }];
    
    // Add components
    await this.addToFrame(form, [
      { type: 'heading', text: 'Welcome Back', size: 28, weight: 'Bold' },
      { type: 'text', text: 'Sign in to your account to continue', size: 14, color: 'muted' },
      { type: 'spacer', height: 16 },
      { type: 'input', label: 'Email', placeholder: 'john@example.com', library: 'shadcn' },
      { type: 'input', label: 'Password', placeholder: '••••••••', library: 'shadcn' },
      { type: 'checkbox', label: 'Remember me' },
      { type: 'spacer', height: 8 },
      { type: 'button', text: 'Sign In', variant: 'default', library: 'shadcn', fullWidth: true },
      { type: 'divider', text: 'OR' },
      { type: 'button', text: 'Continue with Google', variant: 'outline', library: 'shadcn', fullWidth: true },
      { type: 'text', text: "Don't have an account? Sign up", size: 12, align: 'center' }
    ]);
    
    return form;
  }

  // Create a pricing card
  static async createPricingCard(plan: 'free' | 'pro' | 'enterprise' = 'pro'): Promise<FrameNode> {
    const planData = {
      free: {
        name: 'Free',
        price: '$0',
        period: '/month',
        features: ['Up to 10 projects', '2GB storage', 'Basic support'],
        buttonText: 'Get Started',
        variant: 'outline'
      },
      pro: {
        name: 'Pro',
        price: '$29',
        period: '/month',
        features: ['Unlimited projects', '100GB storage', 'Priority support', 'Advanced analytics'],
        buttonText: 'Start Free Trial',
        variant: 'default',
        popular: true
      },
      enterprise: {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        features: ['Unlimited everything', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
        buttonText: 'Contact Sales',
        variant: 'secondary'
      }
    };
    
    const data = planData[plan];
    const card = figma.createFrame();
    card.name = `Pricing Card - ${data.name}`;
    card.resize(320, 480);
    
    // Set properties
    card.layoutMode = 'VERTICAL';
    card.itemSpacing = 20;
    card.paddingLeft = 32;
    card.paddingRight = 32;
    card.paddingTop = 40;
    card.paddingBottom = 40;
    card.cornerRadius = 12;
    card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    
    const isPopular = 'popular' in data && data.popular;
    card.strokes = isPopular ? 
      [{ type: 'SOLID', color: { r: 0.388, g: 0.4, b: 0.965 } }] : 
      [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    card.strokeWeight = isPopular ? 2 : 1;
    
    // Add popular badge if needed
    if (isPopular) {
      const badge = await ShadcnFigmaConverter.createShadcnBadge({
        children: 'Most Popular',
        variant: 'default',
        library: 'shadcn'
      });
      badge.x = card.width / 2 - badge.width / 2;
      badge.y = -12;
      card.appendChild(badge);
    }
    
    // Add content
    await this.addToFrame(card, [
      { type: 'text', text: data.name, size: 20, weight: 'Bold', align: 'center' },
      { type: 'price', price: data.price, period: data.period },
      { type: 'divider' },
      { type: 'featureList', features: data.features },
      { type: 'spacer', height: 'auto' },
      { type: 'button', text: data.buttonText, variant: data.variant, library: 'shadcn', fullWidth: true }
    ]);
    
    return card;
  }

  // Create a feature section
  static async createFeatureSection(): Promise<FrameNode> {
    const section = figma.createFrame();
    section.name = 'Feature Section';
    section.resize(1200, 600);
    
    // Set properties
    section.layoutMode = 'VERTICAL';
    section.itemSpacing = 64;
    section.paddingLeft = 80;
    section.paddingRight = 80;
    section.paddingTop = 80;
    section.paddingBottom = 80;
    section.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.99 } }];
    
    // Add header
    const header = figma.createFrame();
    header.layoutMode = 'VERTICAL';
    header.itemSpacing = 16;
    header.counterAxisAlignItems = 'CENTER';
    header.layoutAlign = 'STRETCH';
    
    await this.addToFrame(header, [
      { type: 'text', text: 'Features', size: 14, weight: 'Medium', color: 'primary' },
      { type: 'heading', text: 'Everything you need to build modern apps', size: 36, weight: 'Bold', align: 'center' },
      { type: 'text', text: 'Our platform provides all the tools and services you need to go from idea to production.', size: 18, color: 'muted', align: 'center' }
    ]);
    
    section.appendChild(header);
    
    // Add feature grid
    const grid = figma.createFrame();
    grid.name = 'Feature Grid';
    grid.layoutMode = 'HORIZONTAL';
    grid.layoutWrap = 'WRAP';
    grid.itemSpacing = 32;
    grid.counterAxisSpacing = 32;
    grid.layoutAlign = 'STRETCH';
    
    const features = [
      { icon: '⚡', title: 'Lightning Fast', description: 'Optimized for speed with edge computing.' },
      { icon: '🔒', title: 'Secure by Default', description: 'Enterprise-grade security built in.' },
      { icon: '🚀', title: 'Easy Deployment', description: 'Deploy to production in minutes.' },
      { icon: '📊', title: 'Analytics Built-in', description: 'Track performance and user behavior.' },
      { icon: '🔧', title: 'Developer Friendly', description: 'Comprehensive APIs and documentation.' },
      { icon: '💬', title: '24/7 Support', description: 'Get help whenever you need it.' }
    ];
    
    for (const feature of features) {
      const card = await this.createFeatureCard(feature);
      grid.appendChild(card);
    }
    
    section.appendChild(grid);
    
    return section;
  }

  // Create a navigation bar
  static async createNavigationBar(): Promise<FrameNode> {
    const nav = figma.createFrame();
    nav.name = 'Navigation Bar';
    nav.resize(1200, 72);
    
    // Set properties
    nav.layoutMode = 'HORIZONTAL';
    nav.primaryAxisAlignItems = 'CENTER';
    nav.counterAxisAlignItems = 'CENTER';
    nav.paddingLeft = 40;
    nav.paddingRight = 40;
    nav.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    nav.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.05 },
      offset: { x: 0, y: 1 },
      radius: 3,
      visible: true,
      blendMode: 'NORMAL'
    }];
    
    // Logo
    const logo = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Bold'));
    logo.characters = 'YourLogo';
    logo.fontSize = 20;
    logo.fontName = FontLoader.getSafeFont('Inter', 'Bold');
    nav.appendChild(logo);
    
    // Spacer
    const spacer1 = figma.createFrame();
    spacer1.layoutGrow = 1;
    spacer1.fills = [];
    nav.appendChild(spacer1);
    
    // Nav links
    const links = ['Home', 'Features', 'Pricing', 'About', 'Contact'];
    for (const link of links) {
      const linkText = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Medium'));
      linkText.characters = link;
      linkText.fontSize = 14;
      linkText.fontName = FontLoader.getSafeFont('Inter', 'Medium');
      linkText.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
      
      const linkWrapper = figma.createFrame();
      linkWrapper.layoutMode = 'HORIZONTAL';
      linkWrapper.paddingLeft = 16;
      linkWrapper.paddingRight = 16;
      linkWrapper.paddingTop = 8;
      linkWrapper.paddingBottom = 8;
      linkWrapper.appendChild(linkText);
      
      nav.appendChild(linkWrapper);
    }
    
    // Spacer
    const spacer2 = figma.createFrame();
    spacer2.layoutGrow = 1;
    spacer2.fills = [];
    nav.appendChild(spacer2);
    
    // CTA buttons
    const loginBtn = await ShadcnFigmaConverter.createShadcnButton({
      children: 'Log In',
      variant: 'ghost',
      library: 'shadcn'
    });
    nav.appendChild(loginBtn);
    
    const signupBtn = await ShadcnFigmaConverter.createShadcnButton({
      children: 'Sign Up',
      variant: 'default',
      library: 'shadcn'
    });
    nav.appendChild(signupBtn);
    
    return nav;
  }

  // Helper: Add components to frame
  private static async addToFrame(frame: FrameNode, components: any[]) {
    for (const comp of components) {
      let element: SceneNode | null = null;
      
      switch (comp.type) {
        case 'heading':
        case 'text':
          element = figma.createText();
          const style = comp.weight || (comp.type === 'heading' ? 'Bold' : 'Regular');
          await figma.loadFontAsync(FontLoader.getSafeFont('Inter', style));
          (element as TextNode).characters = comp.text;
          (element as TextNode).fontSize = comp.size || 14;
          (element as TextNode).fontName = FontLoader.getSafeFont('Inter', style);
          
          if (comp.color === 'muted') {
            (element as TextNode).fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
          } else if (comp.color === 'primary') {
            (element as TextNode).fills = [{ type: 'SOLID', color: { r: 0.388, g: 0.4, b: 0.965 } }];
          }
          
          if (comp.align === 'center') {
            (element as TextNode).textAlignHorizontal = 'CENTER';
          }
          break;
          
        case 'button':
          if (comp.library === 'shadcn') {
            element = await ShadcnFigmaConverter.createShadcnButton({
              children: comp.text,
              variant: comp.variant || 'default',
              library: 'shadcn'
            });
          }
          if (comp.fullWidth && element) {
            (element as FrameNode).layoutAlign = 'STRETCH';
          }
          break;
          
        case 'input':
          if (comp.library === 'shadcn') {
            const wrapper = figma.createFrame();
            wrapper.layoutMode = 'VERTICAL';
            wrapper.itemSpacing = 8;
            wrapper.layoutAlign = 'STRETCH';
            
            // Add label
            if (comp.label) {
              const label = figma.createText();
              await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Medium'));
              label.characters = comp.label;
              label.fontSize = 14;
              label.fontName = FontLoader.getSafeFont('Inter', 'Medium');
              wrapper.appendChild(label);
            }
            
            // Add input
            const input = await ShadcnFigmaConverter.createShadcnInput({
              placeholder: comp.placeholder,
              library: 'shadcn'
            });
            input.layoutAlign = 'STRETCH';
            wrapper.appendChild(input);
            
            element = wrapper;
          }
          break;
          
        case 'spacer':
          element = figma.createFrame();
          (element as FrameNode).fills = [];
          if (comp.height === 'auto') {
            (element as FrameNode).layoutGrow = 1;
          } else {
            (element as FrameNode).resize(1, comp.height || 16);
          }
          break;
          
        case 'divider':
          const dividerWrapper = figma.createFrame();
          dividerWrapper.layoutMode = 'HORIZONTAL';
          dividerWrapper.counterAxisAlignItems = 'CENTER';
          dividerWrapper.itemSpacing = 16;
          dividerWrapper.layoutAlign = 'STRETCH';
          
          const line1 = figma.createLine();
          line1.resize(100, 0);
          line1.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
          line1.strokeWeight = 1;
          
          if (comp.text) {
            const divText = figma.createText();
            await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
            divText.characters = comp.text;
            divText.fontSize = 12;
            divText.fontName = FontLoader.getSafeFont('Inter', 'Regular');
            divText.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
            
            const lineFrame1 = figma.createFrame();
            lineFrame1.layoutGrow = 1;
            lineFrame1.resize(100, 1);
            lineFrame1.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            
            const lineFrame2 = figma.createFrame();
            lineFrame2.layoutGrow = 1;
            lineFrame2.resize(100, 1);
            lineFrame2.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            
            dividerWrapper.appendChild(lineFrame1);
            dividerWrapper.appendChild(divText);
            dividerWrapper.appendChild(lineFrame2);
          } else {
            const lineFrame = figma.createFrame();
            lineFrame.layoutAlign = 'STRETCH';
            lineFrame.resize(100, 1);
            lineFrame.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            dividerWrapper.appendChild(lineFrame);
          }
          
          element = dividerWrapper;
          break;
          
        case 'checkbox':
          const checkWrapper = figma.createFrame();
          checkWrapper.layoutMode = 'HORIZONTAL';
          checkWrapper.counterAxisAlignItems = 'CENTER';
          checkWrapper.itemSpacing = 8;
          
          const checkbox = figma.createFrame();
          checkbox.resize(16, 16);
          checkbox.cornerRadius = 4;
          checkbox.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
          checkbox.strokeWeight = 1;
          checkbox.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
          
          const checkLabel = figma.createText();
          await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
          checkLabel.characters = comp.label || 'Checkbox';
          checkLabel.fontSize = 14;
          checkLabel.fontName = FontLoader.getSafeFont('Inter', 'Regular');
          
          checkWrapper.appendChild(checkbox);
          checkWrapper.appendChild(checkLabel);
          
          element = checkWrapper;
          break;
          
        case 'price':
          const priceWrapper = figma.createFrame();
          priceWrapper.layoutMode = 'HORIZONTAL';
          priceWrapper.counterAxisAlignItems = 'BASELINE';
          priceWrapper.primaryAxisAlignItems = 'CENTER';
          priceWrapper.layoutAlign = 'STRETCH';
          
          const price = figma.createText();
          await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Bold'));
          price.characters = comp.price;
          price.fontSize = 36;
          price.fontName = FontLoader.getSafeFont('Inter', 'Bold');
          
          if (comp.period) {
            const period = figma.createText();
            await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
            period.characters = comp.period;
            period.fontSize = 16;
            period.fontName = FontLoader.getSafeFont('Inter', 'Regular');
            period.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
            
            priceWrapper.appendChild(price);
            priceWrapper.appendChild(period);
          } else {
            priceWrapper.appendChild(price);
          }
          
          element = priceWrapper;
          break;
          
        case 'featureList':
          const listWrapper = figma.createFrame();
          listWrapper.layoutMode = 'VERTICAL';
          listWrapper.itemSpacing = 12;
          listWrapper.layoutAlign = 'STRETCH';
          
          for (const feature of comp.features) {
            const featureItem = figma.createFrame();
            featureItem.layoutMode = 'HORIZONTAL';
            featureItem.itemSpacing = 12;
            featureItem.counterAxisAlignItems = 'CENTER';
            
            // Checkmark icon
            const check = figma.createText();
            await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
            check.characters = '✓';
            check.fontSize = 16;
            check.fontName = FontLoader.getSafeFont('Inter', 'Regular');
            check.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.8, b: 0.3 } }];
            
            const featureText = figma.createText();
            await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
            featureText.characters = feature;
            featureText.fontSize = 14;
            featureText.fontName = FontLoader.getSafeFont('Inter', 'Regular');
            
            featureItem.appendChild(check);
            featureItem.appendChild(featureText);
            listWrapper.appendChild(featureItem);
          }
          
          element = listWrapper;
          break;
      }
      
      if (element) {
        frame.appendChild(element);
      }
    }
  }

  // Helper: Create feature card
  private static async createFeatureCard(feature: { icon: string; title: string; description: string }): Promise<FrameNode> {
    const card = figma.createFrame();
    card.resize(350, 200);
    card.layoutMode = 'VERTICAL';
    card.itemSpacing = 16;
    card.paddingLeft = 24;
    card.paddingRight = 24;
    card.paddingTop = 24;
    card.paddingBottom = 24;
    card.cornerRadius = 12;
    card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    card.strokes = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
    card.strokeWeight = 1;
    
    // Icon
    const iconWrapper = figma.createFrame();
    iconWrapper.resize(48, 48);
    iconWrapper.cornerRadius = 10;
    iconWrapper.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.96, b: 1 } }];
    
    const icon = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
    icon.characters = feature.icon;
    icon.fontSize = 24;
    icon.fontName = FontLoader.getSafeFont('Inter', 'Regular');
    icon.resize(48, 48);
    icon.textAlignHorizontal = 'CENTER';
    icon.textAlignVertical = 'CENTER';
    
    iconWrapper.appendChild(icon);
    card.appendChild(iconWrapper);
    
    // Title
    const title = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Bold'));
    title.characters = feature.title;
    title.fontSize = 18;
    title.fontName = FontLoader.getSafeFont('Inter', 'Bold');
    card.appendChild(title);
    
    // Description
    const desc = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
    desc.characters = feature.description;
    desc.fontSize = 14;
    desc.fontName = FontLoader.getSafeFont('Inter', 'Regular');
    desc.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
    desc.layoutAlign = 'STRETCH';
    desc.textAutoResize = 'HEIGHT';
    card.appendChild(desc);
    
    return card;
  }

  // Create Dashboard Layout
  static async createDashboardLayout(): Promise<FrameNode> {
    const dashboard = figma.createFrame();
    dashboard.name = 'Dashboard Layout';
    dashboard.resize(1440, 900);
    dashboard.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.99 } }];
    
    // Sidebar
    const sidebar = figma.createFrame();
    sidebar.name = 'Sidebar';
    sidebar.resize(260, 900);
    sidebar.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.15 } }];
    sidebar.layoutMode = 'VERTICAL';
    sidebar.paddingTop = 32;
    sidebar.paddingLeft = 24;
    sidebar.paddingRight = 24;
    sidebar.itemSpacing = 24;
    
    // Logo
    const logo = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Bold'));
    logo.characters = 'Dashboard';
    logo.fontSize = 24;
    logo.fontName = FontLoader.getSafeFont('Inter', 'Bold');
    logo.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    sidebar.appendChild(logo);
    
    // Nav items
    const navItems = ['Overview', 'Analytics', 'Products', 'Customers', 'Settings'];
    for (const item of navItems) {
      const navItem = figma.createFrame();
      navItem.layoutMode = 'HORIZONTAL';
      navItem.paddingLeft = 16;
      navItem.paddingRight = 16;
      navItem.paddingTop = 12;
      navItem.paddingBottom = 12;
      navItem.cornerRadius = 8;
      navItem.layoutAlign = 'STRETCH';
      
      if (item === 'Overview') {
        navItem.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.25 } }];
      }
      
      const navText = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Medium'));
      navText.characters = item;
      navText.fontSize = 14;
      navText.fontName = FontLoader.getSafeFont('Inter', 'Medium');
      navText.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
      navItem.appendChild(navText);
      
      sidebar.appendChild(navItem);
    }
    
    dashboard.appendChild(sidebar);
    
    // Main content
    const mainContent = figma.createFrame();
    mainContent.name = 'Main Content';
    mainContent.x = 260;
    mainContent.resize(1180, 900);
    mainContent.layoutMode = 'VERTICAL';
    mainContent.paddingTop = 32;
    mainContent.paddingLeft = 48;
    mainContent.paddingRight = 48;
    mainContent.itemSpacing = 32;
    
    // Header
    const header = figma.createFrame();
    header.layoutMode = 'HORIZONTAL';
    header.counterAxisAlignItems = 'CENTER';
    header.layoutAlign = 'STRETCH';
    
    const headerTitle = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Bold'));
    headerTitle.characters = 'Welcome back!';
    headerTitle.fontSize = 32;
    headerTitle.fontName = FontLoader.getSafeFont('Inter', 'Bold');
    headerTitle.layoutGrow = 1;
    header.appendChild(headerTitle);
    
    const headerButton = await ShadcnFigmaConverter.createShadcnButton({
      children: 'Add New',
      variant: 'default',
      library: 'shadcn'
    });
    header.appendChild(headerButton);
    
    mainContent.appendChild(header);
    
    // Stats cards
    const statsRow = figma.createFrame();
    statsRow.layoutMode = 'HORIZONTAL';
    statsRow.itemSpacing = 24;
    statsRow.layoutAlign = 'STRETCH';
    
    const stats = [
      { label: 'Total Revenue', value: '$45,231.89', change: '+20.1%' },
      { label: 'Subscriptions', value: '+2350', change: '+180.1%' },
      { label: 'Sales', value: '+12,234', change: '+19%' },
      { label: 'Active Now', value: '+573', change: '+201' }
    ];
    
    for (const stat of stats) {
      const statCard = figma.createFrame();
      statCard.layoutMode = 'VERTICAL';
      statCard.itemSpacing = 8;
      statCard.paddingTop = 24;
      statCard.paddingBottom = 24;
      statCard.paddingLeft = 24;
      statCard.paddingRight = 24;
      statCard.cornerRadius = 12;
      statCard.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      statCard.layoutGrow = 1;
      statCard.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.05 },
        offset: { x: 0, y: 1 },
        radius: 3,
        visible: true,
        blendMode: 'NORMAL'
      }];
      
      const label = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
      label.characters = stat.label;
      label.fontSize = 14;
      label.fontName = FontLoader.getSafeFont('Inter', 'Regular');
      label.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
      statCard.appendChild(label);
      
      const value = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Bold'));
      value.characters = stat.value;
      value.fontSize = 24;
      value.fontName = FontLoader.getSafeFont('Inter', 'Bold');
      statCard.appendChild(value);
      
      const change = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
      change.characters = stat.change + ' from last month';
      change.fontSize = 12;
      change.fontName = FontLoader.getSafeFont('Inter', 'Regular');
      change.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.8, b: 0.3 } }];
      statCard.appendChild(change);
      
      statsRow.appendChild(statCard);
    }
    
    mainContent.appendChild(statsRow);
    dashboard.appendChild(mainContent);
    
    return dashboard;
  }

  // Create Data Table
  static async createDataTable(): Promise<FrameNode> {
    const table = figma.createFrame();
    table.name = 'Data Table';
    table.resize(800, 400);
    table.layoutMode = 'VERTICAL';
    table.cornerRadius = 8;
    table.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    table.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    table.strokeWeight = 1;
    
    // Header
    const header = figma.createFrame();
    header.layoutMode = 'HORIZONTAL';
    header.layoutAlign = 'STRETCH';
    header.paddingTop = 16;
    header.paddingBottom = 16;
    header.paddingLeft = 24;
    header.paddingRight = 24;
    header.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.99 } }];
    
    const columns = ['Name', 'Status', 'Date', 'Amount'];
    const columnWidths = [200, 150, 200, 250];
    
    for (let i = 0; i < columns.length; i++) {
      const headerCell = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Medium'));
      headerCell.characters = columns[i] || '';
      headerCell.fontSize = 14;
      headerCell.fontName = FontLoader.getSafeFont('Inter', 'Medium');
      headerCell.fills = [{ type: 'SOLID', color: { r: 0.3, g: 0.3, b: 0.3 } }];
      headerCell.resize(columnWidths[i] || 200, 20);
      header.appendChild(headerCell);
    }
    
    table.appendChild(header);
    
    // Rows
    const rows = [
      { name: 'Olivia Martin', status: 'Active', date: 'Dec 12, 2023', amount: '$1,999.00' },
      { name: 'Jackson Lee', status: 'Pending', date: 'Dec 11, 2023', amount: '$39.00' },
      { name: 'Isabella Nguyen', status: 'Active', date: 'Dec 10, 2023', amount: '$299.00' },
      { name: 'William Kim', status: 'Inactive', date: 'Dec 9, 2023', amount: '$99.00' },
      { name: 'Sofia Davis', status: 'Active', date: 'Dec 8, 2023', amount: '$39.00' }
    ];
    
    for (const rowData of rows) {
      const row = figma.createFrame();
      row.layoutMode = 'HORIZONTAL';
      row.layoutAlign = 'STRETCH';
      row.paddingTop = 16;
      row.paddingBottom = 16;
      row.paddingLeft = 24;
      row.paddingRight = 24;
      
      // Add border between rows
      row.strokes = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
      row.strokeWeight = 1;
      row.strokeAlign = 'INSIDE';
      row.strokeTopWeight = 1;
      row.strokeBottomWeight = 0;
      row.strokeLeftWeight = 0;
      row.strokeRightWeight = 0;
      
      // Name
      const name = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
      name.characters = rowData.name;
      name.fontSize = 14;
      name.fontName = FontLoader.getSafeFont('Inter', 'Regular');
      name.resize(columnWidths[0] || 200, 20);
      row.appendChild(name);
      
      // Status
      const statusBadge = await ShadcnFigmaConverter.createShadcnBadge({
        children: rowData.status,
        variant: rowData.status === 'Active' ? 'default' : 
                 rowData.status === 'Pending' ? 'secondary' : 'outline',
        size: 'sm',
        library: 'shadcn'
      });
      row.appendChild(statusBadge);
      
      // Date
      const date = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
      date.characters = rowData.date;
      date.fontSize = 14;
      date.fontName = FontLoader.getSafeFont('Inter', 'Regular');
      date.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
      date.resize(columnWidths[2] || 200, 20);
      row.appendChild(date);
      
      // Amount
      const amount = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Medium'));
      amount.characters = rowData.amount;
      amount.fontSize = 14;
      amount.fontName = FontLoader.getSafeFont('Inter', 'Medium');
      amount.resize(columnWidths[3] || 250, 20);
      row.appendChild(amount);
      
      table.appendChild(row);
    }
    
    return table;
  }

  // Create User Profile Card
  static async createUserProfileCard(): Promise<FrameNode> {
    const card = figma.createFrame();
    card.name = 'User Profile Card';
    card.resize(340, 400);
    card.layoutMode = 'VERTICAL';
    card.cornerRadius = 16;
    card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    card.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 4 },
      radius: 20,
      visible: true,
      blendMode: 'NORMAL'
    }];
    
    // Cover image placeholder
    const cover = figma.createRectangle();
    cover.resize(340, 120);
    cover.fills = [{
      type: 'GRADIENT_LINEAR',
      gradientTransform: [
        [1, 0, 0],
        [0, 1, 0]
      ],
      gradientStops: [
        { position: 0, color: { r: 0.388, g: 0.4, b: 0.965, a: 1 } },
        { position: 1, color: { r: 0.588, g: 0.6, b: 0.965, a: 1 } }
      ]
    }];
    card.appendChild(cover);
    
    // Content
    const content = figma.createFrame();
    content.layoutMode = 'VERTICAL';
    content.itemSpacing = 20;
    content.paddingTop = 60; // Space for avatar overlap
    content.paddingLeft = 32;
    content.paddingRight = 32;
    content.paddingBottom = 32;
    content.layoutAlign = 'STRETCH';
    content.layoutGrow = 1;
    
    // Name and role
    const nameText = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Bold'));
    nameText.characters = 'Sarah Anderson';
    nameText.fontSize = 24;
    nameText.fontName = FontLoader.getSafeFont('Inter', 'Bold');
    nameText.textAlignHorizontal = 'CENTER';
    content.appendChild(nameText);
    
    const roleText = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
    roleText.characters = 'Senior Product Designer';
    roleText.fontSize = 14;
    roleText.fontName = FontLoader.getSafeFont('Inter', 'Regular');
    roleText.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
    roleText.textAlignHorizontal = 'CENTER';
    content.appendChild(roleText);
    
    // Stats
    const statsRow = figma.createFrame();
    statsRow.layoutMode = 'HORIZONTAL';
    statsRow.counterAxisAlignItems = 'CENTER';
    statsRow.primaryAxisAlignItems = 'CENTER';
    statsRow.itemSpacing = 32;
    
    const statItems = [
      { value: '142', label: 'Projects' },
      { value: '24.5k', label: 'Followers' },
      { value: '487', label: 'Following' }
    ];
    
    for (const stat of statItems) {
      const statContainer = figma.createFrame();
      statContainer.layoutMode = 'VERTICAL';
      statContainer.counterAxisAlignItems = 'CENTER';
      statContainer.itemSpacing = 4;
      
      const statValue = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Bold'));
      statValue.characters = stat.value;
      statValue.fontSize = 20;
      statValue.fontName = FontLoader.getSafeFont('Inter', 'Bold');
      statContainer.appendChild(statValue);
      
      const statLabel = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
      statLabel.characters = stat.label;
      statLabel.fontSize = 12;
      statLabel.fontName = FontLoader.getSafeFont('Inter', 'Regular');
      statLabel.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
      statContainer.appendChild(statLabel);
      
      statsRow.appendChild(statContainer);
    }
    
    content.appendChild(statsRow);
    
    // Bio
    const bio = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
    bio.characters = 'Passionate about creating beautiful and functional digital experiences. Coffee enthusiast ☕';
    bio.fontSize = 14;
    bio.fontName = FontLoader.getSafeFont('Inter', 'Regular');
    bio.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
    bio.textAlignHorizontal = 'CENTER';
    bio.layoutAlign = 'STRETCH';
    bio.textAutoResize = 'HEIGHT';
    content.appendChild(bio);
    
    // Action buttons
    const buttonsRow = figma.createFrame();
    buttonsRow.layoutMode = 'HORIZONTAL';
    buttonsRow.itemSpacing = 12;
    buttonsRow.layoutAlign = 'STRETCH';
    
    const followBtn = await ShadcnFigmaConverter.createShadcnButton({
      children: 'Follow',
      variant: 'default',
      library: 'shadcn'
    });
    followBtn.layoutGrow = 1;
    buttonsRow.appendChild(followBtn);
    
    const messageBtn = await ShadcnFigmaConverter.createShadcnButton({
      children: 'Message',
      variant: 'outline',
      library: 'shadcn'
    });
    messageBtn.layoutGrow = 1;
    buttonsRow.appendChild(messageBtn);
    
    content.appendChild(buttonsRow);
    card.appendChild(content);
    
    // Avatar (positioned absolutely)
    const avatar = await ShadcnFigmaConverter.createShadcnAvatar({
      size: 'lg',
      initials: 'SA',
      library: 'shadcn'
    });
    avatar.resize(80, 80);
    avatar.x = 130; // Center horizontally
    avatar.y = 80;  // Overlap cover and content
    avatar.strokeWeight = 4;
    avatar.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    card.appendChild(avatar);
    
    return card;
  }

  // Create component by type
  static async createTemplate(type: string): Promise<SceneNode | null> {
    try {
      switch (type) {
        case 'loginForm':
          return await this.createLoginForm();
        case 'pricingCard':
          return await this.createPricingCard('pro');
        case 'featureSection':
          return await this.createFeatureSection();
        case 'navigationBar':
          return await this.createNavigationBar();
        case 'dashboardLayout':
          return await this.createDashboardLayout();
        case 'dataTable':
          return await this.createDataTable();
        case 'userProfileCard':
          return await this.createUserProfileCard();
        default:
          console.error(`[ProfessionalTemplates] Unknown template type: ${type}`);
          return null;
      }
    } catch (error) {
      console.error(`[ProfessionalTemplates] Error creating template ${type}:`, error);
      return null;
    }
  }
}