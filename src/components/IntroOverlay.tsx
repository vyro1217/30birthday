import React, { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface IntroOverlayProps {
  text: string;
  mode?: 'overlay' | 'inline';
}

export const IntroOverlay = memo(function IntroOverlay({
  text,
  mode = 'overlay',
}: IntroOverlayProps) {
  const isOverlay = mode === 'overlay';
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={
        isOverlay
          ? 'absolute inset-0 flex items-center justify-center pointer-events-none p-8'
          : 'relative flex w-full justify-center px-2'
      }
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-start gap-6 relative max-w-[min(90vw,420px)]"
      >
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={
            prefersReducedMotion
              ? { opacity: 0.16, scale: 1, rotate: 0 }
              : { opacity: [0.14, 0.24, 0.14], scale: [0.98, 1.02, 0.98], rotate: [0, 3, 0] }
          }
          transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -right-4 -top-10 h-28 w-28 rounded-full border border-[#C5A059]/12"
        >
          <div className="absolute inset-[0.7rem] rounded-full border border-[#C5A059]/10" />
          <div className="absolute inset-[1.4rem] rounded-full border border-[#C5A059]/8" />
        </motion.div>

        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={
            prefersReducedMotion
              ? { opacity: 0.1, x: 0, y: 0 }
              : { opacity: [0.06, 0.16, 0.06], x: [0, 6, 0], y: [0, -4, 0] }
          }
          transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -left-10 bottom-4 h-16 w-24 rounded-[999px] border border-white/8"
        />

        {/* Editorial Accent Line */}
        <div className="w-12 h-[1px] bg-gradient-to-r from-[#C5A059]/60 to-transparent" />

        <p className="text-left text-[clamp(1rem,4.5vw,1.1rem)] leading-[2.4] tracking-[0.12em] font-light italic font-serif break-words [overflow-wrap:anywhere] text-transparent bg-clip-text bg-gradient-to-br from-[#F8F4EE] via-[#F8F4EE] to-[#F8F4EE]/40">
          {text}
        </p>

        {/* Subtle Bottom Accent */}
        <div className="flex items-center gap-3">
          <div className="w-1 h-1 rounded-full bg-[#C5A059]/30" />
          <div className="w-8 h-[1px] bg-gradient-to-r from-[#C5A059]/20 to-transparent" />
        </div>
        
        {/* Subtle Background Glow - Shifted for asymmetry */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 -z-10 w-64 h-64 bg-[radial-gradient(circle_at_50%_50%,#C5A059/0.03_0%,transparent_70%)] blur-3xl" />
      </motion.div>
    </motion.div>
  );
});
