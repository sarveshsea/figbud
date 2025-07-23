// Base Agent Class - Foundation for all specialized agents
export interface AgentTask {
  id: string;
  type: 'research' | 'implement' | 'debug' | 'optimize' | 'design';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description: string;
  assignedTo?: string;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface AgentMessage {
  from: string;
  to: string;
  type: 'task' | 'status' | 'result' | 'error' | 'collaboration';
  content: any;
  timestamp: Date;
}

export abstract class BaseAgent {
  protected name: string;
  protected role: string;
  protected tasks: AgentTask[] = [];
  protected messageHandlers: Map<string, (message: AgentMessage) => void> = new Map();
  protected manager?: BaseAgent;

  constructor(name: string, role: string) {
    this.name = name;
    this.role = role;
  }

  // Core agent capabilities
  abstract processTask(task: AgentTask): Promise<any>;
  abstract getCapabilities(): string[];

  // Task management
  assignTask(task: AgentTask): void {
    task.assignedTo = this.name;
    task.status = 'pending';
    this.tasks.push(task);
    this.notifyManager('task_assigned', task);
  }

  startTask(taskId: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'in_progress';
      task.startedAt = new Date();
      this.notifyManager('task_started', task);
    }
  }

  completeTask(taskId: string, result: any): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      this.notifyManager('task_completed', task);
    }
  }

  failTask(taskId: string, error: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'failed';
      task.error = error;
      this.notifyManager('task_failed', task);
    }
  }

  // Communication
  sendMessage(to: string, type: AgentMessage['type'], content: any): void {
    const message: AgentMessage = {
      from: this.name,
      to,
      type,
      content,
      timestamp: new Date()
    };
    // In real implementation, this would use an event bus or message queue
    console.log(`[${this.name}] Sending message to ${to}:`, message);
  }

  receiveMessage(message: AgentMessage): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  // Manager notification
  protected notifyManager(event: string, data: any): void {
    if (this.manager) {
      this.sendMessage(this.manager.name, 'status', { event, data });
    }
  }

  // Status reporting
  getStatus(): {
    name: string;
    role: string;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
  } {
    return {
      name: this.name,
      role: this.role,
      activeTasks: this.tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: this.tasks.filter(t => t.status === 'completed').length,
      failedTasks: this.tasks.filter(t => t.status === 'failed').length
    };
  }

  setManager(manager: BaseAgent): void {
    this.manager = manager;
  }
}