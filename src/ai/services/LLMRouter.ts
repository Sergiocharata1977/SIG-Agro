import { ClaudeService } from '@/lib/claude/client';

import {
    LLM_ROUTING,
    PROVIDER_MODELS,
    type LLMCapability,
    type LLMProvider,
} from '../config/llmRouting';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GroqChatResponse {
    choices?: Array<{
        message?: {
            content?: string | null;
        };
    }>;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PROVIDER_TIMEOUT_MS = 30_000;

const formatError = (error: unknown): string =>
    error instanceof Error ? error.message : 'Error desconocido';

export class LLMRouter {
    private claudeService: ClaudeService | null = null;

    async chat(
        capability: LLMCapability,
        messages: ChatMessage[],
        systemPrompt: string
    ): Promise<{ text: string; provider: LLMProvider; usedFallback: boolean }> {
        const route = LLM_ROUTING[capability];
        const providers: LLMProvider[] = [route.primary, ...route.fallbacks];
        const errors: string[] = [];

        for (const [index, provider] of providers.entries()) {
            try {
                const text = await this.callProvider(provider, messages, systemPrompt, route.maxTokens, route.temperature);

                return {
                    text,
                    provider,
                    usedFallback: index > 0,
                };
            } catch (error) {
                errors.push(`${provider}: ${formatError(error)}`);
            }
        }

        throw new Error(
            `No se pudo completar la solicitud para "${capability}". Intentos: ${errors.join(' | ')}`
        );
    }

    private async callProvider(
        provider: LLMProvider,
        messages: ChatMessage[],
        systemPrompt: string,
        maxTokens: number,
        temperature: number
    ): Promise<string> {
        switch (provider) {
            case 'groq':
                return this.callGroq(messages, systemPrompt, maxTokens, temperature);
            case 'claude':
                return this.withTimeout(
                    this.getClaudeService().chat(messages, systemPrompt, maxTokens, temperature),
                    provider
                );
            default:
                throw new Error(`Proveedor no soportado: ${String(provider)}`);
        }
    }

    private getClaudeService(): ClaudeService {
        if (!ClaudeService.isAvailable()) {
            throw new Error('ANTHROPIC_API_KEY no configurada');
        }

        if (!this.claudeService) {
            this.claudeService = new ClaudeService();
        }

        return this.claudeService;
    }

    private async callGroq(
        messages: ChatMessage[],
        systemPrompt: string,
        maxTokens: number,
        temperature: number
    ): Promise<string> {
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('GROQ_API_KEY no configurada');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: PROVIDER_MODELS.groq,
                    messages: [
                        { role: 'system', content: systemPrompt } as GroqMessage,
                        ...messages,
                    ],
                    temperature,
                    max_tokens: maxTokens,
                    stream: false,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error de Groq API: ${response.status} - ${errorText}`);
            }

            const data = (await response.json()) as GroqChatResponse;
            const text = data.choices?.[0]?.message?.content?.trim();

            if (!text) {
                throw new Error('Groq devolvio una respuesta vacia');
            }

            return text;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Timeout de ${PROVIDER_TIMEOUT_MS}ms en proveedor groq`);
            }

            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private async withTimeout<T>(promise: Promise<T>, provider: LLMProvider): Promise<T> {
        let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

        try {
            return await Promise.race([
                promise,
                new Promise<never>((_, reject) => {
                    timeoutHandle = setTimeout(() => {
                        reject(new Error(`Timeout de ${PROVIDER_TIMEOUT_MS}ms en proveedor ${provider}`));
                    }, PROVIDER_TIMEOUT_MS);
                }),
            ]);
        } finally {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
        }
    }
}

export const llmRouter = new LLMRouter();
