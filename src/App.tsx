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

function getPreferredExperienceMode(): ExperienceMode {
  const connection = navigator.connection as
    | (Navigator['connection'] & { saveData?: boolean; effectiveType?: string })
    | undefined;

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
  const shouldUseReadable = saveData || slowConnection || (isLineBrowser && (lowCpu || lowMemory));

  if (shouldUseReadable) {
    return 'readable';
  }

  if (prefersReducedMotion || lowCpu || lowMemory || isLineBrowser) {
    return 'lite';
  }

  return 'full';
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

function BootOverlay() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-[120] flex items-center justify-center bg-[#05050A]"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-20 rounded-[1rem] border border-[#C5A059]/30 bg-white/[0.03]" />
        <p className="m-0 text-[0.72rem] uppercase tracking-[0.28em] text-[#C5A059]/72">
          {birthdayContent.ui.bootLabel}
        </p>
      </div>
    </motion.div>
  );
}

export default function App() {
  const activeSteps = React.useMemo<BirthdayStep[]>(() => {
    const activeMemorySteps = MEMORY_STEPS.slice(0, birthdayContent.memorySequence.length);

    return [
      'intro',
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
    const activeMemorySteps = MEMORY_STEPS.slice(0, birthdayContent.memorySequence.length);

    return birthdayContent.memorySequence.reduce<Partial<Record<BirthdayStep, number>>>(
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

  const { step, openGift, prevStep, nextStep } = useBirthdayFlow(activeSteps, memoryAutoAdvanceDelays);
  const backgroundAudio = useBackgroundAudio(birthdayContent.backgroundAudio);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>('full');
  const [isBooting, setIsBooting] = useState(true);
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
    const preferredExperienceMode = getPreferredExperienceMode();
    if (preferredExperienceMode !== 'full') {
      setExperienceMode(preferredExperienceMode);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const support = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      if (!support) {
        setExperienceMode('lite');
      }
    } catch {
      setExperienceMode('lite');
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsBooting(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  const isReadableExperience = experienceMode === 'readable';
  const isLiteExperience = experienceMode === 'lite';
  const showNavigation = !isReadableExperience && !TRANSITION_ONLY_STEPS.has(step);

  const handleSceneFailure = () => {
    setDegradedExperienceMode('lite');
  };

  const handleOpenGift = React.useCallback(() => {
    backgroundAudio.start();
    openGift();
  }, [backgroundAudio, openGift]);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#05050A] font-sans text-[#F8F4EE] selection:bg-[#C5A059]/30">
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
      {!isReadableExperience && !isLiteExperience && (
        <div className="absolute inset-0 z-[1]">
          <SceneErrorBoundary onError={handleSceneFailure}>
            <Suspense fallback={null}>
              <FullSceneCanvas step={step} onOpen={handleOpenGift} onSceneFailure={handleSceneFailure} />
            </Suspense>
          </SceneErrorBoundary>
        </div>
      )}

      {/* UI Layer */}
      <section className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center gap-6 px-6 py-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.75rem,env(safe-area-inset-bottom))] pointer-events-none">
        <AnimatePresence mode="wait">
          {isReadableExperience ? (
            <motion.div 
              key="readable-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto flex max-h-[100dvh] w-full max-w-4xl flex-col items-start gap-24 overflow-y-auto px-2 py-16 pointer-events-auto sm:px-16 sm:py-24"
            >
              <IntroOverlay text={birthdayContent.intro.message} mode="inline" />
              <IntroOverlay text={birthdayContent.before.text} mode="inline" />
              <MemoryNote text={birthdayContent.us.text} image={birthdayContent.us.image} imageAlt={birthdayContent.us.imageAlt} />
              {birthdayContent.memorySequence.map((memoryMoment, index) => (
                <MemoryNote
                  key={memoryMoment.id}
                  text={memoryMoment.caption}
                  image={memoryMoment.image}
                  imageAlt={memoryMoment.imageAlt}
                  eyebrow={memoryMoment.eyebrow}
                  align={index % 2 === 1 ? 'right' : 'left'}
                />
              ))}
              <IntroOverlay text={birthdayContent.afterMemory.text} mode="inline" />
              <TitleMessage
                title={birthdayContent.thirtiethBirthday.title}
                subtitle={birthdayContent.thirtiethBirthday.subtitle}
              />
              <MainBlessing message={birthdayContent.thirtiethBirthday.reflection} />
              <MainBlessing message={birthdayContent.thirtiethBirthday.wish} />
              <FinalWish text={birthdayContent.finalBlessing.text} />
            </motion.div>
          ) : (
            <>
          {step === 'intro' && (
            <IntroOverlay key="intro" text={birthdayContent.intro.message} />
          )}

          {['opening', 'cosmic-core', 'timeline-expand'].includes(step) && birthdayContent.giftPrompt.transition && (
            <IntroOverlay key="transition" text={birthdayContent.giftPrompt.transition} />
          )}

          {step === 'ready' && (
            <div key="ready-stage" className="pointer-events-auto">
              <LiteGiftPrompt
                isVisible={isLiteExperience}
                hint={birthdayContent.giftPrompt.hint}
                onOpen={handleOpenGift}
              />
            </div>
          )}

          {step === 'ready' && !isLiteExperience && (
            <motion.div
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-12 right-12 text-right text-[0.7rem] tracking-[0.3em] text-[#F8F4EE]/40 uppercase font-light pointer-events-none hidden sm:block"
            >
              {birthdayContent.giftPrompt.hint}
            </motion.div>
          )}

          {step === 'ready' && !isLiteExperience && (
            <motion.div
              key="hint-mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 right-0 bottom-[max(4.5rem,calc(env(safe-area-inset-bottom)+4rem))] px-6 text-center text-[0.65rem] tracking-[0.2em] text-[#F8F4EE]/40 uppercase font-light pointer-events-none sm:hidden"
            >
              {birthdayContent.giftPrompt.hint}
            </motion.div>
          )}

          {step === 'node-before' && (
            <IntroOverlay key="node-before" text={birthdayContent.before.text} />
          )}

          {step === 'node-us' && (
            <div key="node-us" className="pointer-events-auto">
              <MemoryNote text={birthdayContent.us.text} image={birthdayContent.us.image} />
            </div>
          )}

          {birthdayContent.memorySequence.map((memoryMoment, index) => {
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
                />
              </div>
            );
          })}

          {step === 'node-now' && (
            <IntroOverlay key="node-now" text={birthdayContent.afterMemory.text} />
          )}

          {step === 'title' && (
            <div key="title" className="pointer-events-auto">
              <TitleMessage
                title={birthdayContent.thirtiethBirthday.title}
                subtitle={birthdayContent.thirtiethBirthday.subtitle}
              />
            </div>
          )}

          {step === 'message' && (
            <div key="message" className="pointer-events-auto">
              <MainBlessing message={birthdayContent.thirtiethBirthday.reflection} />
            </div>
          )}
          
          {step === 'message2' && (
            <div key="message2" className="pointer-events-auto">
              <MainBlessing message={birthdayContent.thirtiethBirthday.wish} />
            </div>
          )}

          {step === 'final' && (
            <div key="final" className="pointer-events-auto">
              <FinalWish text={birthdayContent.finalBlessing.text} />
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
        {backgroundAudio.isAvailable && backgroundAudio.hasStarted && (
          <MusicToggle
            isMuted={backgroundAudio.isMuted}
            onToggle={backgroundAudio.toggleMuted}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBooting && <BootOverlay />}
      </AnimatePresence>
    </main>
  );
}

const LiteGiftPrompt = React.memo(function LiteGiftPrompt({
  isVisible,
  hint,
  onOpen,
}: {
  isVisible: boolean;
  hint: string;
  onOpen: () => void;
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      onClick={onOpen}
      className="group flex min-h-52 w-[min(88vw,22rem)] flex-col items-center justify-center gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
      aria-label={birthdayContent.ui.openGiftAriaLabel}
    >
      <div className="relative h-20 w-24">
        <div className="absolute inset-x-0 bottom-0 h-14 rounded-[1.2rem] border border-[#C5A059]/35 bg-white/[0.03]" />
        <div className="absolute left-1/2 top-1 h-10 w-16 -translate-x-1/2 rounded-t-[1rem] border border-[#C5A059]/45 bg-white/[0.05]" />
        <div className="absolute left-1/2 top-8 h-[1px] w-16 -translate-x-1/2 bg-[#C5A059]/45" />
      </div>
      <span className="text-[0.7rem] uppercase tracking-[0.32em] text-[#C5A059]/75">
        {birthdayContent.ui.litePromptEyebrow}
      </span>
      <span className="text-[clamp(0.95rem,4vw,1.05rem)] font-light text-[#F8F4EE]">{hint}</span>
    </motion.button>
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
