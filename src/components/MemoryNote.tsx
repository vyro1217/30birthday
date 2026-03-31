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
  styleVariant?: 'default' | 'timeline';
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
  styleVariant = 'default',
}: MemoryNoteProps) {
  const isTimelineVariant = styleVariant === 'timeline';
  const isRightAligned = align === 'right';
  const isMobileCard = compact || veryCompact;
  const pageTurnOffset = isTimelineVariant ? (pageTurnDirection === 'forward' ? 18 : -18) : (pageTurnDirection === 'forward' ? 32 : -32);
  const pageTurnRotate = isTimelineVariant ? (pageTurnDirection === 'forward' ? 3 : -3) : (pageTurnDirection === 'forward' ? 7 : -7);
  const [isImageLoaded, setIsImageLoaded] = useState(!image);
  const [hasImageError, setHasImageError] = useState(false);
  const textLength = (text ?? '').replace(/\s+/g, '').length;
  const isHeroImage = imagePresentation === 'hero';
  const isQuietImage = imagePresentation === 'quiet';
  const favorText = textLength > 110 || compact;
  const stronglyFavorText = textLength > 170 || veryCompact;
  const useBottomImageOverlay = Boolean(image && text && (isMobileCard || !stronglyFavorText) );
  const imageMaxHeightClass = 'max-h-[calc(min(100dvh,var(--stage-max-height))-1rem)]';
  const imageWrapperClass = isMobileCard
    ? isTimelineVariant
      ? 'w-full'
      : 'left-1/2 w-[100dvw] max-w-none -translate-x-1/2'
    : 'w-full';
  const imageAspectClass = stronglyFavorText
    ? isQuietImage
      ? 'aspect-[4/4.7] max-h-[calc(min(48dvh,var(--stage-max-height))-1.5rem)]'
      : `aspect-auto ${imageMaxHeightClass}`
    : favorText
      ? isQuietImage
        ? 'aspect-[4/4.8] max-h-[calc(min(44dvh,var(--stage-max-height))-1.5rem)]'
        : `aspect-auto ${imageMaxHeightClass}`
      : isHeroImage
        ? `aspect-[4/5] ${imageMaxHeightClass}`
        : isQuietImage
          ? 'aspect-[4/4.9] max-h-[calc(min(40dvh,var(--stage-max-height))-1.5rem)]'
          : `aspect-[4/4.8] max-h-[calc(min(76dvh,var(--stage-max-height))-1.25rem)]`;
  const imageFrameClass = isMobileCard ? 'h-full' : '';
  const imageElementSizeClass = isMobileCard ? 'h-full' : '';
  const imageBlockClass = isQuietImage
    ? `${isMobileCard ? '' : isRightAligned ? 'ml-auto' : 'mr-auto'} ${veryCompact ? 'mb-1' : compact ? 'mb-1.5' : 'mb-2'}`
    : '';
  const textShellClass = image
    ? isQuietImage
      ? 'border-white/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))]'
      : 'border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]'
    : 'border-transparent bg-transparent';
  const overlayFrameClass = isMobileCard
    ? veryCompact
      ? 'min-h-[7.6rem] max-h-[9.25rem] px-3 pb-3 pt-10'
      : 'min-h-[8.6rem] max-h-[10.5rem] px-4 pb-4 pt-11'
    : veryCompact
      ? 'px-3 pb-3 pt-8'
      : compact
        ? 'px-3.5 pb-3.5 pt-9'
        : 'px-4 pb-4 pt-12';
  const overlayInnerClass = isMobileCard
    ? veryCompact
      ? 'max-w-[min(100%,18.5rem)]'
      : 'max-w-[min(100%,21rem)]'
    : 'max-w-full';

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
      className={`flex w-full ${veryCompact ? 'max-w-[20rem]' : compact ? 'max-w-[22.5rem]' : 'max-w-[25rem]'} h-full max-h-[calc(var(--stage-max-height)-0.75rem)] min-h-0 flex-col ${isMobileCard ? 'overflow-visible' : 'overflow-hidden'} pb-2 ${stronglyFavorText ? 'gap-2' : veryCompact ? 'gap-2.5' : compact ? 'gap-3' : 'gap-6 sm:gap-7'} ${isRightAligned ? 'items-end text-right' : 'items-start text-left'} ${isTimelineVariant ? 'rounded-[1.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] px-2.5 py-2.5 shadow-[0_14px_30px_rgba(0,0,0,0.25)]' : ''}`}
    >
      {image && !hasImageError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={`relative shrink-0 overflow-hidden rounded-[20px] sm:rounded-[24px] ${isTimelineVariant ? 'sm:rounded-[20px]' : ''} ${imageWrapperClass} ${imageBlockClass} ${imageFrameClass}`}
        >
          {!isTimelineVariant && !favorText && !isQuietImage && !isMobileCard && <div className="pointer-events-none absolute inset-x-4 top-[0.5rem] h-full rounded-[22px] border border-white/6 bg-white/[0.018] shadow-[0_12px_24px_rgba(0,0,0,0.1)]" />}
          {!isTimelineVariant && !favorText && !isQuietImage && !isMobileCard && <div className="pointer-events-none absolute inset-x-1.5 top-[0.12rem] h-full rounded-[22px] border border-white/5 bg-white/[0.012]" />}
          {!isTimelineVariant && !favorText && !isQuietImage && !isMobileCard && <div className="absolute -inset-4 border border-white/5 rounded-[32px] sm:rounded-[40px] pointer-events-none" />}
          {!isTimelineVariant && !favorText && isQuietImage && !isMobileCard && <div className="pointer-events-none absolute -inset-3 rounded-[28px] border border-white/4" />}
          <div className={`absolute inset-0 z-10 rounded-[20px] pointer-events-none sm:rounded-[24px] ${useBottomImageOverlay ? (isMobileCard ? 'bg-[linear-gradient(180deg,rgba(8,8,12,0.04)_0%,rgba(8,8,12,0.06)_36%,rgba(8,8,12,0.44)_62%,rgba(8,8,12,0.82)_100%)]' : 'bg-[linear-gradient(180deg,rgba(8,8,12,0.04)_0%,rgba(8,8,12,0.08)_44%,rgba(8,8,12,0.42)_72%,rgba(8,8,12,0.82)_100%)]') : isQuietImage ? 'bg-[linear-gradient(180deg,rgba(8,8,12,0.02),rgba(8,8,12,0.14)_70%,rgba(8,8,12,0.26))]' : 'bg-gradient-to-t from-black/25 to-transparent'}`} />
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
            className={`w-full rounded-[20px] border ${isQuietImage ? 'border-white/8 shadow-[0_14px_30px_rgba(0,0,0,0.36)]' : 'border-white/10 shadow-[0_22px_52px_rgba(0,0,0,0.5)]'} ${isTimelineVariant ? 'sm:rounded-[20px]' : 'sm:rounded-[24px]'} object-cover object-center ${imageAspectClass} ${imageElementSizeClass}`}
            referrerPolicy="no-referrer"
            loading={imageLoading}
            fetchPriority={imageFetchPriority}
            decoding="async"
            sizes={isMobileCard ? '100vw' : isQuietImage ? '(max-width: 640px) 52vw, 220px' : '(max-width: 640px) 88vw, 440px'}
          />
          {useBottomImageOverlay && (
            <div className={`absolute inset-x-0 bottom-0 z-20 flex ${isRightAligned && !isMobileCard ? 'justify-end' : 'justify-start'} ${overlayFrameClass}`}>
              <div className={`flex w-full min-h-0 flex-col ${veryCompact ? 'gap-1.5' : 'gap-2'} ${overlayInnerClass}`}>
                {eyebrow && (
                  <p
                    className={`m-0 shrink-0 uppercase ${veryCompact ? 'text-[0.5rem] tracking-[0.18em]' : 'text-[0.56rem] tracking-[0.22em]'} text-[#F2D59A]/92`}
                    style={{ textShadow: '0 1px 10px rgba(0,0,0,0.35)' }}
                  >
                    {eyebrow}
                  </p>
                )}
                <p
                  className={`touch-scroll m-0 min-h-0 flex-1 overflow-y-auto overscroll-contain whitespace-pre-line break-words font-light italic font-serif text-[#FFF8EE] ${favorText ? 'text-[clamp(0.8rem,2.95vw,0.88rem)] leading-[1.38]' : compact ? 'text-[clamp(0.84rem,3.1vw,0.92rem)] leading-[1.46]' : 'text-[clamp(0.92rem,3.7vw,1rem)] leading-[1.58]'} tracking-[0.01em]`}
                  style={{ textShadow: '0 2px 18px rgba(0,0,0,0.5)' }}
                >
                  {text}
                </p>
              </div>
            </div>
          )}
          {!isTimelineVariant && <div className={`pointer-events-none absolute inset-y-5 ${pageTurnDirection === 'forward' ? 'right-0 w-5 bg-gradient-to-l from-black/10 to-transparent' : 'left-0 w-5 bg-gradient-to-r from-black/10 to-transparent'}`} />}
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
          <div className={`h-full overflow-hidden rounded-[1.15rem] border ${textShellClass}`}>
            <p
              className={`touch-scroll m-0 h-full overflow-y-auto overscroll-contain text-[#F8F4EE]/92 ${stronglyFavorText ? 'text-[clamp(0.8rem,2.95vw,0.86rem)] leading-[1.42]' : favorText ? 'text-[clamp(0.84rem,3.1vw,0.92rem)] leading-[1.5]' : veryCompact ? 'text-[clamp(0.8rem,3vw,0.88rem)] leading-[1.48]' : compact ? 'text-[clamp(0.88rem,3.2vw,0.96rem)] leading-[1.58]' : 'text-[clamp(0.96rem,3.9vw,1.04rem)] leading-[1.8] sm:leading-[1.92]'} font-light italic tracking-[0.01em] font-serif break-words whitespace-pre-line ${image ? (isQuietImage ? (veryCompact ? 'px-3 py-2.5' : compact ? 'px-3.5 py-3' : 'px-4 py-3.5') : veryCompact ? 'px-3 py-2.5' : compact ? 'px-3.5 py-3.5' : 'px-4 py-3.5') : isRightAligned ? 'border-r border-[#C5A059]/24 pl-2 pr-3 text-right' : 'border-l border-[#C5A059]/24 pl-3 pr-1 text-left'} ${image ? 'text-left' : ''}`}
            >
              {text}
            </p>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
});
