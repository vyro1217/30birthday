import React, { memo, useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface MemoryNoteProps {
  text?: string;
  image?: string;
  imageAlt?: string;
  eyebrow?: string;
  imagePresentation?: 'hero' | 'balanced' | 'quiet';
  align?: 'left' | 'right';
  imageLoading?: 'eager' | 'lazy';
  imageFetchPriority?: 'high' | 'low' | 'auto';
  compact?: boolean;
  veryCompact?: boolean;
  pageTurnDirection?: 'forward' | 'backward';
}

export const MemoryNote = memo(function MemoryNote({
  text,
  image,
  imageAlt,
  eyebrow,
  imagePresentation = 'balanced',
  align = 'left',
  imageLoading = 'lazy',
  imageFetchPriority = 'auto',
  compact = false,
  veryCompact = false,
  pageTurnDirection = 'forward',
}: MemoryNoteProps) {
  const isRightAligned = align === 'right';
  const pageTurnOffset = pageTurnDirection === 'forward' ? 32 : -32;
  const pageTurnRotate = pageTurnDirection === 'forward' ? 7 : -7;
  const [isImageLoaded, setIsImageLoaded] = useState(!image);
  const [hasImageError, setHasImageError] = useState(false);
  const textLength = (text ?? '').replace(/\s+/g, '').length;
  const favorText = textLength > 110 || compact;
  const stronglyFavorText = textLength > 170 || veryCompact;
  const useBottomImageOverlay = Boolean(image && text && !stronglyFavorText);
  const imageMaxHeightClass = 'max-h-[calc(min(100dvh,var(--stage-max-height))-1rem)]';
  const imageWrapperClass = 'w-full';
  const imageAspectClass = stronglyFavorText
    ? `aspect-auto ${imageMaxHeightClass}`
    : favorText
      ? imagePresentation === 'quiet'
        ? `aspect-auto max-h-[calc(min(76dvh,var(--stage-max-height))-1.5rem)]`
        : `aspect-auto ${imageMaxHeightClass}`
      : imagePresentation === 'hero'
        ? `aspect-[4/5] ${imageMaxHeightClass}`
        : imagePresentation === 'quiet'
          ? `aspect-[4/4.4] max-h-[calc(min(70dvh,var(--stage-max-height))-1.5rem)]`
          : `aspect-[4/4.8] max-h-[calc(min(76dvh,var(--stage-max-height))-1.25rem)]`;

  useEffect(() => {
    setIsImageLoaded(!image);
    setHasImageError(false);
  }, [image]);

  return (
    <motion.section 
      initial={{ opacity: 0, x: pageTurnOffset, rotateY: pageTurnRotate, scale: 0.985 }}
      animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
      exit={{ opacity: 0, x: -pageTurnOffset * 0.45, rotateY: -pageTurnRotate * 0.65, scale: 0.985 }}
      transition={{ duration: 0.78, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin: pageTurnDirection === 'forward' ? 'right center' : 'left center' }}
      className={`flex ${veryCompact ? 'w-[min(84vw,20rem)]' : compact ? 'w-[min(86vw,22rem)]' : 'w-[min(90vw,25rem)]'} h-full max-h-[calc(var(--stage-max-height)-0.75rem)] min-h-0 flex-col overflow-hidden pb-3 ${stronglyFavorText ? 'gap-2' : veryCompact ? 'gap-2.5' : compact ? 'gap-3' : 'gap-6 sm:gap-7'} ${isRightAligned ? 'items-end text-right' : 'items-start text-left'}`}
    >
      {image && !hasImageError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={`relative shrink-0 overflow-hidden rounded-[20px] sm:rounded-[24px] ${imageWrapperClass}`}
        >
          {!favorText && <div className="pointer-events-none absolute inset-x-4 top-[0.5rem] h-full rounded-[22px] border border-white/6 bg-white/[0.018] shadow-[0_12px_24px_rgba(0,0,0,0.1)]" />}
          {!favorText && <div className="pointer-events-none absolute inset-x-1.5 top-[0.12rem] h-full rounded-[22px] border border-white/5 bg-white/[0.012]" />}
          {!favorText && <div className="absolute -inset-4 border border-white/5 rounded-[32px] sm:rounded-[40px] pointer-events-none" />}
          <div className={`absolute inset-0 z-10 rounded-[20px] pointer-events-none sm:rounded-[24px] ${useBottomImageOverlay ? 'bg-[linear-gradient(180deg,rgba(8,8,12,0.04)_0%,rgba(8,8,12,0.08)_44%,rgba(8,8,12,0.42)_72%,rgba(8,8,12,0.82)_100%)]' : 'bg-gradient-to-t from-black/25 to-transparent'}`} />
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
            className={`w-full rounded-[20px] border border-white/10 object-cover object-center shadow-[0_22px_52px_rgba(0,0,0,0.5)] sm:rounded-[24px] ${imageAspectClass}`}
            referrerPolicy="no-referrer"
            loading={imageLoading}
            fetchPriority={imageFetchPriority}
            decoding="async"
            sizes="(max-width: 640px) 88vw, 440px"
          />
          {useBottomImageOverlay && (
            <div className={`absolute inset-x-0 bottom-0 z-20 flex flex-col ${veryCompact ? 'gap-1.5 px-3 pb-3 pt-8' : compact ? 'gap-2 px-3.5 pb-3.5 pt-10' : 'gap-2.5 px-4 pb-4 pt-12'}`}>
              {eyebrow && (
                <p
                  className={`m-0 uppercase ${veryCompact ? 'text-[0.5rem] tracking-[0.18em]' : 'text-[0.56rem] tracking-[0.22em]'} text-[#F2D59A]/92`}
                  style={{ textShadow: '0 1px 10px rgba(0,0,0,0.35)' }}
                >
                  {eyebrow}
                </p>
              )}
              <p
                className={`m-0 max-h-[42%] overflow-y-auto overscroll-contain whitespace-pre-line break-words font-light italic font-serif text-[#FFF8EE] ${favorText ? 'text-[clamp(0.8rem,2.95vw,0.88rem)] leading-[1.38]' : compact ? 'text-[clamp(0.84rem,3.1vw,0.92rem)] leading-[1.46]' : 'text-[clamp(0.92rem,3.7vw,1rem)] leading-[1.58]'} tracking-[0.01em]`}
                style={{ textShadow: '0 2px 18px rgba(0,0,0,0.5)' }}
              >
                {text}
              </p>
            </div>
          )}
          <div className={`pointer-events-none absolute inset-y-5 ${pageTurnDirection === 'forward' ? 'right-0 w-5 bg-gradient-to-l from-black/10 to-transparent' : 'left-0 w-5 bg-gradient-to-r from-black/10 to-transparent'}`} />
        </motion.div>
      )}
      {text && !useBottomImageOverlay && (
        <motion.div
          initial={{ opacity: 0, x: isRightAligned ? 10 : -10 }}
          animate={{ opacity: 0.9, x: 0 }}
          transition={{ delay: 0.14, duration: 0.65 }}
          className="min-h-0 flex-1 w-full overflow-hidden"
        >
          {eyebrow && (
            <p
              className={`mb-2 text-[0.58rem] uppercase tracking-[0.22em] text-[#C5A059]/72 ${isRightAligned ? 'text-right' : 'text-left'}`}
            >
              {eyebrow}
            </p>
          )}
          <div className={`h-full overflow-hidden rounded-[1.25rem] border ${image ? 'border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]' : 'border-transparent bg-transparent'}`}>
            <p
              className={`m-0 h-full overflow-y-auto overscroll-contain text-[#F8F4EE]/92 ${stronglyFavorText ? 'text-[clamp(0.8rem,2.95vw,0.86rem)] leading-[1.42]' : favorText ? 'text-[clamp(0.84rem,3.1vw,0.92rem)] leading-[1.5]' : veryCompact ? 'text-[clamp(0.8rem,3vw,0.88rem)] leading-[1.46]' : compact ? 'text-[clamp(0.86rem,3.2vw,0.94rem)] leading-[1.54]' : 'text-[clamp(0.96rem,3.9vw,1.04rem)] leading-[1.8] sm:leading-[1.92]'} font-light italic tracking-[0.01em] font-serif break-words whitespace-pre-line ${image ? (veryCompact ? 'px-3 py-2.5' : compact ? 'px-3.5 py-3' : 'px-4 py-3.5') : isRightAligned ? 'border-r border-[#C5A059]/24 pl-2 pr-3 text-right' : 'border-l border-[#C5A059]/24 pl-3 pr-1 text-left'} ${image ? 'text-left' : ''}`}
            >
              {text}
            </p>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
});
