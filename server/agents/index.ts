export { BaseAgent, AgentTask, AgentMessage } from './BaseAgent';
export { BackendEngineerAgent } from './BackendEngineerAgent';
export { FrontendEngineerAgent } from './FrontendEngineerAgent';
export { DebuggerAgent } from './DebuggerAgent';
export { SolutionsArchitectAgent } from './SolutionsArchitectAgent';
export { ManagerAgent } from './ManagerAgent';

// Agent factory for easy instantiation
export class AgentFactory {
  static createManager(): ManagerAgent {
    return new ManagerAgent();
  }

  static createTeam(): {
    manager: ManagerAgent;
    backend: BackendEngineerAgent;
    frontend: FrontendEngineerAgent;
    debugger: DebuggerAgent;
    architect: SolutionsArchitectAgent;
  } {
    const manager = new ManagerAgent();
    const backend = new BackendEngineerAgent();
    const frontend = new FrontendEngineerAgent();
    const debugger = new DebuggerAgent();
    const architect = new SolutionsArchitectAgent();

    // Set manager for all agents
    [backend, frontend, debugger, architect].forEach(agent => {
      agent.setManager(manager);
    });

    return { manager, backend, frontend, debugger, architect };
  }
}