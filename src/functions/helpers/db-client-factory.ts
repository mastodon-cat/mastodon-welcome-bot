import { IDbClient } from "../interfaces/IDbClient";
import { EnvVariableHelpers } from "./env-variable-helpers";
import { ErrorHelper } from "./error-helper";
import { MongoCollectionHandler } from "./mongo-client";
import { PostgresClient } from "./postgres-client";

export class DbClientFacotry {
  public static async getClient(): Promise<IDbClient> {
    EnvVariableHelpers.AssertDbEnvVariablesArePresent();
    const connectionString: string = EnvVariableHelpers.GetEnvironmentVariable("connectionstring").toLowerCase();
    if (connectionString === "") {
      ErrorHelper.HandleError("Connection string is empty");
    }

    let result: IDbClient;
    if (connectionString.startsWith("postgres://")) {
      result = new PostgresClient();
    } else if (connectionString.startsWith("mongodb://") || connectionString.startsWith("mongodb+srv://")) {
      result = new MongoCollectionHandler();
    }
    else {
      ErrorHelper.HandleError("Connection string is not valid", connectionString);
    }

    await result!.initializeClient();
    return result!;
  }
}
