import axios from 'axios';
import { EnvVariableHelpers } from './env-variable-helpers';

export class MastodonApiClient {
    public static async publishStatus(message: string): Promise<void> {
        const instanceName: string = EnvVariableHelpers.GetEnvironmentVariable("instance_name");
        try {
            const url: string = `https://${instanceName}/api/v1/statuses`;

            const body: string = JSON.stringify({
                status: message,
            });

            await MastodonApiClient.mastodonApiCall(url, 'POST', body);
            console.log(`Welcome message sent: '${message}'`);
        } catch (error: any) {
            console.error('Error publishing to ' + instanceName, error);
            throw error;
        }
    }

    private static async mastodonApiCall(url: string, method: string, body: BodyInit): Promise<void> {
        const token: string = EnvVariableHelpers.GetEnvironmentVariable("token");
        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        switch (method.toLowerCase()) {
            case 'get':
                await axios.get(url, { headers: headers });
                break;
            case 'put':
                await axios.put(url, body, { headers: headers });
                break;
            case 'post':
                await axios.post(url, body, { headers: headers });
                break;
        }
    }
}
