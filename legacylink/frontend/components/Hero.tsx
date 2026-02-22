'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Play, Mic, ArrowRight, Star } from 'lucide-react';
import { AnimatedTitle } from './AnimatedTitle';

export function Hero() {
    return (
        <div className="relative z-10 max-w-5xl mx-auto text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs tracking-widest uppercase border border-sepia-600/30 text-sepia-400"
                style={{ background: 'rgba(212,168,83,0.05)' }}
            >
                <Star size={10} className="text-sepia-400 fill-sepia-400" />
                Digital Immortality Platform
                <Star size={10} className="text-sepia-400 fill-sepia-400" />
            </motion.div>

            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight mb-6">
                <AnimatedTitle text="Preserve What" className="block text-sepia-100" />
                <AnimatedTitle text="Matters Most" className="block gradient-text" />
            </h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7 }}
                className="text-sepia-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12"
            >
                Record a lifetime of stories. Our AI preserves their personality, voice, and memories —
                so future generations can have real conversations with the people they loved.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
                <Link href="/gallery">
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="group flex items-center gap-3 px-8 py-4 rounded-full font-medium text-sepia-900 text-sm tracking-wide"
                        style={{ background: 'linear-gradient(135deg, #e6c07a, #d4a853, #c49030)' }}
                    >
                        <Play size={16} className="fill-sepia-900" />
                        Experience Demo
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </Link>

                <Link href="/record">
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-3 px-8 py-4 rounded-full font-medium text-sepia-200 text-sm tracking-wide border border-sepia-600/40 hover:border-sepia-400 transition-all"
                        style={{ background: 'rgba(212,168,83,0.05)' }}
                    >
                        <Mic size={16} />
                        Start Recording
                    </motion.button>
                </Link>
            </motion.div>
        </div>
    );
}
