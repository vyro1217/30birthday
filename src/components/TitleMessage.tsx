import React, { memo } from 'react';
import { motion } from 'motion/react';

interface TitleMessageProps {
  title: string;
  subtitle: string;
}

export const TitleMessage = memo(function TitleMessage({ title, subtitle }: TitleMessageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto flex max-w-[min(90vw,520px)] flex-col items-start gap-5 px-6 text-left sm:px-8"
    >
      <motion.h1 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="m-0 text-[clamp(2rem,10vw,3.8rem)] font-light font-serif italic text-[#F8F4EE] tracking-[-0.03em] leading-[1.08] break-words"
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "100%" }}
          transition={{ delay: 0.18, duration: 0.7 }}
          className="flex flex-col items-start gap-4 w-full"
        >
          <div className="w-16 h-[1px] bg-gradient-to-r from-[#C5A059] to-transparent" />
          <p className="m-0 text-[clamp(0.68rem,3vw,0.82rem)] tracking-[0.28em] text-[#C5A059]/88 uppercase font-light whitespace-pre-line text-left">
            {subtitle}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
});
