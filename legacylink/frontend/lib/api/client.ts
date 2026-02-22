import { Person, ChatRequest, ChatResponse, TranscriptionResponse } from './types';

const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return envUrl.replace(/localhost|127\.0\.0\.1/g, window.location.hostname);
  }
  return envUrl;
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getGallery(): Promise<{ persons: Person[] }> {
    return this.fetchJson('/gallery');
  }

  async getPerson(id: string): Promise<Person> {
    return this.fetchJson(`/persons/${id}`);
  }

  async createPerson(data: any): Promise<Person> {
    return this.fetchJson('/persons/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addMemory(personId: string, data: any): Promise<any> {
    return this.fetchJson(`/persons/${personId}/memories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async transcribeAudio(file: Blob): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/voice/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Transcription failed');
    return response.json();
  }

  // --- Client-side Demo Fallbacks ---

  async chat(personId: string, text: string, sessionId: string): Promise<ChatResponse> {
    try {
      return await this.fetchJson(`/chat/${personId}`, {
        method: 'POST',
        body: JSON.stringify({ query: text, session_id: sessionId }),
      });
    } catch (error) {
      console.warn('API Error, using client-side demo fallback:', error);
      return this.getDemoResponse(personId, text);
    }
  }

  private getDemoResponse(personId: string, query: string): ChatResponse {
    const responses = DEMO_RESPONSES[personId] || DEMO_RESPONSES['default'];
    const queryLower = query.toLowerCase();

    let text = "";
    let emotion = "thoughtful";

    if (queryLower.match(/hello|hi|hey|how are you/)) {
      text = responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
      emotion = "warm";
    } else {
      const topic = Object.keys(responses).find(k => k !== 'greetings' && k !== 'default' && queryLower.includes(k));
      if (topic) {
        text = (responses as any)[topic];
        emotion = text.toLowerCase().includes('remember') ? 'nostalgic' : 'warm';
      } else {
        text = responses.default[Math.floor(Math.random() * responses.default.length)];
      }
    }

    return {
      response: text,
      emotion: emotion,
      relevant_memories: [],
      avatar_expression: emotion === 'warm' ? 'smile' : 'thoughtful',
      voice_url: null
    };
  }
}

const DEMO_RESPONSES: Record<string, any> = {
  "550e8400-e29b-41d4-a716-446655440001": {
    "greetings": ["Oh my, hello dear! Come sit down.", "Well goodness, look who's here!", "Hello, sweetheart! Sit, sit — I made apple pie."],
    "first kiss": "Oh my, that was Harold Thompson at the county fair in 1963. I was sixteen and wearing my best yellow dress.",
    "harold": "Sometimes I think about what might have been. But your grandfather was my true love.",
    "default": ["Life is full of surprises — the good ones and the hard ones both shape you.", "Treasure every single moment, dear."]
  },
  "550e8400-e29b-41d4-a716-446655440002": {
    "greetings": ["Hey, come in, come in.", "Well, look who showed up. About time.", "Hey kid. Good to see ya."],
    "korea": "Korea, 1952. Lemme tell ya — it's cold over there in ways your bones remember forever.",
    "grandmother": "I met your grandmother at a USO dance in '54. Red dress. Laughing at something.",
    "default": ["Back in my day you didn't complain, you just worked harder.", "Nothing worth having comes easy."]
  },
  "550e8400-e29b-41d4-a716-446655440003": {
    "greetings": ["Hey man, come in!", "Oh hey! Far out, I was thinking about you.", "Hey! Grab a seat."],
    "woodstock": "Man, Woodstock. August '69. I heard Hendrix play the Star Spangled Banner and something rewired.",
    "music": "Music is the only language that crosses every border, man. The chord is the same everywhere.",
    "default": ["Man, that's deep. Everything is connected, man.", "The answer is in the question, you know?"]
  },
  "default": {
    "greetings": ["Hello there.", "Nice to see you."],
    "default": ["I remember so many stories from my life...", "The past is a beautiful place."]
  }
};

export const api = new ApiClient();
export const apiClient = api;
