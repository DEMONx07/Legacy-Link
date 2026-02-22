export interface Person {
    id: string;
    name: string;
    birth_year: number | null;
    birth_place: string | null;
    photo_urls: string[];
    demo_persona: boolean;
    memory_count: number;
    avatar_url?: string;
    created_at?: string;
}

export interface Memory {
    id: string;
    memory_text: string;
    emotion: string | null;
    year_reference: number | null;
    decade: string | null;
    themes: string[];
    importance_score: number;
}

export interface ChatRequest {
    query: string;
    session_id?: string;
}

export interface ChatResponse {
    response: string;
    emotion: string;
    relevant_memories: {
        text: string;
        year: number | null;
        emotion: string | null;
    }[];
    avatar_expression: string;
    voice_url: string | null;
}

export interface TranscriptionResponse {
    text: string;
    confidence: number;
}
