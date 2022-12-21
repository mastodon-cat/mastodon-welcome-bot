import { Collection, Db, MongoClient, ObjectId, UpdateResult } from "mongodb";
import { Execution, ExecutionStatus, IExecution } from "../interfaces/execution";
import { EnvVariableHelpers } from "./env-variable-helpers";
import { ErrorHelper } from "./error-helper";

export class MongoCollectionHandler {
    private client!: MongoClient;
    private db!: Db;
    private collection!: Collection;

    constructor() {
        EnvVariableHelpers.AssertMongoEnvVariablesArePresent();
    }

    public async getExecution(): Promise<Execution> {
        await this.initializeCollection();
        const execution: IExecution = await this.collection.findOne<IExecution>({}) || {} as Execution;
        if (!execution?._id) {
            ErrorHelper.HandleError("Could not retrieve execution, for it is an empty object.");
        }
        return new Execution(execution);
    }

    public async updateExecutionStatus(id: ObjectId, status: ExecutionStatus): Promise<void> {
        await this.initializeCollection();

        let statusUpdated: UpdateResult = await this.collection.updateOne({ _id: id }, { $set: { status: status } });
        if (statusUpdated.modifiedCount !== 1) {
            ErrorHelper.HandleError(`Could not modify execution's status to ${status}.`);
        } else {
            console.log(`Execution status set to ${status}.`);
        }
    }

    public async updateExecution(execution: Execution): Promise<void> {
        await this.initializeCollection();

        let statusUpdated: UpdateResult = await this.collection.updateOne({ _id: execution._id },
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

    private async initializeCollection(): Promise<void> {
        if (!this.client || !this.db || !this.collection) {
            const connectionString: string = EnvVariableHelpers.GetEnvironmentVariable("mongo_connectionstring");
            this.client = new MongoClient(connectionString, {});

            await this.client.connect();
            const dbName: string = EnvVariableHelpers.GetEnvironmentVariable("mongo_dbname");
            await this.client.db(dbName).command({ ping: 1 });

            this.db = this.client.db(dbName);
            const collectionName: string = EnvVariableHelpers.GetEnvironmentVariable("mongo_collection");
            this.collection = this.db.collection(collectionName);
        }
    }
}
