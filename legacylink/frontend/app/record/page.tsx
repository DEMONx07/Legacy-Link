'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Mic, Square, Send, CheckCircle, Plus, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

function generateId() {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const MEMORY_PROMPTS = [
  "Tell me about your childhood home...",
  "Describe your most treasured memory...",
  "What was the happiest day of your life?",
  "Tell me about your first job...",
  "Describe someone who changed your life...",
  "What did you love most about your parents?",
  "Tell me about a time you were really scared...",
  "What does home mean to you?",
  "Tell me about your first love...",
  "What advice would you give your younger self?",
  "What are you most proud of?",
  "Describe a meal that takes you back in time...",
];

export default function RecordPage() {
  const [step, setStep] = useState<'setup' | 'record' | 'done'>('setup');
  const [personName, setPersonName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [personId, setPersonId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [savedMemories, setSavedMemories] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const createPerson = async () => {
    if (!personName.trim()) return toast.error('Please enter a name');
    try {
      const person = await api.createPerson({
        name: personName,
        birth_year: birthYear ? parseInt(birthYear) : undefined,
        birth_place: birthPlace || undefined,
      });
      setPersonId(person.id);
      setStep('record');
      toast.success(`${personName}'s legacy has been created!`);
    } catch {
      // Demo fallback
      setPersonId('new-demo-' + generateId());
      setStep('record');
      toast.success(`${personName}'s legacy has been created! (Demo mode)`);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const result = await api.transcribeAudio(blob);
          setTranscript(result.text || '');
        } catch {
          setTranscript('');
          toast.error('Transcription unavailable. Type the memory below.');
        }
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Microphone unavailable. Type your memory in the box below.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const saveMemory = async () => {
    if (!transcript.trim()) return toast.error('Please add a memory first');
    if (!personId) return;

    try {
      await api.addMemory(personId, { memory_text: transcript });
      setSavedMemories((n) => n + 1);
      setTranscript('');
      setPromptIndex((i) => (i + 1) % MEMORY_PROMPTS.length);
      toast.success('Memory saved ✦');

      if (savedMemories + 1 >= 5) {
        setStep('done');
      }
    } catch {
      // Demo mode: still count it
      setSavedMemories((n) => n + 1);
      setTranscript('');
      setPromptIndex((i) => (i + 1) % MEMORY_PROMPTS.length);
      toast.success('Memory saved ✦ (Demo mode)');
      if (savedMemories + 1 >= 3) {
        setStep('done');
      }
    }
  };

  return (
    <div className="min-h-screen px-6 py-24 bg-[#0d0a05]">
      <div className="fixed inset-0 -z-10 bg-gradient-radial from-sepia-400/5 via-transparent to-transparent opacity-80" />

      <div className="max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-sepia-500 hover:text-sepia-300 text-sm mb-8 transition-colors">
          <ArrowLeft size={14} />
          Back
        </Link>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Setup ── */}
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-10">
                <div className="text-xs tracking-widest uppercase text-sepia-600 mb-3">Begin a Legacy</div>
                <h1 className="font-serif text-4xl text-sepia-100 mb-3">Who would you like to preserve?</h1>
                <p className="text-sepia-400 text-sm">We'll guide you through capturing their memories, stories, and personality.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs text-sepia-500 uppercase tracking-widest mb-2 block">Name *</label>
                  <input
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="Grandma Ruth, Uncle Bob..."
                    className="w-full bg-transparent border border-sepia-800/50 focus:border-sepia-600/60 rounded-xl px-4 py-3 text-sepia-100 placeholder-sepia-700 outline-none transition-colors text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-sepia-500 uppercase tracking-widest mb-2 block">Birth Year</label>
                    <input
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      placeholder="1940"
                      type="number"
                      className="w-full bg-transparent border border-sepia-800/50 focus:border-sepia-600/60 rounded-xl px-4 py-3 text-sepia-100 placeholder-sepia-700 outline-none transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-sepia-500 uppercase tracking-widest mb-2 block">Hometown</label>
                    <input
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="Brooklyn, NY"
                      className="w-full bg-transparent border border-sepia-800/50 focus:border-sepia-600/60 rounded-xl px-4 py-3 text-sepia-100 placeholder-sepia-700 outline-none transition-colors text-sm"
                    />
                  </div>
                </div>

                <motion.button
                  onClick={createPerson}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium text-sepia-900 bg-gradient-to-br from-[#e6c07a] to-[#d4a853]"
                >
                  Begin Recording
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Record ── */}
          {step === 'record' && (
            <motion.div
              key="record"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-8">
                <div className="text-xs tracking-widest uppercase text-sepia-600 mb-3">
                  Capturing {personName}'s Legacy
                </div>
                <h1 className="font-serif text-3xl text-sepia-100 mb-2">Record their stories</h1>

                {/* Progress */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-1 rounded-full bg-sepia-900 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#e6c07a] to-[#d4a853]"
                      style={{ width: `${(savedMemories / 5) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs text-sepia-600">{savedMemories}/5 memories</span>
                </div>
              </div>

              {/* Prompt card */}
              <motion.div
                key={promptIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-2xl mb-6 bg-sepia-400/10 border border-sepia-400/15"
              >
                <div className="text-xs text-sepia-600 uppercase tracking-widest mb-2">Try asking...</div>
                <p className="font-serif text-lg text-sepia-200 italic">"{MEMORY_PROMPTS[promptIndex]}"</p>
              </motion.div>

              {/* Recording button */}
              <div className="flex justify-center mb-6">
                <motion.button
                  onClick={isRecording ? stopRecording : startRecording}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center ${isRecording
                    ? 'bg-gradient-to-br from-[#ef4444] to-[#dc2626] shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                    : 'bg-gradient-to-br from-[#e6c07a] to-[#d4a853] shadow-[0_0_30px_rgba(212,168,83,0.3)]'
                    }`}
                >
                  {isRecording ? (
                    <>
                      <Square size={22} className="text-white" />
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 rounded-full border border-red-400/30"
                          animate={{ scale: 1 + i * 0.3, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                        />
                      ))}
                    </>
                  ) : (
                    <Mic size={26} className="text-sepia-900" />
                  )}
                </motion.button>
              </div>

              <div className="text-center text-xs text-sepia-600 mb-6">
                {isRecording ? 'Recording... tap to stop' : 'Tap to record, or type below'}
              </div>

              {/* Text input */}
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Or type the memory here..."
                rows={4}
                className="w-full bg-transparent border border-sepia-800/50 focus:border-sepia-600/60 rounded-xl px-4 py-3 text-sepia-100 placeholder-sepia-700 outline-none transition-colors text-sm resize-none mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setPromptIndex((i) => (i + 1) % MEMORY_PROMPTS.length)}
                  className="px-4 py-2.5 rounded-xl text-xs text-sepia-500 border border-sepia-800/40 hover:border-sepia-700 transition-colors"
                >
                  Next prompt
                </button>
                <motion.button
                  onClick={saveMemory}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!transcript.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-sepia-900 disabled:opacity-40 bg-gradient-to-br from-[#e6c07a] to-[#d4a853]"
                >
                  <CheckCircle size={14} />
                  Save Memory
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: 2, duration: 0.5 }}
                className="text-6xl mb-6"
              >
                ✦
              </motion.div>
              <h2 className="font-serif text-4xl text-sepia-100 mb-4">
                {personName}'s Legacy is Alive
              </h2>
              <p className="text-sepia-400 mb-10 max-w-md mx-auto">
                {savedMemories} memories preserved. {personName}'s avatar is ready for conversations that will last forever.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {personId && !personId.startsWith('new-demo') && (
                  <Link href={`/avatar/${personId}`}>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      className="px-8 py-3 rounded-full font-medium text-sepia-900 text-sm bg-gradient-to-br from-[#e6c07a] to-[#d4a853]"
                    >
                      Talk to {personName.split(' ')[0]}
                    </motion.button>
                  </Link>
                )}
                <Link href="/gallery">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    className="px-8 py-3 rounded-full text-sepia-300 text-sm border border-sepia-700/40"
                  >
                    View Gallery
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
