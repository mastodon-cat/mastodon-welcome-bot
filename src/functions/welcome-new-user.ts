import { Handler } from "@netlify/functions";
import { EnvVariableHelpers } from "./helpers/env-variable-helpers";
import { ErrorHelper } from "./helpers/error-helper";
import { MastodonApiClient } from "./helpers/mastodon-api-client";
import { MongoCollectionHandler } from "./helpers/mongo-client-";
import { Execution, ExecutionStatus } from "./interfaces/execution";
import { SignUpNotification } from "./interfaces/signUpNotificationInterface";

const handler: Handler = async () => {
    EnvVariableHelpers.AssertMastodonEnvVariablesArePresent();

    let mongoClient: MongoCollectionHandler = new MongoCollectionHandler();
    const execution: Execution = await mongoClient.getExecution();
    if (execution.status === ExecutionStatus.Iddle) {
        await mongoClient.updateExecutionStatus(execution._id, ExecutionStatus.Running);

        try {
            let signUps: SignUpNotification[] = await MastodonApiClient.getLastSignUps(execution.lastSignUpNotificationId);
            // ORDER by Id ASC
            signUps = signUps.sort((x, y) => x.id - y.id);

            for (const signUp of signUps) {
                const status: string = buildStatusMessage(signUp);
                try {
                    await MastodonApiClient.publishStatus(status);
                } catch (error) {
                    ErrorHelper.HandleError("There was an error publishing the status to mastodon. Check the logs for more detail.", error);
                }
                execution.lastSignUpNotificationId = signUp.id;
            }
        } finally {
            execution.status = ExecutionStatus.Iddle;
            await mongoClient.updateExecution(execution);
        }
    } else {
        console.log("Process is already running.");
    }

    mongoClient.dispose();
    return { statusCode: 200 };
};

export { handler };

function buildStatusMessage(signUp: SignUpNotification): string {
    let mastodonUserName: string = "";
    try {
        if (!signUp?.account?.username) {
            throw "There is no username";
        }

        mastodonUserName = signUp.account.username;
    } catch (error) {
        ErrorHelper.HandleError(`Notification is not valid: ${error}`, signUp);
    }

    const message: string = EnvVariableHelpers.GetEnvironmentVariable("message");
    const status: string = message
        .replace("{USERNAME}", `@${mastodonUserName}`)
        .replaceAll("|", "\n");
    return status;
}
