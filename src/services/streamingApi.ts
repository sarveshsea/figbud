import { ChatMessage } from '../types';
import { performanceMonitor } from './performanceMonitor';

interface StreamEvent {
  event: string;
  data: any;
}

interface StreamCallbacks {
  onConnect?: () => void;
  onStatus?: (status: { status: string; message?: string }) => void;
  onAIResponse?: (response: { text: string; metadata?: any }) => void;
  onTutorials?: (data: { tutorials: any[]; count: number }) => void;
  onComplete?: (data: { conversationId: string; totalDuration?: number }) => void;
  onError?: (error: any) => void;
  onBackendProcess?: (process: any) => void;
  onModelStatus?: (data: { models: Array<{ name: string; status: string }> }) => void;
  onPerformanceSummary?: (data: any) => void;
  onAgentStatus?: (data: { agents: Array<{ name: string; status: string; task: string }> }) => void;
}

export class StreamingAPIService {
  private baseUrl: string;
  private apiKeys: Record<string, string>;

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
    this.apiKeys = {};
  }

  setApiKeys(keys: Record<string, string>) {
    this.apiKeys = keys;
  }

  async streamChat(
    message: string, 
    context: any,
    conversationId: string | null | undefined,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const perfId = performanceMonitor.startAPICall('chat/stream');
    
    return new Promise((resolve, reject) => {
      try {
        // Prepare headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add API keys to headers
        if (this.apiKeys.firecrawl) headers['X-Firecrawl-Key'] = this.apiKeys.firecrawl;
        if (this.apiKeys.deepseek) headers['X-DeepSeek-Key'] = this.apiKeys.deepseek;
        if (this.apiKeys.openrouter) headers['X-OpenRouter-Key'] = this.apiKeys.openrouter;
        if (this.apiKeys.youtube) headers['X-YouTube-Key'] = this.apiKeys.youtube;
        
        // Create request body
        const body = JSON.stringify({
          message,
          context,
          conversationId
        });
        
        // Make the request to optimized endpoint
        fetch(`${this.baseUrl}/chat/stream/optimized`, {
          method: 'POST',
          headers,
          body
        }).then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }
          
          const decoder = new TextDecoder();
          let buffer = '';
          
          const processChunk = async (): Promise<void> => {
            try {
              const { done, value } = await reader.read();
              
              if (done) {
                performanceMonitor.endAPICall(perfId, true);
                resolve();
                return;
              }
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                if (line.startsWith('event:')) {
                  const eventMatch = line.match(/event:\s*(.+)/);
                  const dataLine = lines[lines.indexOf(line) + 1];
                  
                  if (eventMatch && eventMatch[1] && dataLine?.startsWith('data:')) {
                    const event = eventMatch[1];
                    const dataMatch = dataLine.match(/data:\s*(.+)/);
                    
                    if (dataMatch && dataMatch[1]) {
                      try {
                        const data = JSON.parse(dataMatch[1]);
                        console.log(`[StreamingAPI] Received event: ${event}`, data);
                        this.handleEvent(event, data, callbacks);
                      } catch (e) {
                        console.error('Failed to parse SSE data:', e);
                      }
                    }
                  }
                }
              }
              
              // Continue reading
              await processChunk();
            } catch (error) {
              performanceMonitor.endAPICall(perfId, false);
              callbacks.onError?.(error);
              reject(error);
            }
          };
          
          processChunk();
        }).catch(error => {
          callbacks.onError?.(error);
          reject(error);
        });
        
      } catch (error) {
        callbacks.onError?.(error);
        reject(error);
      }
    });
  }

  private handleEvent(event: string, data: any, callbacks: StreamCallbacks) {
    switch (event) {
      case 'connected':
        callbacks.onConnect?.();
        break;
      case 'status':
        callbacks.onStatus?.(data);
        break;
      case 'ai_response':
        callbacks.onAIResponse?.(data);
        break;
      case 'tutorials':
        callbacks.onTutorials?.(data);
        break;
      case 'complete':
        callbacks.onComplete?.(data);
        break;
      case 'error':
        callbacks.onError?.(data);
        break;
      case 'backend_process':
        callbacks.onBackendProcess?.(data);
        break;
      case 'model_status':
        callbacks.onModelStatus?.(data);
        break;
      case 'performance_summary':
        callbacks.onPerformanceSummary?.(data);
        break;
      case 'agent_status':
        callbacks.onAgentStatus?.(data);
        break;
      default:
        console.log('Unknown SSE event:', event, data);
    }
  }

  // Fallback to regular API if streaming fails
  async fallbackChat(
    message: string,
    context: any,
    conversationId: string | null | undefined
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add API keys to headers
    if (this.apiKeys.openai) headers['X-OpenAI-Key'] = this.apiKeys.openai;
    if (this.apiKeys.anthropic) headers['X-Anthropic-Key'] = this.apiKeys.anthropic;
    if (this.apiKeys.deepseek) headers['X-DeepSeek-Key'] = this.apiKeys.deepseek;
    if (this.apiKeys.openrouter) headers['X-OpenRouter-Key'] = this.apiKeys.openrouter;
    
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        context,
        conversationId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
}

// Export singleton instance
export const streamingAPI = new StreamingAPIService();