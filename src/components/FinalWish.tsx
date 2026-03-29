import React, { memo } from 'react';
import { motion } from 'motion/react';

interface FinalWishProps {
  text: string;
}

export const FinalWish = memo(function FinalWish({ text }: FinalWishProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto w-full max-w-[540px] px-6 text-right sm:px-10"
    >
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.45, ease: [0.22, 1, 0.36, 1] }}
        className="m-0 text-[clamp(1.08rem,5vw,1.48rem)] leading-[1.95] sm:leading-[2.2] text-[#F8F4EE] tracking-[0.03em] font-light italic font-serif whitespace-pre-line break-words [overflow-wrap:anywhere]"
      >
        {text}
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 0.3, scaleX: 1 }}
        transition={{ delay: 0.55, duration: 1.1 }}
        className="h-[1px] w-16 sm:w-24 bg-gradient-to-l from-transparent via-[#C5A059] to-transparent ml-auto mt-10 sm:mt-12"
      />
    </motion.div>
  );
});
