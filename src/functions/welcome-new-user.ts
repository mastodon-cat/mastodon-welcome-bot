import { Handler } from "@netlify/functions";
import { DbClientFacotry, IDbClient } from "./helpers/db-client-factory";
import { ErrorHelper } from "./helpers/error-helper";
import { MastodonApiClient } from "./helpers/mastodon-api-client";
import { Execution, ExecutionStatus } from "./interfaces/execution";
import { SignUpNotification } from "./interfaces/signUpNotificationInterface";

const handler: Handler = async () => {
    const dbClient: IDbClient = await DbClientFacotry.getClient();
    const execution: Execution = await dbClient.getExecution();

    if (execution.status === ExecutionStatus.Iddle) {
        const mastodonClient = new MastodonApiClient(execution);
        await dbClient.updateExecutionStatus(execution.id, ExecutionStatus.Running);

        try {
            let signUps: SignUpNotification[] = await mastodonClient.getLastSignUps(execution.lastSignUpNotificationId);
            // ORDER by Id ASC
            signUps = signUps.sort((x, y) => x.id - y.id);

            for (const signUp of signUps) {
                try {
                    const message: string = buildStatusMessage(execution, signUp);
                    await mastodonClient.publishStatus(message, execution.welcomeMessageVisibility);
                } catch (error) {
                    ErrorHelper.HandleError("There was an error publishing the status to mastodon. Check the logs for more detail.", error);
                }
                execution.lastSignUpNotificationId = signUp.id;
            }
        } finally {
            execution.status = ExecutionStatus.Iddle;
            await dbClient.updateExecution(execution);
        }

    } else {
        console.log("Process is already running.");
    }

    dbClient.dispose();
    return { statusCode: 200 };
};

export { handler };

function buildStatusMessage(execution: Execution, signUp: SignUpNotification): string {
    let mastodonUserName: string = "";
    try {
        if (!signUp?.account?.username) {
            throw "There is no username";
        }

        mastodonUserName = signUp.account.username;
    } catch (error) {
        ErrorHelper.HandleError(`Notification is not valid: ${error}`, signUp);
    }

    return execution.welcomeMessage
        .replaceAll("{USERNAME}", `@${mastodonUserName}`);
}
