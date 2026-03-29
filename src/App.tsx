/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useBirthdayFlow } from './composables/useBirthdayFlow';
import { useBackgroundAudio } from './composables/useBackgroundAudio';
import { birthdayContent } from './data/content';
import { IntroOverlay } from './components/IntroOverlay';
import { TitleMessage } from './components/TitleMessage';
import { MainBlessing } from './components/MainBlessing';
import { MemoryNote } from './components/MemoryNote';
import { FinalWish } from './components/FinalWish';
import { BirthdayStep } from './types/birthday';

import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

const FullSceneCanvas = React.lazy(() =>
  import('./components/FullSceneCanvas').then((module) => ({
    default: module.FullSceneCanvas,
  })),
);

type ExperienceMode = 'full' | 'lite' | 'readable';
const MEMORY_STEPS: BirthdayStep[] = ['memory-1', 'memory-2', 'memory-3'];

const TRANSITION_ONLY_STEPS = new Set<BirthdayStep>([
  'intro',
  'ready',
  'opening',
  'cosmic-core',
  'timeline-expand',
]);

type NavigatorConnection = {
  saveData?: boolean;
  effectiveType?: string;
};

function getPreferredExperienceMode(): ExperienceMode {
  const connection = (
    navigator as Navigator & {
      connection?: NavigatorConnection;
    }
  ).connection;

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const saveData = connection?.saveData === true;
  const slowConnection = connection?.effectiveType
    ? ['slow-2g', '2g'].includes(connection.effectiveType)
    : false;
  const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  const lowMemory =
    typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 'number' &&
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
  const isLineBrowser = /Line\//i.test(navigator.userAgent);
  const shouldUseReadable = saveData || slowConnection;

  if (shouldUseReadable) {
    return 'readable';
  }

  if (prefersReducedMotion || lowCpu || lowMemory || isLineBrowser) {
    return 'lite';
  }

  return 'full';
}

function getInitialExperienceMode(): ExperienceMode {
  if (typeof window === 'undefined') {
    return 'lite';
  }

  const preferredExperienceMode = getPreferredExperienceMode();
  if (preferredExperienceMode !== 'full') {
    return preferredExperienceMode;
  }

  try {
    const canvas = document.createElement('canvas');
    const hasWebglSupport = !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );

    return hasWebglSupport ? 'full' : 'lite';
  } catch {
    return 'lite';
  }
}

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

export default function App() {
  const activeSteps = React.useMemo<BirthdayStep[]>(() => {
    const activeMemorySteps = MEMORY_STEPS.slice(0, birthdayContent.story.memories.length);

    return [
      'ready',
      'opening',
      'cosmic-core',
      'timeline-expand',
      'node-before',
      'node-us',
      ...activeMemorySteps,
      'node-now',
      'title',
      'message',
      'message2',
      'final',
    ];
  }, []);

  const memoryAutoAdvanceDelays = React.useMemo<Partial<Record<BirthdayStep, number>>>(() => {
    const activeMemorySteps = MEMORY_STEPS.slice(0, birthdayContent.story.memories.length);

    return birthdayContent.story.memories.reduce<Partial<Record<BirthdayStep, number>>>(
      (delays, memoryMoment, index) => {
        const memoryStep = activeMemorySteps[index];
        if (!memoryStep || !memoryMoment.pauseMs) {
          return delays;
        }

        delays[memoryStep] = memoryMoment.pauseMs;
        return delays;
      },
      {},
    );
  }, []);

  const { step, openGift, prevStep, nextStep } = useBirthdayFlow(
    activeSteps,
    memoryAutoAdvanceDelays,
    'ready',
  );
  const backgroundAudio = useBackgroundAudio(birthdayContent.backgroundAudio);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>(getInitialExperienceMode);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canUseCursorTracking = window.matchMedia?.('(pointer:fine)').matches;
    if (!canUseCursorTracking) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const setDegradedExperienceMode = React.useCallback((mode: ExperienceMode) => {
    setExperienceMode((currentMode) => {
      if (currentMode === 'readable') {
        return currentMode;
      }

      if (currentMode === 'lite' && mode === 'full') {
        return currentMode;
      }

      return mode;
    });
  }, []);

  useEffect(() => {
    setExperienceMode(getInitialExperienceMode());
  }, []);

  const isReadableExperience = experienceMode === 'readable';
  const isLiteExperience = experienceMode === 'lite';
  const shouldRenderFullScene =
    !isReadableExperience && !isLiteExperience && step !== 'ready' && step !== 'opening';
  const showNavigation = !isReadableExperience && !TRANSITION_ONLY_STEPS.has(step) && step !== 'ready';

  const handleSceneFailure = () => {
    setDegradedExperienceMode('lite');
  };

  const handleOpenGift = React.useCallback(() => {
    backgroundAudio.start();
    openGift();
  }, [backgroundAudio, openGift]);

  return (
    <main className="relative min-h-[100svh] min-h-[100dvh] overflow-x-hidden bg-[#05050A] font-sans text-[#F8F4EE] selection:bg-[#C5A059]/30">
      {/* Custom Ethereal Cursor */}
      <motion.div 
        className="fixed top-0 left-0 w-6 h-6 rounded-full border border-[#C5A059]/30 pointer-events-none z-[9999] hidden sm:block"
        animate={{ x: mousePos.x - 12, y: mousePos.y - 12 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250, mass: 0.5 }}
      >
        <div className="absolute inset-0 rounded-full bg-[#C5A059]/5 blur-[2px]" />
      </motion.div>

      {/* Background Gradients - Atmospheric & Immersive */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          animate={
            prefersReducedMotion || isLiteExperience
              ? { opacity: 0.24, scale: 1 }
              : {
                  opacity: [0.2, 0.4, 0.2],
                  scale: [1, 1.1, 1],
                }
          }
          transition={
            prefersReducedMotion || isLiteExperience
              ? { duration: 0.2 }
              : { duration: 20, repeat: Infinity, ease: "easeInOut" }
          }
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#1A1625_0%,transparent_70%)]" 
        />
        <motion.div 
          animate={
            prefersReducedMotion || isLiteExperience
              ? { opacity: 0.18, scale: 1 }
              : {
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1.1, 1, 1.1],
                }
          }
          transition={
            prefersReducedMotion || isLiteExperience
              ? { duration: 0.2 }
              : { duration: 25, repeat: Infinity, ease: "easeInOut" }
          }
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,#2D2541_0%,transparent_60%)]" 
        />
        <div className="absolute inset-0 bg-[#05050A]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B1020]/50 to-[#05050A]" />
      </div>

      {/* 3D Scene Layer */}
      {shouldRenderFullScene && (
        <div className="pointer-events-none absolute inset-0 z-[1]">
          <SceneErrorBoundary onError={handleSceneFailure}>
            <Suspense fallback={null}>
              <FullSceneCanvas step={step} onSceneFailure={handleSceneFailure} />
            </Suspense>
          </SceneErrorBoundary>
        </div>
      )}

      {/* UI Layer */}
      <section className="relative z-10 flex min-h-[100svh] min-h-[100dvh] w-full flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.75rem,env(safe-area-inset-bottom))] pointer-events-none">
        <AnimatePresence mode="wait">
          {isReadableExperience ? (
            <motion.div 
              key="readable-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto flex w-full max-w-4xl flex-col items-start gap-20 px-2 py-12 pointer-events-auto sm:px-16 sm:py-20"
            >
              <IntroOverlay text={birthdayContent.opening.introText} mode="inline" />
              <IntroOverlay text={birthdayContent.story.before.text} mode="inline" />
              <MemoryNote
                text={birthdayContent.story.us.text}
                image={birthdayContent.story.us.image}
                imageAlt={birthdayContent.story.us.imageAlt}
                imageLoading="eager"
                imageFetchPriority="high"
              />
              {birthdayContent.story.memories.map((memoryMoment, index) => (
                <MemoryNote
                  key={memoryMoment.id}
                  text={memoryMoment.caption}
                  image={memoryMoment.image}
                  imageAlt={memoryMoment.imageAlt}
                  eyebrow={memoryMoment.eyebrow}
                  align={index % 2 === 1 ? 'right' : 'left'}
                  imageLoading={index === 0 ? 'eager' : 'lazy'}
                  imageFetchPriority={index === 0 ? 'high' : 'low'}
                />
              ))}
              <IntroOverlay text={birthdayContent.story.after.text} mode="inline" />
              <TitleMessage
                title={birthdayContent.blessing.title}
                subtitle={birthdayContent.blessing.subtitle}
              />
              <MainBlessing message={birthdayContent.blessing.reflection} />
              <MainBlessing message={birthdayContent.blessing.wish} />
              <FinalWish text={birthdayContent.closing.text} />
            </motion.div>
          ) : (
            <>
          {['cosmic-core', 'timeline-expand'].includes(step) && birthdayContent.opening.giftPrompt.transition && (
            <IntroOverlay key="transition" text={birthdayContent.opening.giftPrompt.transition} />
          )}

          {(step === 'ready' || step === 'opening') && (
            <div key="ready-stage" className="pointer-events-auto">
              <OpeningStage
                content={birthdayContent.opening}
                stageOverride={step === 'opening' ? 'revealed' : undefined}
                onOpen={handleOpenGift}
              />
            </div>
          )}

          {step === 'node-before' && (
            <IntroOverlay key="node-before" text={birthdayContent.story.before.text} />
          )}

          {step === 'node-us' && (
            <div key="node-us" className="pointer-events-auto">
              <MemoryNote
                text={birthdayContent.story.us.text}
                image={birthdayContent.story.us.image}
                imageAlt={birthdayContent.story.us.imageAlt}
                imageLoading="eager"
                imageFetchPriority="high"
              />
            </div>
          )}

          {birthdayContent.story.memories.map((memoryMoment, index) => {
            const memoryStep = MEMORY_STEPS[index];
            if (step !== memoryStep) {
              return null;
            }

            return (
              <div key={memoryMoment.id} className="pointer-events-auto">
                <MemoryNote
                  text={memoryMoment.caption}
                  image={memoryMoment.image}
                  imageAlt={memoryMoment.imageAlt}
                  eyebrow={memoryMoment.eyebrow}
                  align={index % 2 === 1 ? 'right' : 'left'}
                  imageLoading="eager"
                  imageFetchPriority="high"
                />
              </div>
            );
          })}

          {step === 'node-now' && (
            <IntroOverlay key="node-now" text={birthdayContent.story.after.text} />
          )}

          {step === 'title' && (
            <div key="title" className="pointer-events-auto">
              <TitleMessage
                title={birthdayContent.blessing.title}
                subtitle={birthdayContent.blessing.subtitle}
              />
            </div>
          )}

          {step === 'message' && (
            <div key="message" className="pointer-events-auto">
              <MainBlessing message={birthdayContent.blessing.reflection} />
            </div>
          )}
          
          {step === 'message2' && (
            <div key="message2" className="pointer-events-auto">
              <MainBlessing message={birthdayContent.blessing.wish} />
            </div>
          )}

          {step === 'final' && (
            <div key="final" className="pointer-events-auto">
              <FinalWish text={birthdayContent.closing.text} />
            </div>
          )}

            </>
          )}
        </AnimatePresence>
      </section>

      {/* Manual Navigation Controls - Refined Luxury Style */}
      <AnimatePresence>
        {showNavigation && (
          <NavigationControls 
            step={step} 
            prevStep={prevStep} 
            nextStep={nextStep} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {backgroundAudio.isAvailable && backgroundAudio.hasStarted && !TRANSITION_ONLY_STEPS.has(step) && (
          <MusicToggle
            isMuted={backgroundAudio.isMuted}
            onToggle={backgroundAudio.toggleMuted}
          />
        )}
      </AnimatePresence>

    </main>
  );
}

const OpeningStage = React.memo(function OpeningStage({
  content,
  stageOverride,
  onOpen,
}: {
  content: typeof birthdayContent.opening;
  stageOverride?: 'revealed';
  onOpen: () => void;
}) {
  const [authStage, setAuthStage] = React.useState<'idle' | 'scanning' | 'revealed'>('idle');
  const openTimerRef = React.useRef<number | null>(null);
  const [displayPhoto, setDisplayPhoto] = React.useState(content.featuredPhoto.image);
  const [isPhotoLoaded, setIsPhotoLoaded] = React.useState(false);
  const currentStage = stageOverride ?? authStage;

  React.useEffect(() => {
    setDisplayPhoto(content.featuredPhoto.image);
    setIsPhotoLoaded(false);
  }, [content.featuredPhoto.image]);

  React.useEffect(() => {
    return () => {
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current);
      }
    };
  }, []);

  const handleAuthenticate = React.useCallback(() => {
    if (stageOverride || authStage !== 'idle') {
      return;
    }

    setAuthStage('scanning');
    openTimerRef.current = window.setTimeout(() => {
      setAuthStage('revealed');
      openTimerRef.current = window.setTimeout(() => {
        onOpen();
      }, 220);
    }, 1350);
  }, [authStage, onOpen, stageOverride]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex w-[min(92vw,29rem)] flex-col items-start gap-7 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] px-6 py-7 text-left shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-8 sm:py-9"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-20 shrink-0">
          <div className="absolute inset-x-0 bottom-0 h-11 rounded-[1rem] border border-[#C5A059]/35 bg-white/[0.03]" />
          <div className="absolute left-1/2 top-1 h-8 w-12 -translate-x-1/2 rounded-t-[0.8rem] border border-[#C5A059]/45 bg-white/[0.05]" />
          <div className="absolute left-1/2 top-6 h-[1px] w-12 -translate-x-1/2 bg-[#C5A059]/45" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[0.64rem] uppercase tracking-[0.32em] text-[#C5A059]/82">
            {content.cardEyebrow}
          </span>
          <h1 className="m-0 text-[clamp(1.6rem,7vw,2.2rem)] font-light italic font-serif tracking-[-0.02em] text-[#F8F4EE]">
            {content.cardTitle}
          </h1>
        </div>
      </div>

      <p className="m-0 whitespace-pre-line text-[clamp(1rem,4.2vw,1.08rem)] leading-[1.9] font-light italic font-serif tracking-[0.03em] text-[#F8F4EE]/92">
        {content.introText}
      </p>

      <div className="h-px w-full bg-gradient-to-r from-[#C5A059]/30 via-white/10 to-transparent" />

      <div className="grid w-full gap-5">
        <motion.div
          initial={false}
          animate={currentStage === 'revealed' ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.82, y: 0, scale: 0.985 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[18.5rem] overflow-hidden rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] p-[0.65rem] shadow-[0_22px_60px_rgba(0,0,0,0.28)]"
        >
          <div className="pointer-events-none absolute inset-x-6 top-2 h-5 rounded-b-[1.2rem] bg-white/[0.075] blur-md" />
          <div className="pointer-events-none absolute left-1/2 top-3 z-[3] h-1 w-16 -translate-x-1/2 rounded-full bg-white/30" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.14),rgba(255,255,255,0.03)_48%,rgba(0,0,0,0.08)_100%)]">
            <motion.img
              src={displayPhoto}
              alt=""
              aria-hidden="true"
              initial={false}
              animate={
                currentStage === 'revealed'
                  ? { scale: 1.04, filter: 'blur(18px)', opacity: 0.28 }
                  : { scale: 1.1, filter: 'blur(22px)', opacity: 0.34 }
              }
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />

            <motion.img
              src={displayPhoto}
              alt={content.featuredPhoto.imageAlt}
              onLoad={() => setIsPhotoLoaded(true)}
              onError={() => {
                if (displayPhoto !== birthdayContent.story.us.image) {
                  setDisplayPhoto(birthdayContent.story.us.image);
                  return;
                }

                setIsPhotoLoaded(true);
              }}
              initial={false}
              animate={
                currentStage === 'revealed'
                  ? { scale: 1, filter: 'blur(0px)', opacity: 1 }
                  : { scale: 1.02, filter: 'blur(10px)', opacity: 0.72 }
              }
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[1] h-full w-full object-contain px-2 pt-2"
              loading="eager"
              fetchPriority="high"
              decoding="sync"
            />

            <motion.div
              initial={false}
              animate={{ opacity: isPhotoLoaded ? 0 : 1 }}
              transition={{ duration: 0.35 }}
              className="pointer-events-none absolute inset-0 z-[2] rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]"
            />

            <motion.div
              initial={false}
              animate={
                currentStage === 'scanning'
                  ? { opacity: [0.1, 0.38, 0.1], y: ['-100%', '120%', '120%'] }
                  : currentStage === 'revealed'
                    ? { opacity: 0 }
                    : { opacity: 0.1, y: '0%' }
              }
              transition={
                currentStage === 'scanning'
                  ? { duration: 1.1, repeat: 0, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#C5A059]/0 via-[#C5A059]/45 to-[#C5A059]/0 blur-xl"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/48 via-black/10 to-transparent" />

            <motion.div
              initial={false}
              animate={
                currentStage === 'revealed'
                  ? { opacity: [0, 0.24, 0.12], scale: [0.92, 1.04, 1] }
                  : { opacity: 0, scale: 0.96 }
              }
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute inset-0 rounded-[1.35rem] border border-[#E6C98A]/25 bg-[radial-gradient(circle_at_50%_35%,rgba(230,201,138,0.24),rgba(230,201,138,0.06)_38%,transparent_72%)]"
            />
          </div>

          <motion.div
            initial={false}
            animate={
              currentStage === 'revealed'
                ? { opacity: 1, y: 0 }
                : { opacity: 0.84, y: 0 }
            }
            transition={{ duration: 0.45 }}
            className="mt-3 px-1"
          >
            <div className="rounded-[1rem] border border-white/14 bg-[linear-gradient(180deg,rgba(8,8,12,0.68),rgba(8,8,12,0.52))] px-3.5 py-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.24)] backdrop-blur-md">
                <div className="flex flex-col gap-1">
                  <span className="text-[0.6rem] uppercase tracking-[0.28em] text-[#E4C27E]">
                    {currentStage === 'revealed'
                      ? content.photoUnlockedEyebrow
                      : content.photoLockedEyebrow}
                  </span>
                  <span className="text-[0.98rem] font-light italic font-serif tracking-[0.01em] text-[#FFF8EE]">
                    {currentStage === 'revealed'
                      ? content.photoUnlockedText
                      : content.photoLockedText}
                  </span>
                </div>
              </div>
          </motion.div>
        </motion.div>

        <motion.button
          type="button"
          onClick={handleAuthenticate}
          disabled={currentStage !== 'idle'}
          whileTap={currentStage === 'idle' ? { scale: 0.985 } : undefined}
          className="flex min-h-[3.75rem] w-full items-center gap-4 rounded-[1.2rem] border border-[#C5A059]/24 bg-[linear-gradient(180deg,rgba(248,244,238,0.08),rgba(248,244,238,0.04))] px-5 py-4 text-left shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition-colors duration-300 hover:bg-[#F8F4EE]/[0.08] disabled:cursor-default"
          aria-label={birthdayContent.ui.openGiftAriaLabel}
        >
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-[#C5A059]/16 bg-black/20">
            <motion.div
              initial={false}
              animate={
                currentStage === 'scanning'
                  ? { scale: [1, 1.03, 1], opacity: [0.16, 0.45, 0.16] }
                  : currentStage === 'revealed'
                    ? { scale: 1.01, opacity: 0.52 }
                    : { scale: 1, opacity: 0.18 }
              }
              transition={
                currentStage === 'scanning'
                  ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
              className="absolute inset-0 rounded-[1rem] border border-[#C5A059]/18"
            />
            <div className="relative h-7 w-7">
              <div className="absolute left-0 top-0 h-2.5 w-2.5 rounded-tl-[0.35rem] border-l-[1.5px] border-t-[1.5px] border-[#F8F4EE]/78" />
              <div className="absolute right-0 top-0 h-2.5 w-2.5 rounded-tr-[0.35rem] border-r-[1.5px] border-t-[1.5px] border-[#F8F4EE]/78" />
              <div className="absolute bottom-0 left-0 h-2.5 w-2.5 rounded-bl-[0.35rem] border-b-[1.5px] border-l-[1.5px] border-[#F8F4EE]/78" />
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-br-[0.35rem] border-b-[1.5px] border-r-[1.5px] border-[#F8F4EE]/78" />
              <motion.div
                initial={false}
                animate={
                  currentStage === 'scanning'
                    ? { opacity: [0.16, 0.55, 0.16] }
                    : currentStage === 'revealed'
                      ? { opacity: 0.2 }
                      : { opacity: 0.08 }
                }
                transition={
                  currentStage === 'scanning'
                    ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.25 }
                }
                className="absolute inset-[0.35rem] rounded-[0.35rem] border border-white/20"
              />
              <motion.div
                initial={false}
                animate={
                  currentStage === 'scanning'
                    ? { opacity: [0.08, 0.8, 0.08], y: ['-85%', '85%', '85%'] }
                    : currentStage === 'revealed'
                      ? { opacity: 0 }
                      : { opacity: 0, y: '0%' }
                }
                transition={
                  currentStage === 'scanning'
                    ? { duration: 1.15, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.25 }
                }
                className="absolute inset-x-1 top-1/2 h-px bg-[linear-gradient(90deg,transparent,rgba(248,244,238,0.92),transparent)]"
              />
              <motion.div
                initial={false}
                animate={
                  currentStage === 'revealed'
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.7 }
                }
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#C5A059]" />
              </motion.div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[0.72rem] uppercase tracking-[0.24em] text-[#C5A059]/86">
              {currentStage === 'idle'
                ? content.faceIdIdleEyebrow
                : currentStage === 'scanning'
                  ? content.faceIdScanningEyebrow
                  : content.faceIdUnlockedEyebrow}
            </span>
            <span className="text-[1rem] font-light italic font-serif text-[#F8F4EE]">
              {currentStage === 'idle'
                ? content.faceIdIdleText
                : currentStage === 'scanning'
                  ? content.faceIdScanningText
                  : content.faceIdUnlockedText}
            </span>
          </div>
        </motion.button>
      </div>
    </motion.section>
  );
});

const NavigationControls = React.memo(({ step, prevStep, nextStep }: { step: string, prevStep: () => void, nextStep: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-0 right-0 flex justify-center items-center gap-12 sm:gap-24 pointer-events-auto z-[100]"
  >
    <motion.button 
      onClick={prevStep}
      disabled={step === 'intro'}
      whileHover="hover"
      initial="initial"
      className="group flex flex-col items-center gap-2 text-[#F8F4EE]/40 hover:text-[#F8F4EE] disabled:opacity-0 disabled:pointer-events-none transition-all duration-700"
      aria-label="Previous step"
    >
      <ChevronLeft className="w-5 h-5 mb-1 group-hover:-translate-x-1 transition-transform duration-500" />
      <span className="text-[0.6rem] tracking-[0.4em] uppercase font-light">
        {birthdayContent.ui.previousLabel}
      </span>
      <motion.div 
        variants={{
          initial: { width: 16 },
          hover: { width: 48 }
        }}
        className="h-[1px] bg-[#C5A059]/60 transition-all duration-700 ease-in-out" 
      />
    </motion.button>
    <motion.button 
      onClick={nextStep}
      disabled={step === 'ready' || step === 'final'}
      whileHover="hover"
      initial="initial"
      className="group flex flex-col items-center gap-2 text-[#F8F4EE]/40 hover:text-[#F8F4EE] disabled:opacity-0 disabled:pointer-events-none transition-all duration-700"
      aria-label="Next step"
    >
      <ChevronRight className="w-5 h-5 mb-1 group-hover:translate-x-1 transition-transform duration-500" />
      <span className="text-[0.6rem] tracking-[0.4em] uppercase font-light">
        {birthdayContent.ui.nextLabel}
      </span>
      <motion.div 
        variants={{
          initial: { width: 16 },
          hover: { width: 48 }
        }}
        className="h-[1px] bg-[#C5A059]/60 transition-all duration-700 ease-in-out" 
      />
    </motion.button>
  </motion.div>
));

const MusicToggle = React.memo(function MusicToggle({
  isMuted,
  onToggle,
}: {
  isMuted: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onToggle}
      className="pointer-events-auto fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[110] flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[0.62rem] uppercase tracking-[0.24em] text-[#F8F4EE]/78 backdrop-blur-xl sm:right-6"
      aria-label={isMuted ? birthdayContent.ui.musicOffLabel : birthdayContent.ui.musicOnLabel}
    >
      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      <span>{isMuted ? birthdayContent.ui.musicOffLabel : birthdayContent.ui.musicOnLabel}</span>
    </motion.button>
  );
});
