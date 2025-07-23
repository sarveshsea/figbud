import { supabase } from '../config/supabase';

export interface ComponentData {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  figmaProperties: any;
  onceUIMapping?: any;
  usage_count: number;
  thumbnail_url?: string;
  variations?: any[];
}

export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  components: any[];
  preview_url?: string;
  code?: string;
}

export class ComponentService {
  /**
   * Search for components by keywords or types
   */
  static async searchComponents(
    keywords: string[], 
    componentTypes?: string[], 
    limit: number = 10
  ): Promise<ComponentData[]> {
    try {
      let query = supabase
        .from('figma_components')
        .select(`
          *,
          once_ui_mappings!inner(*),
          component_variations(*)
        `);

      // Filter by component types if provided
      if (componentTypes && componentTypes.length > 0) {
        query = query.in('type', componentTypes);
      }

      // Search by keywords in name, description, and tags
      if (keywords.length > 0) {
        const searchTerms = keywords.join(' | ');
        query = query.or(`name.ilike.%${searchTerms}%,description.ilike.%${searchTerms}%,tags.cs.{${keywords.join(',')}}`);
      }

      // Order by usage count and limit
      query = query
        .order('usage_count', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data
      return (data || []).map(component => ({
        id: component.id,
        name: component.name,
        type: component.type,
        category: component.category,
        description: component.description,
        figmaProperties: component.figma_properties,
        onceUIMapping: component.once_ui_mappings,
        usage_count: component.usage_count,
        thumbnail_url: component.thumbnail_url,
        variations: component.component_variations
      }));
    } catch (error) {
      console.error('Error searching components:', error);
      return [];
    }
  }

  /**
   * Get components by exact types
   */
  static async getComponentsByTypes(types: string[]): Promise<ComponentData[]> {
    try {
      const { data, error } = await supabase
        .from('figma_components')
        .select(`
          *,
          once_ui_mappings!inner(*)
        `)
        .in('type', types)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      return (data || []).map(component => ({
        id: component.id,
        name: component.name,
        type: component.type,
        category: component.category,
        description: component.description,
        figmaProperties: component.figma_properties,
        onceUIMapping: component.once_ui_mappings,
        usage_count: component.usage_count,
        thumbnail_url: component.thumbnail_url
      }));
    } catch (error) {
      console.error('Error getting components by types:', error);
      return [];
    }
  }

  /**
   * Get component templates that match keywords
   */
  static async searchTemplates(keywords: string[], category?: string): Promise<ComponentTemplate[]> {
    try {
      let query = supabase
        .from('component_templates')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      if (keywords.length > 0) {
        const searchTerms = keywords.join(' | ');
        query = query.or(`name.ilike.%${searchTerms}%,description.ilike.%${searchTerms}%,tags.cs.{${keywords.join(',')}}`);
      }

      query = query
        .order('usage_count', { ascending: false })
        .limit(5);

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        components: template.components,
        preview_url: template.preview_url,
        code: template.code
      }));
    } catch (error) {
      console.error('Error searching templates:', error);
      return [];
    }
  }

  /**
   * Get Once UI mapping for a component type
   */
  static async getOnceUIMapping(componentType: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('once_ui_mappings')
        .select('*')
        .eq('component_type', componentType)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting Once UI mapping:', error);
      return null;
    }
  }

  /**
   * Increment usage count for a component
   */
  static async trackComponentUsage(componentId: string, userId?: string): Promise<void> {
    try {
      // Increment usage count
      await supabase.rpc('increment_component_usage', { 
        component_id: componentId 
      });

      // Track analytics
      await supabase
        .from('component_analytics')
        .insert({
          component_id: componentId,
          user_id: userId,
          action: 'created',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking component usage:', error);
    }
  }

  /**
   * Get component recommendations based on user history
   */
  static async getRecommendations(userId: string, limit: number = 5): Promise<ComponentData[]> {
    try {
      // Get user's recent component usage
      const { data: recentUsage, error: usageError } = await supabase
        .from('component_analytics')
        .select('component_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (usageError) throw usageError;

      // Get component types from recent usage
      const usedComponentIds = (recentUsage || []).map(u => u.component_id);
      
      if (usedComponentIds.length === 0) {
        // Return popular components if no history
        return this.getPopularComponents(limit);
      }

      // Get similar components based on category and tags
      const { data: components, error: compError } = await supabase
        .from('figma_components')
        .select(`
          *,
          once_ui_mappings!inner(*)
        `)
        .not('id', 'in', `(${usedComponentIds.join(',')})`)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (compError) throw compError;

      return (components || []).map(component => ({
        id: component.id,
        name: component.name,
        type: component.type,
        category: component.category,
        description: component.description,
        figmaProperties: component.figma_properties,
        onceUIMapping: component.once_ui_mappings,
        usage_count: component.usage_count,
        thumbnail_url: component.thumbnail_url
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Get popular components
   */
  static async getPopularComponents(limit: number = 10): Promise<ComponentData[]> {
    try {
      const { data, error } = await supabase
        .from('figma_components')
        .select(`
          *,
          once_ui_mappings!inner(*)
        `)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(component => ({
        id: component.id,
        name: component.name,
        type: component.type,
        category: component.category,
        description: component.description,
        figmaProperties: component.figma_properties,
        onceUIMapping: component.once_ui_mappings,
        usage_count: component.usage_count,
        thumbnail_url: component.thumbnail_url
      }));
    } catch (error) {
      console.error('Error getting popular components:', error);
      return [];
    }
  }

  /**
   * Create Figma component code from component data
   */
  static generateFigmaCode(component: ComponentData): string {
    const { type, figmaProperties } = component;
    
    // Base code template
    let code = `// Create ${type} component\n`;
    
    switch (type.toLowerCase()) {
      case 'button':
        code += this.generateButtonCode(figmaProperties);
        break;
      case 'input':
        code += this.generateInputCode(figmaProperties);
        break;
      case 'card':
        code += this.generateCardCode(figmaProperties);
        break;
      default:
        code += this.generateGenericCode(type, figmaProperties);
    }

    return code;
  }

  private static generateButtonCode(props: any): string {
    return `
const button = figma.createRectangle();
button.name = "${props.name || 'Button'}";
button.resize(${props.width || 120}, ${props.height || 40});
button.cornerRadius = ${props.cornerRadius || 8};
button.fills = [{
  type: 'SOLID',
  color: { r: ${props.fillColor?.r || 0.2}, g: ${props.fillColor?.g || 0.4}, b: ${props.fillColor?.b || 1} }
}];

// Add text
const text = figma.createText();
text.characters = "${props.text || 'Click me'}";
text.fontSize = ${props.fontSize || 16};
text.textAlignHorizontal = 'CENTER';
text.textAlignVertical = 'CENTER';
text.resize(button.width, button.height);

// Group together
const buttonGroup = figma.group([button, text], figma.currentPage);
buttonGroup.name = "${props.name || 'Button Component'}";
`;
  }

  private static generateInputCode(props: any): string {
    return `
const input = figma.createRectangle();
input.name = "${props.name || 'Input Field'}";
input.resize(${props.width || 300}, ${props.height || 48});
input.cornerRadius = ${props.cornerRadius || 4};
input.strokes = [{
  type: 'SOLID',
  color: { r: 0.8, g: 0.8, b: 0.8 }
}];
input.strokeWeight = ${props.strokeWeight || 1};
input.fills = [{
  type: 'SOLID',
  color: { r: 1, g: 1, b: 1 }
}];

// Add placeholder text
const placeholder = figma.createText();
placeholder.characters = "${props.placeholder || 'Enter text...'}";
placeholder.fontSize = ${props.fontSize || 14};
placeholder.fills = [{
  type: 'SOLID',
  color: { r: 0.6, g: 0.6, b: 0.6 }
}];
placeholder.x = 16;
placeholder.y = (input.height - placeholder.height) / 2;

// Group together
const inputGroup = figma.group([input, placeholder], figma.currentPage);
inputGroup.name = "${props.name || 'Input Component'}";
`;
  }

  private static generateCardCode(props: any): string {
    return `
const card = figma.createRectangle();
card.name = "${props.name || 'Card'}";
card.resize(${props.width || 320}, ${props.height || 200});
card.cornerRadius = ${props.cornerRadius || 12};
card.fills = [{
  type: 'SOLID',
  color: { r: 1, g: 1, b: 1 }
}];
card.effects = [{
  type: 'DROP_SHADOW',
  color: { r: 0, g: 0, b: 0, a: 0.1 },
  offset: { x: 0, y: 2 },
  radius: 8,
  visible: true,
  blendMode: 'NORMAL'
}];

// Add to current page
figma.currentPage.appendChild(card);
`;
  }

  private static generateGenericCode(type: string, props: any): string {
    return `
// Create ${type} component
const component = figma.createRectangle();
component.name = "${props.name || type}";
component.resize(${props.width || 200}, ${props.height || 100});

// Add custom properties
${JSON.stringify(props, null, 2)}

// Add to current page
figma.currentPage.appendChild(component);
`;
  }
}