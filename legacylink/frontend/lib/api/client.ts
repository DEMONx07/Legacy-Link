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

  async chat(personId: string, text: string, sessionId: string): Promise<ChatResponse> {
    return this.fetchJson(`/chat/${personId}`, {
      method: 'POST',
      body: JSON.stringify({ query: text, session_id: sessionId }),
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
}

export const api = new ApiClient();
export const apiClient = api;
