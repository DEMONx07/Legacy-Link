'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';
import { api } from '@/lib/api';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onError?: (err: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscript, onError, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const updateAmplitude = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    setAmplitude(avg / 128);
    animFrameRef.current = requestAnimationFrame(updateAmplitude);
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up analyser
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(blob);
      };

      recorder.start(100);
      setIsRecording(true);
    } catch (err) {
      onError?.('Microphone access denied. Type your message instead.');
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(animFrameRef.current);
    setIsRecording(false);
    setAmplitude(0);
  }, []);

  useEffect(() => {
    if (isRecording) {
      updateAmplitude();
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRecording, updateAmplitude]);

  const processAudio = async (blob: Blob) => {
    try {
      const res = await api.transcribeAudio(blob);
      if (res.text) {
        onTranscript(res.text);
      }
    } catch {
      onError?.('Voice processing unavailable. Please type your message.');
    }
  };

  const bars = Array.from({ length: 12 });

  return (
    <motion.button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className="relative flex items-center justify-center w-12 h-12 rounded-full transition-all"
      style={{
        background: isRecording
          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
          : 'linear-gradient(135deg, rgba(212,168,83,0.2), rgba(212,168,83,0.1))',
        border: isRecording
          ? '1px solid rgba(239,68,68,0.5)'
          : '1px solid rgba(212,168,83,0.3)',
        boxShadow: isRecording ? '0 0 20px rgba(239,68,68,0.4)' : 'none',
      }}
    >
      {/* Pulse rings when recording */}
      <AnimatePresence>
        {isRecording && (
          <>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-red-400/30"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1 + i * 0.4, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Waveform bars */}
      <AnimatePresence>
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5">
            {bars.map((_, i) => (
              <motion.div
                key={i}
                className="w-0.5 bg-white rounded-full"
                animate={{
                  height: `${8 + amplitude * 20 * Math.sin(i * 0.8 + Date.now() * 0.005) + Math.random() * 8}px`,
                }}
                transition={{ duration: 0.05 }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {!isRecording && (
        <Mic size={16} className={disabled ? 'text-sepia-700' : 'text-sepia-300'} />
      )}
      {isRecording && (
        <div className="w-3 h-3 bg-white rounded-sm" />
      )}
    </motion.button>
  );
}
