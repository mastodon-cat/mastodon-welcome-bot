import { Collection, Db, MongoClient, ObjectId, UpdateResult } from "mongodb";
import { Execution, ExecutionStatus, IExecution } from "../interfaces/execution";
import { IDbClient } from "./db-client-factory";
import { EnvVariableHelpers } from "./env-variable-helpers";
import { ErrorHelper } from "./error-helper";

export class MongoCollectionHandler implements IDbClient {
    private client!: MongoClient;
    private db!: Db;
    private collection!: Collection;

    public async getExecution(): Promise<Execution> {
        const execution: IExecution = await this.collection.findOne<IExecution>({}) || {} as Execution;

        if (!(execution as any)?._id) {
            ErrorHelper.HandleError("Could not retrieve execution, for it is an empty object.");
        } else {
            execution.id = ((execution as any)._id as ObjectId).toString();
        }

        if (!execution?.id) {
            ErrorHelper.HandleError("Could not retrieve execution, for it is an empty object.");
        }

        return new Execution(execution);
    }

    public async updateExecutionStatus(id: string, status: ExecutionStatus): Promise<void> {
        const objectId: ObjectId = new ObjectId(id);
        let statusUpdated: UpdateResult = await this.collection.updateOne({ _id: objectId }, { $set: { status: status } });
        if (statusUpdated.modifiedCount !== 1) {
            ErrorHelper.HandleError(`Could not modify execution's status to ${status}.`);
        } else {
            console.log(`Execution status set to ${status}.`);
        }
    }

    public async updateExecution(execution: Execution): Promise<void> {
        const objectId: ObjectId = new ObjectId(execution.id);
        let statusUpdated: UpdateResult = await this.collection.updateOne({ _id: objectId },
            { $set: { status: execution.status, lastSignUpNotificationId: execution.lastSignUpNotificationId } });

        if (statusUpdated.modifiedCount !== 1) {
            ErrorHelper.HandleError(`Could not modify execution's status to ${execution.status} 
OR lastSignUpNotificationId to '${execution.lastSignUpNotificationId}'.`);
        } else {
            console.log(`Execution status set to ${execution.status} 
AND lastSignUpNotificationId set to '${execution.lastSignUpNotificationId}'.`);
        }
    }

    public async dispose(): Promise<void> {
        if (this.client) {
            await this.client.close();
        }
    }

    public async initializeClient(): Promise<void> {
        if (!this.client || !this.db || !this.collection) {
            const connectionString: string = EnvVariableHelpers.GetEnvironmentVariable("connectionstring");
            this.client = new MongoClient(connectionString, {});

            await this.client.connect();
            const dbName: string = EnvVariableHelpers.GetEnvironmentVariable("dbname");
            await this.client.db(dbName).command({ ping: 1 });

            this.db = this.client.db(dbName);
            const collectionName: string = EnvVariableHelpers.GetEnvironmentVariable("table");
            this.collection = this.db.collection(collectionName);
        }
    }
}
