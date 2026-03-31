import React, { memo } from 'react';
import { motion } from 'motion/react';

interface MainBlessingProps {
  message: string;
  variant?: 'default' | 'box-bottom';
  compact?: boolean;
  veryCompact?: boolean;
}

export const MainBlessing = memo(function MainBlessing({
  message,
  variant = 'default',
  compact = false,
  veryCompact = false,
}: MainBlessingProps) {
  const paragraphs = message.split('\n\n');
  const isBoxBottom = variant === 'box-bottom';

  return (
    <motion.section 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{ maxHeight: 'var(--stage-max-height)' }}
      className={
        isBoxBottom
          ? `relative w-[min(88vw,24rem)] max-h-full overflow-hidden rounded-[1.6rem] border border-[#E6C98A]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] ${veryCompact ? 'p-3.5' : compact ? 'p-4' : 'p-5 sm:p-6'} shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-lg`
          : `relative w-[min(90vw,31rem)] max-h-full overflow-hidden rounded-[36px] border border-white/8 bg-white/[0.025] ${compact ? 'p-4' : 'p-6 sm:p-10'} shadow-[0_48px_120px_rgba(0,0,0,0.52)] backdrop-blur-[28px] sm:rounded-[44px]`
      }
    >
      {/* Refined Luxury Borders & Accents */}
      <div className={`pointer-events-none absolute inset-0 border border-white/10 ${isBoxBottom ? 'rounded-[1.6rem]' : 'rounded-[36px] sm:rounded-[44px]'}`} />
      <div className="relative z-10">
        <div className="absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#C5A059]/30 to-transparent opacity-70" />
        <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#C5A059]/24 to-transparent opacity-50" />
      </div>
      
      {/* Decorative Corner */}
      {!compact && !isBoxBottom && <div className="absolute top-6 left-6 w-4 h-4 border-t border-l border-[#C5A059]/30" />}
      {!compact && !isBoxBottom && <div className="absolute bottom-6 right-6 w-4 h-4 border-b border-r border-[#C5A059]/30" />}

      <div className={`relative z-10 flex max-h-full min-h-0 flex-col ${isBoxBottom ? (veryCompact ? 'gap-2.5' : compact ? 'gap-3' : 'gap-4') : compact ? 'gap-4' : 'gap-6 sm:gap-7'}`}>
        {/* Editorial Vertical Line */}
        {!compact && !veryCompact && <div className={`absolute top-2 bottom-2 w-[1px] bg-gradient-to-b from-transparent via-[#C5A059]/20 to-transparent ${isBoxBottom ? '-left-3' : '-left-6 sm:-left-8'}`} />}
        
        <div className={`min-h-0 overflow-y-auto overscroll-contain ${veryCompact ? 'pr-1' : ''}`}>
        {paragraphs.map((para, idx) => (
          <motion.p 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + idx * 0.1, duration: 0.65 }}
            className={`m-0 text-left whitespace-pre-line font-light tracking-[0.01em] break-words [overflow-wrap:anywhere] ${veryCompact ? 'text-[clamp(0.82rem,3vw,0.9rem)] leading-[1.46]' : compact ? 'text-[clamp(0.86rem,3.2vw,0.94rem)] leading-[1.54]' : 'text-[clamp(0.96rem,4vw,1.06rem)] leading-[1.8] sm:leading-[1.88]'} text-[#F8F4EE]/92 ${idx === 0 ? `mb-2 font-serif italic text-[#E7D3AB] ${veryCompact ? 'text-[clamp(0.88rem,3.25vw,0.94rem)]' : compact ? 'text-[clamp(0.94rem,3.5vw,1rem)]' : 'text-[clamp(1.02rem,4.2vw,1.14rem)]'}` : 'font-serif italic'}`}
          >
            {para}
          </motion.p>
        ))}
        </div>
      </div>
    </motion.section>
  );
});
