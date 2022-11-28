import got from 'got';
import { SignUpNotification } from '../interfaces/signUpNotificationInterface';
import { EnvVariableHelpers } from './env-variable-helpers';

export class MastodonApiClient {
    public static async getLastSignUps(lastId: number): Promise<SignUpNotification[]> {
        const instanceName: string = EnvVariableHelpers.GetEnvironmentVariable("instance_name");
        try {
            const url: string = `https://${instanceName}/api/v1/notifications?since_id=${lastId}&types[]=admin.sign_up`;
            return await MastodonApiClient.mastodonApiCall<SignUpNotification[]>(url, 'GET');
        } catch (error: any) {
            console.error('Error publishing to ' + instanceName, error);
            throw error;
        }
    }

    public static async publishStatus(message: string): Promise<void> {
        const instanceName: string = EnvVariableHelpers.GetEnvironmentVariable("instance_name");
        try {
            const url: string = `https://${instanceName}/api/v1/statuses`;

            const body = {
                status: message
            };

            await MastodonApiClient.mastodonApiCall(url, 'POST', body);
            console.log(`Welcome message sent: '${message}'`);
        } catch (error: any) {
            console.error('Error publishing to ' + instanceName, error);
            throw error;
        }
    }

    private static async mastodonApiCall<T>(url: string, method: string, body: any = undefined): Promise<T> {
        const token: string = EnvVariableHelpers.GetEnvironmentVariable("token");
        const headers = {
            "Authorization": `Bearer ${token}`,
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
