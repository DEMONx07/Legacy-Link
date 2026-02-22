'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, Heart, Mic, Users, Star } from 'lucide-react';
import { Hero } from '@/components/Hero';

// ── Floating dust particles ──────────────────
function Particles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            background: `rgba(212, 168, 83, ${Math.random() * 0.4 + 0.1})`,
          }}
          animate={{
            y: [window.innerHeight + 20, -20],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: Math.random() * 15 + 12,
            repeat: Infinity,
            delay: Math.random() * 15,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}



// ── Demo persona card ────────────────────────
const PERSONAS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Grandma Ruth',
    years: '1947 – ',
    place: 'Columbus, Ohio',
    trait: 'Warm • Humorous • Wise',
    quote: '"The days are long, but the years are short."',
    color: '#d4a853',
    emoji: '👵',
    initials: 'GR',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Grandpa Joe',
    years: '1943 – ',
    place: 'Brooklyn, New York',
    trait: 'Gruff • Loyal • Storyteller',
    quote: '"You build something with your hands — nobody takes that away."',
    color: '#a87a28',
    emoji: '👴',
    initials: 'GJ',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Uncle Bob',
    years: '1960 – ',
    place: 'Santa Cruz, California',
    trait: 'Laid-back • Philosophical • Musical',
    quote: '"The world isn\'t dangerous. Fear is dangerous."',
    color: '#8a6120',
    emoji: '🎸',
    initials: 'UB',
  },
];

// ── Stat counter ─────────────────────────────
function StatCounter({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="font-serif text-4xl md:text-5xl gradient-text font-bold mb-1">{value}</div>
      <div className="text-sepia-300 text-sm tracking-widest uppercase">{label}</div>
    </motion.div>
  );
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const [demoPlaying, setDemoPlaying] = useState(false);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      <Particles />

      {/* ── Nav ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(13,10,5,0.95) 0%, transparent 100%)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sepia-300 to-sepia-600 flex items-center justify-center">
            <Heart size={14} className="text-sepia-900 fill-sepia-900" />
          </div>
          <span className="font-serif text-xl tracking-tight text-sepia-100">LegacyLink</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-sepia-300">
          <Link href="/gallery" className="hover:text-sepia-100 transition-colors">Gallery</Link>
          <Link href="/record" className="hover:text-sepia-100 transition-colors">Record</Link>
          <Link href="/gallery" className="px-4 py-2 border border-sepia-600/40 rounded-full hover:border-sepia-400 hover:text-sepia-100 transition-all">
            Experience Demo
          </Link>
        </div>
      </motion.nav>

      <Hero />

      {/* ── Demo personas ── */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-xs tracking-widest uppercase text-sepia-500 mb-4">Meet The Legacy Keepers</div>
            <h2 className="font-serif text-4xl md:text-5xl text-sepia-100 mb-4">
              Their Stories Live On
            </h2>
            <p className="text-sepia-400 max-w-xl mx-auto">
              Three pre-loaded demo personas, ready for you to have a real conversation with.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PERSONAS.map((persona, i) => (
              <motion.div
                key={persona.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Link href={`/avatar/${persona.id}`}>
                  <motion.div
                    whileHover={{ y: -6, scale: 1.01 }}
                    className="relative p-6 rounded-2xl cursor-pointer overflow-hidden group h-full bg-gradient-to-br from-[#1a1209]/95 to-[#281c0e]/95 border border-sepia-400/15"
                  >
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl radial-glow-persona persona-${persona.id === '550e8400-e29b-41d4-a716-446655440001' ? 'grandma-ruth' : persona.id === '550e8400-e29b-41d4-a716-446655440002' ? 'grandpa-joe' : 'uncle-bob'}`}
                    />

                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-4 relative z-10 border border-persona-30 bg-persona-20 persona-${persona.id === '550e8400-e29b-41d4-a716-446655440001' ? 'grandma-ruth' : persona.id === '550e8400-e29b-41d4-a716-446655440002' ? 'grandpa-joe' : 'uncle-bob'}`}
                    >
                      {persona.emoji}
                    </div>

                    <div className="relative z-10">
                      <h3 className="font-serif text-xl text-sepia-100 mb-1">{persona.name}</h3>
                      <div className="text-xs text-sepia-500 mb-1">{persona.years}present</div>
                      <div className="text-xs text-sepia-400 mb-3">{persona.place}</div>
                      <div className="text-xs text-sepia-500 tracking-wide mb-4">{persona.trait}</div>

                      <blockquote
                        className={`text-sepia-300 text-sm italic leading-relaxed border-l-2 pl-3 border-persona-30 persona-${persona.id === '550e8400-e29b-41d4-a716-446655440001' ? 'grandma-ruth' : persona.id === '550e8400-e29b-41d4-a716-446655440002' ? 'grandpa-joe' : 'uncle-bob'}`}
                      >
                        {persona.quote}
                      </blockquote>

                      <div className="mt-4 flex items-center gap-1 text-xs text-sepia-500 group-hover:text-sepia-300 transition-colors">
                        <span>Talk to them</span>
                        <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl p-12 bg-sepia-400/5 border border-sepia-400/15">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCounter value="∞" label="Memories Stored" />
              <StatCounter value="3" label="Demo Personas" />
              <StatCounter value="100%" label="Private & Secure" />
              <StatCounter value="1 cmd" label="Deploy" />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-4xl md:text-5xl text-sepia-100 mb-4">
              How It Works
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Mic, title: 'Record Stories', desc: 'Capture hours of memories, stories, and conversations. Our AI extracts personality, speech patterns, and emotional signatures.' },
              { step: '02', icon: Heart, title: 'Build the Avatar', desc: 'LegacyLink creates a 768-dimensional personality vector, clones the voice, and generates a 3D avatar from photos.' },
              { step: '03', icon: Users, title: 'Conversations Forever', desc: 'Future generations can have real, emotionally resonant conversations. The avatar retrieves relevant memories and responds in character.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8"
              >
                <div className="font-serif text-7xl font-bold text-sepia-900/30 absolute top-4 right-6 select-none">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-sepia-400/10 border border-sepia-400/20">
                  <item.icon size={20} className="text-sepia-400" />
                </div>
                <h3 className="font-serif text-xl text-sepia-100 mb-3">{item.title}</h3>
                <p className="text-sepia-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-radial from-sepia-400/5 via-transparent to-transparent" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sepia-500 text-sm tracking-widest uppercase mb-8"
          >
            LegacyLink
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-6xl text-sepia-100 leading-tight mb-6"
          >
            We can't stop death.
            <br />
            <span className="gradient-text">But we can stop being forgotten.</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-4 mt-10"
          >
            <Link href="/gallery">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-10 py-4 rounded-full font-medium text-sepia-900 text-sm bg-gradient-to-br from-[#e6c07a] to-[#d4a853]"
              >
                Begin the Demo
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-sepia-900/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sepia-600 text-sm">
            <Heart size={12} className="fill-sepia-600" />
            <span>LegacyLink — Built with love for those who came before</span>
          </div>
          <div className="flex gap-6 text-xs text-sepia-700">
            <span>Privacy First</span>
            <span>•</span>
            <span>Open Source</span>
            <span>•</span>
            <span>Ethical AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
