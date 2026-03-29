import React, { memo } from 'react';
import { motion } from 'motion/react';

interface TitleMessageProps {
  title: string;
  subtitle: string;
  variant?: 'default' | 'box-bottom';
  compact?: boolean;
  veryCompact?: boolean;
}

export const TitleMessage = memo(function TitleMessage({
  title,
  subtitle,
  variant = 'default',
  compact = false,
  veryCompact = false,
}: TitleMessageProps) {
  const isBoxBottom = variant === 'box-bottom';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={isBoxBottom ? { maxHeight: 'var(--stage-max-height)' } : undefined}
      className={
        isBoxBottom
          ? `mx-auto flex max-h-full w-[min(88vw,23rem)] flex-col items-start ${veryCompact ? 'gap-2' : compact ? 'gap-2.5' : 'gap-3.5'} rounded-[1.6rem] border border-[#E6C98A]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] ${veryCompact ? 'px-3 py-3' : 'px-4 py-4 sm:px-5 sm:py-5'} text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-lg`
          : `mx-auto flex max-w-[min(88vw,28rem)] flex-col items-start ${compact ? 'gap-3' : 'gap-4'} px-4 text-left sm:px-6`
      }
    >
      <motion.h1 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={`m-0 font-light font-serif italic text-[#F8F4EE] tracking-[-0.03em] leading-[1.04] break-words ${isBoxBottom ? (veryCompact ? 'text-[clamp(1.14rem,5.5vw,1.56rem)]' : compact ? 'text-[clamp(1.3rem,6vw,1.86rem)]' : 'text-[clamp(1.52rem,7vw,2.3rem)]') : (compact ? 'text-[clamp(1.42rem,6.8vw,2.2rem)]' : 'text-[clamp(1.68rem,8vw,3rem)]')}`}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "100%" }}
          transition={{ delay: 0.18, duration: 0.7 }}
          className={`flex w-full flex-col items-start ${veryCompact ? 'gap-2.5' : compact ? 'gap-3' : 'gap-4'}`}
        >
          <div className="w-16 h-[1px] bg-gradient-to-r from-[#C5A059] to-transparent" />
          <p className={`m-0 uppercase font-light whitespace-pre-line text-left break-words [overflow-wrap:anywhere] ${veryCompact ? 'text-[clamp(0.56rem,2.3vw,0.66rem)] tracking-[0.14em]' : 'text-[clamp(0.62rem,2.6vw,0.74rem)] tracking-[0.18em]'} text-[#C5A059]/88`}>
            {subtitle}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
});
