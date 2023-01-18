import got, { Headers, Method, OptionsOfJSONResponseBody } from 'got';
import { Execution } from '../interfaces/execution';
import { SignUpNotification } from '../interfaces/signUpNotificationInterface';
import { EnvVariableHelpers } from './env-variable-helpers';

export class MastodonApiClient {
    private token: string;
    private instanceName: string;
    constructor(execution: Execution) {
        execution.AssertMastodonVariables();
        this.token = execution.mastodonApiToken;
        this.instanceName = execution.mastodonInstanceName;
    }

    public async getLastSignUps(signUpId: number): Promise<SignUpNotification[]> {
        const instanceName: string = EnvVariableHelpers.GetEnvironmentVariable("instance_name");
        try {
            const url: string = `https://${this.instanceName}/api/v1/notifications?since_id=${signUpId}&types[]=admin.sign_up`;
            return await this.mastodonApiCall<SignUpNotification[]>(url, 'GET');
        } catch (error: any) {
            console.error('Error publishing to ' + instanceName, error);
            throw error;
        }
    }

    public async publishStatus(message: string, visibility: string): Promise<void> {
        const instanceName: string = EnvVariableHelpers.GetEnvironmentVariable("instance_name");
        try {
            const url: string = `https://${this.instanceName}/api/v1/statuses`;

            const body = {
                status: message,
                visibility: visibility || "direct"
            };

            await this.mastodonApiCall<void>(url, 'POST', body);
            console.log(`Welcome message sent: '${message}'`);
        } catch (error: any) {
            console.error('Error publishing to ' + instanceName, error);
            throw error;
        }
    }

    private async mastodonApiCall<T>(url: string, method: Method, body: any = undefined): Promise<T> {
        const headers: Headers = {
            "Authorization": `Bearer ${this.token}`,
            "Content-Type": "application/json",
        };

        const options: OptionsOfJSONResponseBody = {
            method,
            headers,
            timeout: {
                request: 1500,
            },
            json: body
        };

        try {
            return await got(url, options).json<T>();
        } catch (error) {
            console.error(`Error executing a ${method} request to ${url}`, error);
            throw error;
        }
    }
}
