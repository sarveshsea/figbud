import React, { useState, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { MinimizedBud } from './components/MinimizedBud';
import { ComponentLibraryView } from './components/ComponentLibraryView';
import { ComponentBuilder } from './components/ComponentBuilder';
import { BackendStatus, BackendProcess } from './components/BackendStatus';
import { MinimalProcessView } from './components/MinimalProcessView';
import { ConsoleErrorView } from './components/ConsoleErrorView';
import { ChatMessage } from './types';
import { DesignSystemManager, DesignSystemComponent } from './services/designSystemManager';
import { ComponentDatabase } from './services/componentDatabase';
import { streamingAPI } from './services/streamingApi';
import { consoleErrorTracker } from './services/consoleErrorTracker';

export const App: React.FC = () => {
  // Initialize console error tracking
  useEffect(() => {
    // Track errors in console
    consoleErrorTracker.onError((error) => {
      console.log('[ConsoleErrorTracker] Error captured:', error.message);
    });
  }, []);

  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendProcesses, setBackendProcesses] = useState<BackendProcess[]>([]);
  const [agents, setAgents] = useState<Array<{ name: string; status: string; task: string }>>([]);
  const [showBackendStatus, setShowBackendStatus] = useState(true);
  const [showConsoleErrors, setShowConsoleErrors] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<DesignSystemComponent | null>(null);

  useEffect(() => {
    // Keyboard shortcut for console errors (Ctrl/Cmd + E)
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setShowConsoleErrors(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeydown);

    // Listen for initial state from plugin
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      switch (msg.type) {
        case 'init-state':
          setIsMinimized(msg.isMinimized);
          break;
        case 'bot-response':
          handleBotResponse(msg);
          setLoading(false);
          break;
        case 'show-component-library':
          setShowComponentLibrary(true);
          break;
        case 'component-created':
          handleComponentCreated(msg);
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Add temporary loading message
      const loadingMessage: ChatMessage = {
        id: `loading-${Date.now()}`,
        type: 'assistant',
        content: 'FigBud is thinking...',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, loadingMessage]);

      // Clear previous backend processes
      setBackendProcesses([]);
      setShowBackendStatus(true);
      
      // Add initial process
      const initialProcess: BackendProcess = {
        id: 'connection',
        name: 'Connecting to Backend',
        status: 'active',
        message: 'Establishing connection to FigBud server...'
      };
      setBackendProcesses([initialProcess]);
      
      // Check if backend is running
      try {
        const healthResponse = await fetch('http://localhost:3000/api/health');
        if (!healthResponse.ok) {
          throw new Error('Backend server is not responding');
        }
        
        // Update connection process
        setBackendProcesses(prev => prev.map(p => 
          p.id === 'connection' 
            ? { ...p, status: 'completed', message: 'Connected to backend' }
            : p
        ));
      } catch (healthError) {
        console.error('Backend health check failed:', healthError);
        
        // Update with error
        const errorMessage = `
❌ Backend server is not running!

Please start the backend server:
1. Open a new terminal
2. Navigate to the FigBud directory
3. Run: ./start-server.sh

Or use: npm run server
        `.trim();
        
        const errorBotMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: errorMessage,
          timestamp: new Date()
        };
        
        setMessages(prev => 
          prev.filter(msg => msg.id !== loadingMessage.id).concat(errorBotMessage)
        );
        setLoading(false);
        setBackendProcesses(prev => prev.map(p => 
          p.id === 'connection' 
            ? { ...p, status: 'failed', message: 'Failed to connect to backend server' }
            : p
        ));
        return;
      }
      
      // Use enhanced streaming API
      await streamingAPI.streamChat(
        content,
        {
          timestamp: new Date().toISOString(),
          source: 'figma-plugin',
          userLevel: 'intermediate'
        },
        null, // conversationId
        {
          onStatus: (status) => {
            // Update loading message with status
            setMessages(prev => 
              prev.map(msg => 
                msg.id === loadingMessage.id 
                  ? { ...msg, content: status.message || 'Processing...' }
                  : msg
              )
            );
          },
          onAIResponse: (response) => {
            const aiResponse = response.metadata || {};
            
            // Replace loading message with actual response
            const botMessage: ChatMessage = {
              id: Date.now().toString(),
              type: 'assistant',
              content: response.text,
              timestamp: new Date(),
              metadata: {
                ...response.metadata,
                componentType: aiResponse.componentType,
                properties: aiResponse.properties,
                teacherNote: aiResponse.teacherNote,
                stepByStep: aiResponse.stepByStep
              },
              suggestions: aiResponse.suggestions
            };

            setMessages(prev => 
              prev.map(msg => 
                msg.id === loadingMessage.id ? botMessage : msg
              )
            );
            
            // Store the response for component creation
            if (aiResponse.componentType && aiResponse.properties) {
              setTimeout(() => {
                parent.postMessage({
                  pluginMessage: {
                    type: 'create-component',
                    payload: {
                      type: aiResponse.componentType,
                      properties: aiResponse.properties,
                      metadata: {
                        teacherNote: aiResponse.teacherNote,
                        originalPrompt: content
                      }
                    }
                  }
                }, '*');
              }, 100);
            }
          },
          onTutorials: (data) => {
            console.log('[App] Received tutorials:', data);
            // Update the last assistant message with tutorials
            setMessages(prev => {
              // Find the last assistant message
              let lastAssistantIndex = -1;
              for (let i = prev.length - 1; i >= 0; i--) {
                const msg = prev[i];
                if (msg && msg.type === 'assistant') {
                  lastAssistantIndex = i;
                  break;
                }
              }
              
              if (lastAssistantIndex >= 0) {
                const updated = [...prev];
                const lastMessage = prev[lastAssistantIndex];
                if (lastMessage) {
                  updated[lastAssistantIndex] = {
                    ...lastMessage,
                    metadata: {
                      ...lastMessage.metadata,
                      tutorials: data.tutorials
                    }
                  };
                  console.log('[App] Updated message with tutorials:', updated[lastAssistantIndex]);
                }
                return updated;
              }
              return prev;
            });
          },
          onError: (error) => {
            console.error('Streaming error:', error);
            // Remove loading message and show error
            setMessages(prev => 
              prev.filter(msg => msg.id !== loadingMessage.id)
            );
            // Fall back to regular API
            throw error;
          },
          onComplete: (data) => {
            setLoading(false);
            // Update final process status
            setBackendProcesses(prev => prev.map(p => 
              p.status === 'active' ? { ...p, status: 'completed' } : p
            ));
            // Hide backend status after 3 seconds
            setTimeout(() => setShowBackendStatus(false), 3000);
          },
          onBackendProcess: (process) => {
            setBackendProcesses(prev => {
              const existing = prev.find(p => p.id === process.id);
              if (existing) {
                return prev.map(p => p.id === process.id ? process : p);
              }
              return [...prev, process];
            });
          },
          onAgentStatus: (data) => {
            setAgents(data.agents || []);
          },
          onModelStatus: (data) => {
            // Add model status to backend processes
            const modelProcess: BackendProcess = {
              id: 'model-selection',
              name: 'Model Selection',
              status: 'active',
              message: `Trying ${data.models.filter(m => m.status === 'querying').length} models in parallel...`,
              details: {
                model: data.models.find(m => m.status === 'success')?.name
              }
            };
            setBackendProcesses(prev => {
              const existing = prev.find(p => p.id === 'model-selection');
              if (existing) {
                return prev.map(p => p.id === 'model-selection' ? modelProcess : p);
              }
              return [...prev, modelProcess];
            });
          },
          onPerformanceSummary: (data) => {
            console.log('Performance Summary:', data);
          }
        }
      );
    } catch (error) {
      console.error('Error calling API:', error);
      setLoading(false);
      
      // Fallback to plugin-based processing
      parent.postMessage({
        pluginMessage: {
          type: 'chat-message',
          message: content
        }
      }, '*');
    }
  };

  const handleBotResponse = (msg: any) => {
    console.log('[App] Received bot response:', {
      hasMessage: !!msg.message,
      hasPayload: !!msg.payload,
      hasText: !!msg.text,
      messagePreview: msg.message?.substring(0, 100),
      fullMsg: msg
    });
    
    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: msg.message || msg.payload || msg.text || 'I received your message but the response was empty.',
      timestamp: new Date(),
      metadata: msg.metadata,
      suggestions: msg.suggestions
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    parent.postMessage({
      pluginMessage: { type: 'minimize' }
    }, '*');
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    parent.postMessage({
      pluginMessage: { type: 'maximize' }
    }, '*');
  };

  const handleResize = (width: number, height: number) => {
    parent.postMessage({
      pluginMessage: {
        type: 'resize',
        width,
        height
      }
    }, '*');
  };

  const handleComponentCreated = (msg: any) => {
    const successMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `✅ Successfully created ${msg.componentName || 'component'} in your design!`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, successMessage]);
  };

  const handleSelectComponent = (component: DesignSystemComponent) => {
    setSelectedComponent(component);
    setShowComponentLibrary(false);
  };

  const handleCreateComponent = async (props: any) => {
    if (!selectedComponent) return;

    // Track usage
    await ComponentDatabase.trackUsage(
      `${selectedComponent.library}-${selectedComponent.type}`,
      props
    );

    // Send to plugin to create in Figma
    parent.postMessage({
      pluginMessage: {
        type: 'create-component',
        componentId: `${selectedComponent.library}-${selectedComponent.type}`,
        props: props,
        componentName: selectedComponent.name
      }
    }, '*');

    // Close builder
    setSelectedComponent(null);
    
    // Add message
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `Creating ${selectedComponent.name}...`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  return (
    <div className="w-full h-full" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Gradient Background Layer - Pure decorative background */}
      <div className="gradient-background">
        <div className="wave-gradient wave-gradient-1"></div>
        <div className="wave-gradient wave-gradient-2"></div>
        <div className="wave-gradient wave-gradient-3"></div>
        {/* Additional gradient layers for mesh effect */}
        <div className="wave-gradient wave-gradient-4"></div>
        <div className="wave-gradient wave-gradient-5"></div>
      </div>
      
      {/* Main Content Layer - Above gradient */}
      <div className="main-content-layer">
        {isMinimized ? (
          <MinimizedBud onClick={handleMaximize} />
        ) : showComponentLibrary ? (
          <ComponentLibraryView
            onSelectComponent={handleSelectComponent}
            onClose={() => setShowComponentLibrary(false)}
          />
        ) : selectedComponent ? (
          <ComponentBuilder
            component={selectedComponent}
            onSave={handleCreateComponent}
            onCancel={() => setSelectedComponent(null)}
          />
        ) : (
          <ChatWindow
            isMinimized={isMinimized}
            messages={messages}
            loading={loading}
            backendProcesses={backendProcesses}
            agents={agents}
            showBackendStatus={showBackendStatus}
            onSendMessage={handleSendMessage}
            onMinimize={handleMinimize}
            onResize={handleResize}
            onShowComponentLibrary={() => setShowComponentLibrary(true)}
          />
        )}
      </div>
      
      {/* Console Error View - Topmost layer */}
      <ConsoleErrorView 
        isVisible={showConsoleErrors}
        onClose={() => setShowConsoleErrors(false)}
      />
    </div>
  );
};