import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

// Create a mock/noop client if Supabase is not configured
const supabaseConfigured = supabaseUrl && supabaseKey;
export const supabase = supabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey)
  : null as any;

// Log database status
if (!supabaseConfigured) {
  console.log('⚠️  Supabase not configured - using in-memory storage');
}

export interface ChatSession {
  id?: string;
  user_id?: string;
  conversation_id: string;
  message: string;
  response: string;
  metadata?: any;
  created_at?: string;
}

export interface ComponentCreated {
  id?: string;
  user_id?: string;
  component_type: string;
  properties: any;
  prompt: string;
  teacher_note?: string;
  created_at?: string;
}

export class DatabaseService {
  // In-memory storage for when Supabase is not configured
  private inMemoryChats: ChatSession[] = [];
  private inMemoryComponents: ComponentCreated[] = [];

  // Store chat message and response
  async storeChatMessage(data: {
    conversationId: string;
    message: string;
    response: string;
    metadata?: any;
  }): Promise<void> {
    if (!supabase) {
      // Use in-memory storage
      this.inMemoryChats.push({
        conversation_id: data.conversationId,
        message: data.message,
        response: data.response,
        metadata: data.metadata,
        created_at: new Date().toISOString()
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .insert({
          conversation_id: data.conversationId,
          message: data.message,
          response: data.response,
          metadata: data.metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing chat message:', error);
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  // Store component creation
  async storeComponentCreated(data: {
    componentType: string;
    properties: any;
    prompt: string;
    teacherNote?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('components_created')
        .insert({
          component_type: data.componentType,
          properties: data.properties,
          prompt: data.prompt,
          teacher_note: data.teacherNote,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing component:', error);
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  // Get conversation history (alias for getChatHistory)
  async getConversationHistory(conversationId: string): Promise<ChatSession[]> {
    if (!supabase) {
      // Use in-memory storage
      return this.inMemoryChats
        .filter(chat => chat.conversation_id === conversationId)
        .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    }

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }

  // Alias for backward compatibility
  async getChatHistory(conversationId: string): Promise<ChatSession[]> {
    return this.getConversationHistory(conversationId);
  }

  // Store chat interaction (combines message and response)
  async storeChatInteraction(data: {
    conversationId: string;
    userId?: string;
    message: string;
    response: string;
    metadata?: any;
  }): Promise<void> {
    return this.storeChatMessage({
      conversationId: data.conversationId,
      message: data.message,
      response: data.response,
      metadata: { ...data.metadata, userId: data.userId }
    });
  }

  // Get component statistics
  async getComponentStats(): Promise<any> {
    try {
      // First try to use the materialized view
      let { data, error } = await supabase
        .from('component_stats')
        .select('*')
        .order('count', { ascending: false });

      // If materialized view doesn't exist or fails, calculate dynamically
      if (error) {
        console.log('Materialized view not available, calculating stats dynamically');
        
        // Use raw SQL to calculate stats
        const { data: dynamicData, error: dynamicError } = await supabase
          .rpc('get_component_stats');
        
        if (dynamicError) {
          // Fallback to manual aggregation
          const { data: components, error: componentsError } = await supabase
            .from('components_created')
            .select('component_type');
          
          if (componentsError) {
            console.error('Error fetching components:', componentsError);
            return [];
          }
          
          // Manually aggregate the data
          const stats = components.reduce((acc: any, component: any) => {
            const type = component.component_type;
            if (!acc[type]) {
              acc[type] = { component_type: type, count: 0 };
            }
            acc[type].count++;
            return acc;
          }, {});
          
          data = Object.values(stats).sort((a: any, b: any) => b.count - a.count);
        } else {
          data = dynamicData;
        }
      }

      return data || [];
    } catch (error) {
      console.error('Database error:', error);
      return [];
    }
  }
}

export const databaseService = new DatabaseService();