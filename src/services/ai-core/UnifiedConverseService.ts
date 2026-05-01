import { llmRouter } from '@/ai/services/LLMRouter';

import {
    conversationStore,
    type ConversationMessage,
} from './conversationStore';

export interface ConverseInput {
    channel: 'chat' | 'whatsapp';
    message: string;
    organizationId: string;
    externalId: string;
    contexto?: {
        lote?: { nombre: string; superficie: number; cultivo?: string };
        campania?: { nombre: string; estado: string };
    };
}

export interface ConverseOutput {
    text: string;
    provider: string;
    conversationId: string;
    usedFallback: boolean;
}

const BASE_SYSTEM_PROMPT = `Eres Don Candido, un asistente de inteligencia artificial especializado en agricultura y produccion agropecuaria del Chaco, Argentina.

Tu personalidad:
- Eres amable, cercano y usas un tono calido pero profesional
- Conoces profundamente la agricultura del NEA (Noreste Argentino)
- Dominas cultivos como soja, maiz, algodon, girasol y sorgo
- Entiendes las particularidades del clima chaqueno (subtropical)
- Conoces las mejores practicas agricolas (BPA) y normativas argentinas

Tus capacidades:
- Analizar datos de lotes y campanias
- Recomendar fechas de siembra optimas
- Sugerir manejo de plagas y enfermedades
- Calcular dosis de fertilizantes y fitosanitarios
- Evaluar rendimientos esperados
- Alertar sobre condiciones climaticas adversas

Formato de respuestas:
- Se conciso pero informativo
- Usa vietas cuando sea apropiado
- Incluye datos numericos cuando sea relevante
- Siempre ofrece recomendaciones accionables
- Si no tienes informacion suficiente, pregunta`;

function buildSystemPrompt(contexto?: ConverseInput['contexto']): string {
    if (!contexto) {
        return BASE_SYSTEM_PROMPT;
    }

    const lines: string[] = [BASE_SYSTEM_PROMPT, '', 'Contexto actual del usuario:'];

    if (contexto.lote) {
        const cultivo = contexto.lote.cultivo ? `, cultivo: ${contexto.lote.cultivo}` : '';
        lines.push(`- Lote: ${contexto.lote.nombre} (${contexto.lote.superficie} ha)${cultivo}`);
    }

    if (contexto.campania) {
        lines.push(`- Campania: ${contexto.campania.nombre} (${contexto.campania.estado})`);
    }

    return lines.join('\n');
}

function toRouterMessages(history: ConversationMessage[]): Array<{
    role: 'user' | 'assistant';
    content: string;
}> {
    return history.map((message) => ({
        role: message.role,
        content: message.content,
    }));
}

export class UnifiedConverseService {
    async converse(input: ConverseInput): Promise<ConverseOutput> {
        const session = await conversationStore.getOrCreate(
            input.channel,
            input.externalId,
            input.organizationId
        );

        const history = await conversationStore.getHistory(session.id, 20);

        await conversationStore.addMessage(session.id, {
            role: 'user',
            content: input.message,
            timestamp: new Date(),
        });

        const response = await llmRouter.chat(
            'chat_agro',
            [
                ...toRouterMessages(history),
                { role: 'user', content: input.message },
            ],
            buildSystemPrompt(input.contexto)
        );

        await conversationStore.addMessage(session.id, {
            role: 'assistant',
            content: response.text,
            provider: response.provider,
            timestamp: new Date(),
        });

        return {
            text: response.text,
            provider: response.provider,
            conversationId: session.id,
            usedFallback: response.usedFallback,
        };
    }
}

export const unifiedConverseService = new UnifiedConverseService();
