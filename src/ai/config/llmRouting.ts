// Variables de entorno requeridas:
// GROQ_API_KEY      # Proveedor primario
// ANTHROPIC_API_KEY # Proveedor fallback (opcional pero recomendado)
// ANTHROPIC_MODEL   # default: claude-sonnet-4-6
// GROQ_MODEL        # default: llama-3.3-70b-versatile

export type LLMCapability = 'chat_agro' | 'analisis_lote' | 'recomendacion' | 'doc_gen';
export type LLMProvider = 'groq' | 'claude';

export interface ProviderRoute {
    primary: LLMProvider;
    fallbacks: LLMProvider[];
    maxTokens: number;
    temperature: number;
}

export const LLM_ROUTING: Record<LLMCapability, ProviderRoute> = {
    chat_agro: { primary: 'groq', fallbacks: ['claude'], maxTokens: 2000, temperature: 0.7 },
    analisis_lote: { primary: 'groq', fallbacks: ['claude'], maxTokens: 3000, temperature: 0.4 },
    recomendacion: { primary: 'groq', fallbacks: ['claude'], maxTokens: 2000, temperature: 0.5 },
    doc_gen: { primary: 'claude', fallbacks: ['groq'], maxTokens: 4000, temperature: 0.3 },
};

export const PROVIDER_MODELS: Record<LLMProvider, string> = {
    groq: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    claude: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
};
