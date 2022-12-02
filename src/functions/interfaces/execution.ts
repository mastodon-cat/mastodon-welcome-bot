import { ObjectId } from "mongodb";
import { ErrorHelper } from "../helpers/error-helper";

export enum ExecutionStatus {
  Running = "Running",
  Iddle = "Iddle"
}

export interface IExecution {
  _id: ObjectId;
  status: ExecutionStatus;
  lastSignUpNotificationId: number;
  welcomeMessage: string;
  mastodonApiToken: string;
  mastodonInstanceName: string;
}
export class Execution implements IExecution {

  // Trying to deserialie a JSON or an HTTP call into Execution would fail 
  // with an "is not a function method" because there's a function in the class
  // so instead, we deserialize into IExecution and then "transform" it into Execution
  constructor(execution: IExecution) {
    this._id = execution._id;
    this.status = execution.status;
    this.lastSignUpNotificationId = execution.lastSignUpNotificationId;
    this.welcomeMessage = execution.welcomeMessage;
    this.mastodonApiToken = execution.mastodonApiToken;
    this.mastodonInstanceName = execution.mastodonInstanceName;
  }

  public _id: ObjectId;
  public status: ExecutionStatus;
  public lastSignUpNotificationId: number;
  public welcomeMessage: string;
  public mastodonApiToken: string;
  public mastodonInstanceName: string;

  public AssertMastodonVariables(): void {
    if (!this.welcomeMessage || !this.mastodonInstanceName || !this.mastodonApiToken) {
      ErrorHelper.HandleError("Some Mastodon variables are missing. Check that you have message, token and instance_name:", this);
    }
  }
}
