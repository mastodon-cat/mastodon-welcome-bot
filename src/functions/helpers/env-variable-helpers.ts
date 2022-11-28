import { ErrorHelper } from "./error-helper";

export class EnvVariableHelpers {
  public static AssertMastodonEnvVariablesArePresent(): void {
    if (!process.env.message || !process.env.instance_name || !process.env.token) {
      ErrorHelper.HandleError("Some environment variables are missing. Check that you have message, token and instance_name:", process.env);
    }
  }

  public static AssertMongoEnvVariablesArePresent(): void {
    if (!process.env.mongo_connectionstring || !process.env.mongo_dbname || !process.env.mongo_collection) {
      ErrorHelper.HandleError("Mongo Connection Variables are not correct:", process.env);
    }
  }

  public static GetEnvironmentVariable(environmentVariableName: string): string {
    // It should never be undefined because we're calling AssertEnvVariablesArePresent
    // at the beginning of . 
    // Just fooling Typescript here with the fallback
    return process.env[environmentVariableName] || "";
  }
}