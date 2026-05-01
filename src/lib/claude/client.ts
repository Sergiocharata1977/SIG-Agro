import Anthropic from '@anthropic-ai/sdk';

interface ClaudeMessage {
    role: 'user' | 'assistant';
    content: string;
}

const RETRY_DELAYS_MS = [1000, 2000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ClaudeService {
    private client: Anthropic;
    private model: string;

    constructor() {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY no configurada');
        }

        this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        this.model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
    }

    async chat(
        messages: ClaudeMessage[],
        systemPrompt: string,
        maxTokens = 2000,
        temperature = 0.7
    ): Promise<string> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
            try {
                const response = await this.client.messages.create({
                    model: this.model,
                    system: systemPrompt,
                    messages,
                    max_tokens: maxTokens,
                    temperature,
                });

                const text = response.content
                    .filter((block) => block.type === 'text')
                    .map((block) => block.text)
                    .join('\n')
                    .trim();

                if (!text) {
                    throw new Error('Claude devolvio una respuesta vacia');
                }

                return text;
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error('Error desconocido al consultar Claude');

                if (attempt === RETRY_DELAYS_MS.length) {
                    break;
                }

                await sleep(RETRY_DELAYS_MS[attempt]);
            }
        }

        throw new Error(`Claude fallo tras reintentos: ${lastError?.message ?? 'sin detalle'}`);
    }

    static isAvailable(): boolean {
        return Boolean(process.env.ANTHROPIC_API_KEY);
    }
}
