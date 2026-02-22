import { create } from 'zustand';
import type { Person, ChatResponse } from '../api';

interface Message {
  id: string;
  role: 'user' | 'avatar';
  text: string;
  emotion?: string;
  timestamp: Date;
  memories?: Array<{ text: string; year?: number }>;
}

interface LegacyStore {
  // Gallery
  persons: Person[];
  setPersons: (persons: Person[]) => void;

  // Active avatar
  activePerson: Person | null;
  setActivePerson: (person: Person | null) => void;

  // Conversation
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // UI state
  isLoading: boolean;
  setLoading: (v: boolean) => void;
  avatarExpression: string;
  setAvatarExpression: (expr: string) => void;
  isSpeaking: boolean;
  setIsSpeaking: (v: boolean) => void;
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;

  // Session
  sessionId: string;
}

export const useLegacyStore = create<LegacyStore>((set, get) => ({
  persons: [],
  setPersons: (persons) => set({ persons }),

  activePerson: null,
  setActivePerson: (person) => set({ activePerson: person, messages: [] }),

  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: crypto.randomUUID(), timestamp: new Date() },
      ],
    })),
  clearMessages: () => set({ messages: [] }),

  isLoading: false,
  setLoading: (v) => set({ isLoading: v }),
  avatarExpression: 'neutral',
  setAvatarExpression: (expr) => set({ avatarExpression: expr }),
  isSpeaking: false,
  setIsSpeaking: (v) => set({ isSpeaking: v }),
  isRecording: false,
  setIsRecording: (v) => set({ isRecording: v }),

  sessionId: crypto.randomUUID(),
}));
