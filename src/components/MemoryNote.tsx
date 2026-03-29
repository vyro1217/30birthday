import React, { memo, useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface MemoryNoteProps {
  text?: string;
  image?: string;
  imageAlt?: string;
  eyebrow?: string;
  align?: 'left' | 'right';
}

export const MemoryNote = memo(function MemoryNote({
  text,
  image,
  imageAlt,
  eyebrow,
  align = 'left',
}: MemoryNoteProps) {
  const isRightAligned = align === 'right';
  const [isImageLoaded, setIsImageLoaded] = useState(!image);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setIsImageLoaded(!image);
    setHasImageError(false);
  }, [image]);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 1.7, ease: [0.22, 1, 0.36, 1] }}
      className={`flex w-[min(94%,440px)] flex-col gap-8 sm:gap-10 ${isRightAligned ? 'items-end text-right' : 'items-start text-left'}`}
    >
      {image && !hasImageError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full overflow-hidden rounded-[20px] sm:rounded-[24px]"
        >
          {/* Refined Frame */}
          <div className="absolute -inset-4 border border-white/5 rounded-[32px] sm:rounded-[40px] pointer-events-none" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/25 to-transparent rounded-[20px] sm:rounded-[24px] pointer-events-none" />
          <motion.div
            initial={false}
            animate={{ opacity: isImageLoaded ? 0 : 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 rounded-[20px] sm:rounded-[24px] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]"
          />
          
          <img 
            src={image} 
            alt={imageAlt ?? 'A memory of us'}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => {
              setHasImageError(true);
              setIsImageLoaded(true);
            }}
            className="aspect-[4/5] w-full rounded-[20px] sm:rounded-[24px] object-cover shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-white/10"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </motion.div>
      )}
      {text && (
        <motion.div
          initial={{ opacity: 0, x: isRightAligned ? 10 : -10 }}
          animate={{ opacity: 0.9, x: 0 }}
          transition={{ delay: 0.35, duration: 1.25 }}
        >
          {eyebrow && (
            <p
              className={`mb-3 text-[0.65rem] uppercase tracking-[0.28em] text-[#C5A059]/70 ${isRightAligned ? 'text-right' : 'text-left'}`}
            >
              {eyebrow}
            </p>
          )}
          <p
            className={`m-0 text-[#F8F4EE]/92 text-[clamp(0.98rem,4vw,1.06rem)] leading-[1.95] sm:leading-[2.1] font-light italic tracking-[0.03em] font-serif break-words px-2 whitespace-pre-line ${isRightAligned ? 'border-r border-[#C5A059]/30 pr-6 text-right' : 'border-l border-[#C5A059]/30 pl-6 text-left'}`}
          >
            {text}
          </p>
        </motion.div>
      )}
    </motion.section>
  );
});
