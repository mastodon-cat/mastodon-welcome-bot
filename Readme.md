# Introduction
When users sign up on a Mastodont's instance is nice to welcome them with a friendly message.

This project has been designed as a [Netlify function](https://docs.netlify.com/functions/overview/) that periodically requests [Mastodont's user notifications](https://docs.joinmastodon.org/methods/notifications/), filtering for `admin.sign_up` type. Then publishes a welcome message for each notification received since last message sent. The user can be mentioned in that message.

In order to avoid sending the welcome message more than once to the same user, the process stores in a MongoDb database the ID of the last `admin.sign_up` notification after sending the message.

## Why don't use a Mastodon webhook to act when a new user is created?
The webhook acts instantlly when a new user signs up, so the welcome message would be sent before the account has been verified. In this case, the mention to the user is not valid, and it would remain as plain text.
The `admin.sign_up` notification is not fired after the user actually verifies the account. This is why it is a valid method.
# Deploying the function
You can use the following button and follow the steps to deploy the Function to Netlify.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/mastodon-cat/mastodon-welcome-bot)

If you rather do it manually, a [netlify.toml](./netlify.toml) file has been added to the project with the necessary configuration to deploy the function.

Either way, you must set the `environment variables` in the Netlify site where the function is deployed. 

**Please, read the environment variables documentation**.

This function needs a Mastodon application to be created so the notifications can be read and the message can be sent.

# Application
Go to `/settings/applications` in your Mastodon's instance and create a New Application. The new Application only needs an Application Name and the **`read:notifications`** and **`write:statuses`** scopes. To be able to read `admin.sign_up` notifications, the Application must be created by a user with enough permissions.
After creating the application, 3 keys will be revealed: Client key, Client secret, and Your access token. `'Your access token'` will be the one used by the function.

# Documentation
## Environment variables
This function relies on environment variables to be able to send the welcome publication.
* `mongo_connectionstring` --> The connection string to the MongoDb database. It must start with `mongodb://` or `mongodb+srv://`.
* `mongo_dbname` --> The name of the MongoDb database.
* `mongo_collection` --> The name of the MongoDb collection.

## Database
The database is a very simple one, consisting in just one document in one collection with the following structure:
```ts
{
  _id: ObjectId;
  status: string;
  lastSignUpNotificationId: number;
  welcomeMessage: string;
  welcomeMessageVisibility: string;
  mastodonApiToken: string;
  mastodonInstanceName: string;
}
```
* **id** ➡️ is the Id of the MongoDb document. It is not important, but it should not change.
* **status** ➡️ is either `Iddle` or `Running`.
* **lastSignUpNotificationId** ➡️ is the Id of the last `admin.sign_up` notification retrieved from Mastodon. It is only updated after successfully sending the welcome message to the user.
* **welcomeMessage** ➡️ The message to send to the newly registered user. To mention the user, the text `{USERNAME}` (**capital letters**) must be present in the text. The text can be multi-line.
* **status** ➡️ is either `Iddle` or `Running`.
* **welcomeMessageVisibility** ➡️ is either `public`, `unlisted`, `private` or `direct`. If not set, it defaults to `direct`.
* **mastodonApiToken** ➡️ The `'Your access token'` value from the Mastodon's application.
* **mastodonInstanceName** ➡️ The name of Mastodont's instance where the user has configured the webhook. For example `Mastodon.cat` would be a valid value.
## Function
[The function](./src/functions/welcome-new-user.ts) follows these steps:
1. Creates a client to work with MongoDb collections. The constructor of the client ensures that all necessary environment variables to work with MongoDb are set.
2. Checks that current execution status is `Iddle`. If it's not, it does nothing. This way concurrency is avoided.
3. Sets the current execution status to `Running`.
4. Gets all notifications since last one and orders them by Id ASC.
5. Publishes a welcome message for each `admin.sign_up` notification.
6. Sets the current execution status back to `Iddle` and the `lastSignUpNotificationId` to the ID of the last notification for which a welcome message has been sent.

## Helpers
Some classes with static methods have been created either to reuse code or to keep the main code of the function as simple as possible.
### [ErrorHelper](./src/functions/helpers/error-helper.ts)
Errors in Netlify's log are very visual because they're shown on a red background.
* **HandleError** ➡️ Sends the message as an error to the console before throwing an Exception.
### [EnvVariableHelpers](./src/functions/helpers/env-variable-helpers.ts)
Handles environment variables
* **AssertEnvVariablesArePresent** ➡️ if any needed environment variable is missing in the configuration, uses the HandleError helper to throw an Exception.
* **GetEnvironmentVariable** ➡️ The existence of all needed environment variables has been asserted at the beginning of the function by calling the AssertEnvVariablesArePresent method. In NodeJS retrieving an environment variable using `process.env.VariableName` or `process.env.['VariableName']` returns a nullable string (string?) but we want a not nullable string, so we avoid false alerts in our code. **GetEnvironmentVariable is just a silly & convenient method to get a string instead of a string?**.
### [MastodonApiClient](./src/functions/helpers/mastodon-api-client.ts)
A class to encapsulate requests to the Mastodon API.
* **getLastSignUps** ➡️ Gets all notifications of type `admin.sign_up` since last one.
* **publishStatus** ➡️ Builds the JSON body with the welcome message and the selected visibility (`direct` if undefined) and sends it to Mastodon's API. Handles the Exception.

### [MongoCollectionHandler](./src/functions/helpers/mongo-client.ts)
A class to encapsulate work with MongoDb Client.
* **getExecution** ➡️ Gets the document with the data mentioned in the **Database section**.
* **updateExecutionStatus** ➡️ Sets the status property in the MongoDb document.
* **updateExecution** ➡️ Sets ths status and the lastSignUpNotificationId in the MongoDb document.
* **dispose** ➡️ Closes the MongoDb Client.