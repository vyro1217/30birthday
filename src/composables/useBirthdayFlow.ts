import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { BirthdayStep } from '../types/birthday';

const AUTO_ADVANCE_DELAY: Partial<Record<BirthdayStep, number>> = {
  intro: 2200,
  opening: 2200,
  'cosmic-core': 1200,
  'timeline-expand': 1400,
  'node-before': 6200,
  'node-us': 5600,
  'memory-1': 4600,
  'memory-2': 5200,
  'memory-3': 6200,
  'node-now': 6000,
  title: 3600,
} as const;

const DEFAULT_STEPS: BirthdayStep[] = [
  'intro', 
  'ready', 
  'opening', 
  'cosmic-core', 
  'timeline-expand', 
  'node-before', 
  'node-us', 
  'memory-1',
  'memory-2',
  'memory-3',
  'node-now', 
  'title', 
  'message', 
  'message2',
  'final'
];

export function useBirthdayFlow(
  steps: BirthdayStep[] = DEFAULT_STEPS,
  autoAdvanceDelayOverrides: Partial<Record<BirthdayStep, number>> = {},
) {
  const [step, setStep] = useState<BirthdayStep>('intro');
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
    prevStep,
    openGift,
  }), [step, nextStep, prevStep, openGift]);
}
