'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Send, Volume2, VolumeX, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { api, type Person } from '@/lib/api';
import VoiceRecorder from '@/components/VoiceRecorder';
import EmotionMeter from '@/components/EmotionMeter';

// Lazy load 3D (heavy)
const Avatar3D = dynamic(() => import('@/components/Avatar3D'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border border-sepia-700/30 animate-pulse bg-sepia-400/5" />
        </div>
    ),
});

// Polyfill for randomUUID in non-secure contexts
function generateId() {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

interface Message {
    id: string;
    role: 'user' | 'avatar';
    text: string;
    emotion?: string;
    memories?: Array<{ text: string; year: number | null; emotion: string | null }>;
    timestamp: Date;
}

const PERSONA_CONFIG: Record<string, { color: string; emoji: string; greeting: string }> = {
    '550e8400-e29b-41d4-a716-446655440001': {
        color: '#d4a853',
        emoji: '👵',
        greeting: "Oh my, hello dear! Come sit down — I was just thinking about you. What would you like to talk about?",
    },
    '550e8400-e29b-41d4-a716-446655440002': {
        color: '#a87a28',
        emoji: '👴',
        greeting: "Hey, come in. You want coffee? Real coffee. Sit down, I got time.",
    },
    '550e8400-e29b-41d4-a716-446655440003': {
        color: '#8a6120',
        emoji: '🎸',
        greeting: "Hey man! Far out, I was just playing some Coltrane. Pull up a chair. What's on your mind?",
    },
};

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
    '550e8400-e29b-41d4-a716-446655440001': [
        "Tell me about your first kiss",
        "How did Grandpa propose?",
        "What's your secret pie recipe?",
        "What do you think about Harold now?",
    ],
    '550e8400-e29b-41d4-a716-446655440002': [
        "Tell me about Korea",
        "How did you meet Grandma?",
        "Tell me about building the business",
        "What's the most important thing in life?",
    ],
    '550e8400-e29b-41d4-a716-446655440003': [
        "What was Woodstock like?",
        "Tell me about learning guitar in Bali",
        "What did hitchhiking teach you?",
        "What's your philosophy on life?",
    ],
};

// ── Text-to-speech utility ──
function speak(text: string, rate = 0.9, pitch = 1.0) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 0.9;
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => v.name.includes('Samantha') || v.name.includes('Google US English'));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
}

export default function AvatarClient({ params }: { params: { id: string } }) {
    const personId = params.id;
    const config = PERSONA_CONFIG[personId] || { color: '#d4a853', emoji: '👤', greeting: "Hello, I'm so glad you came." };

    const [person, setPerson] = useState<Person | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expression, setExpression] = useState('neutral');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [sessionId] = useState(generateId());
    const [showInfo, setShowInfo] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load person
    useEffect(() => {
        api.getPerson(personId)
            .then(setPerson)
            .catch(() => {
                // Fallback
                const fallbacks: Record<string, Partial<Person>> = {
                    '550e8400-e29b-41d4-a716-446655440001': { name: 'Grandma Ruth', birth_year: 1947, birth_place: 'Columbus, Ohio', demo_persona: true },
                    '550e8400-e29b-41d4-a716-446655440002': { name: 'Grandpa Joe', birth_year: 1943, birth_place: 'Brooklyn, New York', demo_persona: true },
                    '550e8400-e29b-41d4-a716-446655440003': { name: 'Uncle Bob', birth_year: 1960, birth_place: 'Santa Cruz, California', demo_persona: true },
                };
                setPerson({ id: personId, ...(fallbacks[personId] || { name: 'Legacy Avatar' }), demo_persona: true } as Person);
            });
    }, [personId]);

    // Initial greeting
    useEffect(() => {
        if (!person) return;
        const timer = setTimeout(() => {
            const greetMsg: Message = {
                id: generateId(),
                role: 'avatar',
                text: config.greeting,
                emotion: 'warm',
                timestamp: new Date(),
            };
            setMessages([greetMsg]);
            setExpression('smile');
            if (voiceEnabled) {
                setIsSpeaking(true);
                speak(config.greeting);
                setTimeout(() => setIsSpeaking(false), config.greeting.length * 60);
            }
        }, 600);
        return () => clearTimeout(timer);
    }, [person, config.greeting, voiceEnabled]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = {
            id: generateId(),
            role: 'user',
            text: text.trim(),
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setExpression('thoughtful');

        try {
            const response = await api.chat(personId, text.trim(), sessionId);

            const avatarMsg: Message = {
                id: generateId(),
                role: 'avatar',
                text: response.response || '',
                emotion: response.emotion,
                memories: response.relevant_memories,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, avatarMsg]);
            setExpression(response.avatar_expression || 'neutral');

            if (voiceEnabled) {
                setIsSpeaking(true);
                speak(response.response, 0.88, 1.05);
                setTimeout(() => setIsSpeaking(false), response.response.length * 60 + 500);
            }
        } catch (err) {
            toast.error('Connection issue. Check that the backend is running.');
            setExpression('neutral');
        } finally {
            setIsLoading(false);
        }
    }, [personId, sessionId, isLoading, voiceEnabled]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleVoiceTranscript = (text: string) => {
        sendMessage(text);
    };

    const age = person?.birth_year ? new Date().getFullYear() - person.birth_year : null;
    const suggestions = SUGGESTED_QUESTIONS[personId] || [];

    return (
        <div className={`min-h-screen flex flex-col bg-[#0d0a05] ${person?.demo_persona ? (personId === '550e8400-e29b-41d4-a716-446655440001' ? 'persona-grandma-ruth' : personId === '550e8400-e29b-41d4-a716-446655440002' ? 'persona-grandpa-joe' : 'persona-uncle-bob') : ''}`}>
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-10 radial-ambient-persona" />

            {/* ── Header ── */}
            <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-sepia-900/50 bg-[#0d0a05]/90 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link href="/gallery" className="flex items-center gap-2 text-sepia-500 hover:text-sepia-300 text-sm transition-colors">
                        <ArrowLeft size={14} />
                        <span className="hidden sm:inline">Gallery</span>
                    </Link>
                    <div className="w-px h-4 bg-sepia-800" />
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-persona-30 bg-persona-20">
                            {config.emoji}
                        </div>
                        <div>
                            <div className="font-serif text-sm text-sepia-100">{person?.name || '...'}</div>
                            {age && <div className="text-xs text-sepia-600">{age} years old • {person?.birth_place}</div>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Speaking indicator */}
                    <AnimatePresence>
                        {isSpeaking && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                                style={{ background: `${config.color}15`, color: config.color, border: `1px solid ${config.color}30` }}
                            >
                                {[1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1 rounded-full bg-persona"
                                        animate={{ height: ['4px', '12px', '4px'] }}
                                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                    />
                                ))}
                                <span className="ml-1">Speaking</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => {
                            setVoiceEnabled(!voiceEnabled);
                            if (voiceEnabled) window.speechSynthesis?.cancel();
                        }}
                        title={voiceEnabled ? "Disable Voice" : "Enable Voice"}
                        className="p-2 rounded-full hover:bg-sepia-900/50 transition-colors text-sepia-500 hover:text-sepia-300"
                    >
                        {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>

                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        title="Toggle Info"
                        className="p-2 rounded-full hover:bg-sepia-900/50 transition-colors text-sepia-500 hover:text-sepia-300"
                    >
                        <Info size={14} />
                    </button>
                </div>
            </header>

            {/* ── Main ── */}
            <div className="flex flex-1 overflow-hidden relative z-10">
                {/* Avatar panel */}
                <div className="hidden lg:flex flex-col items-center justify-center w-80 border-r border-sepia-900/30 p-6 shrink-0">
                    <div className="w-full aspect-square max-w-[260px] relative">
                        <div className="absolute inset-0 rounded-full opacity-20 blur-3xl bg-persona" />
                        <Avatar3D color={config.color} expression={expression} isSpeaking={isSpeaking} />
                    </div>

                    {/* Emotion state */}
                    <div className="mt-4 text-center">
                        <div className="font-serif text-lg text-sepia-200 mb-2">{person?.name}</div>
                        <EmotionMeter emotion={expression} />
                    </div>

                    {/* Memory count */}
                    {person?.memory_count && (
                        <div className="mt-6 w-full">
                            <div className="flex justify-between text-xs text-sepia-600 mb-1">
                                <span>Memory depth</span>
                                <span>{person.memory_count} memories</span>
                            </div>
                            <div className="h-1 rounded-full bg-sepia-900 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full transition-all duration-1000 persona-progress-gradient"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, ((person.memory_count || 0) / 20) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Info panel */}
                    <AnimatePresence>
                        {showInfo && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="mt-4 w-full p-4 rounded-xl text-xs text-sepia-400"
                                style={{ background: 'rgba(212,168,83,0.05)', border: '1px solid rgba(212,168,83,0.1)' }}
                            >
                                <div className="font-medium text-sepia-300 mb-2">About {person?.name}</div>
                                {person?.birth_year && <div>Born: {person.birth_year}</div>}
                                {person?.birth_place && <div>From: {person.birth_place}</div>}
                                {person?.demo_persona && <div className="mt-1 text-sepia-600">Demo persona — pre-loaded</div>}
                                <div className="mt-2 text-sepia-600">Powered by LegacyLink AI with RAG memory retrieval</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Chat panel */}
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
                        {/* Suggested questions (only at start) */}
                        {messages.length <= 1 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-wrap gap-2 mb-4"
                            >
                                {suggestions.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => sendMessage(q)}
                                        className="text-xs px-3 py-1.5 rounded-full text-sepia-400 hover:text-sepia-200 transition-colors bg-sepia-400/10 border border-sepia-400/20"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'avatar' && (
                                        <div className="w-7 h-7 shrink-0 mt-1 rounded-full flex items-center justify-center text-xs border border-persona-30 bg-persona-20">
                                            {config.emoji}
                                        </div>
                                    )}

                                    <div className={`max-w-[78%] md:max-w-[65%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                        <div
                                            className={`px-4 py-3 text-sm leading-relaxed ${msg.role === 'avatar'
                                                ? 'bg-[#1a1209]/90 text-[#f8eddc] rounded-[2px_18px_18px_18px] border-persona-15'
                                                : 'bg-sepia-400/15 border border-sepia-400/20 text-sepia-300 rounded-[18px_18px_2px_18px]'
                                                }`}
                                        >
                                            {msg.role === 'avatar' ? (
                                                <TypewriterText text={msg.text} />
                                            ) : (
                                                msg.text
                                            )}
                                        </div>

                                        {/* Emotion + memories */}
                                        {msg.role === 'avatar' && msg.emotion && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <EmotionMeter emotion={msg.emotion} />
                                                {msg.memories && msg.memories.length > 0 && (
                                                    <div className="text-xs text-sepia-700">
                                                        {msg.memories.length} memory{msg.memories.length > 1 ? 's' : ''} recalled
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Typing indicator */}
                        <AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs border border-persona-30 bg-persona-20">
                                        {config.emoji}
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl flex items-center gap-1 bg-[#1a1209]/90 border-persona-15">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-persona"
                                                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input bar */}
                    <div className="px-4 md:px-6 py-4 border-t border-sepia-900/30 bg-[#0d0a05]/95 backdrop-blur-md">
                        <form onSubmit={handleSubmit} className="flex items-center gap-3">
                            <VoiceRecorder
                                onTranscript={handleVoiceTranscript}
                                onError={(e) => toast.error(e)}
                                disabled={isLoading}
                            />

                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Ask ${person?.name?.split(' ')[0] || 'them'} anything...`}
                                disabled={isLoading}
                                className="flex-1 bg-transparent border border-sepia-800/50 focus:border-sepia-600/60 rounded-full px-4 py-3 text-sm text-sepia-200 placeholder-sepia-700 outline-none transition-colors"
                            />

                            <motion.button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Send Message"
                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
                                style={{ background: `linear-gradient(135deg, ${config.color}dd, ${config.color}88)` }}
                            >
                                <Send size={14} className="text-sepia-900" />
                            </motion.button>
                        </form>

                        {/* Mobile suggestions */}
                        {messages.length <= 1 && (
                            <div className="lg:hidden flex gap-2 overflow-x-auto mt-3 pb-1">
                                {suggestions.slice(0, 3).map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => sendMessage(q)}
                                        className="text-xs px-3 py-1.5 rounded-full shrink-0 text-sepia-400 bg-sepia-400/10 border border-sepia-400/20"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Typewriter effect for avatar responses ──
function TypewriterText({ text }: { text: string }) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        setDisplayed('');
        setDone(false);
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(interval);
                setDone(true);
            }
        }, 18);
        return () => clearInterval(interval);
    }, [text]);

    return (
        <span>
            {displayed}
            {!done && (
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="ml-0.5 inline-block w-0.5 h-4 bg-sepia-400 align-middle"
                />
            )}
        </span>
    );
}
