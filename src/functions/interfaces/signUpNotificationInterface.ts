import { Account } from "./accountInterface";

export interface SignUpNotification {
  id: number;
  type: string;
  created_at: Date;
  account: Account;
}
