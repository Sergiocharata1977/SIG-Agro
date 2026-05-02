export interface VoiceSettings {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
}

export interface ElevenLabsVoiceConfig {
    voiceId: string;
    modelId: string;
    settings: VoiceSettings;
    languageCode: string;
}

// Configuracion de voz Don Juan GIS (masculino, calido, argentino)
export const DON_JUAN_GIS_VOICE: ElevenLabsVoiceConfig = {
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB',
    modelId: 'eleven_multilingual_v2',
    settings: {
        stability: 0.71,
        similarity_boost: 0.85,
        style: 0.35,
        use_speaker_boost: true,
    },
    languageCode: 'es',
};
