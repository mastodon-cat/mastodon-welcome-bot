# Introduction
When users sign up on a Mastodont's instance is nice to welcome them with a friendly message.

This project has been designed as a [Netlify function](https://docs.netlify.com/functions/overview/) that receives the result of Mastodont's `account.created` webhook and publishes a welcome message. The user can be mentioned in that message.

As the webhook configuration does not allow to add any header, there's no way to identify via Authorization header who reached the function endpoint. It could be done via querystring, although that feature is not implemented at the moment.

# Deploying the function
You can use the following button and follow the steps to create the application in Netlify.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/mastodon-cat/mastodon-welcome-bot)

If you rather do it manually, a [netlify.toml](./netlify.toml) file has been added to the project with the necessary configuration to deploy the function.

Either way, you must set the `environment variables` in the Netlify site where the function is deployed. **Please, read the environment variables documentation**.

This function needs a Mastodon application to be created so the message can be sent. It also needs a Mastodon webhook so Mastodon can send the account.created data to the function.

## Application
Go to `/settings/applications` Mastodon's instance URL and create a New Application. The new Application only needs an Application Name and the **`write:statuses`** Scope. Anybody can create this application, no special permissions are needed.
After creating the application, 3 keys will be revealed: Client key, Client secret, and Your access token. `'Your access token'` will be the one used by the function.

## Webhook
`This can only be done after the function has beedn deployed to Netlify`. Creating a webhook needs `Manage webhooks (0x8000)` [permissions](https://docs.joinmastodon.org/entities/Role/). Log in as a user with the required permissions. Go to `/admin/roles` Mastodon's instance URL and add a new endpoint with the Netlify function's URL.

# Documentation
## Environment variables
This function relies on environment variables to be able to send the welcome publication.
* `instance_name` --> The name of Mastodont's instance where the user has configured the webhook. For example `Mastodon.cat` would be a valid value.
* `token` --> The `'Your access token'` value from the Mastodon's application.
* `message` --> The message to send to the newly registered user. To mention the user, the text `{USERNAME}` (**capital letters**) must be present in the text. As the message is stored in an environment variable and **Netlify environment variables do not allow line breaks** (it ignores them) **| (a pipe symbol)** can be used in the message to be dynamically replaced as line breaks. To get a double line break just add two pipes: ||.

## Function
[The function](./src/functions/welcome-new-user.ts) will ensure 4 main points before trying to use the body received, throwing an Exception if any of them fails :
1. All mandatory environment variables are set.
2. Http Method is a POST, because the `account.created` endpoint works uses the POST Method.
3. A Body has been received.
4. The function will parse the body into a `NewUser` object and assert if the `username` property is in place.

After that, the function just publishes the status via API and returns a status code accordingly.

## Helpers
Some classes with static methods have been created either to reuse code or to keep the main code of the function as simple as possible.
### [ErrorHelper](./src/functions/helpers/error-helper.ts)
Errors in Netlify's log are very visual because they're shown on a red background.
* `HandleError` --> Sends the message as an error to the console before throwing an Exception.
### [EnvVariableHelpers](./src/functions/helpers/env-variable-helpers.ts)
Handles environment variables
* `AssertEnvVariablesArePresent` --> if any needed environment variable is missing in the configuration, uses the HandleError helper to throw an Exception.
* `GetEnvironmentVariable` --> The existence of all needed environment variables has been asserted at the beginning of the function by calling the AssertEnvVariablesArePresent method. In NodeJS retrieving an environment variable using `process.env.VariableName` or `process.env.['VariableName']` returns a nullable string (string?) but we want a not nullable string, so we avoid false alerts in our code. **GetEnvironmentVariable is just a silly & convenient method to get a string instead of a string?**.
### [MastodonApiClient](./src/functions/helpers/mastodon-api-client.ts)
A class to encapsulate calls to Mastodon API.
* `publishStatus` --> Builds the JSON body with the welcome message and sends it to Mastodon's API. Handles the Exception.