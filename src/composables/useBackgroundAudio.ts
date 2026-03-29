import { useCallback, useEffect, useRef, useState } from 'react';
import { BirthdayBackgroundAudio } from '../types/birthday';

const CHORD_SEQUENCE = [
  [261.63, 329.63, 392.0],
  [293.66, 369.99, 440.0],
  [220.0, 329.63, 392.0],
  [246.94, 329.63, 392.0],
];

function playTone(
  context: AudioContext,
  masterGain: GainNode,
  frequency: number,
  startAt: number,
  duration: number,
  type: OscillatorType,
  volume: number,
) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.45);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.2);
}

export function useBackgroundAudio(config: BirthdayBackgroundAudio) {
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const generatedLoopRef = useRef<number | null>(null);
  const chordIndexRef = useRef(0);

  const isAvailable = config.mode !== 'off';

  const clearGeneratedLoop = useCallback(() => {
    if (generatedLoopRef.current !== null) {
      window.clearInterval(generatedLoopRef.current);
      generatedLoopRef.current = null;
    }
  }, []);

  const scheduleGeneratedChord = useCallback(() => {
    const context = audioContextRef.current;
    const masterGain = masterGainRef.current;

    if (!context || !masterGain) {
      return;
    }

    const currentChord = CHORD_SEQUENCE[chordIndexRef.current % CHORD_SEQUENCE.length];
    const now = context.currentTime + 0.04;

    currentChord.forEach((frequency, index) => {
      playTone(context, masterGain, frequency, now + index * 0.22, 2.8, 'triangle', 0.018);
      playTone(context, masterGain, frequency * 0.5, now + index * 0.22, 3.2, 'sine', 0.01);
    });

    chordIndexRef.current += 1;
  }, []);

  const startGeneratedAudio = useCallback(() => {
    if (audioContextRef.current && masterGainRef.current) {
      void audioContextRef.current.resume();
      return;
    }

    const audioContext = new AudioContext();
    const masterGain = audioContext.createGain();
    masterGain.gain.value = isMuted ? 0 : 0.9;
    masterGain.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    masterGainRef.current = masterGain;
    chordIndexRef.current = 0;

    scheduleGeneratedChord();
    generatedLoopRef.current = window.setInterval(scheduleGeneratedChord, 4400);
  }, [isMuted, scheduleGeneratedChord]);

  const startFileAudio = useCallback(() => {
    if (!config.fileSrc) {
      return;
    }

    if (!audioElementRef.current) {
      const audio = new Audio(config.fileSrc);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.35;
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

  const toggleMuted = useCallback(() => {
    setIsMuted((currentMuted) => {
      const nextMuted = !currentMuted;

      if (audioElementRef.current) {
        audioElementRef.current.muted = nextMuted;
      }

      if (masterGainRef.current) {
        masterGainRef.current.gain.setTargetAtTime(nextMuted ? 0 : 0.9, audioContextRef.current?.currentTime ?? 0, 0.15);
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
    toggleMuted,
    isMuted,
    hasStarted,
    isAvailable,
  };
}
