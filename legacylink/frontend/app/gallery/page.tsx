'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Plus, Heart, Clock } from 'lucide-react';
import { api, type Person } from '@/lib/api';

const PERSONA_EMOJIS: Record<string, string> = {
  '550e8400-e29b-41d4-a716-446655440001': '👵',
  '550e8400-e29b-41d4-a716-446655440002': '👴',
  '550e8400-e29b-41d4-a716-446655440003': '🎸',
};

const PERSONA_COLORS: Record<string, string> = {
  '550e8400-e29b-41d4-a716-446655440001': '#d4a853',
  '550e8400-e29b-41d4-a716-446655440002': '#a87a28',
  '550e8400-e29b-41d4-a716-446655440003': '#8a6120',
};

export default function GalleryPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGallery()
      .then((data) => setPersons(data.persons))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fallback demo data if API down
  const displayPersons = persons.length > 0 ? persons : [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Grandma Ruth', birth_year: 1947, birth_place: 'Columbus, Ohio', demo_persona: true, memory_count: 5 },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Grandpa Joe', birth_year: 1943, birth_place: 'Brooklyn, New York', demo_persona: true, memory_count: 3 },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Uncle Bob', birth_year: 1960, birth_place: 'Santa Cruz, California', demo_persona: true, memory_count: 3 },
  ];

  return (
    <div className="min-h-screen px-6 py-24">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-radial from-sepia-400/5 via-[#0d0a05] to-[#0d0a05]" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <Link href="/" className="flex items-center gap-2 text-sepia-500 hover:text-sepia-300 text-sm mb-4 transition-colors">
              <ArrowLeft size={14} />
              Back
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl text-sepia-100 mb-2">The Gallery</h1>
            <p className="text-sepia-400">Choose a legacy to experience</p>
          </div>
          <Link href="/record">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="hidden md:flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-sepia-900 bg-gradient-to-br from-[#e6c07a] to-[#d4a853]"
            >
              <Plus size={14} />
              Create New
            </motion.button>
          </Link>
        </motion.div>

        {/* Demo badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs text-sepia-400 border border-sepia-700/40 bg-sepia-400/5"
        >
          <Heart size={10} className="fill-sepia-500 text-sepia-500" />
          Demo Mode — 3 pre-loaded personas. No API keys required.
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl animate-pulse bg-sepia-400/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayPersons.map((person, i) => {
              const color = PERSONA_COLORS[person.id] || '#d4a853';
              const emoji = PERSONA_EMOJIS[person.id] || '👤';
              const age = person.birth_year ? new Date().getFullYear() - person.birth_year : null;

              return (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/avatar/${person.id}`}>
                    <motion.div
                      whileHover={{ y: -6, scale: 1.01 }}
                      className={`relative p-6 rounded-2xl cursor-pointer overflow-hidden group bg-gradient-to-br from-[#1a1209]/98 to-[#281c0e]/95 min-h-[260px] border-persona-15 ${person.demo_persona ? (person.id === '550e8400-e29b-41d4-a716-446655440001' ? 'persona-grandma-ruth' : person.id === '550e8400-e29b-41d4-a716-446655440002' ? 'persona-grandpa-joe' : 'persona-uncle-bob') : ''}`}
                    >
                      {/* Hover glow */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl radial-glow-persona" />

                      {/* Demo tag */}
                      {person.demo_persona && (
                        <div className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full border z-10 border-persona-30 text-persona bg-persona-10">
                          Demo
                        </div>
                      )}

                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4 border border-persona-30 bg-persona-20">
                        {emoji}
                      </div>

                      <h3 className="font-serif text-xl text-sepia-100 mb-1">{person.name}</h3>

                      <div className="flex items-center gap-3 text-xs text-sepia-500 mb-3">
                        {person.birth_year && <span>b. {person.birth_year}</span>}
                        {age && <span>•</span>}
                        {age && <span>{age} years</span>}
                        {person.birth_place && (
                          <>
                            <span>•</span>
                            <span>{person.birth_place}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-sepia-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock size={10} />
                          <span>{person.memory_count || 0} memories</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1 rounded-full bg-sepia-900/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, ((person.memory_count || 0) / 20) * 100)}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                          className="h-full rounded-full"
                          style={{ backgroundImage: `linear-gradient(to right, ${color}60, ${color})` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-sepia-600">{person.memory_count || 0}/20 memories to full portrait</div>

                      <div className="mt-4 flex items-center gap-1 text-xs group-hover:text-sepia-300 transition-colors text-sepia-500">
                        <span>Start conversation</span>
                        <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}

            {/* Create new card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: displayPersons.length * 0.1 }}
            >
              <Link href="/record">
                <motion.div
                  whileHover={{ y: -6, scale: 1.01 }}
                  className="relative p-6 rounded-2xl cursor-pointer border-dashed border-2 border-sepia-800/50 hover:border-sepia-600/60 transition-colors flex flex-col items-center justify-center text-center group"
                  style={{ minHeight: 260 }}
                >
                  <div className="w-12 h-12 rounded-full border border-sepia-700/50 group-hover:border-sepia-500/60 flex items-center justify-center mb-4 transition-colors">
                    <Plus size={18} className="text-sepia-600 group-hover:text-sepia-400 transition-colors" />
                  </div>
                  <h3 className="font-serif text-lg text-sepia-600 group-hover:text-sepia-300 transition-colors mb-2">
                    Preserve a Memory
                  </h3>
                  <p className="text-sepia-700 text-xs">Record stories from someone you love</p>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
