'use client';

import { motion } from 'framer-motion';

const EMOTIONS: Record<string, { label: string; icon: string; color: string }> = {
  warm: { label: 'Warm', icon: '🌻', color: '#d4a853' },
  nostalgic: { label: 'Nostalgic', icon: '🌅', color: '#c49030' },
  joyful: { label: 'Joyful', icon: '✨', color: '#e6c07a' },
  sad: { label: 'Reflective', icon: '🌧', color: '#6b8cba' },
  proud: { label: 'Proud', icon: '🦁', color: '#a87a28' },
  thoughtful: { label: 'Thoughtful', icon: '🌿', color: '#6b9e6b' },
  funny: { label: 'Playful', icon: '😄', color: '#d4a853' },
  neutral: { label: 'Present', icon: '🕊', color: '#8a8a8a' },
  romantic_nostalgic: { label: 'Romantic', icon: '🌹', color: '#c06080' },
  joyful_loving: { label: 'Loving', icon: '💛', color: '#d4a853' },
  profound_joy: { label: 'Profound Joy', icon: '🌟', color: '#e6c07a' },
  fierce_proud: { label: 'Fierce', icon: '🔥', color: '#d45833' },
  transcendent_joyful: { label: 'Transcendent', icon: '🎶', color: '#9b7fd4' },
  peaceful_philosophical: { label: 'Peaceful', icon: '🌊', color: '#5ba3c9' },
};

export default function EmotionMeter({ emotion }: { emotion: string }) {
  const key = emotion.toLowerCase().replace(/ /g, '_');
  const found = EMOTIONS[key] || EMOTIONS['neutral'];

  return (
    <motion.div
      key={emotion}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
      style={{
        background: `${found.color}15`,
        border: `1px solid ${found.color}30`,
        color: found.color,
      }}
    >
      <span>{found.icon}</span>
      <span className="font-medium tracking-wide">{found.label}</span>
    </motion.div>
  );
}
