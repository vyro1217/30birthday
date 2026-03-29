import React, { memo } from 'react';
import { motion } from 'motion/react';

interface IntroOverlayProps {
  text: string;
  mode?: 'overlay' | 'inline';
}

export const IntroOverlay = memo(function IntroOverlay({
  text,
  mode = 'overlay',
}: IntroOverlayProps) {
  const isOverlay = mode === 'overlay';

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
        transition={{ duration: 2.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-start gap-6 relative max-w-[min(90vw,420px)]"
      >
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
