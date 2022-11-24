import { Handler } from "@netlify/functions";
import { Context } from "@netlify/functions/dist/function/context";
import { Event } from "@netlify/functions/dist/function/event";
import { EnvVariableHelpers } from "./helpers/env-variable-helpers";
import { ErrorHelper } from "./helpers/error-helper";
import { MastodonApiClient } from "./helpers/mastodon-api-client";
import { NewUser } from "./interfaces/newUserInterface";

const handler: Handler = async (event: Event, context: Context) => {
    EnvVariableHelpers.AssertEnvVariablesArePresent();

    if (!event.httpMethod || event.httpMethod !== "POST") {
        ErrorHelper.HandleError("This is not a POST method call", event);
    }

    if (!event.body) {
        ErrorHelper.HandleError("There is no body.", event);
    }

    let mastodonUserName: string = "";
    try {
        const mastodonUser: NewUser = JSON.parse(event.body as string);
        if (!mastodonUser?.object?.account?.username) {
            throw "There is no username";
        }

        mastodonUserName = mastodonUser.object.account.username;
    } catch (error) {
        ErrorHelper.HandleError(`Body is not valid: ${error}`, event.body as string);
    }

    const message: string = EnvVariableHelpers.GetEnvironmentVariable("message");
    const status: string = message
        .replace("{USERNAME}", `@${mastodonUserName}`)
        .replaceAll("|", "\n");
    try {
        await MastodonApiClient.publishStatus(status);
        return { statusCode: 200 };
    } catch {
        return { statusCode: 500, body: "There was an error publishing the status to mastodon. Check the logs for more detail." };
    }
};

export { handler };

