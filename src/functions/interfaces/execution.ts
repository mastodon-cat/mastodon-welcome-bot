import { ErrorHelper } from "../helpers/error-helper";
import { SignUpNotification } from "./signUpNotificationInterface";

export enum ExecutionStatus {
  Running = "Running",
  Iddle = "Iddle"
}

export interface IExecution {
  id: string;
  status: ExecutionStatus;
  lastSignUpNotificationId: number;
  welcomeMessage: string;
  welcomeMessageVisibility: string;
  mastodonApiToken: string;
  mastodonInstanceName: string;
  enforceRetries: boolean | undefined;
}
export class Execution implements IExecution {

  // Trying to deserialie a JSON or an HTTP call into Execution would fail 
  // with an "is not a function method" because there's a function in the class
  // so instead, we deserialize into IExecution and then "transform" it into Execution
  constructor(execution: IExecution) {
    this.id = execution.id;
    this.status = execution.status;
    this.lastSignUpNotificationId = execution.lastSignUpNotificationId;
    this.welcomeMessage = execution.welcomeMessage;
    this.welcomeMessageVisibility = execution.welcomeMessageVisibility;
    this.mastodonApiToken = execution.mastodonApiToken;
    this.mastodonInstanceName = execution.mastodonInstanceName;
    this.enforceRetries = execution.enforceRetries;
  }

  public id: string;
  public status: ExecutionStatus;
  public lastSignUpNotificationId: number;
  public welcomeMessage: string;
  public welcomeMessageVisibility: string;
  public mastodonApiToken: string;
  public mastodonInstanceName: string;
  public enforceRetries: boolean | undefined;

  public AssertMastodonVariables(): void {
    if (!this.welcomeMessage || !this.mastodonInstanceName || !this.mastodonApiToken) {
      ErrorHelper.HandleError("Some Mastodon variables are missing. Check that you have message, token and instance_name:", this);
    }
  }

  public buildStatusMessage(signUp: SignUpNotification): string {
    let mastodonUserName: string = "";
    try {
      if (!signUp?.account?.username) {
        ErrorHelper.HandleError("There is no username", signUp);
      }

      mastodonUserName = signUp.account.username;
    } catch (error) {
      ErrorHelper.HandleError(`Notification is not valid: ${error}`, signUp);
    }

    return this.welcomeMessage
      .replaceAll("{USERNAME}", `@${mastodonUserName}`);
  }
}
