import { Pool, QueryResult } from "pg";
import { Execution, ExecutionStatus, IExecution } from "../interfaces/execution";
import { IDbClient } from "../interfaces/IDbClient";
import { EnvVariableHelpers } from "./env-variable-helpers";
import { ErrorHelper } from "./error-helper";

// https://node-postgres.com/
// https://github.com/stphnchoe/twitchClips/blob/master/src/lambda/handler.js
export class PostgresClient implements IDbClient {
  private readonly pool: Pool;
  private readonly tableName: string;
  constructor() {
    const parse = require('pg-connection-string').parse;
    const config = parse(process.env.connectionstring);
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
    });
    this.tableName = EnvVariableHelpers.GetEnvironmentVariable("table");
  }

  public async getExecution(): Promise<Execution> {
    try {
      const query = `SELECT * FROM ${this.tableName}`;
      let result = await this.pool.query<IExecution>(query);
      return new Execution(result.rows[0]);
    } catch (err: any) {
      console.log(err.stack);
      throw err;
    }
  }

  public async updateExecutionStatus(id: string, status: ExecutionStatus): Promise<void> {
    const query: string = `UPDATE ${this.tableName} SET status = $1 WHERE id = $2`;
    const queryParamenters: Array<any> = [status, id];
    const statusUpdated: QueryResult<any> = await this.pool.query(query, queryParamenters);
    if (statusUpdated.rowCount !== 1) {
      ErrorHelper.HandleError(`Could not modify execution's status to ${status}.`);
    } else {
      console.log(`Execution status set to ${status}.`);
    }
  }

  public async updateExecution(execution: Execution): Promise<void> {
    const query: string = `UPDATE ${this.tableName} SET status = $1, "lastSignUpNotificationId" = $2 WHERE id = $3`;
    const queryParamenters: Array<any> = [execution.status, execution.lastSignUpNotificationId, execution.id];
    const statusUpdated: QueryResult<any> = await this.pool.query(query, queryParamenters);
    if (statusUpdated.rowCount !== 1) {
      ErrorHelper.HandleError(`Could not modify execution's status to ${execution.status} 
OR lastSignUpNotificationId to '${execution.lastSignUpNotificationId}'.`);
    } else {
      console.log(`Execution status set to ${execution.status} 
AND lastSignUpNotificationId set to '${execution.lastSignUpNotificationId}'.`);
    }
  }

  public initializeClient(): void {
    this.pool.connect((err) => {
      if (err) {
        console.error("Error connecting to DB: ", err);
      } else {
        console.log('Successfully connected to host');
      }
    });
  }

  public dispose(): void {
    this.pool.end();
  }
}
