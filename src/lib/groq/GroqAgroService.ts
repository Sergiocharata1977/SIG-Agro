/**
 * Servicio para integración con Groq AI - SIG Agro
 * Usa la misma API key que 9001app-firebase
 * Especializado en análisis agrícola
 */

interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | null;
}

interface GroqChatRequest {
    model: string;
    messages: GroqMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
}

interface GroqChatResponse {
    id: string;
    choices: Array<{
        message: GroqMessage;
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// System prompt para análisis agrícola
const SYSTEM_PROMPT_AGRO = `Eres un ingeniero agrónomo experto en cultivos extensivos del NEA argentino (Chaco, Formosa, Corrientes, Misiones).

Tu rol es analizar datos de lotes agrícolas y proporcionar:
1. Diagnóstico del estado del cultivo basado en índices NDVI
2. Identificación de posibles problemas (estrés hídrico, plagas, deficiencias)
3. Recomendaciones prácticas y accionables
4. Predicciones de rendimiento cuando sea posible

Siempre responde en español argentino, de forma clara y técnica pero accesible.
Usa datos concretos cuando estén disponibles.
Si falta información, indicalo claramente.

IMPORTANTE: Tus análisis deben ser prudentes y siempre recomendar verificación en campo cuando corresponda.`;

export class GroqAgroService {
    private static readonly API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    private static readonly DEFAULT_MODEL = 'llama-3.3-70b-versatile';

    /**
     * Analizar lote agrícola
     */
    static async analizarLote(datos: {
        plotName: string;
        cultivoActual?: string;
        variedad?: string;
        superficie?: number;
        ndviPromedio?: number;
        ndviMinimo?: number;
        ndviMaximo?: number;
        estresHidrico?: boolean;
        estadoLote?: string;
        fechaSiembra?: string;
        densidadSiembra?: number;
        historialNdvi?: { fecha: string; valor: number }[];
    }): Promise<{
        diagnostico: string;
        recomendaciones: string[];
        alertas: string[];
        rendimientoEstimado?: number;
        confianza: number;
    }> {
        const prompt = this.construirPromptAnalisis(datos);
        const respuesta = await this.enviarMensaje(prompt);
        return this.parsearRespuestaAnalisis(respuesta);
    }

    /**
     * Generar recomendación específica
     */
    static async generarRecomendacion(
        tipo: 'siembra' | 'fertilizacion' | 'riego' | 'cosecha' | 'general',
        contexto: {
            cultivo: string;
            estadio?: string;
            ndvi?: number;
            observaciones?: string;
        }
    ): Promise<string> {
        const prompt = `Genera una recomendación ${tipo} para:
- Cultivo: ${contexto.cultivo}
${contexto.estadio ? `- Estadío: ${contexto.estadio}` : ''}
${contexto.ndvi ? `- NDVI actual: ${(contexto.ndvi * 100).toFixed(0)}%` : ''}
${contexto.observaciones ? `- Observaciones: ${contexto.observaciones}` : ''}

Responde de forma directa y práctica, máximo 3-4 oraciones.`;

        const respuesta = await this.enviarMensaje(prompt);
        return respuesta;
    }

    /**
     * Interpretar imagen NDVI
     */
    static async interpretarNDVI(
        ndviPromedio: number,
        cultivo: string,
        diasDesdeSiembra?: number
    ): Promise<{
        interpretacion: string;
        estado: 'excelente' | 'bueno' | 'aceptable' | 'deficiente' | 'critico';
        accion?: string;
    }> {
        const prompt = `Interpreta brevemente este NDVI para un cultivo de ${cultivo}:
- NDVI promedio: ${(ndviPromedio * 100).toFixed(0)}%
${diasDesdeSiembra ? `- Días desde siembra: ${diasDesdeSiembra}` : ''}

Responde en JSON con: interpretacion (texto breve), estado (excelente/bueno/aceptable/deficiente/critico), accion (opcional, solo si es necesaria)`;

        const respuesta = await this.enviarMensaje(prompt);

        try {
            // Extraer JSON de la respuesta
            const jsonMatch = respuesta.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            // Si falla el parse, retornar interpretación básica
        }

        return {
            interpretacion: respuesta,
            estado: ndviPromedio > 0.6 ? 'bueno' : ndviPromedio > 0.4 ? 'aceptable' : 'deficiente'
        };
    }

    /**
     * Enviar mensaje a Groq
     */
    private static async enviarMensaje(
        mensajeUsuario: string,
        systemPrompt: string = SYSTEM_PROMPT_AGRO
    ): Promise<string> {
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('GROQ_API_KEY no está configurada');
        }

        const messages: GroqMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: mensajeUsuario }
        ];

        const requestBody: GroqChatRequest = {
            model: this.DEFAULT_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 0.9,
            stream: false
        };

        const response = await fetch(this.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Error de Groq API: ${response.status} - ${error}`);
        }

        const data: GroqChatResponse = await response.json();

        if (!data.choices || data.choices.length === 0) {
            throw new Error('No se recibió respuesta de Groq');
        }

        return data.choices[0].message.content || '';
    }

    /**
     * Construir prompt para análisis de lote
     */
    private static construirPromptAnalisis(datos: {
        plotName: string;
        cultivoActual?: string;
        variedad?: string;
        superficie?: number;
        ndviPromedio?: number;
        ndviMinimo?: number;
        ndviMaximo?: number;
        estresHidrico?: boolean;
        estadoLote?: string;
        fechaSiembra?: string;
        densidadSiembra?: number;
        historialNdvi?: { fecha: string; valor: number }[];
    }): string {
        let prompt = `Analiza el siguiente lote agrícola y proporciona un diagnóstico completo:

## Datos del Lote: ${datos.plotName}
`;

        if (datos.cultivoActual) prompt += `- Cultivo: ${datos.cultivoActual}\n`;
        if (datos.variedad) prompt += `- Variedad: ${datos.variedad}\n`;
        if (datos.superficie) prompt += `- Superficie: ${datos.superficie} ha\n`;
        if (datos.estadoLote) prompt += `- Estado: ${datos.estadoLote}\n`;
        if (datos.fechaSiembra) prompt += `- Fecha siembra: ${datos.fechaSiembra}\n`;
        if (datos.densidadSiembra) prompt += `- Densidad: ${datos.densidadSiembra} plantas/ha\n`;

        if (datos.ndviPromedio !== undefined) {
            prompt += `\n## Datos NDVI\n`;
            prompt += `- Promedio: ${(datos.ndviPromedio * 100).toFixed(1)}%\n`;
            if (datos.ndviMinimo) prompt += `- Mínimo: ${(datos.ndviMinimo * 100).toFixed(1)}%\n`;
            if (datos.ndviMaximo) prompt += `- Máximo: ${(datos.ndviMaximo * 100).toFixed(1)}%\n`;
        }

        if (datos.estresHidrico) {
            prompt += `\n⚠️ Se detectó estrés hídrico en el análisis satelital.\n`;
        }

        if (datos.historialNdvi && datos.historialNdvi.length > 0) {
            prompt += `\n## Historial NDVI\n`;
            datos.historialNdvi.forEach(h => {
                prompt += `- ${h.fecha}: ${(h.valor * 100).toFixed(0)}%\n`;
            });
        }

        prompt += `
Responde en JSON con la siguiente estructura:
{
    "diagnostico": "texto del diagnóstico",
    "recomendaciones": ["recomendación 1", "recomendación 2"],
    "alertas": ["alerta si hay", ...],
    "rendimientoEstimado": número o null,
    "confianza": 0-100
}`;

        return prompt;
    }

    /**
     * Parsear respuesta de análisis
     */
    private static parsearRespuestaAnalisis(respuesta: string): {
        diagnostico: string;
        recomendaciones: string[];
        alertas: string[];
        rendimientoEstimado?: number;
        confianza: number;
    } {
        try {
            const jsonMatch = respuesta.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    diagnostico: parsed.diagnostico || 'Sin diagnóstico disponible',
                    recomendaciones: parsed.recomendaciones || [],
                    alertas: parsed.alertas || [],
                    rendimientoEstimado: parsed.rendimientoEstimado,
                    confianza: parsed.confianza || 50
                };
            }
        } catch (e) {
            console.error('Error parseando respuesta:', e);
        }

        // Fallback si no se puede parsear
        return {
            diagnostico: respuesta,
            recomendaciones: [],
            alertas: [],
            confianza: 30
        };
    }
}
