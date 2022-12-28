import { ErrorHelper } from "./error-helper";

export class EnvVariableHelpers {
    public static AssertDbEnvVariablesArePresent(): void {
    if (!process.env.connectionstring || !process.env.dbname || !process.env.table) {
      ErrorHelper.HandleError("Mongo Connection Variables are not correct:", process.env);
    }
  }

  public static GetEnvironmentVariable(environmentVariableName: string): string {
    // It should never be undefined because AssertDbEnvVariablesArePresent
    // should've been previously called
    return process.env[environmentVariableName]!;
  }
}