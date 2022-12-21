import got from 'got';
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

            await this.mastodonApiCall(url, 'POST', body);
            console.log(`Welcome message sent: '${message}'`);
        } catch (error: any) {
            console.error('Error publishing to ' + instanceName, error);
            throw error;
        }
    }

    private async mastodonApiCall<T>(url: string, method: string, body: any = undefined): Promise<T> {
        const headers = {
            "Authorization": `Bearer ${this.token}`,
            "Content-Type": "application/json",
        };

        switch (method.toLowerCase()) {
            case 'get':
                return await got.get(url, { headers }).json<T>();
            case 'put':
                return await got.put(url, { headers: headers, json: body }).json();
            case 'post':
                return await got.post(url, { headers: headers, json: body }).json();
        }

        return {} as T;
    }
}
