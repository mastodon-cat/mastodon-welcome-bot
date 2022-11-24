import { Event } from "@netlify/functions/dist/function/event";

export class ErrorHelper {
  public static HandleError(errorMessage: string,
    obj?: Event | NodeJS.ProcessEnv | string): void {
    console.error(errorMessage, obj);
    throw errorMessage;
  }
}