import type { ElevenLabsVoiceConfig } from './voice-config';

// Cliente ElevenLabs REST API - convierte texto en audio
// API: https://api.elevenlabs.io/v1/text-to-speech/{voiceId}
export class ElevenLabsService {
    private apiKey: string;
    private baseUrl = 'https://api.elevenlabs.io/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async textToSpeech(text: string, config: ElevenLabsVoiceConfig): Promise<ArrayBuffer> {
        const response = await fetch(`${this.baseUrl}/text-to-speech/${config.voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                model_id: config.modelId,
                voice_settings: config.settings,
                language_code: config.languageCode,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`ElevenLabs TTS error ${response.status}: ${errorBody}`);
        }

        return response.arrayBuffer();
    }

    static fromEnv(): ElevenLabsService {
        if (!process.env.ELEVENLABS_API_KEY) {
            throw new Error('ELEVENLABS_API_KEY no configurada');
        }

        return new ElevenLabsService(process.env.ELEVENLABS_API_KEY);
    }

    static isAvailable(): boolean {
        return !!process.env.ELEVENLABS_API_KEY;
    }
}
