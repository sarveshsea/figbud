import { DesignSystemComponent } from './designSystemManager';

interface ComponentUsage {
  componentId: string;
  userId: string;
  timestamp: Date;
  props: any;
}

interface ComponentVersion {
  id: string;
  componentId: string;
  version: number;
  props: any;
  changes: string;
  createdAt: Date;
  createdBy: string;
}

export class ComponentDatabase {
  private static readonly STORAGE_PREFIX = 'figbud_components_';
  private static readonly USAGE_PREFIX = 'figbud_usage_';
  private static readonly VERSION_PREFIX = 'figbud_versions_';
  
  // Initialize database (placeholder for Supabase integration)
  static async initialize() {
    // In production, this would connect to Supabase
    console.log('[ComponentDatabase] Initialized with local storage fallback');
  }

  // Save component to database
  static async saveComponent(component: DesignSystemComponent): Promise<string> {
    try {
      // Generate ID if not present
      const id = component.id || `${component.library}-${component.type}-${Date.now()}`;
      const componentWithId = { ...component, id, updatedAt: new Date() };
      
      // Save to local storage (fallback)
      localStorage.setItem(`${this.STORAGE_PREFIX}${id}`, JSON.stringify(componentWithId));
      
      // In production, this would save to Supabase
      // await supabase.from('design_system_components').upsert(componentWithId);
      
      console.log('[ComponentDatabase] Saved component:', id);
      return id;
    } catch (error) {
      console.error('[ComponentDatabase] Error saving component:', error);
      throw error;
    }
  }

  // Get component by ID
  static async getComponent(id: string): Promise<DesignSystemComponent | null> {
    try {
      // Try local storage first
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${id}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // In production, query Supabase
      // const { data } = await supabase
      //   .from('design_system_components')
      //   .select('*')
      //   .eq('id', id)
      //   .single();
      
      return null;
    } catch (error) {
      console.error('[ComponentDatabase] Error getting component:', error);
      return null;
    }
  }

  // Get all components
  static async getAllComponents(): Promise<DesignSystemComponent[]> {
    try {
      const components: DesignSystemComponent[] = [];
      
      // Get from local storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            components.push(JSON.parse(item));
          }
        }
      }
      
      // In production, query Supabase
      // const { data } = await supabase
      //   .from('design_system_components')
      //   .select('*')
      //   .order('created_at', { ascending: false });
      
      return components;
    } catch (error) {
      console.error('[ComponentDatabase] Error getting all components:', error);
      return [];
    }
  }

  // Search components
  static async searchComponents(query: string): Promise<DesignSystemComponent[]> {
    try {
      const allComponents = await this.getAllComponents();
      const lowerQuery = query.toLowerCase();
      
      return allComponents.filter(comp =>
        comp.name.toLowerCase().includes(lowerQuery) ||
        comp.description.toLowerCase().includes(lowerQuery) ||
        comp.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
      
      // In production, use Supabase full-text search
      // const { data } = await supabase
      //   .from('design_system_components')
      //   .select('*')
      //   .textSearch('search_vector', query);
    } catch (error) {
      console.error('[ComponentDatabase] Error searching components:', error);
      return [];
    }
  }

  // Track component usage
  static async trackUsage(componentId: string, props: any, userId: string = 'anonymous'): Promise<void> {
    try {
      const usage: ComponentUsage = {
        componentId,
        userId,
        timestamp: new Date(),
        props
      };
      
      // Save to local storage
      const key = `${this.USAGE_PREFIX}${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(usage));
      
      // Update component usage count
      const component = await this.getComponent(componentId);
      if (component) {
        component.usage = (component.usage || 0) + 1;
        await this.saveComponent(component);
      }
      
      // In production, save to Supabase
      // await supabase.from('component_usage').insert(usage);
    } catch (error) {
      console.error('[ComponentDatabase] Error tracking usage:', error);
    }
  }

  // Get component usage statistics
  static async getUsageStats(componentId?: string): Promise<any> {
    try {
      const usages: ComponentUsage[] = [];
      
      // Get from local storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.USAGE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            const usage = JSON.parse(item);
            if (!componentId || usage.componentId === componentId) {
              usages.push(usage);
            }
          }
        }
      }
      
      // Calculate statistics
      const stats = {
        totalUsage: usages.length,
        uniqueUsers: new Set(usages.map(u => u.userId)).size,
        recentUsage: usages.filter(u => {
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 1);
          return new Date(u.timestamp) > dayAgo;
        }).length,
        popularProps: this.getPopularProps(usages)
      };
      
      return stats;
    } catch (error) {
      console.error('[ComponentDatabase] Error getting usage stats:', error);
      return null;
    }
  }

  // Get popular prop combinations
  private static getPopularProps(usages: ComponentUsage[]): any[] {
    const propCounts = new Map<string, number>();
    
    usages.forEach(usage => {
      const propsKey = JSON.stringify(usage.props);
      propCounts.set(propsKey, (propCounts.get(propsKey) || 0) + 1);
    });
    
    return Array.from(propCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([props, count]) => ({
        props: JSON.parse(props),
        count
      }));
  }

  // Save component version
  static async saveVersion(
    componentId: string, 
    props: any, 
    changes: string, 
    userId: string = 'anonymous'
  ): Promise<void> {
    try {
      // Get current version number
      const versions = await this.getVersions(componentId);
      const versionNumber = versions.length + 1;
      
      const version: ComponentVersion = {
        id: `${componentId}-v${versionNumber}`,
        componentId,
        version: versionNumber,
        props,
        changes,
        createdAt: new Date(),
        createdBy: userId
      };
      
      // Save to local storage
      localStorage.setItem(`${this.VERSION_PREFIX}${version.id}`, JSON.stringify(version));
      
      // In production, save to Supabase
      // await supabase.from('component_versions').insert(version);
    } catch (error) {
      console.error('[ComponentDatabase] Error saving version:', error);
    }
  }

  // Get component versions
  static async getVersions(componentId: string): Promise<ComponentVersion[]> {
    try {
      const versions: ComponentVersion[] = [];
      
      // Get from local storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.VERSION_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            const version = JSON.parse(item);
            if (version.componentId === componentId) {
              versions.push(version);
            }
          }
        }
      }
      
      // Sort by version number
      return versions.sort((a, b) => a.version - b.version);
    } catch (error) {
      console.error('[ComponentDatabase] Error getting versions:', error);
      return [];
    }
  }

  // Export component data
  static async exportComponent(componentId: string): Promise<any> {
    try {
      const component = await this.getComponent(componentId);
      const versions = await this.getVersions(componentId);
      const stats = await this.getUsageStats(componentId);
      
      return {
        component,
        versions,
        stats,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('[ComponentDatabase] Error exporting component:', error);
      return null;
    }
  }

  // Import component data
  static async importComponent(data: any): Promise<string | null> {
    try {
      if (!data.component) {
        throw new Error('Invalid import data: missing component');
      }
      
      // Generate new ID to avoid conflicts
      const newId = `imported-${Date.now()}`;
      const component = { ...data.component, id: newId };
      
      // Save component
      await this.saveComponent(component);
      
      // Import versions if available
      if (data.versions) {
        for (const version of data.versions) {
          await this.saveVersion(newId, version.props, version.changes, version.createdBy);
        }
      }
      
      return newId;
    } catch (error) {
      console.error('[ComponentDatabase] Error importing component:', error);
      return null;
    }
  }

  // Clean up old data
  static async cleanup(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // Clean usage data
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.USAGE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            const usage = JSON.parse(item);
            if (new Date(usage.timestamp) < cutoffDate) {
              localStorage.removeItem(key);
            }
          }
        }
      }
      
      console.log('[ComponentDatabase] Cleanup completed');
    } catch (error) {
      console.error('[ComponentDatabase] Error during cleanup:', error);
    }
  }
}

// Initialize on load
ComponentDatabase.initialize();