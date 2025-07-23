import { BaseAgent, AgentTask, AgentMessage } from './BaseAgent';
import { BackendEngineerAgent } from './BackendEngineerAgent';
import { FrontendEngineerAgent } from './FrontendEngineerAgent';
import { DebuggerAgent } from './DebuggerAgent';
import { SolutionsArchitectAgent } from './SolutionsArchitectAgent';

interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  tasks: AgentTask[];
  status: 'planning' | 'active' | 'completed';
}

interface KanbanColumn {
  name: string;
  tasks: AgentTask[];
}

export class ManagerAgent extends BaseAgent {
  private agents: Map<string, BaseAgent> = new Map();
  private sprints: Sprint[] = [];
  private currentSprint: Sprint | null = null;
  private kanbanBoard: KanbanColumn[] = [
    { name: 'Backlog', tasks: [] },
    { name: 'To Do', tasks: [] },
    { name: 'In Progress', tasks: [] },
    { name: 'Review', tasks: [] },
    { name: 'Done', tasks: [] }
  ];

  constructor() {
    super('Manager', 'Project Management & Coordination');
    this.initializeTeam();
  }

  getCapabilities(): string[] {
    return [
      'task_assignment',
      'sprint_planning',
      'team_coordination',
      'progress_tracking',
      'resource_allocation',
      'priority_management'
    ];
  }

  private initializeTeam(): void {
    // Create and register agents
    const backend = new BackendEngineerAgent();
    const frontend = new FrontendEngineerAgent();
    const debugger = new DebuggerAgent();
    const architect = new SolutionsArchitectAgent();

    // Set this manager as their manager
    [backend, frontend, debugger, architect].forEach(agent => {
      agent.setManager(this);
      this.agents.set(agent['name'], agent);
    });
  }

  async processTask(task: AgentTask): Promise<any> {
    this.startTask(task.id);

    try {
      switch (task.type) {
        case 'implement':
          return await this.coordinateImplementation(task);
        case 'debug':
          return await this.coordinateDebugging(task);
        case 'optimize':
          return await this.coordinateOptimization(task);
        default:
          return await this.generalCoordination(task);
      }
    } catch (error) {
      this.failTask(task.id, error.message);
      throw error;
    }
  }

  private async coordinateImplementation(task: AgentTask): Promise<any> {
    // Break down the task
    const subtasks: AgentTask[] = [
      {
        id: `${task.id}-design`,
        type: 'design',
        priority: task.priority,
        status: 'pending',
        description: `Design architecture for ${task.description}`
      },
      {
        id: `${task.id}-backend`,
        type: 'implement',
        priority: task.priority,
        status: 'pending',
        description: `Implement backend for ${task.description}`
      },
      {
        id: `${task.id}-frontend`,
        type: 'implement',
        priority: task.priority,
        status: 'pending',
        description: `Implement UI for ${task.description}`
      },
      {
        id: `${task.id}-test`,
        type: 'debug',
        priority: task.priority,
        status: 'pending',
        description: `Test and debug ${task.description}`
      }
    ];

    // Assign tasks to appropriate agents
    const assignments = {
      [subtasks[0].id]: 'SolutionsArchitect',
      [subtasks[1].id]: 'BackendEngineer',
      [subtasks[2].id]: 'FrontendEngineer',
      [subtasks[3].id]: 'Debugger'
    };

    // Execute tasks in sequence
    const results: any[] = [];
    for (const subtask of subtasks) {
      const agentName = assignments[subtask.id];
      const agent = this.agents.get(agentName);
      
      if (agent) {
        agent.assignTask(subtask);
        const result = await agent.processTask(subtask);
        results.push({ agent: agentName, result });
        
        // Update kanban board
        this.moveTaskToColumn(subtask, 'Done');
      }
    }

    const summary = {
      mainTask: task.description,
      subtasks: subtasks.length,
      results,
      duration: Date.now() - (task.startedAt?.getTime() || Date.now()),
      status: 'completed'
    };

    this.completeTask(task.id, summary);
    return summary;
  }

  private async coordinateDebugging(task: AgentTask): Promise<any> {
    // First, get error analysis from debugger
    const debugger = this.agents.get('Debugger') as DebuggerAgent;
    debugger.assignTask(task);
    const analysis = await debugger.processTask(task);

    // Based on the analysis, assign fix tasks
    const fixTasks: AgentTask[] = [];
    
    if (analysis.rootCause?.includes('Backend')) {
      fixTasks.push({
        id: `${task.id}-backend-fix`,
        type: 'implement',
        priority: 'high',
        status: 'pending',
        description: `Fix backend issue: ${analysis.rootCause}`
      });
    }

    if (analysis.rootCause?.includes('Frontend')) {
      fixTasks.push({
        id: `${task.id}-frontend-fix`,
        type: 'implement',
        priority: 'high',
        status: 'pending',
        description: `Fix frontend issue: ${analysis.rootCause}`
      });
    }

    // Execute fixes
    const fixes: any[] = [];
    for (const fixTask of fixTasks) {
      const agent = fixTask.description.includes('backend') 
        ? this.agents.get('BackendEngineer')
        : this.agents.get('FrontendEngineer');
      
      if (agent) {
        agent.assignTask(fixTask);
        const result = await agent.processTask(fixTask);
        fixes.push(result);
      }
    }

    const summary = {
      debugAnalysis: analysis,
      fixes,
      resolved: true,
      preventionMeasures: analysis.preventionSteps
    };

    this.completeTask(task.id, summary);
    return summary;
  }

  private async coordinateOptimization(task: AgentTask): Promise<any> {
    // Get architectural review first
    const architect = this.agents.get('SolutionsArchitect') as SolutionsArchitectAgent;
    const reviewTask: AgentTask = {
      id: `${task.id}-review`,
      type: 'research',
      priority: task.priority,
      status: 'pending',
      description: 'Review current architecture for optimization opportunities'
    };
    
    architect.assignTask(reviewTask);
    const review = await architect.processTask(reviewTask);

    // Implement optimizations based on review
    const optimizationTasks: AgentTask[] = review.recommendations
      .filter(rec => rec.impact === 'High')
      .map((rec, i) => ({
        id: `${task.id}-opt-${i}`,
        type: 'optimize',
        priority: 'high',
        status: 'pending',
        description: rec.suggestion
      }));

    // Assign and execute optimizations
    const results: any[] = [];
    for (const optTask of optimizationTasks) {
      const agent = optTask.description.includes('backend') || optTask.description.includes('API')
        ? this.agents.get('BackendEngineer')
        : this.agents.get('FrontendEngineer');
      
      if (agent) {
        agent.assignTask(optTask);
        const result = await agent.processTask(optTask);
        results.push(result);
      }
    }

    const summary = {
      review,
      optimizations: results,
      improvements: 'Significant performance improvements achieved',
      nextSteps: review.proposedChanges.immediate
    };

    this.completeTask(task.id, summary);
    return summary;
  }

  private async generalCoordination(task: AgentTask): Promise<any> {
    // Default coordination logic
    const team = Array.from(this.agents.values());
    const capabilities = team.flatMap(agent => agent.getCapabilities());
    
    const result = {
      task: task.description,
      teamSize: team.length,
      capabilities,
      coordination: 'Task distributed to appropriate team members',
      status: 'completed'
    };

    this.completeTask(task.id, result);
    return result;
  }

  // Sprint management
  createSprint(name: string, duration: number = 14): Sprint {
    const sprint: Sprint = {
      id: Date.now().toString(),
      name,
      startDate: new Date(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
      tasks: [],
      status: 'planning'
    };

    this.sprints.push(sprint);
    return sprint;
  }

  startSprint(sprintId: string): void {
    const sprint = this.sprints.find(s => s.id === sprintId);
    if (sprint) {
      sprint.status = 'active';
      this.currentSprint = sprint;
      
      // Move tasks from backlog to todo
      sprint.tasks.forEach(task => {
        this.moveTaskToColumn(task, 'To Do');
      });
    }
  }

  // Kanban board management
  moveTaskToColumn(task: AgentTask, columnName: string): void {
    // Remove from all columns
    this.kanbanBoard.forEach(column => {
      column.tasks = column.tasks.filter(t => t.id !== task.id);
    });

    // Add to target column
    const targetColumn = this.kanbanBoard.find(col => col.name === columnName);
    if (targetColumn) {
      targetColumn.tasks.push(task);
    }
  }

  getTeamStatus(): any {
    const teamStatus = Array.from(this.agents.entries()).map(([name, agent]) => ({
      name,
      ...agent.getStatus()
    }));

    return {
      team: teamStatus,
      currentSprint: this.currentSprint,
      kanbanBoard: this.kanbanBoard.map(col => ({
        name: col.name,
        taskCount: col.tasks.length
      })),
      performance: {
        tasksCompleted: this.tasks.filter(t => t.status === 'completed').length,
        tasksFailed: this.tasks.filter(t => t.status === 'failed').length,
        averageCompletionTime: this.calculateAverageCompletionTime()
      }
    };
  }

  private calculateAverageCompletionTime(): number {
    const completedTasks = this.tasks.filter(t => 
      t.status === 'completed' && t.startedAt && t.completedAt
    );

    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      const duration = task.completedAt!.getTime() - task.startedAt!.getTime();
      return sum + duration;
    }, 0);

    return Math.round(totalTime / completedTasks.length / 1000); // in seconds
  }

  // Handle messages from agents
  receiveMessage(message: AgentMessage): void {
    console.log(`[Manager] Received message from ${message.from}:`, message);
    
    // Handle different message types
    if (message.type === 'status') {
      const { event, data } = message.content;
      
      switch (event) {
        case 'task_completed':
          this.moveTaskToColumn(data, 'Done');
          break;
        case 'task_failed':
          // Reassign or escalate
          this.handleTaskFailure(data);
          break;
        case 'task_started':
          this.moveTaskToColumn(data, 'In Progress');
          break;
      }
    } else if (message.type === 'collaboration') {
      // Handle alerts and collaboration requests
      if (message.content.alert) {
        this.handleAlert(message.content);
      }
    }
  }

  private handleTaskFailure(task: AgentTask): void {
    // Create a debug task
    const debugTask: AgentTask = {
      id: `debug-${task.id}`,
      type: 'debug',
      priority: 'high',
      status: 'pending',
      description: `Debug failed task: ${task.description} - Error: ${task.error}`
    };

    // Assign to debugger
    const debugger = this.agents.get('Debugger');
    if (debugger) {
      debugger.assignTask(debugTask);
      debugger.processTask(debugTask);
    }
  }

  private handleAlert(alert: any): void {
    console.log(`[Manager] ALERT: ${alert.alert}`);
    
    // Take appropriate action based on alert type
    if (alert.alert.includes('Performance degradation')) {
      // Create optimization task
      const optTask: AgentTask = {
        id: `opt-${Date.now()}`,
        type: 'optimize',
        priority: 'high',
        status: 'pending',
        description: `Optimize ${alert.endpoint} - Current response time: ${alert.avgResponseTime}ms`
      };
      
      this.processTask(optTask);
    }
  }
}