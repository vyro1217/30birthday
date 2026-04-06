import React, { Suspense, useRef, useEffect, memo, useMemo } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Float, Sparkles, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { BirthdayStep } from '../types/birthday';
import { GiftBoxModel } from './GiftBoxModel';

type SceneMode =
  | 'none'
  | 'gift-opening'
  | 'cosmic-core'
  | 'timeline-expand'
  | 'reading-background-box'
  | 'closing-gift';

interface GiftBoxProps {
  sceneMode: SceneMode;
  step: BirthdayStep;
  simpleInteractionMode?: boolean;
  storyGiftOpening?: boolean;
  storyGiftPullProgress?: number;
  onStoryGiftPullChange?: (distance: number) => void;
  onStoryGiftPullEnd?: (distance: number) => void;
  onClosingGiftOpen?: () => void;
}

const loadGiftBoxTimelineLayer = () =>
  import('./GiftBoxTimelineLayer').then((module) => ({
    default: module.GiftBoxTimelineLayer,
  }));

const GiftBoxTimelineLayer = React.lazy(loadGiftBoxTimelineLayer);

export const GiftBoxScene = memo(function GiftBoxScene({
  sceneMode,
  step,
  simpleInteractionMode = false,
  storyGiftOpening = false,
  storyGiftPullProgress = 0,
  onStoryGiftPullChange,
  onStoryGiftPullEnd,
  onClosingGiftOpen,
}: GiftBoxProps) {
  const { camera } = useThree();
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
  const groupRef = useRef<THREE.Group>(null);
  const boxGroupRef = useRef<THREE.Group>(null);
  const lidGroupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  const tracksRef = useRef<THREE.Group>(null);
  const timelineGroupRef = useRef<THREE.Group>(null);
  const insertCardRef = useRef<THREE.Group>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const storyGiftGlowRef = useRef<THREE.PointLight>(null);
  const storyGiftPullVisualRef = useRef(0);
  const detachStoryGiftListenersRef = useRef<(() => void) | null>(null);
  const detachClosingGiftListenersRef = useRef<(() => void) | null>(null);
  const closingGiftRotationYRef = useRef(0.35);
  const closingGiftSpinVelocityRef = useRef(0);
  const storyGiftPullStateRef = useRef({
    active: false,
    startClientY: 0,
    distance: 0,
    pointerId: -1,
  });
  const closingGiftDragStateRef = useRef({
    active: false,
    pointerId: -1,
    startClientX: 0,
    lastClientX: 0,
    totalDragDistance: 0,
  });

  // Memoize static arrays to prevent re-renders
  const verticalEdgePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    [-1.05, 1.05].forEach(x => [-1.05, 1.05].forEach(z => positions.push([x, 0, z])));
    return positions;
  }, []);

  const cornerPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    [-1.1, 1.1].forEach(x => [-1.1, 1.1].forEach(z => positions.push([x, 0, z])));
    return positions;
  }, []);

  const isCosmicPhase = sceneMode === 'cosmic-core';
  const isTimelinePhase = sceneMode === 'timeline-expand';
  const isGiftPhase = sceneMode === 'gift-opening';
  const isReadingBackgroundPhase = sceneMode === 'reading-background-box';
  const isClosingPhase = sceneMode === 'closing-gift';
  const showSecondaryStars = isTimelinePhase;
  const showAmbientSparkles = isCosmicPhase || isTimelinePhase;
  const shouldLoadTimelineLayer = isGiftPhase || isCosmicPhase || isTimelinePhase;

  const textSteps = useMemo(
    () => ['node-before', 'node-us', 'memory-1', 'memory-2', 'memory-3', 'memory-4', 'memory-5', 'node-now', 'node-thirty-soft', 'node-thirty-race', 'title', 'message', 'message2', 'final'],
    [],
  );

  const cornerBoxSteps = useMemo(
    () => ['node-us', 'memory-1', 'memory-2', 'memory-3', 'memory-4', 'memory-5'],
    [],
  );

  const readingCornerPlacements = useMemo(
    () =>
      ({
        'node-before': 'top-left',
        'node-us': 'top-right',
        'memory-1': 'bottom-right',
        'memory-2': 'bottom-left',
        'memory-3': 'top-left',
        'memory-4': 'top-right',
        'memory-5': 'bottom-right',
        'node-now': 'bottom-left',
        'node-thirty-soft': 'top-left',
        'node-thirty-race': 'top-right',
        title: 'bottom-right',
        message: 'bottom-left',
        message2: 'top-left',
        final: 'top-right',
      }) satisfies Partial<Record<BirthdayStep, 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>>,
    [],
  );

  useEffect(() => {
    if (!shouldLoadTimelineLayer) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadGiftBoxTimelineLayer();
    }, isGiftPhase ? 220 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isGiftPhase, shouldLoadTimelineLayer]);

    // Slow, gentle rotations
    useFrame((state) => {
      const t = state.clock.getElapsedTime();
      if (pointLightRef.current) {
        const baseIntensity = isReadingBackgroundPhase
          ? 1.2
          : isClosingPhase
            ? 1.7
            : isCosmicPhase
              ? 2.55
              : isTimelinePhase
                ? 2.2
                : 2.2;
        const intensitySwing = isReadingBackgroundPhase ? 0.14 : isClosingPhase ? 0.28 : 0.75;
        pointLightRef.current.intensity = isReadingBackgroundPhase
          ? baseIntensity
          : baseIntensity + Math.sin(t * 0.5) * intensitySwing;
        pointLightRef.current.position.x = isReadingBackgroundPhase ? 0.8 : Math.sin(t * 0.3) * 2;
        pointLightRef.current.position.y = isReadingBackgroundPhase ? 1.45 : 1 + Math.cos(t * 0.4) * 0.5;
      }
      
      // Rotate core and tracks
      if (coreRef.current && (isCosmicPhase || isTimelinePhase)) {
        coreRef.current.rotation.y += 0.01;
      }
      if (tracksRef.current && isTimelinePhase) {
        tracksRef.current.rotation.y += 0.002;
      }

      // Subtle rotation for the box base
      if (boxGroupRef.current && step === 'ready') {
        boxGroupRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
      }

      if (groupRef.current && boxGroupRef.current && isReadingBackgroundPhase) {
        groupRef.current.rotation.y = 0;
        groupRef.current.rotation.x = 0;
        boxGroupRef.current.rotation.y = THREE.MathUtils.lerp(boxGroupRef.current.rotation.y, 0, 0.18);
      }

      if (step === 'closing-gift' && boxGroupRef.current) {
        const dragState = closingGiftDragStateRef.current;
        if (!dragState.active) {
          closingGiftSpinVelocityRef.current *= 0.92;
          if (Math.abs(closingGiftSpinVelocityRef.current) < 0.0001) {
            closingGiftSpinVelocityRef.current = 0;
          }
          const easedTarget = 0.35 + closingGiftSpinVelocityRef.current * 18;
          closingGiftRotationYRef.current = THREE.MathUtils.lerp(
            closingGiftRotationYRef.current,
            easedTarget,
            0.08,
          );
        }

        closingGiftRotationYRef.current = THREE.MathUtils.clamp(closingGiftRotationYRef.current, -1.15, 1.55);
        boxGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          boxGroupRef.current.rotation.y,
          closingGiftRotationYRef.current,
          dragState.active ? 0.32 : 0.14,
        );
      }

      if (step === 'story-gift' && insertCardRef.current && lidGroupRef.current && boxGroupRef.current) {
        const targetPull = storyGiftOpening ? 1 : storyGiftPullProgress;
        storyGiftPullVisualRef.current = THREE.MathUtils.lerp(
          storyGiftPullVisualRef.current,
          targetPull,
          storyGiftOpening ? 0.18 : 0.22,
        );

        const visualPull = storyGiftPullVisualRef.current;
        insertCardRef.current.position.y = -0.24 + visualPull * 1.56;
        insertCardRef.current.position.z = 0.02 + visualPull * 0.14;
        insertCardRef.current.rotation.x = -0.04 - visualPull * 0.46;
        insertCardRef.current.rotation.z = visualPull * 0.045;

        lidGroupRef.current.rotation.x = -Math.PI * (0.7 + visualPull * 0.28);
        lidGroupRef.current.position.y = 1.22 + visualPull * 0.48;
        lidGroupRef.current.position.z = -0.36 - visualPull * 0.46;

        boxGroupRef.current.rotation.x = -0.08 - visualPull * 0.18;
        boxGroupRef.current.position.y = -0.03 - visualPull * 0.03;

        if (storyGiftGlowRef.current) {
          storyGiftGlowRef.current.intensity = 1.4 + visualPull * 2.6;
          storyGiftGlowRef.current.distance = 2.8 + visualPull * 1.4;
        }
      }

    });

  const updateStoryGiftPull = (distance: number) => {
    const clampedDistance = Math.max(0, Math.min(148, distance));
    storyGiftPullStateRef.current.distance = clampedDistance;
    onStoryGiftPullChange?.(clampedDistance);
  };

  const finishStoryGiftPull = () => {
    const pullState = storyGiftPullStateRef.current;
    if (!pullState.active) {
      return;
    }

    detachStoryGiftListenersRef.current?.();
    detachStoryGiftListenersRef.current = null;

    pullState.active = false;
    const finalDistance = pullState.distance;
    pullState.distance = 0;
    pullState.pointerId = -1;
    onStoryGiftPullEnd?.(finalDistance);
  };

  const handleStoryGiftPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (step !== 'story-gift' || storyGiftOpening) {
      return;
    }

    event.stopPropagation();
    storyGiftPullStateRef.current.active = true;
    storyGiftPullStateRef.current.startClientY = event.clientY;
    storyGiftPullStateRef.current.pointerId = event.pointerId;
    storyGiftPullStateRef.current.distance = storyGiftPullProgress * 148;
    const pointerId = event.pointerId;
    const handleWindowPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId || !storyGiftPullStateRef.current.active) {
        return;
      }

      const distance = storyGiftPullStateRef.current.startClientY - moveEvent.clientY;
      updateStoryGiftPull(distance);
    };

    const handleWindowPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) {
        return;
      }

      finishStoryGiftPull();
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp, { passive: true });
    window.addEventListener('pointercancel', handleWindowPointerUp, { passive: true });
    detachStoryGiftListenersRef.current = () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  };

  const handleStoryGiftPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (storyGiftPullStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    finishStoryGiftPull();
  };

  const handleStoryGiftTap = (event: ThreeEvent<MouseEvent>) => {
    if (step !== 'story-gift' || storyGiftOpening || !simpleInteractionMode) {
      return;
    }

    if (storyGiftPullProgress > 0.08) {
      return;
    }

    event.stopPropagation();
    onStoryGiftPullChange?.(92);
    window.setTimeout(() => {
      onStoryGiftPullEnd?.(92);
    }, 40);
  };

  const finishClosingGiftDrag = (allowTap = true) => {
    const dragState = closingGiftDragStateRef.current;
    if (!dragState.active) {
      return;
    }

    detachClosingGiftListenersRef.current?.();
    detachClosingGiftListenersRef.current = null;

    const shouldTriggerOpen = allowTap && dragState.totalDragDistance < 10;
    dragState.active = false;
    dragState.pointerId = -1;
    dragState.totalDragDistance = 0;

    if (shouldTriggerOpen) {
      onClosingGiftOpen?.();
    }
  };

  const handleClosingGiftPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (step !== 'closing-gift') {
      return;
    }

    event.stopPropagation();
    const pointerId = event.pointerId;
    const dragState = closingGiftDragStateRef.current;
    dragState.active = true;
    dragState.pointerId = pointerId;
    dragState.startClientX = event.clientX;
    dragState.lastClientX = event.clientX;
    dragState.totalDragDistance = 0;
    closingGiftSpinVelocityRef.current = 0;

    const handleWindowPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId || !closingGiftDragStateRef.current.active) {
        return;
      }

      const deltaX = moveEvent.clientX - closingGiftDragStateRef.current.lastClientX;
      closingGiftDragStateRef.current.lastClientX = moveEvent.clientX;
      closingGiftDragStateRef.current.totalDragDistance += Math.abs(deltaX);

      const deltaRotation = deltaX * 0.012;
      closingGiftRotationYRef.current = THREE.MathUtils.clamp(
        closingGiftRotationYRef.current + deltaRotation,
        -1.15,
        1.55,
      );
      closingGiftSpinVelocityRef.current = THREE.MathUtils.clamp(deltaRotation, -0.03, 0.03);
    };

    const handleWindowPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) {
        return;
      }

      finishClosingGiftDrag(true);
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp, { passive: true });
    window.addEventListener('pointercancel', handleWindowPointerUp, { passive: true });
    detachClosingGiftListenersRef.current = () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  };

  const handleClosingGiftPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (closingGiftDragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    finishClosingGiftDrag(true);
  };

  useEffect(() => {
    return () => {
      detachStoryGiftListenersRef.current?.();
      detachClosingGiftListenersRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (step !== 'closing-gift' && closingGiftDragStateRef.current.active) {
      finishClosingGiftDrag(false);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'closing-gift') {
      closingGiftRotationYRef.current = 0.35;
      closingGiftSpinVelocityRef.current = 0;
    }
  }, [step]);

  useEffect(() => {
    const isBridgeStep = step === 'opening-bridge';
    const isStoryGiftStep = step === 'story-gift';
    const isClosingGiftStep = step === 'closing-gift';

      if (isStoryGiftStep) {
        gsap.to(camera.position, {
          x: 0,
          y: 8.45,
          z: 0.38,
          duration: 2.05,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
        gsap.to(camera.rotation, {
          x: -1.54,
          y: 0,
          z: 0,
          duration: 2.05,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
      } else if (isClosingGiftStep) {
        gsap.to(camera.position, {
          x: 0,
          y: isMobileViewport ? 1.2 : 1.1,
          z: isMobileViewport ? 10.4 : 9.5,
          duration: 2.4,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
        gsap.to(camera.rotation, {
          x: isMobileViewport ? -0.08 : -0.06,
          y: 0,
          z: 0,
          duration: 2.4,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
      } else if (isBridgeStep) {
        gsap.to(camera.position, {
          x: 0,
          y: 7.4,
          z: 1.2,
          duration: 1.35,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
        gsap.to(camera.rotation, {
          x: -1.34,
          y: 0,
          z: 0,
          duration: 1.35,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
      } else if (isReadingBackgroundPhase || textSteps.includes(step)) {
        gsap.to(camera.position, {
          x: 0,
          y: isMobileViewport ? 5.3 : 5.55,
          z: isMobileViewport ? 3.9 : 3.55,
          duration: 1.8,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
        gsap.to(camera.rotation, {
          x: isMobileViewport ? -0.86 : -0.9,
          y: 0,
          z: 0,
          duration: 1.8,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
      } else {
        gsap.to(camera.position, {
          x: 0,
          y: 0,
          z: 7,
          duration: 1.6,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
        gsap.to(camera.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.6,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
      }

      if (step === 'opening' && lidGroupRef.current) {
      // Pivot animation: rotate around the back edge
        gsap.to(lidGroupRef.current.rotation, {
        x: -Math.PI * 0.65,
        duration: 2.2,
        ease: 'back.out(1.4)',
        overwrite: 'auto',
        });
      // Slight lift and slide
        gsap.to(lidGroupRef.current.position, {
        y: 1.2,
        z: -0.4,
        duration: 2.2,
        ease: 'power2.out',
        overwrite: 'auto',
        });
      }

    if (step === 'story-gift' && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: storyGiftOpening ? -Math.PI * 0.94 : -Math.PI * 0.78,
        duration: storyGiftOpening ? 1.05 : 1.5,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      gsap.to(lidGroupRef.current.position, {
        y: storyGiftOpening ? 1.62 : 1.36,
        z: storyGiftOpening ? -0.74 : -0.5,
        duration: storyGiftOpening ? 1.05 : 1.5,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }

    if (step === 'closing-gift' && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: 0,
        duration: 2.1,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 0.45,
        z: -1.05,
        duration: 2.1,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
    }

    if (step === 'opening-bridge' && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: -Math.PI * 0.76,
        duration: 1.18,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 1.32,
        z: -0.5,
        duration: 1.18,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }

    if (cornerBoxSteps.includes(step) && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: -Math.PI * 0.88,
        duration: 1.35,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 1.42,
        z: -0.58,
        duration: 1.35,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }

    if (step === 'cosmic-core' && coreRef.current) {
      gsap.fromTo(coreRef.current.position, 
        { y: -0.5 }, 
        { y: 1.5, duration: 1.2, ease: 'power2.out' }
      );
      gsap.fromTo(coreRef.current.scale, 
        { x: 0, y: 0, z: 0 }, 
        { x: 1, y: 1, z: 1, duration: 1.2, ease: 'back.out(1.7)' }
      );
    }

    if (step === 'timeline-expand' && tracksRef.current) {
      gsap.fromTo(tracksRef.current.scale,
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 1.4, ease: 'expo.out' }
      );
    }

    if (insertCardRef.current) {
      if (storyGiftOpening) {
        gsap.to(insertCardRef.current.position, {
          y: 1.14,
          duration: 1.05,
          ease: 'power3.out',
          overwrite: 'auto',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: -0.24,
          duration: 1.05,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      } else if (step === 'opening-bridge') {
        gsap.to(insertCardRef.current.position, {
          y: 0.28,
          duration: 1,
          ease: 'power3.out',
          overwrite: 'auto',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: -0.1,
          duration: 1,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      } else if (cornerBoxSteps.includes(step)) {
        gsap.to(insertCardRef.current.position, {
          y: 0.62,
          duration: 1,
          ease: 'power3.out',
          overwrite: 'auto',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: -0.2,
          duration: 1,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      } else if (isReadingBackgroundPhase) {
        gsap.to(insertCardRef.current.position, {
          y: 0.46,
          z: 0.08,
          duration: 1.05,
          ease: 'power3.out',
          overwrite: 'auto',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: -0.12,
          z: -0.06,
          duration: 1.05,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      } else if (['cosmic-core', 'timeline-expand', 'node-before', 'node-now', 'node-thirty-soft', 'node-thirty-race', 'title', 'message', 'message2', 'final'].includes(step)) {
        gsap.to(insertCardRef.current.position, {
          y: 0.8,
          duration: 1.05,
          ease: 'power3.out',
          overwrite: 'auto',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: -0.18,
          duration: 1.05,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      } else if (step === 'closing-gift') {
        gsap.to(insertCardRef.current.position, {
          y: -0.42,
          duration: 1.4,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: 0,
          duration: 1.4,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
      } else {
        gsap.to(insertCardRef.current.position, {
          y: -0.36,
          duration: 0.85,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: 0,
          duration: 0.85,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
      }
    }

    // Move box to the side when text steps are active
    const isTextStep = textSteps.includes(step);
    const readingCornerPlacement = readingCornerPlacements[step];
    const isReadingCornerStep = Boolean(readingCornerPlacement);
      if (step === 'story-gift' && groupRef.current) {
        gsap.to(groupRef.current.position, {
          x: 0,
          y: storyGiftOpening ? -0.02 : -0.12,
          z: storyGiftOpening ? 0.42 : 0.08,
          duration: 1.25,
          ease: 'power3.inOut',
          overwrite: 'auto',
        });
        gsap.to(groupRef.current.scale, {
          x: isMobileViewport ? 1.04 : 1.08,
          y: isMobileViewport ? 1.04 : 1.08,
          z: isMobileViewport ? 1.04 : 1.08,
          duration: 1.25,
          ease: 'power3.inOut',
          overwrite: 'auto',
        });
        if (boxGroupRef.current) {
          gsap.to(boxGroupRef.current.rotation, {
          x: -0.2,
          y: 0,
          z: 0,
          duration: 1.25,
          ease: 'power3.inOut',
          overwrite: 'auto',
        });
      }
    } else if (step === 'opening-bridge' && groupRef.current) {
      gsap.to(groupRef.current.position, {
        x: 0,
        y: -0.06,
        z: 0.12,
        duration: 1.1,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      gsap.to(groupRef.current.scale, {
        x: isMobileViewport ? 1.02 : 1.05,
        y: isMobileViewport ? 1.02 : 1.05,
        z: isMobileViewport ? 1.02 : 1.05,
        duration: 1.1,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      if (boxGroupRef.current) {
        gsap.to(boxGroupRef.current.rotation, {
          x: -0.14,
          y: 0,
          z: 0,
          duration: 1.1,
          ease: 'power3.inOut',
          overwrite: 'auto',
        });
      }
    } else if ((isReadingBackgroundPhase || isReadingCornerStep) && groupRef.current) {
      const isLeftCorner =
        readingCornerPlacement === 'top-left' || readingCornerPlacement === 'bottom-left';
      const isTopCorner =
        readingCornerPlacement === 'top-left' || readingCornerPlacement === 'top-right';

      gsap.to(groupRef.current.position, {
        x: isLeftCorner
          ? isMobileViewport
            ? -1.18
            : -1.92
          : isMobileViewport
            ? 1.22
            : 2.08,
        y: isTopCorner
          ? isMobileViewport
            ? 2.34
            : 1.96
          : isMobileViewport
            ? -1.94
            : -1.34,
        z: isMobileViewport ? -2.18 : -1.45,
        duration: 1.55,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      gsap.to(groupRef.current.scale, {
        x: isMobileViewport ? 0.16 : 0.25,
        y: isMobileViewport ? 0.16 : 0.25,
        z: isMobileViewport ? 0.16 : 0.25,
        duration: 1.55,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      if (boxGroupRef.current) {
        gsap.to(boxGroupRef.current.rotation, {
          x: isTopCorner ? -0.48 : -0.28,
          y: isLeftCorner
            ? isMobileViewport
              ? 0.34
              : 0.38
            : isMobileViewport
              ? -0.34
              : -0.38,
          z: isLeftCorner ? 0.08 : -0.08,
          duration: 1.4,
          ease: 'power3.inOut',
          overwrite: 'auto',
        });
      }
    } else if (step === 'closing-gift' && groupRef.current) {
      gsap.to(groupRef.current.position, {
        x: 0,
        y: isMobileViewport ? -0.95 : -0.88,
        z: 0,
        duration: 2.2,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      gsap.to(groupRef.current.scale, {
        x: isMobileViewport ? 0.34 : 0.42,
        y: isMobileViewport ? 0.34 : 0.42,
        z: isMobileViewport ? 0.34 : 0.42,
        duration: 2.2,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      if (boxGroupRef.current) {
        gsap.to(boxGroupRef.current.rotation, {
          x: 0.22,
          y: isMobileViewport ? 0.42 : 0.35,
          z: isMobileViewport ? -0.02 : -0.04,
          duration: 2.1,
          ease: 'power3.inOut',
          overwrite: 'auto',
        });
      }
    } else if ((isTextStep || step === 'ready' || step === 'cosmic-core' || step === 'timeline-expand') && groupRef.current) {
      gsap.to(groupRef.current.position, { x: 0, y: 0, z: 0, duration: 1.5, overwrite: 'auto' });
      gsap.to(groupRef.current.scale, { x: 1, y: 1, z: 1, duration: 1.5, overwrite: 'auto' });
      if (boxGroupRef.current) {
        gsap.to(boxGroupRef.current.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
    }

    // Move and scale timeline elements when text is active
    if (isTextStep && timelineGroupRef.current) {
      gsap.to(timelineGroupRef.current.position, {
        x: isMobileViewport ? -1.55 : -3.2,
        y: isMobileViewport ? 2.75 : 2.15,
        z: isMobileViewport ? -3.4 : -2.3,
        duration: 1.5,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      gsap.to(timelineGroupRef.current.scale, {
        x: isMobileViewport ? 0.34 : 0.5,
        y: isMobileViewport ? 0.34 : 0.5,
        z: isMobileViewport ? 0.34 : 0.5,
        duration: 1.5,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
    } else if (!isTextStep && timelineGroupRef.current) {
      gsap.to(timelineGroupRef.current.position, { x: 0, y: 0, z: 0, duration: 1.5, overwrite: 'auto' });
      gsap.to(timelineGroupRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.5,
        overwrite: 'auto',
      });
    }
    if (isReadingBackgroundPhase && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: -Math.PI * 0.78,
        duration: 1.25,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 1.28,
        z: -0.44,
        duration: 1.25,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }
    return () => {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera.rotation);

      if (groupRef.current) {
        gsap.killTweensOf(groupRef.current.position);
        gsap.killTweensOf(groupRef.current.scale);
      }

      if (boxGroupRef.current) {
        gsap.killTweensOf(boxGroupRef.current.rotation);
        gsap.killTweensOf(boxGroupRef.current.position);
      }

      if (lidGroupRef.current) {
        gsap.killTweensOf(lidGroupRef.current.rotation);
        gsap.killTweensOf(lidGroupRef.current.position);
      }

      if (insertCardRef.current) {
        gsap.killTweensOf(insertCardRef.current.position);
        gsap.killTweensOf(insertCardRef.current.rotation);
      }

      if (coreRef.current) {
        gsap.killTweensOf(coreRef.current.position);
        gsap.killTweensOf(coreRef.current.scale);
      }

      if (tracksRef.current) {
        gsap.killTweensOf(tracksRef.current.scale);
        gsap.killTweensOf(tracksRef.current.rotation);
      }

      if (timelineGroupRef.current) {
        gsap.killTweensOf(timelineGroupRef.current.position);
        gsap.killTweensOf(timelineGroupRef.current.scale);
      }
    };
  }, [camera.position, camera.rotation, isMobileViewport, isReadingBackgroundPhase, readingCornerPlacements, step, storyGiftOpening]);

  const isTimelineActive = isCosmicPhase || isTimelinePhase;

  return (
    <>
      <ambientLight intensity={isReadingBackgroundPhase ? 0.42 : isClosingPhase ? 0.52 : 0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.95} />
      <pointLight ref={pointLightRef} position={[0, 2, 4]} intensity={2.1} color="#F8F4EE" />
      
      <fog attach="fog" args={['#05050A', 5, isReadingBackgroundPhase ? 19 : 25]} />
      
      {/* Layered Starry Sky - More subtle */}
      <Stars radius={90} depth={42} count={isReadingBackgroundPhase ? 28 : isMobileViewport ? (showSecondaryStars ? 96 : 52) : showSecondaryStars ? 180 : 96} factor={1.2} saturation={0} fade speed={isReadingBackgroundPhase ? 0 : 0.04} />
      {showSecondaryStars && (
        <Stars radius={130} depth={42} count={isMobileViewport ? 18 : 34} factor={1.55} saturation={0.12} fade speed={0.08} />
      )}
      
      {/* Nebula Glow Effect - Deeper and more subtle */}
      <Sphere args={[56, 10, 10]} scale={[-1, 1, 1]}>
        <meshBasicMaterial 
          color="#05050A" 
          side={THREE.BackSide} 
          transparent 
          opacity={0.5} 
        />
      </Sphere>
      
      {/* Gentle floating light particles */}
      {showAmbientSparkles && (
        <Sparkles count={isMobileViewport ? (isTimelinePhase ? 2 : 1) : isTimelinePhase ? 4 : 3} scale={7.5} size={0.58} speed={0.06} opacity={0.1} color="#D8C4A8" />
      )}
      
      <Float
        speed={isReadingBackgroundPhase ? 0 : isGiftPhase ? 0.34 : isMobileViewport ? 0.4 : 0.74}
        rotationIntensity={isReadingBackgroundPhase ? 0 : isGiftPhase ? 0.04 : isMobileViewport ? 0.06 : 0.12}
        floatIntensity={isReadingBackgroundPhase ? 0 : isGiftPhase ? 0.1 : isMobileViewport ? 0.16 : 0.32}
      >
        <group ref={groupRef}>
          <GiftBoxModel
            step={step}
            isMobileViewport={isMobileViewport}
            verticalEdgePositions={verticalEdgePositions}
            cornerPositions={cornerPositions}
            boxGroupRef={boxGroupRef}
            lidGroupRef={lidGroupRef}
            insertCardRef={insertCardRef}
            storyGiftGlowRef={storyGiftGlowRef}
            handleStoryGiftTap={handleStoryGiftTap}
            handleStoryGiftPointerDown={handleStoryGiftPointerDown}
            handleStoryGiftPointerUp={handleStoryGiftPointerUp}
            finishStoryGiftPull={finishStoryGiftPull}
            handleClosingGiftPointerDown={handleClosingGiftPointerDown}
            handleClosingGiftPointerUp={handleClosingGiftPointerUp}
            finishClosingGiftDrag={finishClosingGiftDrag}
          />
        </group>

        {isTimelineActive && (
          <Suspense fallback={null}>
            <GiftBoxTimelineLayer
              isMobileViewport={isMobileViewport}
              isTimelinePhase={isTimelinePhase}
              timelineGroupRef={timelineGroupRef}
              coreRef={coreRef}
              tracksRef={tracksRef}
            />
          </Suspense>
        )}
      </Float>
    </>
  );
});
