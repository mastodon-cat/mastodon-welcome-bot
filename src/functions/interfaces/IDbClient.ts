import { Execution, ExecutionStatus } from "./execution";


export interface IDbClient {
  getExecution(): Promise<Execution>;
  updateExecutionStatus(id: string, status: ExecutionStatus): Promise<void>;
  updateExecution(execution: Execution): Promise<void>;
  initializeClient(): void | Promise<void>;
  dispose(): void | Promise<void>;
}
