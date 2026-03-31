import React, { useRef, useEffect, memo, useMemo } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Box, Float, Stars, Sphere, Sparkles, Torus, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { BirthdayStep } from '../types/birthday';

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

  const textSteps = useMemo(
    () => ['node-before', 'node-us', 'memory-1', 'memory-2', 'memory-3', 'memory-4', 'memory-5', 'node-now', 'node-thirty-soft', 'node-thirty-race', 'title', 'message', 'message2', 'final'],
    [],
  );

  const cornerBoxSteps = useMemo(
    () => ['node-us', 'memory-1', 'memory-2', 'memory-3', 'memory-4', 'memory-5'],
    [],
  );

  const leftAnchorReadingSteps = useMemo(
    () => ['node-before', 'node-now', 'node-thirty-soft', 'node-thirty-race', 'title', 'message', 'message2', 'final'],
    [],
  );

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
      });
      gsap.to(camera.rotation, {
        x: -1.54,
        y: 0,
        z: 0,
        duration: 2.05,
        ease: 'power2.inOut',
      });
    } else if (isClosingGiftStep) {
      gsap.to(camera.position, {
        x: 0,
        y: isMobileViewport ? 1.2 : 1.1,
        z: isMobileViewport ? 10.4 : 9.5,
        duration: 2.4,
        ease: 'power2.inOut',
      });
      gsap.to(camera.rotation, {
        x: isMobileViewport ? -0.08 : -0.06,
        y: 0,
        z: 0,
        duration: 2.4,
        ease: 'power2.inOut',
      });
    } else if (isBridgeStep) {
      gsap.to(camera.position, {
        x: 0,
        y: 7.4,
        z: 1.2,
        duration: 1.35,
        ease: 'power2.inOut',
      });
      gsap.to(camera.rotation, {
        x: -1.34,
        y: 0,
        z: 0,
        duration: 1.35,
        ease: 'power2.inOut',
      });
    } else if (isReadingBackgroundPhase || textSteps.includes(step)) {
      gsap.to(camera.position, {
        x: 0,
        y: isMobileViewport ? 5.3 : 5.55,
        z: isMobileViewport ? 3.9 : 3.55,
        duration: 1.8,
        ease: 'power2.inOut',
      });
      gsap.to(camera.rotation, {
        x: isMobileViewport ? -0.86 : -0.9,
        y: 0,
        z: 0,
        duration: 1.8,
        ease: 'power2.inOut',
      });
    } else {
      gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 7,
        duration: 1.6,
        ease: 'power2.inOut',
      });
      gsap.to(camera.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.6,
        ease: 'power2.inOut',
      });
    }

    if (step === 'opening' && lidGroupRef.current) {
      // Pivot animation: rotate around the back edge
      gsap.to(lidGroupRef.current.rotation, {
        x: -Math.PI * 0.65,
        duration: 2.2,
        ease: 'back.out(1.4)',
      });
      // Slight lift and slide
      gsap.to(lidGroupRef.current.position, {
        y: 1.2,
        z: -0.4,
        duration: 2.2,
        ease: 'power2.out',
      });
    }

    if (step === 'story-gift' && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: storyGiftOpening ? -Math.PI * 0.94 : -Math.PI * 0.78,
        duration: storyGiftOpening ? 1.05 : 1.5,
        ease: 'power3.out',
      });
      gsap.to(lidGroupRef.current.position, {
        y: storyGiftOpening ? 1.62 : 1.36,
        z: storyGiftOpening ? -0.74 : -0.5,
        duration: storyGiftOpening ? 1.05 : 1.5,
        ease: 'power3.out',
      });
    }

    if (step === 'closing-gift' && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: 0,
        duration: 2.1,
        ease: 'power3.inOut',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 0.45,
        z: -1.05,
        duration: 2.1,
        ease: 'power3.inOut',
      });
    }

    if (step === 'opening-bridge' && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: -Math.PI * 0.76,
        duration: 1.18,
        ease: 'power3.out',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 1.32,
        z: -0.5,
        duration: 1.18,
        ease: 'power3.out',
      });
    }

    if (cornerBoxSteps.includes(step) && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: -Math.PI * 0.88,
        duration: 1.35,
        ease: 'power3.out',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 1.42,
        z: -0.58,
        duration: 1.35,
        ease: 'power3.out',
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
        });
        gsap.to(insertCardRef.current.rotation, {
          x: -0.24,
          duration: 1.05,
          ease: 'power3.out',
        });
      } else if (step === 'opening-bridge') {
        gsap.to(insertCardRef.current.position, {
          y: 0.28,
          duration: 1,
          ease: 'power3.out',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: -0.1,
          duration: 1,
          ease: 'power3.out',
        });
      } else if (cornerBoxSteps.includes(step)) {
        gsap.to(insertCardRef.current.position, {
          y: 0.62,
          duration: 1,
          ease: 'power3.out',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: -0.2,
          duration: 1,
          ease: 'power3.out',
        });
      } else if (isReadingBackgroundPhase) {
        gsap.to(insertCardRef.current.position, {
          y: 0.46,
          z: 0.08,
          duration: 1.05,
          ease: 'power3.out',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: -0.12,
          z: -0.06,
          duration: 1.05,
          ease: 'power3.out',
        });
      } else if (['cosmic-core', 'timeline-expand', 'node-before', 'node-now', 'node-thirty-soft', 'node-thirty-race', 'title', 'message', 'message2', 'final'].includes(step)) {
        gsap.to(insertCardRef.current.position, {
          y: 0.8,
          duration: 1.05,
          ease: 'power3.out',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: -0.18,
          duration: 1.05,
          ease: 'power3.out',
        });
      } else if (step === 'closing-gift') {
        gsap.to(insertCardRef.current.position, {
          y: -0.42,
          duration: 1.4,
          ease: 'power2.inOut',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: 0,
          duration: 1.4,
          ease: 'power2.inOut',
        });
      } else {
        gsap.to(insertCardRef.current.position, {
          y: -0.36,
          duration: 0.85,
          ease: 'power2.inOut',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: 0,
          duration: 0.85,
          ease: 'power2.inOut',
        });
      }
    }

    // Move box to the side when text steps are active
    const isTextStep = textSteps.includes(step);
    const shouldMoveBoxToCorner = cornerBoxSteps.includes(step);
    const shouldAnchorReadingBoxLeft = leftAnchorReadingSteps.includes(step);
      if (step === 'story-gift' && groupRef.current) {
        gsap.to(groupRef.current.position, {
          x: 0,
          y: storyGiftOpening ? -0.02 : -0.12,
          z: storyGiftOpening ? 0.42 : 0.08,
          duration: 1.25,
          ease: 'power3.inOut',
        });
        gsap.to(groupRef.current.scale, {
          x: isMobileViewport ? 1.04 : 1.08,
          y: isMobileViewport ? 1.04 : 1.08,
          z: isMobileViewport ? 1.04 : 1.08,
          duration: 1.25,
          ease: 'power3.inOut',
        });
        if (boxGroupRef.current) {
          gsap.to(boxGroupRef.current.rotation, {
          x: -0.2,
          y: 0,
          z: 0,
          duration: 1.25,
          ease: 'power3.inOut',
        });
      }
    } else if (step === 'opening-bridge' && groupRef.current) {
      gsap.to(groupRef.current.position, {
        x: 0,
        y: -0.06,
        z: 0.12,
        duration: 1.1,
        ease: 'power3.inOut',
      });
      gsap.to(groupRef.current.scale, {
        x: isMobileViewport ? 1.02 : 1.05,
        y: isMobileViewport ? 1.02 : 1.05,
        z: isMobileViewport ? 1.02 : 1.05,
        duration: 1.1,
        ease: 'power3.inOut',
      });
      if (boxGroupRef.current) {
        gsap.to(boxGroupRef.current.rotation, {
          x: -0.14,
          y: 0,
          z: 0,
          duration: 1.1,
          ease: 'power3.inOut',
        });
      }
    } else if (isReadingBackgroundPhase && groupRef.current) {
      gsap.to(groupRef.current.position, {
        x: shouldAnchorReadingBoxLeft
          ? isMobileViewport
            ? -0.92
            : -1.92
          : isMobileViewport
            ? 0.98
            : 2.08,
        y: isMobileViewport ? 2.1 : 1.62,
        z: isMobileViewport ? -1.95 : -1.45,
        duration: 1.55,
        ease: 'power3.inOut',
      });
      gsap.to(groupRef.current.scale, {
        x: isMobileViewport ? 0.19 : 0.25,
        y: isMobileViewport ? 0.19 : 0.25,
        z: isMobileViewport ? 0.19 : 0.25,
        duration: 1.55,
        ease: 'power3.inOut',
      });
      if (boxGroupRef.current) {
        gsap.to(boxGroupRef.current.rotation, {
          x: -0.42,
          y: shouldAnchorReadingBoxLeft
            ? isMobileViewport
              ? 0.34
              : 0.38
            : isMobileViewport
              ? -0.34
              : -0.38,
          z: shouldAnchorReadingBoxLeft ? 0.06 : -0.06,
          duration: 1.4,
          ease: 'power3.inOut',
        });
      }
    } else if (shouldMoveBoxToCorner && groupRef.current) {
      gsap.to(groupRef.current.position, {
        x: isMobileViewport ? 1.35 : 3.3,
        y: isMobileViewport ? 2.5 : 1.9,
        z: isMobileViewport ? -1.7 : -0.45,
        duration: 1.6,
        ease: 'power3.inOut'
      });
      gsap.to(groupRef.current.scale, {
        x: isMobileViewport ? 0.28 : 0.38,
        y: isMobileViewport ? 0.28 : 0.38,
        z: isMobileViewport ? 0.28 : 0.38,
        duration: 1.6,
        ease: 'power3.inOut'
      });
      if (boxGroupRef.current) {
        gsap.to(boxGroupRef.current.rotation, {
          x: -0.62,
          y: isMobileViewport ? -0.32 : -0.44,
          z: isMobileViewport ? -0.24 : -0.16,
          duration: 1.45,
          ease: 'power3.inOut',
        });
      }
    } else if (step === 'closing-gift' && groupRef.current) {
      gsap.to(groupRef.current.position, {
        x: 0,
        y: isMobileViewport ? -0.95 : -0.88,
        z: 0,
        duration: 2.2,
        ease: 'power3.inOut',
      });
      gsap.to(groupRef.current.scale, {
        x: isMobileViewport ? 0.34 : 0.42,
        y: isMobileViewport ? 0.34 : 0.42,
        z: isMobileViewport ? 0.34 : 0.42,
        duration: 2.2,
        ease: 'power3.inOut',
      });
      if (boxGroupRef.current) {
        gsap.to(boxGroupRef.current.rotation, {
          x: 0.22,
          y: isMobileViewport ? 0.42 : 0.35,
          z: isMobileViewport ? -0.02 : -0.04,
          duration: 2.1,
          ease: 'power3.inOut',
        });
      }
    } else if ((isTextStep || step === 'ready' || step === 'cosmic-core' || step === 'timeline-expand') && groupRef.current) {
      gsap.to(groupRef.current.position, { x: 0, y: 0, z: 0, duration: 1.5 });
      gsap.to(groupRef.current.scale, { x: 1, y: 1, z: 1, duration: 1.5 });
      if (boxGroupRef.current) {
        gsap.to(boxGroupRef.current.rotation, {
          x: 0,
          y: 0,
          z: 0,
          duration: 1.5,
          ease: 'power2.out',
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
        ease: 'power3.inOut'
      });
      gsap.to(timelineGroupRef.current.scale, {
        x: isMobileViewport ? 0.34 : 0.5,
        y: isMobileViewport ? 0.34 : 0.5,
        z: isMobileViewport ? 0.34 : 0.5,
        duration: 1.5,
        ease: 'power3.inOut'
      });
    } else if (!isTextStep && timelineGroupRef.current) {
      gsap.to(timelineGroupRef.current.position, { x: 0, y: 0, z: 0, duration: 1.5 });
      gsap.to(timelineGroupRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.5,
      });
    }
    if (isReadingBackgroundPhase && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: -Math.PI * 0.78,
        duration: 1.25,
        ease: 'power3.out',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 1.28,
        z: -0.44,
        duration: 1.25,
        ease: 'power3.out',
      });
    }
  }, [camera.position, camera.rotation, isMobileViewport, isReadingBackgroundPhase, leftAnchorReadingSteps, step, storyGiftOpening]);

  const isTimelineActive = isCosmicPhase || isTimelinePhase;

  return (
    <>
      <ambientLight intensity={isReadingBackgroundPhase ? 0.42 : isClosingPhase ? 0.52 : 0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.95} />
      <pointLight ref={pointLightRef} position={[0, 2, 4]} intensity={2.1} color="#F8F4EE" />
      
      <fog attach="fog" args={['#05050A', 5, isReadingBackgroundPhase ? 19 : 25]} />
      
      {/* Layered Starry Sky - More subtle */}
      <Stars radius={90} depth={42} count={isReadingBackgroundPhase ? 40 : showSecondaryStars ? 180 : 96} factor={1.2} saturation={0} fade speed={isReadingBackgroundPhase ? 0 : 0.04} />
      {showSecondaryStars && (
        <Stars radius={130} depth={42} count={34} factor={1.55} saturation={0.12} fade speed={0.08} />
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
        <Sparkles count={isTimelinePhase ? 4 : 3} scale={7.5} size={0.58} speed={0.06} opacity={0.1} color="#D8C4A8" />
      )}
      
      <Float
        speed={isReadingBackgroundPhase ? 0 : isGiftPhase ? 0.34 : isMobileViewport ? 0.4 : 0.74}
        rotationIntensity={isReadingBackgroundPhase ? 0 : isGiftPhase ? 0.04 : isMobileViewport ? 0.06 : 0.12}
        floatIntensity={isReadingBackgroundPhase ? 0 : isGiftPhase ? 0.1 : isMobileViewport ? 0.16 : 0.32}
      >
        <group ref={groupRef}>
          <group ref={boxGroupRef}>
            {/* Box Base - Luxurious Polished Crystal with Iridescence & Gold Frame */}
            <group position={[0, -0.25, 0]}>
              <RoundedBox args={[2.1, 1.68, 2.1]} radius={0.08} smoothness={4}>
                <meshPhysicalMaterial 
                  color="#FFF8EE"
                  transmission={0.82}
                  thickness={1.4}
                  roughness={0.08}
                  metalness={0.05}
                  ior={1.45} 
                  clearcoat={1}
                  clearcoatRoughness={0.06}
                  transparent
                  opacity={0.5}
                  envMapIntensity={3.2}
                  attenuationColor="#F7E9D1"
                  attenuationDistance={4}
                  emissive="#C5A059"
                  emissiveIntensity={0.12} 
                  iridescence={0.1}
                  iridescenceIOR={1.25}
                  sheen={0.22}
                  sheenColor="#F8F4EE"
                />
              </RoundedBox>

              <RoundedBox args={[1.78, 0.92, 1.78]} radius={0.06} smoothness={4} position={[0, -0.08, 0]}>
                <meshStandardMaterial
                  color="#2A1912"
                  roughness={0.9}
                  metalness={0.05}
                />
              </RoundedBox>

              <RoundedBox args={[1.56, 0.52, 1.56]} radius={0.05} smoothness={4} position={[0, 0.14, 0]}>
                <meshStandardMaterial
                  color="#120D0A"
                  roughness={0.96}
                  metalness={0.02}
                />
              </RoundedBox>

              <group ref={insertCardRef} position={[0, -0.36, 0.02]}>
                <RoundedBox args={[1.22, 0.08, 1.02]} radius={0.03} smoothness={4}>
                  <meshStandardMaterial color="#C08C57" roughness={0.92} metalness={0.04} />
                </RoundedBox>
                <RoundedBox args={[1.08, 0.04, 0.86]} radius={0.04} smoothness={4} position={[0, 0.055, 0]}>
                  <meshPhysicalMaterial
                    color="#FFF8EE"
                    roughness={0.22}
                    transmission={0.08}
                    clearcoat={0.6}
                    clearcoatRoughness={0.08}
                  />
                </RoundedBox>
                <group position={[0, 0.085, 0]}>
                  {[0.2, 0.08, -0.04, -0.16].map((zOffset, index) => (
                    <Box
                      key={zOffset}
                      args={[index === 0 ? 0.62 : index === 1 ? 0.74 : index === 2 ? 0.68 : 0.56, 0.006, 0.028]}
                      position={[0, 0, zOffset]}
                    >
                      <meshStandardMaterial
                        color={step === 'story-gift' ? '#8B5E3C' : '#A6784D'}
                        emissive={step === 'story-gift' ? '#E8D8BE' : '#000000'}
                        emissiveIntensity={step === 'story-gift' ? 0.08 : 0}
                        roughness={0.92}
                        metalness={0.02}
                      />
                    </Box>
                  ))}
                  <Box args={[0.22, 0.006, 0.028]} position={[-0.2, 0, -0.28]}>
                    <meshStandardMaterial color="#B9875E" roughness={0.92} metalness={0.02} />
                  </Box>
                  <Box args={[0.3, 0.006, 0.028]} position={[0.12, 0, -0.28]}>
                    <meshStandardMaterial color="#B9875E" roughness={0.92} metalness={0.02} />
                  </Box>
                </group>
              </group>

              {step === 'story-gift' && (
                <mesh
                  position={[0, 0.4, 0.04]}
                  onClick={handleStoryGiftTap}
                  onPointerDown={handleStoryGiftPointerDown}
                  onPointerUp={handleStoryGiftPointerUp}
                  onPointerCancel={handleStoryGiftPointerUp}
                  onPointerMissed={() => {
                    finishStoryGiftPull();
                  }}
                >
                  <boxGeometry args={[2, 1.1, 1.92]} />
                  <meshBasicMaterial transparent opacity={0} />
                </mesh>
              )}

              {step === 'closing-gift' && (
                <mesh
                  position={[0, 0.2, 0]}
                  onPointerDown={handleClosingGiftPointerDown}
                  onPointerUp={handleClosingGiftPointerUp}
                  onPointerCancel={handleClosingGiftPointerUp}
                  onPointerMissed={() => {
                    finishClosingGiftDrag(false);
                  }}
                >
                  <boxGeometry args={[2.45, 2.35, 2.4]} />
                  <meshBasicMaterial transparent opacity={0} />
                </mesh>
              )}
              
              {/* Gold Wireframe/Edge Accents for the Base */}
              <group>
                {/* Vertical Edges */}
                {verticalEdgePositions.map((pos, i) => (
                <Box key={`v-${i}`} args={[0.02, 1.69, 0.02]} position={[pos[0], 0.14, pos[2]]}>
                    <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} emissive="#D4AF37" emissiveIntensity={0.3} />
                  </Box>
                ))}
                {/* Horizontal Edges - Bottom */}
                <Box args={[2.12, 0.02, 0.02]} position={[0, -0.84, 1.05]}>
                  <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                </Box>
                <Box args={[2.12, 0.02, 0.02]} position={[0, -0.84, -1.05]}>
                  <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                </Box>
                <Box args={[0.02, 0.02, 2.12]} position={[1.05, -0.84, 0]}>
                  <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                </Box>
                <Box args={[0.02, 0.02, 2.12]} position={[-1.05, -0.84, 0]}>
                  <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                </Box>
              </group>

              <group position={[0, -0.44, 0]}>
                <RoundedBox args={[1.42, 0.28, 1.18]} radius={0.04} smoothness={4}>
                  <meshStandardMaterial color="#3C241A" roughness={0.94} metalness={0.02} />
                </RoundedBox>
                <RoundedBox args={[1.28, 0.18, 1.02]} radius={0.04} smoothness={4} position={[0, 0.12, 0]}>
                  <meshStandardMaterial color="#6E4A36" roughness={0.92} metalness={0.02} />
                </RoundedBox>
                <RoundedBox args={[0.92, 0.1, 0.62]} radius={0.03} smoothness={4} position={[0, 0.23, -0.15]}>
                  <meshStandardMaterial color="#8A6147" roughness={0.9} metalness={0.02} />
                </RoundedBox>
                <RoundedBox args={[0.66, 0.08, 0.44]} radius={0.03} smoothness={4} position={[-0.14, 0.31, 0.22]}>
                  <meshStandardMaterial color="#4E3327" roughness={0.94} metalness={0.02} />
                </RoundedBox>
              </group>

              {step === 'story-gift' && (
                <pointLight
                  ref={storyGiftGlowRef}
                  position={[0, 0.42, 0.12]}
                  intensity={1.6}
                  color="#F6E6C8"
                  distance={2.8}
                  decay={2}
                />
              )}
            </group>
            
            {/* Inner Glow - Ethereal light from within */}
            {step === 'ready' && (
              <group position={[0, -0.25, 0]}>
                <Sphere args={[0.9, 24, 24]}>
                  <meshBasicMaterial 
                    color="#C5A059" 
                    transparent 
                    opacity={0.08} 
                  />
                </Sphere>
                <pointLight intensity={5.8} color="#C5A059" distance={6} decay={2} />
                <Sparkles count={4} scale={1.5} size={1.5} speed={0.34} color="#C5A059" opacity={0.2} />
              </group>
            )}
            
            {/* Box Lid Group (for pivoting) */}
            <group ref={lidGroupRef} position={[0, 0.45, -1.05]}>
              <RoundedBox args={[2.2, 0.3, 2.2]} radius={0.08} smoothness={4} position={[0, 0.15, 1.05]}>
                <meshPhysicalMaterial 
                  color="#FDFBF7" 
                  metalness={0.1}
                  roughness={0.08}
                  clearcoat={0.8}
                  clearcoatRoughness={0.1}
                  envMapIntensity={3}
                  transmission={0.1}
                  thickness={0.5}
                  ior={1.4}
                  sheen={1}
                  sheenColor="#FFF"
                  sheenRoughness={0.1}
                />
              </RoundedBox>
              
              {/* Elegant Gold Ribbon & Corner Accents */}
              <group position={[0, 0.15, 1.05]}>
                {/* Vertical Ribbon */}
                <Box args={[0.04, 0.34, 2.22]}>
                  <meshPhysicalMaterial 
                    color="#D4AF37" 
                    metalness={1} 
                    roughness={0.05} 
                    emissive="#D4AF37"
                    emissiveIntensity={0.5}
                  />
                </Box>
                {/* Horizontal Ribbon */}
                <Box args={[2.22, 0.34, 0.04]}>
                  <meshPhysicalMaterial 
                    color="#D4AF37" 
                    metalness={1} 
                    roughness={0.05} 
                    emissive="#D4AF37"
                    emissiveIntensity={0.5}
                  />
                </Box>
                
                {/* Gold Corner Accents */}
                {cornerPositions.map((pos, i) => (
                  <group key={`corner-${i}`} position={pos}>
                    <Box args={[0.15, 0.35, 0.02]} position={[pos[0] > 0 ? -0.065 : 0.065, 0, 0]}>
                      <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                    </Box>
                    <Box args={[0.02, 0.35, 0.15]} position={[0, 0, pos[2] > 0 ? -0.065 : 0.065]}>
                      <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                    </Box>
                  </group>
                ))}

                {/* Gold Trim around the lid edge - Top & Bottom */}
                <Box args={[2.26, 0.05, 2.26]} position={[0, 0.17, 0]}>
                  <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                </Box>
                <Box args={[2.26, 0.05, 2.26]} position={[0, -0.17, 0]}>
                  <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                </Box>
                
                {/* Central Gold Seal/Medallion - More intricate */}
                <group position={[0, 0.19, 0]} rotation={[0, Math.PI / 4, 0]}>
                  <Box args={[0.4, 0.06, 0.4]}>
                    <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} emissive="#D4AF37" emissiveIntensity={0.5} />
                  </Box>
                  <Box args={[0.25, 0.1, 0.25]} rotation={[0, -Math.PI / 4, 0]}>
                    <meshPhysicalMaterial color="#F8F4EE" metalness={0.4} roughness={0.05} clearcoat={0.5} />
                  </Box>
                </group>

                <group position={[0, 0.36, 0]}>
                  <Torus args={[0.2, 0.035, 12, 24]} rotation={[Math.PI / 2.2, 0, Math.PI / 4]}>
                    <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.08} />
                  </Torus>
                  <Torus args={[0.2, 0.035, 12, 24]} rotation={[Math.PI / 2.2, 0, -Math.PI / 4]}>
                    <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.08} />
                  </Torus>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* Cosmic Core & Timeline - Redesigned to be a subtle point of light */}
        {isTimelineActive && (
          <group ref={timelineGroupRef} position={[0, 0, 0]}>
            {/* Central Core - Ethereal Point of Light */}
            <group ref={coreRef} position={[0, 1.5, 0]}>
              <Sphere args={[0.05, 12, 12]}>
                <meshBasicMaterial color="#FFF" />
              </Sphere>
              {/* Soft Glow Layers */}
              <Sphere args={[0.34, 12, 12]}>
                <meshStandardMaterial 
                  color="#D8C4A8" 
                  transparent 
                  opacity={isTimelinePhase ? 0.15 : 0.11}
                  emissive="#D8C4A8"
                  emissiveIntensity={isTimelinePhase ? 2 : 1.4}
                />
              </Sphere>
              <pointLight intensity={isTimelinePhase ? 2.1 : 2.2} color="#F8F4EE" distance={isTimelinePhase ? 8 : 6} decay={2} />
              <Sparkles count={isTimelinePhase ? 2 : 1} scale={1.2} size={0.58} speed={0.08} color="#F8F4EE" opacity={0.1} />
            </group>

            {/* Timeline Tracks & Nodes - Ultra-thin lines */}
            {isTimelinePhase && (
              <group ref={tracksRef} position={[0, 1.5, 0]}>
              {/* Node 1: Before (Top Left) */}
              <group position={[-2.5, 1.5, -1]}>
                <Sphere args={[0.08, 12, 12]}>
                  <meshStandardMaterial 
                    color="#C5A059" 
                    emissive="#C5A059"
                    emissiveIntensity={1.2}
                  />
                </Sphere>
                {/* Node Glow */}
                <pointLight intensity={0.8} color="#C5A059" distance={1.8} />
                {/* Track to core */}
                <mesh rotation={[0, 0, Math.PI / 4]}>
                  <cylinderGeometry args={[0.0015, 0.0015, 3.5]} />
                  <meshBasicMaterial color="#C5A059" transparent opacity={0.15} />
                </mesh>
              </group>

              {/* Node 2: Us (Right) */}
              <group position={[2.8, -0.5, 0.5]}>
                <Sphere args={[0.08, 12, 12]}>
                  <meshStandardMaterial 
                    color="#7D6B9D" 
                    emissive="#7D6B9D"
                    emissiveIntensity={1.5}
                  />
                </Sphere>
                {/* Node Glow */}
                <pointLight intensity={0.9} color="#7D6B9D" distance={2} />
                {/* Track to core */}
                <mesh rotation={[0, 0, -Math.PI / 2.5]}>
                  <cylinderGeometry args={[0.0015, 0.0015, 3]} />
                  <meshBasicMaterial color="#7D6B9D" transparent opacity={0.15} />
                </mesh>
              </group>

              {/* Node 3: Now (Front Center) */}
              <group position={[0, 2.5, 2]}>
                <Sphere args={[0.1, 12, 12]}>
                  <meshStandardMaterial 
                    color="#F8F4EE" 
                    emissive="#F8F4EE"
                    emissiveIntensity={1.8}
                  />
                </Sphere>
                {/* Node Glow */}
                <pointLight intensity={1.1} color="#F8F4EE" distance={2.4} />
                {/* Track to core */}
                <mesh rotation={[Math.PI / 3, 0, 0]}>
                  <cylinderGeometry args={[0.0015, 0.0015, 2.5]} />
                  <meshBasicMaterial color="#F8F4EE" transparent opacity={0.2} />
                </mesh>
              </group>
              </group>
            )}
            
            {/* Magic dust - Very subtle */}
            {isTimelinePhase && (
              <Sparkles count={2} scale={2.1} size={0.58} speed={0.06} color="#F8F4EE" opacity={0.08} />
            )}
          </group>
        )}
      </Float>
    </>
  );
});
