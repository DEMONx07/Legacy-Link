'use client';

import { motion } from 'framer-motion';

export function AnimatedTitle({ text, className }: { text: string; className?: string }) {
    return (
        <span className={className}>
            {text.split('').map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
                >
                    {char}
                </motion.span>
            ))}
        </span>
    );
}
