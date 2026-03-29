import React, { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface FinalWishProps {
  text: string;
}

export const FinalWish = memo(function FinalWish({ text }: FinalWishProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative mx-auto w-full max-w-[540px] px-6 text-right sm:px-10"
    >
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={
          prefersReducedMotion
            ? { opacity: 0.12, scale: 1, rotate: 0 }
            : { opacity: [0.08, 0.2, 0.08], scale: [0.96, 1.02, 0.96], rotate: [0, -2, 0] }
        }
        transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -left-4 -top-10 h-32 w-32 rounded-full border border-[#C5A059]/10"
      >
        <div className="absolute inset-[0.9rem] rounded-full border border-[#C5A059]/10" />
        <div className="absolute inset-[1.8rem] rounded-full border border-[#C5A059]/8" />
      </motion.div>

      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={
          prefersReducedMotion
            ? { opacity: 0.1, x: 0, y: 0 }
            : { opacity: [0.06, 0.14, 0.06], x: [0, -6, 0], y: [0, 4, 0] }
        }
        transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute right-2 top-8 h-[4.5rem] w-24 rounded-[999px] border border-white/8"
      />

      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="m-0 text-[clamp(1.08rem,5vw,1.48rem)] leading-[1.95] sm:leading-[2.2] text-[#F8F4EE] tracking-[0.03em] font-light italic font-serif whitespace-pre-line break-words [overflow-wrap:anywhere]"
      >
        {text}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 0.3, scaleX: 1 }}
        transition={{ delay: 0.18, duration: 0.7 }}
        className="h-[1px] w-16 sm:w-24 bg-gradient-to-l from-transparent via-[#C5A059] to-transparent ml-auto mt-10 sm:mt-12"
      />
    </motion.div>
  );
});
