/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'motion/react';
import { useBirthdayFlow } from './composables/useBirthdayFlow';
import { useBackgroundAudio } from './composables/useBackgroundAudio';
import { useViewportHeight } from './composables/useViewportHeight';
import { birthdayContent } from './data/content';
import { IntroOverlay } from './components/IntroOverlay';
import { TitleMessage } from './components/TitleMessage';
import { MainBlessing } from './components/MainBlessing';
import { MemoryNote } from './components/MemoryNote';
import { FinalWish } from './components/FinalWish';
import { StageFrame } from './components/StageFrame';
import { BirthdayStep } from './types/birthday';

import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

const FullSceneCanvas = React.lazy(() =>
  import('./components/FullSceneCanvas').then((module) => ({
    default: module.FullSceneCanvas,
  })),
);

type ExperienceMode = 'full' | 'lite' | 'readable';
type SceneMode =
  | 'none'
  | 'gift-opening'
  | 'cosmic-core'
  | 'timeline-expand'
  | 'reading-background-box'
  | 'closing-gift';
type ScenePlaybackMode = 'always' | 'demand';
const MEMORY_STEPS: BirthdayStep[] = ['memory-1', 'memory-2', 'memory-3', 'memory-4', 'memory-5'];
const AUTO_MEMORY_STEPS = new Set<BirthdayStep>(['memory-1']);
const READING_SCENE_STEPS = new Set<BirthdayStep>([
  'node-before',
  'node-us',
  'memory-1',
  'memory-2',
  'memory-3',
  'memory-4',
  'memory-5',
  'node-now',
  'node-thirty-soft',
  'node-thirty-race',
  'title',
  'message',
  'message2',
  'final',
]);

const TRANSITION_ONLY_STEPS = new Set<BirthdayStep>([
  'intro',
  'ready',
  'opening',
  'opening-bridge',
  'cosmic-core',
  'timeline-expand',
  'story-gift',
  'closing-gift',
]);

function getSceneMode(step: BirthdayStep): SceneMode {
  if (step === 'opening-bridge' || step === 'story-gift') {
    return 'gift-opening';
  }

  if (step === 'cosmic-core') {
    return 'cosmic-core';
  }

  if (step === 'timeline-expand') {
    return 'timeline-expand';
  }

  if (READING_SCENE_STEPS.has(step)) {
    return 'reading-background-box';
  }

  if (step === 'closing-gift') {
    return 'closing-gift';
  }

  return 'none';
}

function getScenePlaybackMode(step: BirthdayStep): ScenePlaybackMode {
  return READING_SCENE_STEPS.has(step) ? 'demand' : 'always';
}

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

function useMeasuredHeight<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!active) {
      setHeight(0);
      return;
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    const updateHeight = () => {
      setHeight(Math.round(element.getBoundingClientRect().height));
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateHeight);
      return () => {
        window.removeEventListener('resize', updateHeight);
      };
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [active]);

  return { ref, height };
}

export default function App() {
  const storyPhotoTotal = birthdayContent.story.memories.length + 1;
  const activeSteps = React.useMemo<BirthdayStep[]>(() => {
    const activeMemorySteps = MEMORY_STEPS.slice(0, birthdayContent.story.memories.length);

    return [
      'ready',
      'opening',
      'opening-bridge',
      'cosmic-core',
      'timeline-expand',
      'story-gift',
      'node-before',
      'node-us',
      ...activeMemorySteps,
      'node-now',
      'node-thirty-soft',
      'node-thirty-race',
      'title',
      'message',
      'message2',
      'final',
      'closing-gift',
    ];
  }, [storyPhotoTotal]);

  const memoryAutoAdvanceDelays = React.useMemo<Partial<Record<BirthdayStep, number>>>(() => {
    const activeMemorySteps = MEMORY_STEPS.slice(0, birthdayContent.story.memories.length);

    return birthdayContent.story.memories.reduce<Partial<Record<BirthdayStep, number>>>(
      (delays, memoryMoment, index) => {
        const memoryStep = activeMemorySteps[index];
        if (!memoryStep || !memoryMoment.pauseMs || !AUTO_MEMORY_STEPS.has(memoryStep)) {
          return delays;
        }

        delays[memoryStep] = memoryMoment.pauseMs;
        return delays;
      },
      {},
    );
  }, []);

  const { step, openGift, prevStep, nextStep, continueStep } = useBirthdayFlow(
    activeSteps,
    memoryAutoAdvanceDelays,
    'ready',
  );
  const backgroundAudio = useBackgroundAudio(birthdayContent.backgroundAudio);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>(getInitialExperienceMode);
  const [isStoryGiftOpening, setIsStoryGiftOpening] = useState(false);
  const [storyGiftPullDistance, setStoryGiftPullDistance] = useState(0);
  const [lockedReadingStageHeight, setLockedReadingStageHeight] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const viewport = useViewportHeight();

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
  const sceneMode = getSceneMode(step);
  const scenePlaybackMode = getScenePlaybackMode(step);
  const shouldRenderFullScene = !isReadableExperience && sceneMode !== 'none';
  const shouldUseStaticBackdrop =
    isReadableExperience || isLiteExperience || sceneMode === 'none' || sceneMode === 'reading-background-box';
  const showNavigation = !TRANSITION_ONLY_STEPS.has(step) && step !== 'ready' && step !== 'story-gift';
  const showMusicToggle =
    backgroundAudio.isAvailable && backgroundAudio.hasStarted && !TRANSITION_ONLY_STEPS.has(step);
  const isSceneInteractive = sceneMode === 'gift-opening' && step === 'story-gift';
  const isNarrowViewport = viewport.width > 0 && viewport.width <= 390;
  const isVeryNarrowViewport = viewport.width > 0 && viewport.width <= 360;
  const isCompactViewport = (viewport.height > 0 && viewport.height <= 760) || isNarrowViewport;
  const isVeryCompactViewport = (viewport.height > 0 && viewport.height <= 680) || isVeryNarrowViewport;
  const isTinyViewport = viewport.height > 0 && viewport.height <= 600;
  const isSimpleGiftInteraction =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(pointer: coarse)').matches === true || isCompactViewport);
  const compactCards = isCompactViewport || isReadableExperience;
  const outerSidePadding = isVeryNarrowViewport ? '0.72rem' : isTinyViewport ? '0.8rem' : isCompactViewport ? '0.95rem' : '1.4rem';
  const stageGap = isTinyViewport ? 6 : isVeryCompactViewport ? 10 : isCompactViewport ? 12 : 18;
  const topChrome = useMeasuredHeight<HTMLDivElement>(showMusicToggle);
  const bottomChrome = useMeasuredHeight<HTMLDivElement>(showNavigation);
  const topReserve = (showMusicToggle ? topChrome.height : 0) + stageGap;
  const bottomReserve = (showNavigation ? bottomChrome.height : 0) + stageGap;
  const rawStageHeight = Math.max(viewport.height, 0);

  useEffect(() => {
    if (!READING_SCENE_STEPS.has(step)) {
      if (lockedReadingStageHeight !== null) {
        setLockedReadingStageHeight(null);
      }
      return;
    }

    if (rawStageHeight <= 0) {
      return;
    }

    setLockedReadingStageHeight((current) => {
      if (current === null) {
        return rawStageHeight;
      }

      // Keep page height stable during reading flow; refresh only on major viewport changes.
      return Math.abs(current - rawStageHeight) > 120 ? rawStageHeight : current;
    });
  }, [lockedReadingStageHeight, rawStageHeight, step]);

  const stageHeight =
    READING_SCENE_STEPS.has(step) && lockedReadingStageHeight !== null
      ? lockedReadingStageHeight
      : rawStageHeight;
  const appShellStyle = {
    '--app-height': `${Math.max(viewport.height, 0)}px`,
    '--app-width': `${Math.max(viewport.width, 0)}px`,
    '--app-top-offset': `${Math.max(viewport.top, 0)}px`,
    '--app-left-offset': `${Math.max(viewport.left, 0)}px`,
    transform: 'translate3d(var(--app-left-offset), var(--app-top-offset), 0)',
  } as React.CSSProperties;

  const handleSceneFailure = () => {
    setDegradedExperienceMode('readable');
  };

  const handleOpenGift = React.useCallback(() => {
    backgroundAudio.start();
    openGift();
  }, [backgroundAudio, openGift]);

  const handleStoryGiftOpen = React.useCallback(() => {
    if (step !== 'story-gift' || isStoryGiftOpening) {
      return;
    }

    setIsStoryGiftOpening(true);
    setStoryGiftPullDistance(148);
    window.setTimeout(() => {
      continueStep();
    }, 520);
  }, [continueStep, isStoryGiftOpening, step]);

  const handleStoryGiftPullChange = React.useCallback(
    (distance: number) => {
      if (step !== 'story-gift' || isStoryGiftOpening) {
        return;
      }

      setStoryGiftPullDistance(Math.max(0, Math.min(148, distance)));
    },
    [isStoryGiftOpening, step],
  );

  const handleStoryGiftPullEnd = React.useCallback(
    (distance: number) => {
      if (step !== 'story-gift' || isStoryGiftOpening) {
        return;
      }

      const clampedDistance = Math.max(0, Math.min(148, distance));
      if (clampedDistance >= (isSimpleGiftInteraction ? 64 : 112)) {
        handleStoryGiftOpen();
        return;
      }

      setStoryGiftPullDistance(0);
    },
    [handleStoryGiftOpen, isSimpleGiftInteraction, isStoryGiftOpening, step],
  );

  useEffect(() => {
    if (step !== 'story-gift' && isStoryGiftOpening) {
      setIsStoryGiftOpening(false);
    }
  }, [isStoryGiftOpening, step]);

  useEffect(() => {
    if (step !== 'story-gift' && storyGiftPullDistance !== 0) {
      setStoryGiftPullDistance(0);
    }
  }, [step, storyGiftPullDistance]);

  return (
    <main
      style={appShellStyle}
      className="fixed left-0 top-0 h-[var(--app-height)] w-[var(--app-width)] overflow-hidden bg-[#05050A] font-sans text-[#F8F4EE] selection:bg-[#C5A059]/30"
      data-app-shell="true"
      aria-live="off"
      aria-busy="false"
    >
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
            prefersReducedMotion || shouldUseStaticBackdrop
              ? { opacity: 0.24, scale: 1 }
              : {
                  opacity: [0.2, 0.4, 0.2],
                  scale: [1, 1.1, 1],
                }
          }
          transition={
            prefersReducedMotion || shouldUseStaticBackdrop
              ? { duration: 0.2 }
              : { duration: 20, repeat: Infinity, ease: "easeInOut" }
          }
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#1A1625_0%,transparent_70%)]" 
        />
        <motion.div 
          animate={
            prefersReducedMotion || shouldUseStaticBackdrop
              ? { opacity: 0.18, scale: 1 }
              : {
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1.1, 1, 1.1],
                }
          }
          transition={
            prefersReducedMotion || shouldUseStaticBackdrop
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
        <div
          className={`${isSceneInteractive ? 'pointer-events-auto' : 'pointer-events-none'} absolute inset-0 z-[1]`}
          style={{ touchAction: isSceneInteractive ? 'none' : 'auto' }}
        >
          <SceneErrorBoundary onError={handleSceneFailure}>
            <Suspense fallback={null}>
              <FullSceneCanvas
                sceneMode={sceneMode}
                playbackMode={scenePlaybackMode}
                step={step}
                onSceneFailure={handleSceneFailure}
                simpleInteractionMode={isSimpleGiftInteraction}
                storyGiftOpening={isStoryGiftOpening}
                storyGiftPullProgress={Math.min(storyGiftPullDistance / 148, 1)}
                onStoryGiftPullChange={handleStoryGiftPullChange}
                onStoryGiftPullEnd={handleStoryGiftPullEnd}
              />
            </Suspense>
          </SceneErrorBoundary>
        </div>
      )}

      {/* UI Layer */}
      <section
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
        style={{
          paddingTop: 'var(--viewport-pad-top)',
          paddingRight: `max(${outerSidePadding}, var(--viewport-pad-right))`,
          paddingBottom: 'var(--viewport-pad-bottom)',
          paddingLeft: `max(${outerSidePadding}, var(--viewport-pad-left))`,
        }}
      >
        <AnimatePresence mode="wait">
          <>
            <div className="h-full w-full">
          {step === 'opening-bridge' && (
            <StageFrame key="opening-bridge" availableHeight={stageHeight} anchor="bottom">
              <OpeningBridgeStage compact={compactCards} veryCompact={isVeryCompactViewport} />
            </StageFrame>
          )}

          {(step === 'ready' || step === 'opening') && (
            <StageFrame key="ready-stage" availableHeight={stageHeight} contentClassName="flex h-full items-center justify-center">
              <div className="pointer-events-auto">
                <OpeningStage
                  content={birthdayContent.opening}
                  compact={compactCards}
                  veryCompact={isVeryCompactViewport}
                  simpleInteractionMode={isSimpleGiftInteraction}
                  stageOverride={step === 'opening' ? 'revealed' : undefined}
                  onOpen={step === 'opening' ? continueStep : handleOpenGift}
                />
              </div>
            </StageFrame>
          )}

          {step === 'gift-ribbon' && (
            <StageFrame key="gift-ribbon" availableHeight={stageHeight} contentClassName="flex h-full items-center justify-center">
              <div className="pointer-events-auto">
                <GiftRibbonStage
                  content={birthdayContent.opening.revealCard}
                  compact={compactCards}
                  simpleInteractionMode={isSimpleGiftInteraction}
                  veryCompact={isVeryCompactViewport}
                  onContinue={continueStep}
                />
              </div>
            </StageFrame>
          )}

          {step === 'story-gift' && (
            <StageFrame key="story-gift" availableHeight={stageHeight} anchor="bottom">
              <StoryGiftStage
                compact={compactCards}
                veryCompact={isVeryCompactViewport}
                simpleInteractionMode={isSimpleGiftInteraction}
                pullProgress={Math.min(storyGiftPullDistance / 148, 1)}
                isOpening={isStoryGiftOpening}
              />
            </StageFrame>
          )}

          {step === 'node-before' && (
            <StageFrame key="node-before" availableHeight={stageHeight}>
              <TimelineNodeShell
                compact={compactCards}
                veryCompact={isVeryCompactViewport}
                progress="1 / 8"
              >
                <IntroOverlay mode="inline" text={birthdayContent.story.before.text} variant="from-box" compact={compactCards} veryCompact={isVeryCompactViewport} />
              </TimelineNodeShell>
            </StageFrame>
          )}

          {step === 'node-us' && (
            <StageFrame key="node-us" availableHeight={stageHeight}>
              <TimelineNodeShell
                compact={compactCards}
                veryCompact={isVeryCompactViewport}
                progress="2 / 8"
              >
                <MemoryNote
                  compact={compactCards}
                  veryCompact={isVeryCompactViewport}
                  styleVariant="timeline"
                  pageTurnDirection="forward"
                  text={birthdayContent.story.us.text}
                  image={birthdayContent.story.us.image}
                  imageAlt={birthdayContent.story.us.imageAlt}
                  imagePresentation="hero"
                  imageLoading="eager"
                  imageFetchPriority="high"
                />
              </TimelineNodeShell>
            </StageFrame>
          )}

          {birthdayContent.story.memories.map((memoryMoment, index) => {
            const memoryStep = MEMORY_STEPS[index];
            if (step !== memoryStep) {
              return null;
            }

            return (
              <StageFrame key={memoryMoment.id} availableHeight={stageHeight}>
                <TimelineNodeShell
                  compact={compactCards}
                  veryCompact={isVeryCompactViewport}
                  progress={`${index + 3} / 8`}
                  isMinor={true}
                >
                  <MemoryNote
                    compact={compactCards}
                    veryCompact={isVeryCompactViewport}
                    styleVariant="timeline"
                    pageTurnDirection="forward"
                    text={memoryMoment.caption}
                    image={memoryMoment.image}
                    imageAlt={memoryMoment.imageAlt}
                    eyebrow={memoryMoment.eyebrow}
                    imagePresentation={
                      index === 1 ? 'hero' : 'quiet'
                    }
                    align={index % 2 === 1 ? 'right' : 'left'}
                    imageLoading={index <= 1 ? 'eager' : 'lazy'}
                    imageFetchPriority={index <= 1 ? 'high' : 'low'}
                  />
                </TimelineNodeShell>
              </StageFrame>
            );
          })}

          {step === 'node-now' && (
            <StageFrame key="node-now" availableHeight={stageHeight}>
              <TimelineNodeShell
                compact={compactCards}
                veryCompact={isVeryCompactViewport}
                progress="8 / 8"
              >
                <MemoryNote
                  compact={compactCards}
                  veryCompact={isVeryCompactViewport}
                  styleVariant="timeline"
                  pageTurnDirection="forward"
                  text={birthdayContent.story.after.text}
                  image={birthdayContent.story.after.image}
                  imageAlt={birthdayContent.story.after.imageAlt}
                  imagePresentation="quiet"
                  imageLoading="lazy"
                  imageFetchPriority="low"
                />
              </TimelineNodeShell>
            </StageFrame>
          )}

          {step === 'node-thirty-soft' && (
            <StageFrame key="node-thirty-soft" availableHeight={stageHeight}>
              <IntroOverlay key="node-thirty-soft" text={birthdayContent.story.thirtySoft.text} variant="box-bottom" compact={compactCards} veryCompact={isVeryCompactViewport} />
            </StageFrame>
          )}

          {step === 'node-thirty-race' && (
            <StageFrame key="node-thirty-race" availableHeight={stageHeight}>
              <IntroOverlay key="node-thirty-race" text={birthdayContent.story.thirtyRace.text} variant="box-bottom" compact={compactCards} veryCompact={isVeryCompactViewport} />
            </StageFrame>
          )}

          {step === 'title' && (
            <StageFrame key="title" availableHeight={stageHeight}>
              <ClosingStageShell
                compact={compactCards}
                veryCompact={isVeryCompactViewport}
                progress="1 / 4"
                converging={true}
                convergenceStep={1}
                convergenceTotal={4}
              >
                <TitleMessage
                  compact={compactCards}
                  veryCompact={isVeryCompactViewport}
                  title={birthdayContent.blessing.title}
                  subtitle={birthdayContent.blessing.subtitle}
                  variant="box-bottom"
                />
              </ClosingStageShell>
            </StageFrame>
          )}

          {step === 'message' && (
            <StageFrame key="message" availableHeight={stageHeight}>
              <ClosingStageShell
                compact={compactCards}
                veryCompact={isVeryCompactViewport}
                progress="2 / 4"
                converging={true}
                convergenceStep={2}
                convergenceTotal={4}
              >
                <MainBlessing compact={compactCards} veryCompact={isVeryCompactViewport} message={birthdayContent.blessing.reflection} variant="box-bottom" />
              </ClosingStageShell>
            </StageFrame>
          )}
          
          {step === 'message2' && (
            <StageFrame key="message2" availableHeight={stageHeight}>
              <ClosingStageShell
                compact={compactCards}
                veryCompact={isVeryCompactViewport}
                progress="3 / 4"
                converging={true}
                convergenceStep={3}
                convergenceTotal={4}
              >
                <MainBlessing compact={compactCards} veryCompact={isVeryCompactViewport} message={birthdayContent.blessing.wish} variant="box-bottom" />
              </ClosingStageShell>
            </StageFrame>
          )}

          {step === 'final' && (
            <StageFrame key="final" availableHeight={stageHeight}>
              <ClosingStageShell
                compact={compactCards}
                veryCompact={isVeryCompactViewport}
                progress="4 / 4"
                converging={true}
                convergenceStep={4}
                convergenceTotal={4}
                finale={true}
              >
                <FinalWish
                  compact={compactCards}
                  veryCompact={isVeryCompactViewport}
                  text={birthdayContent.closing.text}
                  image={birthdayContent.closing.image}
                  imageAlt={birthdayContent.closing.imageAlt}
                  variant="box-bottom"
                />
              </ClosingStageShell>
            </StageFrame>
          )}

          {step === 'closing-gift' && (
            <StageFrame key="closing-gift" availableHeight={stageHeight} contentClassName="flex h-full items-center justify-center">
              <div className="pointer-events-auto">
                <ClosingGiftStage compact={compactCards} veryCompact={isVeryCompactViewport} />
              </div>
            </StageFrame>
          )}
            </div>
          </>
        </AnimatePresence>
      </section>

      {/* Manual Navigation Controls - Refined Luxury Style */}
      <AnimatePresence>
        {showNavigation && (
          <div
            ref={bottomChrome.ref}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[100]"
            style={{
              paddingRight: `max(${outerSidePadding}, var(--viewport-pad-right))`,
              paddingBottom: 'var(--chrome-safe-bottom)',
              paddingLeft: `max(${outerSidePadding}, var(--viewport-pad-left))`,
            }}
          >
            <NavigationControls 
              compact={compactCards}
              veryCompact={isVeryCompactViewport}
              step={step} 
              prevStep={prevStep} 
              nextStep={nextStep} 
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMusicToggle && (
          <div
            ref={topChrome.ref}
            className="pointer-events-none absolute right-0 top-0 z-[110]"
            style={{
              paddingTop: 'var(--chrome-safe-top)',
              paddingRight: `max(${outerSidePadding}, var(--viewport-pad-right))`,
            }}
          >
            <MusicToggle
              compact={compactCards}
              isMuted={backgroundAudio.isMuted}
              onToggle={backgroundAudio.toggleMuted}
            />
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}

const OpeningStage = React.memo(function OpeningStage({
  content,
  compact,
  veryCompact,
  simpleInteractionMode,
  stageOverride,
  onOpen,
}: {
  content: typeof birthdayContent.opening;
  compact: boolean;
  veryCompact: boolean;
  simpleInteractionMode: boolean;
  stageOverride?: 'revealed';
  onOpen: () => void;
}) {
  const [authState, setAuthState] = React.useState<'idle' | 'scanning' | 'revealed'>(
    stageOverride === 'revealed' ? 'revealed' : 'idle',
  );
  const openTimerRef = React.useRef<number | null>(null);
  const revealHoldMs = simpleInteractionMode ? 1100 : 1650;

  React.useEffect(() => {
    if (stageOverride !== 'revealed') {
      return;
    }

    setAuthState('revealed');
    openTimerRef.current = window.setTimeout(() => {
      onOpen();
    }, revealHoldMs);

    return () => {
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
    };
  }, [onOpen, stageOverride]);

  React.useEffect(() => {
    return () => {
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current);
      }
    };
  }, []);

  const handleAuthenticate = React.useCallback(() => {
    if (authState !== 'idle' || stageOverride === 'revealed') {
      return;
    }

    setAuthState('scanning');
    openTimerRef.current = window.setTimeout(() => {
      setAuthState('revealed');
      openTimerRef.current = window.setTimeout(() => {
        onOpen();
      }, revealHoldMs);
    }, simpleInteractionMode ? 760 : 1400);
  }, [authState, onOpen, revealHoldMs, simpleInteractionMode, stageOverride]);

  const statusCopy =
    authState === 'revealed'
      ? {
          eyebrow: content.faceIdUnlockedEyebrow,
          text: content.faceIdUnlockedText,
        }
      : authState === 'scanning'
        ? {
            eyebrow: content.faceIdScanningEyebrow,
            text: content.faceIdScanningText,
          }
        : {
            eyebrow: content.faceIdIdleEyebrow,
            text: content.faceIdIdleText,
          };

  return (
      <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{ maxHeight: 'var(--stage-max-height)' }}
      className={`mx-auto flex w-[min(88vw,25rem)] max-h-full min-h-0 flex-col items-start overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] text-left shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl ${veryCompact ? 'gap-3 px-3 py-3' : compact ? 'gap-4 px-3.5 py-3.5' : 'gap-6 px-5 py-6 sm:px-7 sm:py-8'}`}
    >
      <div className={`flex flex-col ${veryCompact ? 'gap-1.5' : 'gap-2'}`}>
        <span className="text-[0.64rem] uppercase tracking-[0.32em] text-[#C5A059]/82">
          {content.cardEyebrow}
        </span>
        <h1 className={`m-0 font-light italic font-serif tracking-[-0.02em] text-[#F8F4EE] ${veryCompact ? 'text-[clamp(1.38rem,5.8vw,1.8rem)] leading-[1.04]' : compact ? 'text-[clamp(1.54rem,6.2vw,2rem)] leading-[1.06]' : 'text-[clamp(1.7rem,7vw,2.35rem)] leading-[1.08]'}`}>
          {content.cardTitle}
        </h1>
      </div>

      <p className={`m-0 whitespace-pre-line font-light italic font-serif tracking-[0.02em] text-[#F8F4EE]/92 ${veryCompact ? 'text-[clamp(0.82rem,3vw,0.9rem)] leading-[1.42]' : compact ? 'text-[clamp(0.88rem,3.3vw,0.94rem)] leading-[1.52]' : 'text-[clamp(0.96rem,3.8vw,1.04rem)] leading-[1.74]'}`}>
        {content.introText}
      </p>

      <motion.button
        type="button"
        onClick={handleAuthenticate}
        disabled={authState !== 'idle'}
        whileTap={authState === 'idle' ? { scale: 0.985 } : undefined}
        className="group relative w-full cursor-pointer overflow-hidden rounded-[1.95rem] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-0 py-4 text-left shadow-[0_20px_50px_rgba(0,0,0,0.22)]"
        aria-label={birthdayContent.ui.openGiftAriaLabel}
      >
        <div className={`relative mx-auto w-full ${veryCompact ? 'max-w-[11rem]' : compact ? 'max-w-[12.5rem]' : 'max-w-[15rem]'}`}>
          {!veryCompact && <div className="pointer-events-none absolute inset-x-[18%] top-[8%] h-[36%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_68%)] blur-3xl" />}
          {!veryCompact && <div className="pointer-events-none absolute inset-x-[14%] bottom-[10%] h-[20%] rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.4),transparent_72%)] blur-3xl" />}

          <div className="relative z-[2] overflow-hidden rounded-[1.75rem] bg-transparent">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-transparent" />
            <div className="relative">
              <div className={`relative mx-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/12 bg-black/20 ${veryCompact ? 'max-w-[8.8rem]' : compact ? 'max-w-[10rem]' : 'max-w-[11.5rem]'}`}>
              <img
                src={content.featuredPhoto.image}
                alt={content.featuredPhoto.imageAlt}
                className={`absolute inset-0 h-full w-full object-cover transition-[filter,transform,opacity] duration-500 ${authState === 'idle' ? 'scale-[1.04] blur-[14px] opacity-72' : authState === 'scanning' ? 'scale-[1.02] blur-[6px] opacity-82' : 'scale-100 blur-0 opacity-95'}`}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.18),rgba(255,255,255,0.02))]" />
              <div className={`absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,14,0.26),rgba(6,8,14,0.52))] transition-opacity duration-500 ${authState === 'revealed' ? 'opacity-35' : 'opacity-100'}`} />
              <motion.div
                animate={
                  authState === 'scanning'
                    ? { opacity: [0.22, 1, 0.22], y: [-38, 38, -38] }
                    : authState === 'revealed'
                      ? { opacity: 0, y: 0 }
                      : { opacity: 0.34, y: 0 }
                }
                transition={
                  authState === 'scanning'
                    ? { duration: 1.05, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.3 }
                }
                className="absolute left-3 right-3 h-[2px] rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.2),rgba(255,255,255,0.92),rgba(255,255,255,0.2))]"
              />
              <div className={`pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(6,8,14,0.62))] ${veryCompact ? 'h-10' : 'h-16'}`} />
              <div className={`absolute inset-x-0 flex justify-center ${veryCompact ? 'bottom-2.5' : 'bottom-4'}`}>
                <motion.div
                  initial={false}
                  animate={
                    authState === 'scanning'
                      ? { width: veryCompact ? 102 : compact ? 112 : 122 }
                      : authState === 'revealed'
                        ? { width: veryCompact ? 110 : compact ? 120 : 132 }
                        : { width: veryCompact ? 96 : compact ? 106 : 116 }
                  }
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex items-center justify-center gap-1.5 overflow-hidden rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(16,18,26,0.9),rgba(8,10,18,0.78))] shadow-[0_14px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl ${veryCompact ? 'px-2 py-1.5' : 'px-2.5 py-1.5'}`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${authState === 'idle' ? 'bg-white/82' : authState === 'revealed' ? 'bg-[#E6C98A]/88' : 'bg-white/26'}`} />
                    <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${authState === 'scanning' ? 'bg-white/92' : 'bg-white/18'}`} />
                    <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${authState === 'revealed' ? 'bg-[#E6C98A]/96' : 'bg-white/18'}`} />
                  </div>
                  <span className="whitespace-nowrap text-[0.52rem] font-medium tracking-[0.16em] text-white/74">
                    {authState === 'idle' ? 'Tap to open' : authState === 'scanning' ? 'Opening this for you' : 'Almost there'}
                  </span>
                </motion.div>
              </div>
            </div>
            </div>
            <div className={`mt-3 flex flex-col items-center gap-1.5 text-center ${veryCompact ? 'px-1 py-1' : 'px-2 py-1.5'}`}>
              <p className="m-0 text-[0.68rem] uppercase tracking-[0.22em] text-white/42">
                {authState === 'idle' ? 'A gift for you' : authState === 'scanning' ? 'With my own hands' : 'Come in softly'}
              </p>
              <p className="m-0 text-[0.78rem] leading-[1.5] text-[#F8F4EE]/72">
                {authState === 'idle'
                  ? 'Open this gift first.'
                  : authState === 'scanning'
                    ? 'For your 30th, I want to open it with my own hands.'
                    : 'The first note is waiting inside.'}
              </p>
            </div>
          </div>
        </div>
      </motion.button>

      <div className={`w-full rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,18,0.72),rgba(12,12,18,0.44))] shadow-[0_20px_40px_rgba(0,0,0,0.2)] ${veryCompact ? 'px-3 py-3' : compact ? 'px-3.5 py-3.5' : 'px-4.5 py-4.5'}`}>
        <p className="m-0 text-[0.62rem] uppercase tracking-[0.28em] text-[#E4C27E]/84">
          {simpleInteractionMode && authState === 'idle' ? 'Tap to open' : statusCopy.eyebrow}
        </p>
        <p className={`mt-2.5 m-0 text-[#F8F4EE]/80 ${veryCompact ? 'text-[0.78rem] leading-[1.44]' : compact ? 'text-[0.84rem] leading-[1.56]' : 'text-[0.92rem] leading-[1.72]'}`}>
          {simpleInteractionMode && authState === 'idle'
            ? 'Open this gift first. For your 30th, I want to open it with my own hands.'
            : statusCopy.text}
        </p>
      </div>
    </motion.section>
  );
});

const GiftRibbonStage = React.memo(function GiftRibbonStage({
  content,
  compact,
  simpleInteractionMode,
  veryCompact,
  onContinue,
}: {
  content: typeof birthdayContent.opening.revealCard;
  compact: boolean;
  simpleInteractionMode: boolean;
  veryCompact: boolean;
  onContinue: () => void;
}) {
  const [ribbonPull, setRibbonPull] = React.useState(0);
  const [boxPull, setBoxPull] = React.useState(0);
  const [phase, setPhase] = React.useState<'idle' | 'untying' | 'resting'>('idle');
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const phaseTimerRef = React.useRef<number | null>(null);

  const beginRibbonOpening = React.useCallback(() => {
    if (phase !== 'idle') {
      return;
    }

    setRibbonPull(-110);
    setBoxPull(-54);
    setPhase('untying');
  }, [phase]);

  const updateGiftDrag = React.useCallback(
    (offsetY: number) => {
      if (phase !== 'idle') {
        return;
      }

      const clampedPull = Math.max(-118, Math.min(0, offsetY));
      setRibbonPull(clampedPull);
      setBoxPull(clampedPull * 0.48);
    },
    [phase],
  );

  const hasUntiedRibbon = phase !== 'idle';
  const cubeState: 'closed' | 'opening' | 'open' = phase === 'idle' ? 'closed' : 'opening';
  const cubeViewMode: 'angled' | 'top' = 'top';
  const ribbonVisibility = phase === 'idle' ? 1 : phase === 'untying' ? 0.18 : 0.08;
  const bowSpread = phase === 'idle' ? 0 : phase === 'untying' ? 1 : 1.2;
  const phaseIndex =
    phase === 'idle'
      ? 0
      : phase === 'untying'
        ? 1
        : 2;
  const phaseLabel =
    phase === 'idle'
      ? {
          primary: '',
          secondary: '',
        }
      : phase === 'untying'
        ? {
            primary: 'Ribbon loosening',
            secondary: '',
          }
        : {
            primary: '',
            secondary: '',
          };

  React.useEffect(() => {
    if (!hasUntiedRibbon || isTransitioning) {
      return;
    }

    if (phaseTimerRef.current !== null) {
      window.clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }

    if (phase === 'untying') {
      phaseTimerRef.current = window.setTimeout(() => {
        setPhase('resting');
      }, 560);
    } else if (phase === 'resting') {
      phaseTimerRef.current = window.setTimeout(() => {
        setIsTransitioning(true);
        window.setTimeout(() => {
          onContinue();
        }, 520);
      }, 520);
    }

    return () => {
      if (phaseTimerRef.current !== null) {
        window.clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
    };
  }, [hasUntiedRibbon, isTransitioning, onContinue, phase]);

  React.useEffect(() => {
    return () => {
      if (phaseTimerRef.current !== null) {
        window.clearTimeout(phaseTimerRef.current);
      }
    };
  }, []);

  const handleRibbonDragEnd = React.useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (phase !== 'idle') {
        return;
      }

      const pulledFarEnough = info.offset.y <= -96;
      const pulledFastEnough = info.velocity.y <= -420;

      if (pulledFarEnough || pulledFastEnough) {
        beginRibbonOpening();
        return;
      }

      setRibbonPull(0);
      setBoxPull(0);
    },
    [beginRibbonOpening, phase],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{ maxHeight: 'var(--stage-max-height)' }}
      className={`mx-auto flex w-[min(88vw,25rem)] max-h-full min-h-0 flex-col items-start overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] text-left shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl ${veryCompact ? 'gap-3 px-3 py-3' : compact ? 'gap-3.5 px-3.5 py-3.5' : 'gap-6 px-5 py-6 sm:px-7 sm:py-8'}`}
    >
      <div className={`flex w-full flex-col ${veryCompact ? 'gap-1.5' : 'gap-3'}`}>
        <div className={`flex w-full items-center justify-between uppercase text-[#E4C27E]/82 ${veryCompact ? 'text-[0.54rem] tracking-[0.18em]' : 'text-[0.6rem] tracking-[0.24em]'}`}>
          <span>{phase === 'untying' ? 'Ribbon loosening' : phase === 'resting' ? 'Ribbon opened' : ''}</span>
          <span>{isTransitioning ? 'Entering story' : `Step ${phaseIndex + 1} / 5`}</span>
        </div>
        <div className={`grid w-full grid-cols-5 ${veryCompact ? 'gap-1.5' : 'gap-2'}`}>
          {Array.from({ length: 3 }, (_value, index) => (
            <motion.div
              key={index}
              animate={{
                opacity: index <= phaseIndex ? 1 : 0.35,
                scaleX: index === phaseIndex ? 1 : 0.94,
              }}
              className="h-[3px] rounded-full bg-[linear-gradient(90deg,rgba(228,194,126,0.35),rgba(248,244,238,0.9),rgba(228,194,126,0.35))]"
            />
          ))}
        </div>
      </div>

      <div className={`relative mx-auto w-full shrink-0 [perspective:1500px] ${veryCompact ? 'max-w-[18.5rem]' : compact ? 'max-w-[21rem]' : 'max-w-[24rem]'}`}>
        <motion.div
          initial={false}
          animate={
            phase === 'resting'
              ? { rotateX: 88, rotateZ: 0, scale: 1.01, y: 2 }
              : phase === 'untying'
                ? { rotateX: 88, rotateZ: 0, scale: 1.01, y: 1 }
                : { rotateX: 88, rotateZ: 0, scale: 1, y: boxPull * 0.12 }
          }
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
          className={`relative mx-auto w-full ${veryCompact ? 'h-[12rem]' : compact ? 'h-[14rem]' : 'h-[17rem]'}`}
        >
          {phase === 'idle' && (
            <motion.div
              drag="y"
              dragConstraints={{ top: -132, bottom: 0 }}
              dragElastic={0.08}
              dragMomentum={false}
              onDrag={(_event, info) => {
                updateGiftDrag(info.offset.y);
              }}
              onDragEnd={handleRibbonDragEnd}
              onClick={simpleInteractionMode ? beginRibbonOpening : undefined}
              className={`absolute inset-x-[3.6rem] bottom-[3.2rem] top-[2rem] z-[6] rounded-[1.8rem] touch-none ${simpleInteractionMode ? 'cursor-pointer' : ''}`}
            />
          )}
          <GiftCubeVisual
            compact={compact}
            veryCompact={veryCompact}
            state={cubeState}
            dragOffset={boxPull}
            showInsertCard={false}
            viewMode={cubeViewMode}
            ribbonVisibility={ribbonVisibility}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[5]">
          <motion.div
            initial={false}
            animate={{
              opacity: phase === 'resting' ? 0 : 1,
              y: phase === 'idle' ? 0 : phase === 'untying' ? -6 : -18,
              scale: phase === 'idle' ? 1 : 0.96,
            }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`relative mx-auto ${veryCompact ? 'h-[8.2rem] w-[12rem]' : compact ? 'h-[9.4rem] w-[13.4rem]' : 'h-[10.4rem] w-[15rem]'}`}
            >
              <motion.div
                initial={false}
                animate={{ x: -22 * bowSpread, rotate: -34 * bowSpread, y: 8 * bowSpread, opacity: phase === 'resting' ? 0 : 1 }}
                transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-[2.4rem] top-[1.5rem] h-6 w-10 rounded-[999px] border border-[#E6C98A]/55 bg-[linear-gradient(180deg,#F8EED2,#D4AF37)] shadow-[0_10px_22px_rgba(0,0,0,0.22)]"
              />
              <motion.div
                initial={false}
                animate={{ x: 22 * bowSpread, rotate: 34 * bowSpread, y: 8 * bowSpread, opacity: phase === 'resting' ? 0 : 1 }}
                transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-[2.4rem] top-[1.5rem] h-6 w-10 rounded-[999px] border border-[#E6C98A]/55 bg-[linear-gradient(180deg,#F8EED2,#D4AF37)] shadow-[0_10px_22px_rgba(0,0,0,0.22)]"
              />
              <motion.div
                initial={false}
                animate={{ x: -34 * bowSpread, y: 30 * bowSpread, rotate: -48 * bowSpread, opacity: phase === 'resting' ? 0 : 0.9 }}
                transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-[4.6rem] top-[2.6rem] h-[3.8rem] w-[1rem] rounded-[999px] bg-[linear-gradient(180deg,#F5E9C8,#C5A059)] shadow-[0_0_18px_rgba(197,160,89,0.22)]"
              />
              <motion.div
                initial={false}
                animate={{ x: 34 * bowSpread, y: 30 * bowSpread, rotate: 48 * bowSpread, opacity: phase === 'resting' ? 0 : 0.9 }}
                transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-[4.6rem] top-[2.6rem] h-[3.8rem] w-[1rem] rounded-[999px] bg-[linear-gradient(180deg,#F5E9C8,#C5A059)] shadow-[0_0_18px_rgba(197,160,89,0.22)]"
              />
              <motion.div
                initial={false}
                animate={{ scale: phase === 'idle' ? 1 : 0.88, opacity: phase === 'resting' ? 0 : 1, y: phase === 'idle' ? 0 : -4 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-1/2 top-[0.95rem] h-8 w-5 -translate-x-1/2 rounded-full border border-[#E6C98A]/55 bg-[radial-gradient(circle_at_50%_45%,rgba(248,244,238,0.95),rgba(197,160,89,0.92))] shadow-[0_8px_18px_rgba(0,0,0,0.26)]"
              />
            </motion.div>
          </div>

        </motion.div>
      </div>

      <div className={`w-full rounded-[1.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,8,12,0.62),rgba(8,8,12,0.42))] text-center shadow-[0_14px_34px_rgba(0,0,0,0.18)] ${veryCompact ? 'px-2.5 py-2' : compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
        <p className={`m-0 uppercase text-[#C5A059]/86 ${veryCompact ? 'text-[0.58rem] tracking-[0.16em]' : compact ? 'text-[0.64rem] tracking-[0.2em]' : 'text-[0.72rem] tracking-[0.26em]'}`}>
          {phase === 'idle'
            ? 'Pull the ribbon upward to untie the bow'
            : phase === 'untying'
              ? 'The ribbon is loosening'
              : 'Ribbon opened'}
        </p>
      </div>

      {phase === 'resting' && (
        <div className="h-2" />
      )}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(180deg,rgba(5,5,10,0.28),rgba(5,5,10,0.78))]"
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
});

const StoryGiftStage = React.memo(function StoryGiftStage({
  compact,
  veryCompact,
  simpleInteractionMode,
  pullProgress,
  isOpening,
}: {
  compact: boolean;
  veryCompact: boolean;
  simpleInteractionMode: boolean;
  pullProgress: number;
  isOpening: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      style={{ maxHeight: 'var(--stage-max-height)' }}
      className={`relative mx-auto flex w-[min(88vw,23rem)] max-h-full min-h-0 flex-col items-start gap-3 rounded-[1.45rem] border border-[#E6C98A]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-lg ${veryCompact ? 'px-3 py-3' : compact ? 'px-3.5 py-3.5' : 'px-4.5 py-4.5'}`}
    >
      <span className="text-[0.62rem] uppercase tracking-[0.28em] text-[#E4C27E]">
        for you
      </span>
      <h2 className={`m-0 font-light italic font-serif tracking-[-0.02em] text-[#FFF8EE] ${veryCompact ? 'text-[1.08rem]' : compact ? 'text-[1.18rem]' : 'text-[1.35rem]'}`}>
        {isOpening ? 'stay with me for one second' : 'pull gently'}
      </h2>
      <p className={`m-0 text-[#F8F4EE]/82 ${veryCompact ? 'text-[0.76rem] leading-[1.4]' : compact ? 'text-[0.82rem] leading-[1.5]' : 'text-[0.9rem] leading-[1.62]'}`}>
        {isOpening
          ? 'I want this moment to feel a little slower.'
          : simpleInteractionMode
            ? 'Tap or pull upward a little.'
            : 'Pull upward gently.'}
      </p>
      {!veryCompact && (
        <div className="mt-1 flex items-center gap-3 text-[0.66rem] uppercase tracking-[0.22em] text-[#C5A059]/74">
          <span className="inline-block h-[1px] w-10 bg-gradient-to-r from-[#C5A059]/55 to-transparent" />
          <span>{isOpening ? 'almost there' : simpleInteractionMode ? 'tap or pull' : 'pull gently'}</span>
        </div>
      )}
      <div className="mt-2 w-full">
        <div className="h-[3px] overflow-hidden rounded-full bg-white/8">
          <motion.div
            initial={false}
            animate={{ width: `${Math.max(8, pullProgress * 100)}%` }}
            transition={{ duration: isOpening ? 0.3 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(228,194,126,0.45),rgba(248,244,238,0.92),rgba(228,194,126,0.45))]"
          />
        </div>
        {!isOpening && (
          <div className="mt-2 flex items-center justify-between gap-3">
            {!veryCompact && (
              <p className={`m-0 text-[#F8F4EE]/54 ${compact ? 'text-[0.72rem] leading-[1.38]' : 'text-[0.78rem] leading-[1.44]'}`}>
                {simpleInteractionMode ? 'Tap or pull upward slightly.' : 'Drag upward on the note.'}
              </p>
            )}
            <span className={`shrink-0 uppercase tracking-[0.2em] text-[#E4C27E]/78 ${veryCompact ? 'text-[0.56rem]' : 'text-[0.62rem]'}`}>
              {Math.round(pullProgress * 100)}%
            </span>
          </div>
        )}
      </div>
      <AnimatePresence>
        {isOpening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(5,5,10,0.18),rgba(5,5,10,0.56))]"
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
});

const OpeningBridgeStage = React.memo(function OpeningBridgeStage({
  compact,
  veryCompact,
}: {
  compact: boolean;
  veryCompact: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      style={{ maxHeight: 'var(--stage-max-height)' }}
      className={`relative mx-auto flex w-[min(88vw,23rem)] max-h-full min-h-0 flex-col items-start ${veryCompact ? 'gap-3.5' : compact ? 'gap-4' : 'gap-5'} rounded-[1.45rem] border border-[#E6C98A]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-lg ${veryCompact ? 'px-3 py-3' : compact ? 'px-3.5 py-3.5' : 'px-4.5 py-4.5'}`}
    >
      <span className="text-[0.62rem] uppercase tracking-[0.28em] text-[#E4C27E]">
        Opening gently
      </span>
      <h2 className={`m-0 max-w-[16rem] font-light italic font-serif tracking-[-0.02em] text-[#FFF8EE] ${veryCompact ? 'text-[1rem] leading-[1.22]' : compact ? 'text-[1.08rem] leading-[1.2]' : 'text-[1.2rem] leading-[1.16]'}`}>
        hold this moment gently
      </h2>
      <p className={`m-0 mt-0.5 text-[#F8F4EE]/82 ${veryCompact ? 'text-[0.76rem] leading-[1.38]' : compact ? 'text-[0.82rem] leading-[1.48]' : 'text-[0.9rem] leading-[1.6]'}`}>
        {birthdayContent.opening.giftPrompt.bridgeText}
      </p>
      {!veryCompact && (
        <div className="mt-1 flex items-center gap-3 text-[0.66rem] uppercase tracking-[0.22em] text-[#C5A059]/74">
          <span className="inline-block h-[1px] w-10 bg-gradient-to-r from-[#C5A059]/55 to-transparent" />
          <span>slowly, with love</span>
        </div>
      )}
    </motion.section>
  );
});

const TimelineNodeShell = React.memo(function TimelineNodeShell({
  compact,
  veryCompact,
  progress,
  isMinor = false,
  children,
}: {
  compact: boolean;
  veryCompact: boolean;
  progress: string;
  isMinor?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`pointer-events-auto flex h-full w-full ${compact || veryCompact ? 'items-start justify-stretch pt-1' : 'items-center justify-center'}`}>
      <div
        style={{ maxHeight: 'var(--stage-max-height)' }}
        className={`relative flex max-h-full min-h-0 w-full ${veryCompact ? 'max-w-[21rem] gap-2.5 px-1' : compact ? 'max-w-[23rem] gap-3 px-1.5' : 'max-w-[24.5rem] gap-3.5'} flex-col`}
      >
        <div className={`absolute bottom-0 top-0 ${veryCompact ? 'left-2.5' : compact ? 'left-3' : 'left-3.5'}`}>
          <div className="h-full w-[1px] bg-[linear-gradient(180deg,rgba(230,201,138,0.52),rgba(230,201,138,0.14)_74%,transparent)]" />
        </div>
        <div className={`relative z-10 flex w-full flex-col ${veryCompact ? 'gap-1.5 pl-7' : compact ? 'gap-2 pl-8' : 'gap-2.5 pl-9'}`}>
          <div className="flex items-center justify-between gap-2.5">
            <div className={`relative shrink-0 rounded-full border ${isMinor ? 'h-2.5 w-2.5 border-[#E6C98A]/70 bg-[#E6C98A]/78' : 'h-3.5 w-3.5 border-[#F2D59A]/90 bg-[#E6C98A]/90'}`}>
              {!isMinor && <div className="absolute inset-[-5px] rounded-full border border-[#E6C98A]/34" />}
            </div>
            <span className={`${veryCompact ? 'text-[0.5rem] tracking-[0.18em]' : 'text-[0.56rem] tracking-[0.22em]'} uppercase text-[#F8F4EE]/30`}>
              {progress}
            </span>
          </div>
        </div>
        <div className={`relative z-10 min-h-0 flex-1 ${veryCompact ? 'pl-7' : compact ? 'pl-8' : 'pl-9'}`}>
          <div className={`absolute bottom-0 top-0 ${veryCompact ? '-left-[0.1rem]' : compact ? '-left-[0.16rem]' : '-left-[0.2rem]'}`}>
            <div className="h-full w-[1px] bg-[linear-gradient(180deg,rgba(230,201,138,0.42),rgba(230,201,138,0.08))]" />
          </div>
          <div className="h-full min-h-0 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
});

const ReadingStageShell = React.memo(function ReadingStageShell({
  compact,
  veryCompact,
  eyebrow,
  title,
  note,
  children,
}: {
  compact: boolean;
  veryCompact: boolean;
  eyebrow?: string;
  title?: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`pointer-events-auto flex h-full w-full ${compact || veryCompact ? 'items-start justify-stretch pt-1' : 'items-center justify-center'}`}>
      <div style={{ maxHeight: 'var(--stage-max-height)' }} className={`flex max-h-full min-h-0 w-full ${veryCompact ? 'max-w-[20.75rem] gap-2 px-1' : compact ? 'max-w-[22.5rem] gap-2.5 px-1.5' : 'max-w-[24rem] gap-3.5'} flex-col items-start`}>
        {eyebrow && (
          <span className={`${veryCompact ? 'text-[0.55rem] tracking-[0.22em]' : 'text-[0.62rem] tracking-[0.28em]'} uppercase text-[#E4C27E]/82`}>
            {eyebrow}
          </span>
        )}
        {(title || (note && !veryCompact)) && (
          <div className={`flex w-full flex-col items-start ${veryCompact ? 'gap-1.5' : 'gap-2'}`}>
            {title && (
              <h3 className={`m-0 font-light italic font-serif tracking-[-0.02em] text-[#FFF8EE] ${veryCompact ? 'text-[0.92rem]' : compact ? 'text-[1rem]' : 'text-[1.1rem]'}`}>
                {title}
              </h3>
            )}
            {note && !veryCompact && (
              <p className={`m-0 text-[#F8F4EE]/62 ${veryCompact ? 'text-[0.68rem] leading-[1.26]' : compact ? 'text-[0.74rem] leading-[1.34]' : 'text-[0.8rem] leading-[1.44]'}`}>
                {note}
              </p>
            )}
          </div>
        )}
        <div className="relative min-h-0 w-full flex-1 pt-1">{children}</div>
      </div>
    </div>
  );
});

const StoryAlbumStage = React.memo(function StoryAlbumStage({
  compact,
  veryCompact,
  page,
  total,
  eyebrow,
  title,
  note,
  children,
}: {
  compact: boolean;
  veryCompact: boolean;
  page: number;
  total: number;
  eyebrow?: string;
  title?: string;
  note?: string;
  children: React.ReactNode;
}) {
  const headerHeightClass = veryCompact ? 'h-[5.2rem]' : compact ? 'h-[5.8rem]' : 'h-[6.4rem]';
  const headerEyebrow =
    eyebrow ??
    (page === 1
      ? 'for you'
      : page === total
        ? 'still us'
        : 'with you');
  const headerTitle =
    title ??
    (page === 1
      ? 'I wanted to keep this with you.'
      : page === total
        ? 'One more memory before the last words.'
        : 'Another moment I wanted to keep close.');

  return (
    <div className={`pointer-events-auto flex h-full w-full ${compact || veryCompact ? 'items-start justify-stretch pt-1' : 'items-center justify-center'}`}>
      <div style={{ maxHeight: 'var(--stage-max-height)' }} className={`relative flex max-h-full min-h-0 w-full ${veryCompact ? 'max-w-[20.75rem] gap-2 px-1 pb-2' : compact ? 'max-w-[22.5rem] gap-2.5 px-1.5 pb-2' : 'max-w-[24rem] gap-3.5 pb-3'} flex-col items-start`}>
        <div className={`${headerHeightClass} flex w-full flex-col justify-start`}>
          <div className="flex w-full items-center justify-between">
            <span className={`${veryCompact ? 'text-[0.55rem] tracking-[0.2em]' : 'text-[0.62rem] tracking-[0.28em]'} uppercase text-[#E4C27E]/82`}>
              {headerEyebrow}
            </span>
            <span className={`${veryCompact ? 'text-[0.52rem] tracking-[0.18em]' : 'text-[0.58rem] tracking-[0.24em]'} uppercase text-[#F8F4EE]/36`}>
              {page} / {total}
            </span>
          </div>
          <p className={`m-0 ${veryCompact ? 'mt-1 min-h-[1.9rem] text-[0.78rem] leading-[1.22]' : compact ? 'mt-1.5 min-h-[2.2rem] text-[0.86rem] leading-[1.28]' : 'mt-1.5 min-h-[2.4rem] text-[0.95rem] leading-[1.34]'} overflow-hidden font-light italic font-serif tracking-[-0.01em] text-[#FFF8EE]/90`}>
            {headerTitle}
          </p>
          {note && !veryCompact && (
            <p className={`m-0 mt-1 text-[#F8F4EE]/58 ${compact ? 'text-[0.72rem] leading-[1.3]' : 'text-[0.78rem] leading-[1.4]'}`}>
              {note}
            </p>
          )}
          <div className={`${veryCompact ? 'mt-1.5 gap-1' : 'mt-2 gap-1.5'} flex w-full items-center`}>
            {Array.from({ length: total }, (_value, index) => (
              <span
                key={index}
                className={`block h-[3px] rounded-full transition-[width,background-color] duration-300 ${index + 1 === page ? (veryCompact ? 'w-6 bg-[#E4C27E]/88' : compact ? 'w-7 bg-[#E4C27E]/88' : 'w-8 bg-[#E4C27E]/88') : (veryCompact ? 'w-3 bg-white/14' : compact ? 'w-3.5 bg-white/14' : 'w-4 bg-white/14')}`}
              />
            ))}
          </div>
        </div>
        <div className="relative min-h-0 w-full flex-1">
          {!compact && !veryCompact && <div className="pointer-events-none absolute inset-x-4 top-[0.45rem] h-full rounded-[1.9rem] border border-white/6 bg-white/[0.015] shadow-[0_12px_24px_rgba(0,0,0,0.1)]" />}
          {!compact && !veryCompact && <div className="pointer-events-none absolute inset-x-1.5 top-[0.1rem] h-full rounded-[1.9rem] border border-white/5 bg-white/[0.012]" />}
          <div className="relative h-full min-h-0">{children}</div>
        </div>
      </div>
    </div>
  );
});

const ClosingStageShell = React.memo(function ClosingStageShell({
  compact,
  veryCompact,
  eyebrow,
  title,
  progress,
  converging = false,
  convergenceStep = 1,
  convergenceTotal = 4,
  finale = false,
  children,
}: {
  compact: boolean;
  veryCompact: boolean;
  eyebrow?: string;
  title?: string;
  progress: string;
  converging?: boolean;
  convergenceStep?: number;
  convergenceTotal?: number;
  finale?: boolean;
  children: React.ReactNode;
}) {
  const clampedTotal = Math.max(1, convergenceTotal);
  const clampedStep = Math.min(Math.max(1, convergenceStep), clampedTotal);
  const progressHeight = `${(clampedStep / clampedTotal) * 100}%`;

  return (
    <div className={`pointer-events-auto flex h-full w-full ${compact || veryCompact ? 'items-start justify-stretch pt-1' : 'items-center justify-center'}`}>
      <div
        style={{ maxHeight: 'var(--stage-max-height)' }}
        className={`relative flex max-h-full min-h-0 w-full ${veryCompact ? 'max-w-[21rem] gap-2.5 px-1' : compact ? 'max-w-[23rem] gap-3 px-1.5' : 'max-w-[28rem] gap-4'} flex-col items-start`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(230,201,138,0.42),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(230,201,138,0.18),transparent)]" />
        {!veryCompact && <div className="pointer-events-none absolute left-3 top-3 h-4 w-4 border-l border-t border-[#E6C98A]/28" />}
        {!veryCompact && <div className="pointer-events-none absolute right-3 top-3 h-4 w-4 border-r border-t border-[#E6C98A]/28" />}
        {converging && (
          <>
            <div className={`pointer-events-none absolute bottom-2 top-2 ${veryCompact ? 'left-2.5' : 'left-3.5'} w-[1px] bg-[linear-gradient(180deg,rgba(230,201,138,0.22),rgba(230,201,138,0.08))]`} />
            <div
              className={`pointer-events-none absolute bottom-2 ${veryCompact ? 'left-2.5' : 'left-3.5'} w-[1px] bg-[linear-gradient(180deg,rgba(230,201,138,0.88),rgba(230,201,138,0.22))]`}
              style={{ height: progressHeight }}
            />
            <div className={`pointer-events-none absolute ${veryCompact ? 'left-[0.43rem]' : 'left-[0.67rem]'} ${finale ? 'top-[calc(100%-2.55rem)] h-7 w-7' : 'top-[calc(100%-1.95rem)] h-[1.125rem] w-[1.125rem]'} rounded-full border ${finale ? 'border-[#F2D59A]/95 bg-[#E6C98A]/92 shadow-[0_0_44px_rgba(230,201,138,0.7)]' : 'border-[#E6C98A]/75 bg-[#E6C98A]/72'} `} />
            {finale && <div className={`pointer-events-none absolute ${veryCompact ? 'left-[0.16rem]' : 'left-[0.39rem]'} top-[calc(100%-2.82rem)] h-[1.75rem] w-[1.75rem] rounded-full border border-[#F2D59A]/38`} />}
            {finale && <div className={`pointer-events-none absolute ${veryCompact ? '-left-[0.32rem]' : '-left-[0.05rem]'} top-[calc(100%-3.24rem)] h-[2.55rem] w-[2.55rem] rounded-full bg-[radial-gradient(circle,rgba(230,201,138,0.46)_0%,rgba(230,201,138,0.22)_36%,rgba(230,201,138,0.04)_68%,transparent_100%)] blur-[2px]`} />}
          </>
        )}
        <div className="relative z-10 flex w-full items-center justify-between">
          <span className={`${veryCompact ? 'text-[0.55rem] tracking-[0.2em]' : 'text-[0.62rem] tracking-[0.28em]'} uppercase text-[#E4C27E]/82`}>
            {eyebrow ?? ''}
          </span>
          <span className={`${veryCompact ? 'text-[0.52rem] tracking-[0.18em]' : 'text-[0.58rem] tracking-[0.24em]'} uppercase text-[#F8F4EE]/34`}>
            {progress}
          </span>
        </div>
        <div className="relative z-10 h-[1px] w-16 bg-gradient-to-r from-[#C5A059]/65 to-transparent" />
        {title && (
          <h3 className={`relative z-10 m-0 font-light italic font-serif tracking-[-0.02em] text-[#FFF8EE] ${veryCompact ? 'text-[0.98rem]' : compact ? 'text-[1.04rem]' : 'text-[1.16rem]'}`}>
            {title}
          </h3>
        )}
        <div className="relative z-10 min-h-0 w-full flex-1">{children}</div>
      </div>
    </div>
  );
});

const GiftCubeVisual = React.memo(function GiftCubeVisual({
  compact,
  veryCompact = false,
  state = 'closed',
  dragOffset = 0,
  showInsertCard,
  showFaceLock = false,
  faceLockState = 'idle',
  faceLockPhotoSrc,
  faceLockPhotoAlt = '',
  viewMode = 'angled',
  ribbonVisibility = 1,
}: {
  compact: boolean;
  veryCompact?: boolean;
  state?: 'closed' | 'opening' | 'open' | 'closing';
  dragOffset?: number;
  showInsertCard?: boolean;
  showFaceLock?: boolean;
  faceLockState?: 'idle' | 'scanning' | 'unlocked';
  faceLockPhotoSrc?: string;
  faceLockPhotoAlt?: string;
  viewMode?: 'angled' | 'top';
  ribbonVisibility?: number;
}) {
  const isOpenState = state === 'open';
  const isOpeningState = state === 'opening';
  const isClosingState = state === 'closing';
  const shouldShowInsertCard = showInsertCard ?? (isOpenState || isOpeningState);
  const isTopViewMode = viewMode === 'top';

  return (
    <motion.div
      initial={false}
      animate={
        isOpenState
          ? { rotateX: 74, rotateZ: 0, scale: 1.03, y: 12 }
          : isOpeningState
            ? { rotateX: 54, rotateZ: -5, scale: 1.02, y: 6 }
            : isClosingState
              ? { rotateX: isTopViewMode ? 76 : 28, rotateZ: isTopViewMode ? 0 : -6, scale: 1, y: 10 }
              : { rotateX: isTopViewMode ? 88 : 22, rotateZ: isTopViewMode ? 0 : -14, scale: 1, y: dragOffset * 0.35 }
      }
      transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformStyle: 'preserve-3d' }}
      className={`relative mx-auto w-full ${veryCompact ? 'h-[15rem]' : compact ? 'h-[17rem]' : 'h-[21rem]'}`}
    >
      <div className="absolute inset-x-10 bottom-3 h-7 rounded-full bg-black/30 blur-2xl" />
      <div className="absolute inset-x-10 bottom-6 h-[58%] rounded-[2.2rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.08))] shadow-[0_35px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl" />
      {!isTopViewMode && (
        <>
          <div className="absolute inset-x-[3.95rem] bottom-[1.15rem] h-[1.35rem] rounded-b-[1.2rem] border-x border-b border-[#D8C4A8]/14 bg-[linear-gradient(180deg,rgba(154,121,98,0.42),rgba(74,53,44,0.78))] shadow-[0_10px_18px_rgba(0,0,0,0.18)]" />
          <div className="absolute right-[2.95rem] bottom-[2.2rem] h-[50%] w-[1.15rem] skew-y-[-16deg] rounded-r-[0.9rem] border-r border-[#F4E3C3]/12 bg-[linear-gradient(180deg,rgba(123,98,79,0.34),rgba(54,38,31,0.82))]" />
        </>
      )}
      <div className="absolute inset-x-[3.55rem] bottom-[2.1rem] h-[51%] rounded-[1.8rem] border border-[#D8C4A8]/18 bg-[linear-gradient(180deg,rgba(21,16,12,0.9),rgba(11,9,8,0.96))]" />
      <div className="absolute inset-x-[4rem] bottom-[2.35rem] h-[46%] rounded-[1.5rem] bg-[radial-gradient(circle_at_50%_18%,rgba(212,175,55,0.16),transparent_48%),linear-gradient(180deg,rgba(91,34,18,0.3),rgba(33,18,15,0.82))]" />
      <div className="absolute inset-x-[4.25rem] bottom-[2.75rem] h-[0.3rem] rounded-full bg-[linear-gradient(90deg,rgba(212,175,55,0.7),rgba(248,244,238,0.95),rgba(212,175,55,0.7))]" />
      <div className="absolute left-[16%] bottom-[3.35rem] h-[1.05rem] w-[45%] rounded-[0.7rem] border border-[#E6C98A]/10 bg-[linear-gradient(180deg,rgba(135,92,66,0.92),rgba(78,50,37,0.96))] shadow-[0_8px_18px_rgba(0,0,0,0.2)]" />
      <div className="absolute left-[18%] bottom-[4.25rem] h-[0.18rem] w-[36%] rounded-full bg-white/10" />
      <div className="absolute left-[18%] bottom-[4.7rem] h-[0.18rem] w-[28%] rounded-full bg-white/8" />
      <div className="absolute right-[20%] bottom-[3.15rem] h-[1.45rem] w-[1.95rem] rounded-[0.48rem] border border-[#E6C98A]/12 bg-[linear-gradient(180deg,rgba(230,220,204,0.9),rgba(114,91,73,0.88))] shadow-[0_8px_16px_rgba(0,0,0,0.18)]" />
      <div className="absolute right-[21%] bottom-[3.55rem] h-[0.72rem] w-[1.45rem] rounded-[0.28rem] border border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.16),rgba(255,255,255,0.03))]" />
      <div className="absolute right-[27%] bottom-[4.15rem] h-[0.34rem] w-[3.8rem] rotate-[34deg] rounded-full bg-[linear-gradient(180deg,#F1DFB5,#C79D58)] shadow-[0_10px_22px_rgba(0,0,0,0.18)]" />
      <div className="absolute right-[26.3%] bottom-[4.04rem] h-[0.13rem] w-[0.9rem] rotate-[34deg] rounded-full bg-[linear-gradient(180deg,#F1DFB5,#C79D58)]" />
      <div className="absolute left-1/2 bottom-[2.5rem] h-[0.42rem] w-[1.15rem] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(248,244,238,0.92),rgba(212,175,55,0.92))]" />

      {shouldShowInsertCard && (
        <motion.div
          initial={false}
          animate={{
            opacity: isClosingState ? 0 : 1,
            y: isOpenState ? -40 : isOpeningState ? -24 : -8,
            scale: isClosingState ? 0.94 : 1,
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`absolute inset-x-[18%] z-[4] rounded-[1.55rem] ${veryCompact ? 'bottom-[2.25rem]' : 'bottom-[3.2rem]'}`}
        >
          <div className="absolute inset-x-6 -bottom-4 h-8 rounded-full bg-black/35 blur-xl" />
          <div className={`relative overflow-hidden rounded-[1.45rem] border border-[#E6C98A]/22 bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.03))] shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-lg ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
            <div className="pointer-events-none absolute inset-x-6 top-0 h-12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
            <div className="relative flex flex-col gap-1.5">
              <span className="text-[0.62rem] uppercase tracking-[0.28em] text-[#E4C27E]">
                A note inside
              </span>
              <span className={`font-light italic font-serif text-[#FFF8EE] ${compact ? 'text-[0.9rem]' : 'text-[1rem]'}`}>
                Made to be opened slowly
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={false}
        animate={
          isOpenState
            ? { y: -94, rotateX: -114, rotateZ: 0 }
            : isOpeningState
              ? { y: -68, rotateX: -82, rotateZ: 0 }
              : isClosingState
                ? { y: -20, rotateX: -28, rotateZ: 0 }
                : { y: 0, rotateX: 0, rotateZ: 0 }
        }
        transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
        className={`absolute inset-x-8 top-6 ${veryCompact ? 'h-[7.8rem]' : compact ? 'h-[8.8rem]' : 'h-[10rem]'}`}
      >
        <div className="absolute inset-0 rounded-[2rem] border border-[#E6C98A]/22 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] shadow-[0_28px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl" />
        {!isTopViewMode && (
          <div className="absolute inset-x-[0.8rem] bottom-[-0.95rem] h-[1rem] rounded-b-[1.2rem] border-x border-b border-[#E6C98A]/14 bg-[linear-gradient(180deg,rgba(149,126,104,0.44),rgba(68,50,42,0.78))]" />
        )}
        <div className="absolute inset-4 rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))]" />
        <div className="absolute inset-x-[1.2rem] top-[0.75rem] h-[0.24rem] rounded-full bg-[linear-gradient(90deg,rgba(212,175,55,0.58),rgba(248,244,238,0.92),rgba(212,175,55,0.58))]" />

        <motion.div
          initial={false}
          animate={{ opacity: ribbonVisibility }}
          className={`absolute left-1/2 top-[-0.2rem] z-[4] flex -translate-x-1/2 flex-col items-center ${compact ? 'h-[8rem] w-10' : 'h-[9.6rem] w-12'}`}
        >
          <div className="relative mt-1 h-10 w-14">
            <div className="absolute left-0 top-2 h-6 w-7 rounded-[999px] border border-[#E6C98A]/55 bg-[linear-gradient(180deg,#F8EED2,#D4AF37)] shadow-[0_8px_18px_rgba(0,0,0,0.2)]" />
            <div className="absolute right-0 top-2 h-6 w-7 rounded-[999px] border border-[#E6C98A]/55 bg-[linear-gradient(180deg,#F8EED2,#D4AF37)] shadow-[0_8px_18px_rgba(0,0,0,0.2)]" />
            <div className="absolute left-1/2 top-0 h-8 w-5 -translate-x-1/2 rounded-full border border-[#E6C98A]/55 bg-[radial-gradient(circle_at_50%_45%,rgba(248,244,238,0.95),rgba(197,160,89,0.92))] shadow-[0_8px_18px_rgba(0,0,0,0.26)]" />
          </div>
          <div className="mt-[-0.1rem] w-5 rounded-full bg-[linear-gradient(180deg,#F5E9C8,#C5A059)] shadow-[0_0_18px_rgba(197,160,89,0.22)]" style={{ height: compact ? '6.8rem' : '7.6rem' }} />
          <div className="absolute left-1/2 top-[46%] h-[0.34rem] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,rgba(245,233,200,0.86),rgba(197,160,89,0.96),rgba(245,233,200,0.86))]" />
          <div className="absolute left-[50%] top-[46%] h-[72%] w-[0.34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,rgba(245,233,200,0.86),rgba(197,160,89,0.96),rgba(245,233,200,0.86))]" />
        </motion.div>

        {showFaceLock && (
          <div className="absolute inset-x-[31%] bottom-[4.35rem] z-[6] rounded-[1.15rem] border border-[#E6C98A]/26 bg-[linear-gradient(180deg,rgba(10,10,14,0.82),rgba(10,10,14,0.52))] px-3 py-3 shadow-[0_18px_36px_rgba(0,0,0,0.26)] backdrop-blur-lg">
            <div className="mb-2 text-center">
              <span className="text-[0.48rem] uppercase tracking-[0.18em] text-[#F8F4EE]/52">
                {faceLockState === 'unlocked' ? 'Open for you' : faceLockState === 'scanning' ? 'Opening your gift' : 'Tap to open'}
              </span>
            </div>
            <motion.div
              initial={false}
              animate={
                faceLockState === 'unlocked'
                  ? { scale: [1, 1.04, 0.98], opacity: [1, 1, 0.96] }
                  : { scale: 1, opacity: 1 }
              }
              transition={faceLockState === 'unlocked' ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] } : { duration: 0.2 }}
              className="relative mx-auto flex h-[3.35rem] w-[3.35rem] items-center justify-center overflow-hidden rounded-[0.95rem] border border-[#E6C98A]/22 bg-black/20"
            >
              {faceLockPhotoSrc ? (
                <img
                  src={faceLockPhotoSrc}
                  alt={faceLockPhotoAlt}
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
              ) : null}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.12),rgba(255,255,255,0.01))]" />
              <div className="absolute inset-[0.38rem] rounded-[0.72rem] border border-[#E6C98A]/24" />
              <motion.div
                animate={
                  faceLockState === 'scanning'
                    ? { opacity: [0.22, 1, 0.22], y: [-12, 12, -12] }
                    : faceLockState === 'unlocked'
                      ? { opacity: 0, y: 0 }
                      : { opacity: 0.34, y: 0 }
                }
                transition={
                  faceLockState === 'scanning'
                    ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.3 }
                }
                className="absolute left-1.5 right-1.5 h-[2px] rounded-full bg-[#E6C98A]"
              />
              <div className="absolute left-2 top-2 h-2.5 w-2.5 rounded-tl-[0.45rem] border-l border-t border-[#E6C98A]/70" />
              <div className="absolute right-2 top-2 h-2.5 w-2.5 rounded-tr-[0.45rem] border-r border-t border-[#E6C98A]/70" />
              <div className="absolute bottom-2 left-2 h-2.5 w-2.5 rounded-bl-[0.45rem] border-b border-l border-[#E6C98A]/70" />
              <div className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-br-[0.45rem] border-b border-r border-[#E6C98A]/70" />
              {faceLockState === 'unlocked' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.86 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle,rgba(197,160,89,0.18),transparent_62%)]"
                >
                  <div className="rounded-full border border-[#E6C98A]/34 bg-black/24 px-2.5 py-1">
                    <span className="text-[0.54rem] font-medium tracking-[0.18em] text-[#FFF8EE]">For you</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});

const ClosingGiftStage = React.memo(function ClosingGiftStage({
  compact,
  veryCompact,
}: {
  compact: boolean;
  veryCompact: boolean;
}) {
  const [showEnding, setShowEnding] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowEnding(true);
    }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="mx-auto flex h-full w-full items-center justify-center"
    >
      <div className="pointer-events-none flex h-full w-full items-center justify-center">
        <AnimatePresence>
          {showEnding && (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col items-center text-center ${veryCompact ? 'gap-2.5' : compact ? 'gap-3' : 'gap-4'} ${veryCompact ? '-mt-[10vh]' : '-mt-[12vh]'}`}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                className={`${veryCompact ? 'text-[1.9rem]' : compact ? 'text-[2.2rem]' : 'text-[2.7rem]'} leading-none text-[#F6CFD6] drop-shadow-[0_0_24px_rgba(246,207,214,0.32)]`}
                aria-hidden="true"
              >
                {'♥'}
              </motion.div>
              <div className="flex flex-col items-center gap-1">
                <span className={`font-serif italic tracking-[0.04em] text-[#FFF4F6] ${veryCompact ? 'text-[1rem]' : compact ? 'text-[1.14rem]' : 'text-[1.34rem]'}`}>
                  your love
                </span>
                <span className={`uppercase tracking-[0.22em] text-[#E6C98A]/72 ${veryCompact ? 'text-[0.52rem]' : 'text-[0.58rem]'}`}>
                  always
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
});

const OpeningRevealCard = React.memo(function OpeningRevealCard({
  content,
  onConfirm,
  mode = 'overlay',
}: {
  content: typeof birthdayContent.opening.revealCard;
  onConfirm?: () => void;
  mode?: 'overlay' | 'inline';
}) {
  const isInline = mode === 'inline';
  const [isOpeningRest, setIsOpeningRest] = React.useState(false);
  const [dragY, setDragY] = React.useState(0);

  const handleConfirm = React.useCallback(() => {
    if (!onConfirm || isOpeningRest) {
      return;
    }

    setIsOpeningRest(true);
    window.setTimeout(() => {
      onConfirm();
    }, 380);
  }, [isOpeningRest, onConfirm]);

  const handleDragEnd = React.useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!onConfirm || isInline || isOpeningRest) {
        return;
      }

      const pulledFarEnough = info.offset.y <= -88;
      const pulledFastEnough = info.velocity.y <= -420;

      if (pulledFarEnough || pulledFastEnough) {
        setDragY(-96);
        handleConfirm();
        return;
      }

      setDragY(0);
    },
    [handleConfirm, isInline, isOpeningRest, onConfirm],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={
        isInline
          ? 'mx-auto flex w-full max-w-[30rem] flex-col gap-5'
          : 'mx-auto flex w-[min(92vw,30rem)] flex-col gap-5'
      }
    >
      <div
        className={
          isInline
            ? 'relative mx-auto w-full max-w-[30rem]'
            : 'relative mx-auto w-full max-w-[30rem]'
        }
      >
        <div className="absolute inset-x-5 bottom-0 h-[78%] rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(28,24,36,0.92),rgba(10,10,14,0.82))] shadow-[0_28px_60px_rgba(0,0,0,0.4)]" />
        <div className="pointer-events-none absolute inset-x-16 top-5 h-6 rounded-b-[1rem] bg-white/[0.08] blur-md" />
        <div className="pointer-events-none absolute inset-x-9 bottom-5 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <motion.div
          initial={{ y: 44, opacity: 0.75 }}
          animate={
            isOpeningRest
              ? { y: -18, opacity: 1, scale: 1.015 }
              : { y: dragY, opacity: 1, scale: 1 }
          }
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          drag={!isInline && !isOpeningRest ? 'y' : false}
          dragConstraints={{ top: -140, bottom: 0 }}
          dragElastic={0.08}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          className={`relative mx-auto w-[92%] ${!isInline && !isOpeningRest ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
        >
          <div className="absolute left-1/2 top-3 z-[3] h-1 w-16 -translate-x-1/2 rounded-full bg-[#FFF8EE]/40" />
          <div className="relative overflow-hidden rounded-[1.6rem] border border-[#E6C98A]/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.04))] px-5 pb-6 pt-8 shadow-[0_32px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:px-7 sm:pb-7 sm:pt-9">
            <motion.div
              initial={{ opacity: 0.2, scale: 0.96 }}
              animate={{ opacity: [0.16, 0.3, 0.18], scale: [0.98, 1.01, 0.99] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(230,201,138,0.16),transparent_52%)]"
            />
            <div className="pointer-events-none absolute inset-x-6 top-0 h-14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
            <div className="relative flex flex-col gap-4">
              <span className="text-[0.62rem] uppercase tracking-[0.3em] text-[#E4C27E]">
                {content.eyebrow}
              </span>
              <h2 className="m-0 text-[clamp(1.4rem,6vw,1.95rem)] font-light italic font-serif tracking-[-0.02em] text-[#FFF8EE]">
                {content.title}
              </h2>
              <p className="m-0 whitespace-pre-line text-[clamp(0.98rem,4vw,1.04rem)] leading-[1.95] font-light italic font-serif tracking-[0.02em] text-[#F8F4EE]/92">
                {content.body}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {!isInline && onConfirm && (
        <div className="mx-auto flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.28em] text-[#E4C27E]/88">
            <span className="inline-block h-[1px] w-8 bg-gradient-to-r from-transparent to-[#C5A059]/55" />
            <span>{content.confirmLabel}</span>
            <span className="inline-block h-[1px] w-8 bg-gradient-to-l from-transparent to-[#C5A059]/55" />
          </div>
          <p className="m-0 text-[0.78rem] tracking-[0.06em] text-[#F8F4EE]/58">
            Pull the card upward to reveal the rest.
          </p>
        </div>
      )}
    </motion.section>
  );
});

const NavigationControls = React.memo(({ compact, veryCompact, step, prevStep, nextStep }: { compact: boolean, veryCompact: boolean, step: string, prevStep: () => void, nextStep: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className={`pointer-events-auto flex items-center justify-center ${veryCompact ? 'gap-6' : compact ? 'gap-8' : 'gap-12 sm:gap-24'}`}
  >
    <motion.button 
      onClick={prevStep}
      disabled={step === 'intro'}
      whileHover="hover"
      initial="initial"
      className={`group flex flex-col items-center text-[#F8F4EE]/40 hover:text-[#F8F4EE] disabled:pointer-events-none disabled:opacity-0 transition-all duration-700 ${veryCompact ? 'gap-1' : compact ? 'gap-1.5' : 'gap-2'}`}
      aria-label="Previous step"
    >
      <ChevronLeft className={`group-hover:-translate-x-1 transition-transform duration-500 ${veryCompact ? 'mb-0 h-3.5 w-3.5' : compact ? 'mb-0 h-4 w-4' : 'mb-1 h-5 w-5'}`} />
      <span className={`uppercase font-light ${veryCompact ? 'text-[0.5rem] tracking-[0.2em]' : compact ? 'text-[0.55rem] tracking-[0.28em]' : 'text-[0.6rem] tracking-[0.4em]'}`}>
        {birthdayContent.ui.previousLabel}
      </span>
      <motion.div 
        variants={{
          initial: { width: veryCompact ? 12 : 16 },
          hover: { width: veryCompact ? 28 : 48 }
        }}
        className="h-[1px] bg-[#C5A059]/60 transition-all duration-700 ease-in-out" 
      />
    </motion.button>
    <motion.button 
      onClick={nextStep}
      disabled={step === 'ready' || step === 'closing-gift'}
      whileHover="hover"
      initial="initial"
      className={`group flex flex-col items-center text-[#F8F4EE]/40 hover:text-[#F8F4EE] disabled:pointer-events-none disabled:opacity-0 transition-all duration-700 ${veryCompact ? 'gap-1' : compact ? 'gap-1.5' : 'gap-2'}`}
      aria-label="Next step"
    >
      <ChevronRight className={`group-hover:translate-x-1 transition-transform duration-500 ${veryCompact ? 'mb-0 h-3.5 w-3.5' : compact ? 'mb-0 h-4 w-4' : 'mb-1 h-5 w-5'}`} />
      <span className={`uppercase font-light ${veryCompact ? 'text-[0.5rem] tracking-[0.2em]' : compact ? 'text-[0.55rem] tracking-[0.28em]' : 'text-[0.6rem] tracking-[0.4em]'}`}>
        {birthdayContent.ui.nextLabel}
      </span>
      <motion.div 
        variants={{
          initial: { width: veryCompact ? 12 : 16 },
          hover: { width: veryCompact ? 28 : 48 }
        }}
        className="h-[1px] bg-[#C5A059]/60 transition-all duration-700 ease-in-out" 
      />
    </motion.button>
  </motion.div>
));

const MusicToggle = React.memo(function MusicToggle({
  compact,
  isMuted,
  onToggle,
}: {
  compact: boolean;
  isMuted: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onToggle}
      className={`pointer-events-auto flex items-center rounded-full border border-white/10 bg-black/30 text-[#F8F4EE]/78 backdrop-blur-xl ${compact ? 'gap-1.5 px-2.5 py-1.5 text-[0.55rem] tracking-[0.18em]' : 'gap-2 px-3 py-2 text-[0.62rem] tracking-[0.24em]'} uppercase`}
      aria-label={isMuted ? birthdayContent.ui.musicOffLabel : birthdayContent.ui.musicOnLabel}
    >
      {isMuted ? <VolumeX className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> : <Volume2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      <span>{isMuted ? birthdayContent.ui.musicOffLabel : birthdayContent.ui.musicOnLabel}</span>
    </motion.button>
  );
});


