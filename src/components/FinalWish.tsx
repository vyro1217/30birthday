import React, { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface FinalWishProps {
  text: string;
  image?: string;
  imageAlt?: string;
  variant?: 'default' | 'box-bottom';
  compact?: boolean;
  veryCompact?: boolean;
}

export const FinalWish = memo(function FinalWish({
  text,
  image,
  imageAlt,
  variant = 'default',
  compact = false,
  veryCompact = false,
}: FinalWishProps) {
  const prefersReducedMotion = useReducedMotion();
  const isBoxBottom = variant === 'box-bottom';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={isBoxBottom ? { maxHeight: 'var(--stage-max-height)' } : undefined}
      className={
        isBoxBottom
          ? `relative mx-auto max-h-full w-[min(88vw,23rem)] overflow-hidden rounded-[1.6rem] border border-[#E6C98A]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] ${veryCompact ? 'px-3 py-3' : 'px-4 py-4 sm:px-5 sm:py-5'} text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-lg`
          : 'relative mx-auto w-full max-w-[min(88vw,30rem)] px-4 text-right sm:px-8'
      }
    >
      {!compact && !veryCompact && <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={
          prefersReducedMotion
            ? { opacity: 0.12, scale: 1, rotate: 0 }
            : { opacity: [0.08, 0.2, 0.08], scale: [0.96, 1.02, 0.96], rotate: [0, -2, 0] }
        }
        transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className={`pointer-events-none absolute rounded-full border border-[#C5A059]/10 ${isBoxBottom ? '-left-3 -top-8 h-24 w-24' : '-left-4 -top-10 h-32 w-32'}`}
      >
        <div className="absolute inset-[0.9rem] rounded-full border border-[#C5A059]/10" />
        <div className="absolute inset-[1.8rem] rounded-full border border-[#C5A059]/8" />
      </motion.div>}

      {!compact && !veryCompact && <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={
          prefersReducedMotion
            ? { opacity: 0.1, x: 0, y: 0 }
            : { opacity: [0.06, 0.14, 0.06], x: [0, -6, 0], y: [0, 4, 0] }
        }
        transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className={`pointer-events-none absolute rounded-[999px] border border-white/8 ${isBoxBottom ? 'right-1 top-6 h-14 w-20' : 'right-2 top-8 h-[4.5rem] w-24'}`}
      />}

      <div className="flex max-h-full min-h-0 flex-col gap-3">
        {image ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[1.2rem] border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.32)]"
          >
            <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(6,8,14,0.04),rgba(6,8,14,0.2)_58%,rgba(6,8,14,0.48))]" />
            <img
              src={image}
              alt={imageAlt ?? 'A memory photo'}
              className="block h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 88vw, 420px"
            />
          </motion.div>
        ) : null}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={`m-0 max-h-full overflow-y-auto overscroll-contain pr-1 text-[#F8F4EE] tracking-[0.01em] font-light italic font-serif whitespace-pre-line break-words [overflow-wrap:anywhere] ${isBoxBottom ? (veryCompact ? 'text-[clamp(0.82rem,3vw,0.9rem)] leading-[1.46]' : compact ? 'text-[clamp(0.88rem,3.3vw,0.96rem)] leading-[1.54]' : 'text-[clamp(0.96rem,4vw,1.08rem)] leading-[1.8]') : (compact ? 'text-[clamp(0.94rem,3.7vw,1.02rem)] leading-[1.64]' : 'text-[clamp(1rem,4.4vw,1.24rem)] leading-[1.82] sm:leading-[1.96]')}`}
        >
          {text}
        </motion.p>
      </div>
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 0.3, scaleX: 1 }}
        transition={{ delay: 0.18, duration: 0.7 }}
        className={`h-[1px] bg-gradient-to-l from-transparent via-[#C5A059] to-transparent ${isBoxBottom ? 'ml-0 mt-8 w-14' : 'ml-auto mt-10 w-16 sm:mt-12 sm:w-24'}`}
      />
    </motion.div>
  );
});
