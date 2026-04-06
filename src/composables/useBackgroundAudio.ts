import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BirthdayAudioCueConfig,
  BirthdayAudioCueId,
  BirthdayAudioSegmentConfig,
  BirthdayAudioSegmentId,
  BirthdayBackgroundAudio,
} from '../types/birthday';

const CHORD_SEQUENCE = [
  [261.63, 329.63, 392.0],
  [293.66, 369.99, 440.0],
  [220.0, 329.63, 392.0],
  [246.94, 329.63, 392.0],
];
const OUTPUT_GAIN_MULTIPLIER = 1.14;

const SEGMENT_DEFAULTS: Record<BirthdayAudioSegmentId, Required<BirthdayAudioSegmentConfig>> = {
  opening: {
    title: 'Opening',
    intensity: 0.64,
    tempoMs: 4100,
    toneColor: 'velvet',
    pulse: 'none',
    sparkle: 0.08,
  },
  reveal: {
    title: 'Reveal',
    intensity: 0.94,
    tempoMs: 3000,
    toneColor: 'glass',
    pulse: 'soft',
    sparkle: 0.34,
  },
  reading: {
    title: 'Reading',
    intensity: 0.56,
    tempoMs: 4700,
    toneColor: 'warm',
    pulse: 'none',
    sparkle: 0.12,
  },
  closing: {
    title: 'Closing',
    intensity: 0.74,
    tempoMs: 5200,
    toneColor: 'warm',
    pulse: 'soft',
    sparkle: 0.18,
  },
};

const CUE_DEFAULTS: Record<BirthdayAudioCueId, Required<Omit<BirthdayAudioCueConfig, 'fileSrc'>> & { fileSrc?: string }> = {
  'open-gift': {
    kind: 'swell',
    volume: 0.34,
  },
  'reveal-hit': {
    kind: 'chime',
    volume: 0.42,
  },
  'reveal-confirm': {
    kind: 'bell',
    volume: 0.36,
  },
  finale: {
    kind: 'swell',
    volume: 0.3,
  },
  reopen: {
    kind: 'chime',
    volume: 0.24,
  },
};

function mergeSegmentConfig(
  config: BirthdayBackgroundAudio,
): Record<BirthdayAudioSegmentId, Required<BirthdayAudioSegmentConfig>> {
  return {
    opening: { ...SEGMENT_DEFAULTS.opening, ...config.segments?.opening },
    reveal: { ...SEGMENT_DEFAULTS.reveal, ...config.segments?.reveal },
    reading: { ...SEGMENT_DEFAULTS.reading, ...config.segments?.reading },
    closing: { ...SEGMENT_DEFAULTS.closing, ...config.segments?.closing },
  };
}

function mergeCueConfig(config: BirthdayBackgroundAudio): Record<BirthdayAudioCueId, Required<Omit<BirthdayAudioCueConfig, 'fileSrc'>> & { fileSrc?: string }> {
  return {
    'open-gift': { ...CUE_DEFAULTS['open-gift'], ...config.accents?.['open-gift'] },
    'reveal-hit': { ...CUE_DEFAULTS['reveal-hit'], ...config.accents?.['reveal-hit'] },
    'reveal-confirm': { ...CUE_DEFAULTS['reveal-confirm'], ...config.accents?.['reveal-confirm'] },
    finale: { ...CUE_DEFAULTS.finale, ...config.accents?.finale },
    reopen: { ...CUE_DEFAULTS.reopen, ...config.accents?.reopen },
  };
}

function getToneTypes(segment: Required<BirthdayAudioSegmentConfig>): {
  pad: OscillatorType;
  bass: OscillatorType;
  shimmer: OscillatorType;
} {
  switch (segment.toneColor) {
    case 'glass':
      return { pad: 'triangle', bass: 'sine', shimmer: 'sine' };
    case 'warm':
      return { pad: 'sine', bass: 'triangle', shimmer: 'triangle' };
    case 'velvet':
    default:
      return { pad: 'triangle', bass: 'sine', shimmer: 'triangle' };
  }
}

function playTone(
  context: AudioContext,
  targetNode: AudioNode,
  frequency: number,
  startAt: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  attack = 0.42,
) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), startAt + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gainNode);
  gainNode.connect(targetNode);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.18);
}

function playPulse(
  context: AudioContext,
  targetNode: AudioNode,
  rootFrequency: number,
  startAt: number,
  volume: number,
  kind: 'soft' | 'steady',
) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const lowpass = context.createBiquadFilter();

  oscillator.type = kind === 'steady' ? 'triangle' : 'sine';
  oscillator.frequency.setValueAtTime(rootFrequency, startAt);
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(kind === 'steady' ? 640 : 420, startAt);

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), startAt + 0.03);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.42);

  oscillator.connect(lowpass);
  lowpass.connect(gainNode);
  gainNode.connect(targetNode);

  oscillator.start(startAt);
  oscillator.stop(startAt + 0.52);
}

function triggerGeneratedAccent(
  context: AudioContext,
  targetNode: AudioNode,
  cue: Required<Omit<BirthdayAudioCueConfig, 'fileSrc'>> & { fileSrc?: string },
) {
  const now = context.currentTime + 0.02;

  if (cue.kind === 'swell') {
    [392.0, 523.25, 659.25].forEach((frequency, index) => {
      playTone(context, targetNode, frequency, now + index * 0.07, 1.7, 'triangle', cue.volume * (0.2 + index * 0.05), 0.16);
    });
    return;
  }

  if (cue.kind === 'bell') {
    [659.25, 783.99, 987.77].forEach((frequency, index) => {
      playTone(context, targetNode, frequency, now + index * 0.1, 1.4, 'sine', cue.volume * (0.18 - index * 0.02), 0.04);
    });
    return;
  }

  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    playTone(context, targetNode, frequency, now + index * 0.06, 1.05, 'triangle', cue.volume * (0.19 - index * 0.02), 0.05);
  });
}

function getSegmentOutputGain(segment: Required<BirthdayAudioSegmentConfig>) {
  return Math.min(segment.intensity * OUTPUT_GAIN_MULTIPLIER, 1);
}

function getSegmentBedGainMultiplier(segmentId: BirthdayAudioSegmentId) {
  if (segmentId === 'reading') {
    return 1.42;
  }

  return 1;
}

export function useBackgroundAudio(config: BirthdayBackgroundAudio) {
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const bedGainRef = useRef<GainNode | null>(null);
  const accentGainRef = useRef<GainNode | null>(null);
  const loopTimerRef = useRef<number | null>(null);
  const chordIndexRef = useRef(0);
  const currentSegmentRef = useRef<BirthdayAudioSegmentId>('opening');
  const segmentConfigRef = useRef<Record<BirthdayAudioSegmentId, Required<BirthdayAudioSegmentConfig>>>(mergeSegmentConfig(config));
  const cueConfigRef = useRef<Record<BirthdayAudioCueId, Required<Omit<BirthdayAudioCueConfig, 'fileSrc'>> & { fileSrc?: string }>>(mergeCueConfig(config));

  const isAvailable = config.mode !== 'off';

  const mergedSegments = useMemo(() => mergeSegmentConfig(config), [config]);
  const mergedCues = useMemo(() => mergeCueConfig(config), [config]);

  useEffect(() => {
    segmentConfigRef.current = mergedSegments;
  }, [mergedSegments]);

  useEffect(() => {
    cueConfigRef.current = mergedCues;
  }, [mergedCues]);

  const clearGeneratedLoop = useCallback(() => {
    if (loopTimerRef.current !== null) {
      window.clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }, []);

  const playFileCue = useCallback((fileSrc: string, volume: number) => {
    const cueAudio = new Audio(fileSrc);
    cueAudio.preload = 'auto';
    cueAudio.volume = Math.max(0, Math.min(volume, 1));
    cueAudio.muted = isMuted;
    void cueAudio.play().catch(() => {});
  }, [isMuted]);

  const scheduleGeneratedMeasure = useCallback(() => {
    const context = audioContextRef.current;
    const bedGain = bedGainRef.current;
    const accentGain = accentGainRef.current;

    if (!context || !bedGain || !accentGain) {
      return;
    }

    const segment = segmentConfigRef.current[currentSegmentRef.current];
    const chord = CHORD_SEQUENCE[chordIndexRef.current % CHORD_SEQUENCE.length];
    const toneTypes = getToneTypes(segment);
    const now = context.currentTime + 0.04;
    const chordDuration = Math.max(segment.tempoMs / 1000, 2.6);
    const bassDuration = Math.max(chordDuration * 0.78, 2.2);
    const sparkleVolume = segment.sparkle * segment.intensity;
    const bedGainMultiplier = getSegmentBedGainMultiplier(currentSegmentRef.current);

    chord.forEach((frequency, index) => {
      playTone(
        context,
        bedGain,
        frequency,
        now + index * 0.12,
        chordDuration,
        toneTypes.pad,
        0.02 * segment.intensity * bedGainMultiplier,
        currentSegmentRef.current === 'reveal' ? 0.18 : 0.36,
      );
    });

    playTone(
      context,
      bedGain,
      chord[0] * 0.5,
      now,
      bassDuration,
      toneTypes.bass,
      0.013 * segment.intensity * bedGainMultiplier,
      0.22,
    );

    if (segment.pulse !== 'none') {
      const pulseCount = segment.pulse === 'steady' ? 3 : 2;
      const pulseSpacing = chordDuration / (pulseCount + 1);
      for (let index = 0; index < pulseCount; index += 1) {
        playPulse(
          context,
          bedGain,
          chord[0] * 0.5,
          now + pulseSpacing * (index + 1),
          (segment.pulse === 'steady' ? 0.012 : 0.008) * segment.intensity * bedGainMultiplier,
          segment.pulse,
        );
      }
    }

    if (sparkleVolume > 0.01) {
      const sparkleFrequencies =
        currentSegmentRef.current === 'reveal'
          ? [chord[1] * 2, chord[2] * 2, chord[2] * 2.5]
          : currentSegmentRef.current === 'closing'
            ? [chord[2] * 1.5]
            : [chord[1] * 2];

      sparkleFrequencies.forEach((frequency, index) => {
        playTone(
          context,
          accentGain,
          frequency,
          now + chordDuration * (0.32 + index * 0.12),
          0.95,
          toneTypes.shimmer,
          0.015 * sparkleVolume,
          0.05,
        );
      });
    }

    chordIndexRef.current += 1;

    const nextLoopDelay = Math.max(segment.tempoMs - 220, 1800);
    loopTimerRef.current = window.setTimeout(scheduleGeneratedMeasure, nextLoopDelay);
  }, []);

  const startGeneratedAudio = useCallback(() => {
    if (audioContextRef.current && masterGainRef.current) {
      void audioContextRef.current.resume();
      return;
    }

    const audioContext = new AudioContext();
    const masterGain = audioContext.createGain();
    const bedGain = audioContext.createGain();
    const accentGain = audioContext.createGain();
    const targetVolume = isMuted ? 0 : getSegmentOutputGain(segmentConfigRef.current[currentSegmentRef.current]);

    masterGain.gain.value = targetVolume;
    bedGain.gain.value = 1;
    accentGain.gain.value = 1;

    bedGain.connect(masterGain);
    accentGain.connect(masterGain);
    masterGain.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    masterGainRef.current = masterGain;
    bedGainRef.current = bedGain;
    accentGainRef.current = accentGain;
    chordIndexRef.current = 0;

    scheduleGeneratedMeasure();
  }, [isMuted, scheduleGeneratedMeasure]);

  const startFileAudio = useCallback(() => {
    if (!config.fileSrc) {
      return;
    }

    if (!audioElementRef.current) {
      const audio = new Audio(config.fileSrc);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = Math.min(0.35 * OUTPUT_GAIN_MULTIPLIER, 1);
      audio.muted = isMuted;
      audioElementRef.current = audio;
    }

    void audioElementRef.current.play().catch(() => {});
  }, [config.fileSrc, isMuted]);

  const start = useCallback(() => {
    if (!isAvailable) {
      return;
    }

    if (hasStarted) {
      if (config.mode === 'generated' && audioContextRef.current?.state === 'suspended') {
        void audioContextRef.current.resume();
      }
      if (config.mode === 'file' && audioElementRef.current?.paused) {
        void audioElementRef.current.play().catch(() => {});
      }
      return;
    }

    if (config.mode === 'generated') {
      startGeneratedAudio();
    }

    if (config.mode === 'file') {
      startFileAudio();
    }

    setHasStarted(true);
  }, [config.mode, hasStarted, isAvailable, startFileAudio, startGeneratedAudio]);

  const setSegment = useCallback((segment: BirthdayAudioSegmentId) => {
    currentSegmentRef.current = segment;

    const context = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!context || !masterGain) {
      return;
    }

    const segmentConfig = segmentConfigRef.current[segment];
    masterGain.gain.cancelScheduledValues(context.currentTime);
    masterGain.gain.setTargetAtTime(isMuted ? 0 : getSegmentOutputGain(segmentConfig), context.currentTime, 0.45);
  }, [isMuted]);

  const triggerAccent = useCallback((cueId: BirthdayAudioCueId) => {
    if (!hasStarted || isMuted || config.mode !== 'generated') {
      return;
    }

    const cue = cueConfigRef.current[cueId];
    if (cue.fileSrc) {
      playFileCue(cue.fileSrc, cue.volume);
      return;
    }

    const context = audioContextRef.current;
    const accentGain = accentGainRef.current;
    if (!context || !accentGain) {
      return;
    }

    triggerGeneratedAccent(context, accentGain, cue);
  }, [config.mode, hasStarted, isMuted, playFileCue]);

  const toggleMuted = useCallback(() => {
    setIsMuted((currentMuted) => {
      const nextMuted = !currentMuted;

      if (audioElementRef.current) {
        audioElementRef.current.muted = nextMuted;
      }

      if (masterGainRef.current) {
        const context = audioContextRef.current;
        const targetGain = nextMuted ? 0 : getSegmentOutputGain(segmentConfigRef.current[currentSegmentRef.current]);
        masterGainRef.current.gain.setTargetAtTime(targetGain, context?.currentTime ?? 0, 0.18);
      }

      return nextMuted;
    });
  }, []);

  useEffect(() => {
    return () => {
      clearGeneratedLoop();
      audioElementRef.current?.pause();
      audioElementRef.current = null;

      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [clearGeneratedLoop]);

  return {
    start,
    setSegment,
    triggerAccent,
    toggleMuted,
    isMuted,
    hasStarted,
    isAvailable,
  };
}
