import { ErrorHelper } from "./error-helper";

export class EnvVariableHelpers {
  public static AssertEnvVariablesArePresent(): void {
    if (!process.env.message || !process.env.instance_name || !process.env.token) {
      ErrorHelper.HandleError("Some environment variables are missing. Check that you have message, token and instance_name:", process.env);
    }
  }

  public static GetEnvironmentVariable(environmentVariableName: string): string {
    // It should never be undefined because we're calling AssertEnvVariablesArePresent
    // at the beginning of . 
    // Just fooling Typescript here with the fallback
    return process.env[environmentVariableName] || "";
  }
}