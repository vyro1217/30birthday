import React, { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface IntroOverlayProps {
  text: string;
  mode?: 'overlay' | 'inline';
  variant?: 'default' | 'from-box' | 'box-bottom';
  compact?: boolean;
  veryCompact?: boolean;
}

export const IntroOverlay = memo(function IntroOverlay({
  text,
  mode = 'overlay',
  variant = 'default',
  compact = false,
  veryCompact = false,
}: IntroOverlayProps) {
  const isOverlay = mode === 'overlay';
  const prefersReducedMotion = useReducedMotion();
  const isFromBox = variant === 'from-box';
  const isBoxBottom = variant === 'box-bottom';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={
        isOverlay
          ? isBoxBottom
            ? 'absolute inset-0 flex items-end justify-center pointer-events-none px-4 py-4 sm:px-6 sm:py-6'
            : 'absolute inset-0 flex items-center justify-center pointer-events-none px-4 py-4 sm:px-8 sm:py-8'
          : 'relative flex w-full justify-center px-2'
      }
    >
      <motion.div
        initial={
          isFromBox || isBoxBottom
            ? { opacity: 0, x: 0, y: 64, scale: 0.96 }
            : { opacity: 0, x: -20, y: 0, scale: 1 }
        }
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={
          isFromBox || isBoxBottom
            ? { opacity: 0, x: 0, y: -20, scale: 0.985 }
            : { opacity: 0, x: 20, y: 0, scale: 1 }
        }
        transition={{ duration: isFromBox || isBoxBottom ? 1.15 : 1.05, ease: [0.22, 1, 0.36, 1] }}
        style={isBoxBottom ? { maxHeight: 'var(--stage-max-height)' } : undefined}
        className={`relative flex min-h-0 w-full flex-col items-start ${veryCompact ? 'gap-2.5' : compact ? 'gap-3' : 'gap-5'} ${isBoxBottom ? `${veryCompact ? 'max-w-[20.75rem] rounded-[1.15rem] px-3 py-3' : compact ? 'max-w-[22.5rem] rounded-[1.2rem] px-3.5 py-3.5' : 'max-w-[23rem] rounded-[1.45rem] px-4 py-4 sm:px-5 sm:py-5'} max-h-full overflow-hidden border border-[#E6C98A]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-lg` : 'max-w-[24rem]'}`}
      >
        {!compact && !veryCompact && (
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
        )}

        {!compact && !veryCompact && (
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
        )}

        {!compact && !veryCompact && (isFromBox || isBoxBottom) && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, y: 26, scaleX: 0.72 }}
            animate={{ opacity: 1, y: 0, scaleX: 1 }}
            exit={{ opacity: 0, y: -12, scaleX: 0.84 }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className={`pointer-events-none absolute left-2 top-[-1.9rem] h-10 rounded-t-[1.4rem] border border-[#E6C98A]/10 border-b-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] ${isBoxBottom ? 'w-[8.6rem]' : 'w-[10.5rem]'}`}
          />
        )}

        {/* Editorial Accent Line */}
        <div className="relative z-10 flex w-full flex-col items-start gap-3">
          <div className={`${compact || veryCompact ? 'w-9' : 'w-12'} h-[1px] bg-gradient-to-r from-[#C5A059]/45 to-transparent`} />

          <p className={`min-h-0 overflow-y-auto overscroll-contain pr-1 text-left ${veryCompact ? 'text-[clamp(0.84rem,3vw,0.92rem)] leading-[1.5] tracking-[0.01em]' : compact ? 'text-[clamp(0.9rem,3.3vw,0.98rem)] leading-[1.58] tracking-[0.015em]' : 'text-[clamp(0.96rem,4vw,1.04rem)] leading-[1.88] tracking-[0.05em]'} font-light italic font-serif break-words whitespace-pre-line [overflow-wrap:anywhere] text-transparent bg-clip-text bg-gradient-to-br from-[#F8F4EE] via-[#F8F4EE] to-[#F8F4EE]/40`}>
            {text}
          </p>
        </div>

        {/* Subtle Bottom Accent */}
        <div className={`relative z-10 flex items-center ${compact || veryCompact ? 'gap-2.5' : 'gap-3'}`}>
          <div className="w-1 h-1 rounded-full bg-[#C5A059]/30" />
          <div className={`${compact || veryCompact ? 'w-6' : 'w-8'} h-[1px] bg-gradient-to-r from-[#C5A059]/20 to-transparent`} />
        </div>
        
        {/* Subtle Background Glow - Shifted for asymmetry */}
        {!compact && !veryCompact && <div className="absolute -left-12 top-1/2 -translate-y-1/2 -z-10 w-64 h-64 bg-[radial-gradient(circle_at_50%_50%,#C5A059/0.03_0%,transparent_70%)] blur-3xl" />}
      </motion.div>
    </motion.div>
  );
});
