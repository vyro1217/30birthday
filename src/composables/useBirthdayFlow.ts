import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { BirthdayStep } from '../types/birthday';

const AUTO_ADVANCE_DELAY: Partial<Record<BirthdayStep, number>> = {
  intro: 2200,
  'opening-bridge': 2000,
  'cosmic-core': 1200,
  'timeline-expand': 1400,
  'node-before': 6200,
  'memory-1': 4600,
  'node-now': 6000,
} as const;

const DEFAULT_STEPS: BirthdayStep[] = [
  'intro', 
  'ready', 
  'opening', 
  'opening-bridge',
  'cosmic-core', 
  'timeline-expand', 
  'story-gift',
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
  'closing-gift'
];

export function useBirthdayFlow(
  steps: BirthdayStep[] = DEFAULT_STEPS,
  autoAdvanceDelayOverrides: Partial<Record<BirthdayStep, number>> = {},
  initialStep?: BirthdayStep,
) {
  const [step, setStep] = useState<BirthdayStep>(() => {
    if (initialStep && steps.includes(initialStep)) {
      return initialStep;
    }

    return steps[0] ?? 'intro';
  });
  const [autoAdvanceBlockedForStep, setAutoAdvanceBlockedForStep] = useState<BirthdayStep | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceDelay = useMemo(
    () => ({ ...AUTO_ADVANCE_DELAY, ...autoAdvanceDelayOverrides }),
    [autoAdvanceDelayOverrides],
  );

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const nextStep = useCallback(() => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      const next = steps[currentIndex + 1];
      setStep(next);
      setAutoAdvanceBlockedForStep(next);
      clearTimers();
    }
  }, [step, clearTimers, steps]);

  const continueStep = useCallback(() => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      const next = steps[currentIndex + 1];
      setAutoAdvanceBlockedForStep(null);
      setStep(next);
      clearTimers();
    }
  }, [step, clearTimers, steps]);

  const prevStep = useCallback(() => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      const prev = steps[currentIndex - 1];
      setStep(prev);
      setAutoAdvanceBlockedForStep(prev);
      clearTimers();
    }
  }, [step, clearTimers, steps]);

  const openGift = useCallback(() => {
    if (step !== 'ready') return;
    setAutoAdvanceBlockedForStep(null);
    setStep('opening');
  }, [step]);

  useEffect(() => {
    if (autoAdvanceBlockedForStep && autoAdvanceBlockedForStep !== step) {
      setAutoAdvanceBlockedForStep(null);
    }
  }, [autoAdvanceBlockedForStep, step]);

  useEffect(() => {
    const delay = autoAdvanceDelay[step];

    if (!delay || autoAdvanceBlockedForStep === step) {
      clearTimers();
      return;
    }

    timerRef.current = setTimeout(() => {
      setStep((currentStep) => {
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex === -1 || currentIndex >= steps.length - 1) {
          return currentStep;
        }

        return steps[currentIndex + 1];
      });
    }, delay);

    return clearTimers;
  }, [step, clearTimers, steps, autoAdvanceDelay, autoAdvanceBlockedForStep]);

  return useMemo(() => ({
    step,
    nextStep,
    continueStep,
    prevStep,
    openGift,
  }), [step, nextStep, continueStep, prevStep, openGift]);
}
