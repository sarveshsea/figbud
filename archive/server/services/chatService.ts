import { supabase, supabaseAdmin } from '../config/supabase';
import { EnrichedResponse } from './responseParser';

export interface ChatSession {
  id: string;
  user_id: string | null;
  widget_session_id: string;
  is_anonymous: boolean;
  started_at: Date;
  last_activity: Date;
  ended_at: Date | null;
  metadata: any;
}

export interface ChatConversation {
  id: string;
  user_id: string | null;
  session_id: string;
  widget_session_id: string;
  is_active: boolean;
  created_at: Date;
  ended_at: Date | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: any;
  intent?: any;
  components?: any;
  tutorials?: any;
  provider?: string;
  model?: string;
  created_at: Date;
}

export class ChatService {
  /**
   * Create a new chat session
   */
  static async createSession(
    userId: string | null,
    widgetSessionId: string,
    metadata: any = {}
  ): Promise<ChatSession | null> {
    try {
      const client = supabaseAdmin || supabase;
      
      // Check if session already exists
      const { data: existingSession } = await client
        .from('chat_sessions')
        .select('*')
        .eq('widget_session_id', widgetSessionId)
        .single();

      if (existingSession) {
        return existingSession;
      }

      // Call the stored procedure to create session and conversation
      const { data, error } = await client
        .rpc('create_chat_session', {
          p_user_id: userId,
          p_widget_session_id: widgetSessionId,
          p_metadata: metadata
        });

      if (error) throw error;

      // Fetch the created session
      const { data: session, error: fetchError } = await client
        .from('chat_sessions')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) throw fetchError;

      return session;
    } catch (error) {
      console.error('Error creating chat session:', error);
      return null;
    }
  }

  /**
   * End a chat session
   */
  static async endSession(widgetSessionId: string): Promise<void> {
    try {
      const client = supabaseAdmin || supabase;
      
      const { error } = await client
        .rpc('end_chat_session', {
          p_widget_session_id: widgetSessionId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error ending chat session:', error);
    }
  }

  /**
   * Get active conversation for a session
   */
  static async getActiveConversation(
    widgetSessionId: string
  ): Promise<ChatConversation | null> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('widget_session_id', widgetSessionId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      return data;
    } catch (error) {
      console.error('Error getting active conversation:', error);
      return null;
    }
  }

  /**
   * Store a chat message with enriched data
   */
  static async storeMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    enrichedData?: Partial<EnrichedResponse>
  ): Promise<ChatMessage | null> {
    try {
      const client = supabaseAdmin || supabase;
      
      const messageData = {
        p_conversation_id: conversationId,
        p_role: role,
        p_content: content,
        p_metadata: enrichedData?.metadata || {},
        p_intent: enrichedData?.intent || null,
        p_components: enrichedData?.suggestedComponents || null,
        p_tutorials: enrichedData?.relatedTutorials || null,
        p_provider: enrichedData?.provider || null,
        p_model: (enrichedData?.metadata as any)?.model || null
      };

      const { data: messageId, error } = await client
        .rpc('store_chat_message', messageData);

      if (error) throw error;

      // Fetch the created message
      const { data: message, error: fetchError } = await client
        .from('chat_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      return message;
    } catch (error) {
      console.error('Error storing chat message:', error);
      return null;
    }
  }

  /**
   * Get chat history for a user
   */
  static async getUserChatHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_chat_history', {
          p_user_id: userId,
          p_limit: limit,
          p_offset: offset
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user chat history:', error);
      return [];
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getConversationMessages(
    conversationId: string
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    }
  }

  /**
   * Store intent analysis with session context
   */
  static async storeIntentAnalysis(
    message: string,
    intent: any,
    sessionId?: string,
    conversationId?: string,
    userId?: string
  ): Promise<void> {
    try {
      const client = supabaseAdmin || supabase;
      
      const { error } = await client
        .from('intent_analysis')
        .insert({
          user_id: userId,
          session_id: sessionId,
          conversation_id: conversationId,
          message,
          detected_action: intent.action,
          component_types: intent.componentTypes,
          keywords: intent.keywords,
          tutorial_requests: intent.tutorialRequests,
          is_question: intent.isQuestion,
          needs_guidance: intent.needsGuidance,
          confidence: intent.confidence,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing intent analysis:', error);
    }
  }

  /**
   * Cleanup expired sessions (called by cron job)
   */
  static async cleanupExpiredSessions(
    hoursInactive: number = 24
  ): Promise<number> {
    try {
      const client = supabaseAdmin || supabase;
      
      const { data, error } = await client
        .rpc('cleanup_expired_sessions', {
          p_hours_inactive: hoursInactive
        });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get or create session for a widget
   */
  static async getOrCreateSession(
    widgetSessionId: string,
    userId?: string,
    metadata?: any
  ): Promise<{ session: ChatSession | null; conversation: ChatConversation | null }> {
    try {
      // First check if session exists
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('widget_session_id', widgetSessionId)
        .single();

      let session = existingSession;

      // Create new session if doesn't exist
      if (!session) {
        session = await this.createSession(userId || null, widgetSessionId, metadata);
      }

      // Get active conversation
      const conversation = await this.getActiveConversation(widgetSessionId);

      return { session, conversation };
    } catch (error) {
      console.error('Error in getOrCreateSession:', error);
      return { session: null, conversation: null };
    }
  }

  /**
   * Check if user has access to a conversation
   */
  static async userHasAccessToConversation(
    userId: string,
    conversationId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, user_id, session_id')
        .eq('id', conversationId)
        .single();

      if (error || !data) return false;

      // Check if user owns the conversation
      if (data.user_id === userId) return true;

      // Check if it's an anonymous session
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('is_anonymous')
        .eq('id', data.session_id)
        .single();

      return session?.is_anonymous || false;
    } catch (error) {
      console.error('Error checking conversation access:', error);
      return false;
    }
  }
}