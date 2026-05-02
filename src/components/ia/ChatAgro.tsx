'use client';

/**
 * Componente de Chat con Don Juan GIS IA
 * Chat flotante para consultas agrícolas
 */

import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface Mensaje {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatAgroProps {
    contexto?: {
        lote?: { nombre: string; superficie: number; cultivo?: string };
        campania?: { nombre: string; estado: string };
    };
}

export default function ChatAgro({ contexto }: ChatAgroProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(null);
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [ttsErrorMessageId, setTtsErrorMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);
    const errorTimeoutRef = useRef<number | null>(null);

    const clearAudioResources = () => {
        audioRef.current?.pause();
        audioRef.current = null;

        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
        }
    };

    const showTtsError = (messageId: string) => {
        setTtsErrorMessageId(messageId);

        if (errorTimeoutRef.current !== null) {
            window.clearTimeout(errorTimeoutRef.current);
        }

        errorTimeoutRef.current = window.setTimeout(() => {
            setTtsErrorMessageId((current) => (current === messageId ? null : current));
            errorTimeoutRef.current = null;
        }, 2000);
    };

    useEffect(() => {
        let cancelled = false;

        const probeTtsAvailability = async () => {
            try {
                const response = await fetch('/api/elevenlabs/speech', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: '' }),
                });

                if (cancelled) return;

                if (response.status === 400) {
                    setTtsAvailable(true);
                    return;
                }

                if (response.status === 503) {
                    setTtsAvailable(false);
                }
            } catch (error) {
                console.error('Error verificando TTS:', error);
            }
        };

        probeTtsAvailability();

        return () => {
            cancelled = true;

            if (errorTimeoutRef.current !== null) {
                window.clearTimeout(errorTimeoutRef.current);
            }

            clearAudioResources();
        };
    }, []);

    // Scroll al final cuando hay nuevos mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    // Mensaje inicial
    useEffect(() => {
        if (isOpen && mensajes.length === 0) {
            setMensajes([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: `¡Hola! Soy **Don Juan GIS** 🌾, tu asistente agrícola inteligente.

Puedo ayudarte con:
- 📊 Análisis de lotes y campañas
- 🌱 Recomendaciones de siembra
- 🐛 Control de plagas
- 📈 Proyecciones de rendimiento

¿En qué te puedo ayudar?`,
                    timestamp: new Date(),
                },
            ]);
        }
    }, [isOpen, mensajes.length]);

    const enviarMensaje = async () => {
        if (!input.trim() || loading) return;

        const mensajeUsuario: Mensaje = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMensajes((prev) => [...prev, mensajeUsuario]);
        setInput('');
        setLoading(true);

        try {
            // Llamar a la API de chat
            const response = await fetch('/api/ia/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mensaje: input,
                    historial: mensajes.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    contexto,
                }),
            });

            const data = await response.json();

            const mensajeAsistente: Mensaje = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.respuesta || 'Error al procesar la respuesta',
                timestamp: new Date(),
            };

            setMensajes((prev) => [...prev, mensajeAsistente]);
        } catch (error) {
            console.error('Error en chat:', error);
            setMensajes((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'Hubo un error al procesar tu mensaje. Intenta nuevamente.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    };

    const reproducirAudio = async (mensaje: Mensaje) => {
        if (playingMessageId || ttsAvailable === false) return;

        setPlayingMessageId(mensaje.id);
        setTtsErrorMessageId(null);

        try {
            const response = await fetch('/api/elevenlabs/speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: mensaje.content }),
            });

            if (response.status === 503) {
                setTtsAvailable(false);
                return;
            }

            if (!response.ok) {
                throw new Error(`TTS request failed with status ${response.status}`);
            }

            setTtsAvailable(true);

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            clearAudioResources();
            audioUrlRef.current = audioUrl;

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.addEventListener('ended', () => {
                clearAudioResources();
            }, { once: true });

            audio.addEventListener('error', () => {
                clearAudioResources();
                showTtsError(mensaje.id);
            }, { once: true });

            try {
                await audio.play();
            } catch (error) {
                clearAudioResources();
                throw error;
            }
        } catch (error) {
            console.error('Error reproduciendo audio TTS:', error);
            showTtsError(mensaje.id);
        } finally {
            setPlayingMessageId((current) => (current === mensaje.id ? null : current));
        }
    };

    return (
        <>
            {/* Botón flotante */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
            >
                {isOpen ? (
                    <span className="text-white text-2xl">✕</span>
                ) : (
                    <span className="text-3xl">🌾</span>
                )}
            </button>

            {/* Ventana de chat */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🌾</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Don Juan GIS IA</h3>
                            <p className="text-xs text-white/80">Asistente Agrícola</p>
                        </div>
                    </div>

                    {/* Contexto actual */}
                    {contexto?.lote && (
                        <div className="px-4 py-2 bg-green-50 text-xs text-green-800 border-b">
                            📍 {contexto.lote.nombre} - {contexto.lote.superficie}ha
                            {contexto.lote.cultivo && ` (${contexto.lote.cultivo})`}
                        </div>
                    )}

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {mensajes.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className="flex items-end gap-2 max-w-[80%]">
                                    <div
                                        className={`px-4 py-2 rounded-2xl ${msg.role === 'user'
                                                ? 'bg-green-500 text-white rounded-br-none'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                            }`}
                                    >
                                        <div
                                            className="text-sm whitespace-pre-wrap"
                                            dangerouslySetInnerHTML={{
                                                __html: msg.content
                                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                    .replace(/\n/g, '<br/>')
                                            }}
                                        />
                                    </div>

                                    {msg.role === 'assistant' && ttsAvailable === true && (
                                        <button
                                            type="button"
                                            onClick={() => void reproducirAudio(msg)}
                                            disabled={playingMessageId !== null}
                                            className="mb-1 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            aria-label="Reproducir respuesta"
                                        >
                                            {playingMessageId === msg.id ? (
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-500" />
                                            ) : ttsErrorMessageId === msg.id ? (
                                                <VolumeX className="h-4 w-4 text-red-500" />
                                            ) : (
                                                <Volume2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-none">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Pregunta sobre tu cultivo..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                disabled={loading}
                            />
                            <button
                                onClick={enviarMensaje}
                                disabled={loading || !input.trim()}
                                className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 disabled:opacity-50 transition"
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
