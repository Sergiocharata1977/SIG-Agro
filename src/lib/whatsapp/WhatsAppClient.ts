import type {
    MetaGraphErrorResponse,
    MetaGraphSuccessResponse,
    WhatsAppSendResult,
} from '../../types/whatsapp';

const META_API_URL = 'https://graph.facebook.com/v19.0';
const RETRY_DELAYS_MS = [500, 1000, 2000] as const;

export class WhatsAppClient {
    constructor(
        private readonly accessToken: string,
        private readonly phoneNumberId: string
    ) {}

    async sendTextMessage(to: string, body: string): Promise<WhatsAppSendResult> {
        const response = await this.requestWithRetry<MetaGraphSuccessResponse>({
            path: `/${this.phoneNumberId}/messages`,
            body: {
                messaging_product: 'whatsapp',
                to,
                type: 'text',
                text: {
                    body,
                },
            },
        });

        const messageId = response.messages?.[0]?.id;
        if (!messageId) {
            throw new Error('Meta Graph API response did not include a WhatsApp message id.');
        }

        return {
            messageId,
            status: 'accepted',
            contacts: response.contacts,
        };
    }

    async markAsRead(messageId: string): Promise<void> {
        await this.requestWithRetry({
            path: `/${this.phoneNumberId}/messages`,
            body: {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
            },
        });
    }

    static fromEnv(): WhatsAppClient {
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!accessToken && !phoneNumberId) {
            throw new Error(
                'Missing WhatsApp configuration: set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.'
            );
        }

        if (!accessToken) {
            throw new Error('Missing WhatsApp configuration: WHATSAPP_ACCESS_TOKEN is not set.');
        }

        if (!phoneNumberId) {
            throw new Error('Missing WhatsApp configuration: WHATSAPP_PHONE_NUMBER_ID is not set.');
        }

        return new WhatsAppClient(accessToken, phoneNumberId);
    }

    private async requestWithRetry<T>(input: {
        path: string;
        body: Record<string, unknown>;
    }): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
            try {
                return await this.request<T>(input.path, input.body);
            } catch (error) {
                lastError = toError(error);

                if (attempt === RETRY_DELAYS_MS.length) {
                    break;
                }

                await sleep(RETRY_DELAYS_MS[attempt]);
            }
        }

        throw new Error(
            `WhatsApp request failed after ${RETRY_DELAYS_MS.length + 1} attempts: ${lastError?.message ?? 'Unknown error'}`
        );
    }

    private async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
        const response = await fetch(`${META_API_URL}${path}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw await buildRequestError(response);
        }

        return (await response.json()) as T;
    }
}

async function buildRequestError(response: Response): Promise<Error> {
    const rawBody = await response.text();
    const message = parseGraphErrorMessage(rawBody);

    return new Error(`Meta Graph API request failed with ${response.status} ${response.statusText}: ${message}`);
}

function parseGraphErrorMessage(rawBody: string): string {
    if (!rawBody) {
        return 'Empty error response body.';
    }

    try {
        const parsed = JSON.parse(rawBody) as MetaGraphErrorResponse;
        const error = parsed.error;
        if (!error) {
            return rawBody;
        }

        const details = error.error_data?.details ? ` Details: ${error.error_data.details}` : '';
        const code = error.code !== undefined ? ` Code: ${error.code}.` : '';
        return `${error.message}.${code}${details}`.trim();
    } catch {
        return rawBody;
    }
}

function toError(error: unknown): Error {
    if (error instanceof Error) {
        return error;
    }

    return new Error(typeof error === 'string' ? error : 'Unknown error');
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
