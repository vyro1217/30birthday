import React, { memo } from 'react';
import { motion } from 'motion/react';

interface MainBlessingProps {
  message: string;
}

export const MainBlessing = memo(function MainBlessing({ message }: MainBlessingProps) {
  const paragraphs = message.split('\n\n');

  return (
    <motion.section 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-[min(94%,560px)] overflow-hidden rounded-[36px] border border-white/8 bg-white/[0.025] p-8 shadow-[0_48px_120px_rgba(0,0,0,0.52)] backdrop-blur-[28px] sm:rounded-[44px] sm:p-14"
    >
      {/* Refined Luxury Borders & Accents */}
      <div className="pointer-events-none absolute inset-0 rounded-[36px] border border-white/10 sm:rounded-[44px]" />
      <div className="absolute top-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#C5A059]/30 to-transparent opacity-70" />
      <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#C5A059]/24 to-transparent opacity-50" />
      
      {/* Decorative Corner */}
      <div className="absolute top-6 left-6 w-4 h-4 border-t border-l border-[#C5A059]/30" />
      <div className="absolute bottom-6 right-6 w-4 h-4 border-b border-r border-[#C5A059]/30" />

      <div className="relative flex flex-col gap-8 sm:gap-10">
        {/* Editorial Vertical Line */}
        <div className="absolute -left-6 sm:-left-8 top-2 bottom-2 w-[1px] bg-gradient-to-b from-transparent via-[#C5A059]/20 to-transparent" />
        
        {paragraphs.map((para, idx) => (
          <motion.p 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + idx * 0.24, duration: 1.1 }}
            className={`m-0 text-[clamp(1rem,4.4vw,1.12rem)] leading-[1.95] sm:leading-[2.1] text-[#F8F4EE]/92 text-left whitespace-pre-line font-light tracking-[0.025em] ${idx === 0 ? 'mb-2 font-serif italic text-[#E7D3AB] text-[clamp(1.08rem,4.8vw,1.24rem)]' : ''} break-words [overflow-wrap:anywhere]`}
          >
            {para}
          </motion.p>
        ))}
      </div>
    </motion.section>
  );
});
