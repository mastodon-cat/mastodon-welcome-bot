import { ObjectId } from "mongodb";

export enum ExecutionStatus {
  Running = "Running",
  Iddle = "Iddle"
}

export interface Execution {
  _id: ObjectId;
  status: ExecutionStatus;
  lastSignUpNotificationId: number;
}
