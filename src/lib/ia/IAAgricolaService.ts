/**
 * Servicio de IA para análisis agrícola
 * Usa Groq API (LLaMA 3.3-70b) para respuestas ultra-rápidas
 */

interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GroqChatResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

// Prompt del sistema para Don Juan GIS IA
const SYSTEM_PROMPT = `Eres Don Juan GIS, un asistente de inteligencia artificial especializado en agricultura y producción agropecuaria de Argentina.

Tu personalidad:
- Eres amable, cercano y usas un tono cálido pero profesional
- Conoces profundamente la agricultura del NEA (Noreste Argentino)
- Dominas cultivos como soja, maíz, algodón, girasol y sorgo
- Entiendes las particularidades del clima chaqueño (subtropical)
- Conoces las mejores prácticas agrícolas (BPA) y normativas argentinas

Tus capacidades:
- Analizar datos de lotes y campañas
- Recomendar fechas de siembra óptimas
- Sugerir manejo de plagas y enfermedades
- Calcular dosis de fertilizantes y fitosanitarios
- Evaluar rendimientos esperados
- Alertar sobre condiciones climáticas adversas

Formato de respuestas:
- Sé conciso pero informativo
- Usa viñetas cuando sea apropiado
- Incluye datos numéricos cuando sea relevante
- Siempre ofrece recomendaciones accionables
- Si no tienes información suficiente, pregunta`;

/**
 * Clase principal del servicio de IA Agrícola
 */
export class IAAgricolaService {
    private static readonly API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    private static readonly MODEL = 'llama-3.3-70b-versatile';

    /**
     * Enviar mensaje a Don Juan GIS IA
     */
    static async chat(
        mensaje: string,
        historial: GroqMessage[] = [],
        contexto?: {
            lote?: { nombre: string; superficie: number; cultivo?: string };
            campania?: { nombre: string; estado: string };
        }
    ): Promise<string> {
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            console.warn('GROQ_API_KEY no configurada, usando respuesta simulada');
            return this.respuestaSimulada(mensaje);
        }

        // Construir prompt con contexto
        let systemWithContext = SYSTEM_PROMPT;
        if (contexto) {
            systemWithContext += '\n\nContexto actual del usuario:';
            if (contexto.lote) {
                systemWithContext += `\n- Lote: ${contexto.lote.nombre} (${contexto.lote.superficie} ha)`;
                if (contexto.lote.cultivo) {
                    systemWithContext += `, cultivo: ${contexto.lote.cultivo}`;
                }
            }
            if (contexto.campania) {
                systemWithContext += `\n- Campaña: ${contexto.campania.nombre} (${contexto.campania.estado})`;
            }
        }

        const messages: GroqMessage[] = [
            { role: 'system', content: systemWithContext },
            ...historial,
            { role: 'user', content: mensaje },
        ];

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.MODEL,
                    messages,
                    temperature: 0.7,
                    max_tokens: 2000,
                    stream: false,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('Error Groq:', error);
                throw new Error(`Error de API: ${response.status}`);
            }

            const data: GroqChatResponse = await response.json();
            return data.choices[0]?.message?.content || 'Sin respuesta';
        } catch (error) {
            console.error('Error en IA Agrícola:', error);
            return this.respuestaSimulada(mensaje);
        }
    }

    /**
     * Analizar un lote con IA
     */
    static async analizarLote(lote: {
        nombre: string;
        superficie: number;
        cultivo?: string;
        estado: string;
        ultimaCosecha?: Date;
        ultimoRendimiento?: number;
    }): Promise<{
        resumen: string;
        alertas: string[];
        recomendaciones: string[];
    }> {
        const prompt = `Analiza el siguiente lote agrícola y dame un resumen con alertas y recomendaciones:

Lote: ${lote.nombre}
Superficie: ${lote.superficie} hectáreas
Estado actual: ${lote.estado}
${lote.cultivo ? `Cultivo actual: ${lote.cultivo}` : 'Sin cultivo actual'}
${lote.ultimaCosecha ? `Última cosecha: ${lote.ultimaCosecha.toLocaleDateString('es-AR')}` : ''}
${lote.ultimoRendimiento ? `Último rendimiento: ${lote.ultimoRendimiento} kg/ha` : ''}

Responde en formato JSON con la estructura:
{
  "resumen": "...",
  "alertas": ["...", "..."],
  "recomendaciones": ["...", "..."]
}`;

        try {
            const respuesta = await this.chat(prompt);

            // Intentar parsear JSON
            const jsonMatch = respuesta.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // Si no es JSON, formatear manualmente
            return {
                resumen: respuesta,
                alertas: [],
                recomendaciones: [],
            };
        } catch (error) {
            console.error('Error al analizar lote:', error);
            return {
                resumen: 'No se pudo realizar el análisis. Intenta nuevamente.',
                alertas: [],
                recomendaciones: [],
            };
        }
    }

    /**
     * Obtener recomendación de siembra
     */
    static async recomendarSiembra(cultivo: string, departamento: string): Promise<string> {
        const prompt = `¿Cuál es la fecha óptima de siembra para ${cultivo} en el departamento ${departamento}, Chaco, Argentina? 
    
Incluye:
- Ventana óptima de siembra
- Densidad recomendada
- Consideraciones climáticas
- Variedades recomendadas para la zona`;

        return this.chat(prompt);
    }

    /**
     * Respuesta simulada cuando no hay API key
     */
    private static respuestaSimulada(mensaje: string): string {
        const msgLower = mensaje.toLowerCase();

        if (msgLower.includes('soja')) {
            return `🌱 **Sobre Soja en el Chaco:**

La soja es uno de los cultivos principales de la región. Algunas recomendaciones:

- **Siembra óptima:** Octubre a Diciembre
- **Variedades recomendadas:** Grupos IV y V (ciclo corto a medio)
- **Densidad:** 280.000-350.000 plantas/ha
- **Espaciamiento:** 42-52 cm entre surcos

¿Necesitas información más específica sobre tu lote?`;
        }

        if (msgLower.includes('maíz')) {
            return `🌽 **Sobre Maíz en el Chaco:**

El maíz es muy importante para la rotación. Te comparto:

- **Siembra óptima:** Septiembre a Noviembre
- **Rendimiento esperado:** 6.000-9.000 kg/ha
- **Densidad:** 65.000-75.000 plantas/ha
- **Fertilización:** Considerar N-P-K según análisis de suelo

¿Quieres que analice tu situación específica?`;
        }

        return `¡Hola! Soy **Don Juan GIS**, tu asistente agrícola. 🌾

Puedo ayudarte con:
- 📊 Análisis de tus lotes y campañas
- 🌱 Recomendaciones de siembra
- 💧 Manejo de riego y fertilización
- 🐛 Control de plagas y enfermedades
- 📈 Proyecciones de rendimiento

¿En qué puedo ayudarte hoy?`;
    }
}
