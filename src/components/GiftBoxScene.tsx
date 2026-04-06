import React, { Suspense, useRef, useEffect, memo, useMemo } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Float, Sparkles, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { BirthdayStep, StoryGiftPhase } from '../types/birthday';
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
  storyGiftPhase?: StoryGiftPhase;
  storyGiftPullProgress?: number;
  onStoryGiftPullChange?: (distance: number) => void;
  onStoryGiftPullEnd?: (distance: number) => void;
  onStoryGiftConfirm?: () => void;
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
  storyGiftPhase = 'idle',
  storyGiftPullProgress = 0,
  onStoryGiftPullChange,
  onStoryGiftPullEnd,
  onStoryGiftConfirm,
  onClosingGiftOpen,
}: GiftBoxProps) {
  const storyGiftOpening = storyGiftPhase === 'opening';
  const storyGiftWalletFocused = storyGiftPhase === 'wallet-focus';
  const storyGiftOpened = storyGiftPhase !== 'idle';
  const { camera, size } = useThree();
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
  const detachBridgeGiftListenersRef = useRef<(() => void) | null>(null);
  const detachClosingGiftListenersRef = useRef<(() => void) | null>(null);
  const bridgeGiftRotationYRef = useRef(0.02);
  const bridgeGiftSpinVelocityRef = useRef(0);
  const closingGiftRotationYRef = useRef(0.35);
  const closingGiftSpinVelocityRef = useRef(0);
  const storyGiftPullStateRef = useRef({
    active: false,
    startClientY: 0,
    distance: 0,
    pointerId: -1,
  });
  const bridgeGiftDragStateRef = useRef({
    active: false,
    pointerId: -1,
    startClientX: 0,
    lastClientX: 0,
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
  const isBridgeStep = step === 'opening-bridge';
  const showSecondaryStars = isTimelinePhase;
  const showAmbientSparkles = isCosmicPhase || isTimelinePhase;
  const shouldLoadTimelineLayer = isGiftPhase || isCosmicPhase || isTimelinePhase;
  const responsiveSceneScale = useMemo(() => {
    if (size.width <= 430) {
      return 0.68;
    }

    if (size.width <= 820) {
      return 0.82;
    }

    return 0.96;
  }, [size.width]);
  const storyGiftViewportProfile = useMemo(() => {
    const isNarrow = size.width <= 390;
    const isCompact = size.width <= 430;
    const isShort = size.height <= 760;
    const isVeryShort = size.height <= 680;
    const isWide = size.width >= 960;

    return {
      boxGroupY: isVeryShort ? 0.08 : isShort ? 0.06 : 0.04,
      boxGroupZ: isWide ? 0.06 : isCompact ? 0.08 : 0.1,
      boxScale: isVeryShort ? 0.98 : isCompact ? 1 : 1.03,
      openingScaleBoost: isNarrow ? 0.03 : 0.04,
      focusScaleBoost: isNarrow ? 0.05 : 0.065,
      walletLift: isCompact ? 0.16 : 0.2,
      walletPush: isCompact ? 0.18 : 0.24,
      idleCameraY: isVeryShort ? 1.02 : isCompact ? 1.06 : 0.96,
      idleCameraZ: isVeryShort ? 6.45 : isCompact ? 6.28 : isWide ? 5.45 : 5.8,
      idleCameraRotX: isVeryShort ? -0.36 : isCompact ? -0.4 : -0.38,
      revealCameraY: isVeryShort ? 1.96 : isCompact ? 2.02 : 1.76,
      revealCameraZ: isVeryShort ? 4.9 : isCompact ? 4.74 : 4.26,
      revealCameraRotX: isVeryShort ? -0.52 : isCompact ? -0.56 : -0.54,
      focusCameraY: isVeryShort ? 2.08 : isCompact ? 2.16 : 1.98,
      focusCameraZ: isVeryShort ? 4.36 : isCompact ? 4.18 : 3.82,
      focusCameraRotX: isVeryShort ? -0.58 : isCompact ? -0.62 : -0.6,
    };
  }, [size.height, size.width]);

  const textSteps = useMemo(
    () => ['node-before', 'node-us', 'memory-1', 'memory-2', 'memory-3', 'memory-4', 'memory-5', 'node-now', 'node-thirty-soft', 'node-thirty-race', 'title', 'message', 'message2', 'final'],
    [],
  );
  const isTextStep = textSteps.includes(step);

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

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (pointLightRef.current) {
      const baseIntensity = isReadingBackgroundPhase
        ? 1.4
        : isBridgeStep
          ? 1.15
        : isClosingPhase
          ? 1.95
          : isCosmicPhase
            ? 2.75
            : isTimelinePhase
              ? 2.3
              : 2.45;
      const intensitySwing = isReadingBackgroundPhase ? 0.18 : isBridgeStep ? 0.08 : isClosingPhase ? 0.22 : 0.64;
      pointLightRef.current.intensity = baseIntensity + Math.sin(t * 0.55) * intensitySwing;
      pointLightRef.current.position.x = isReadingBackgroundPhase ? 0.55 : isBridgeStep ? 0.28 : Math.sin(t * 0.24) * 1.8;
      pointLightRef.current.position.y = isReadingBackgroundPhase ? 1.75 : isBridgeStep ? 1.18 + Math.cos(t * 0.22) * 0.12 : 1.2 + Math.cos(t * 0.32) * 0.72;
      pointLightRef.current.position.z = isReadingBackgroundPhase ? 3.9 : isBridgeStep ? 3.2 : 3.7 + Math.sin(t * 0.18) * 0.42;
      pointLightRef.current.color.set(isBridgeStep ? '#FFF0DE' : isClosingPhase ? '#FFE4F5' : isCosmicPhase ? '#F4CCFF' : '#FFF1F7');
    }

    if (coreRef.current && (isCosmicPhase || isTimelinePhase)) {
      coreRef.current.rotation.y += 0.01;
      coreRef.current.rotation.x = Math.sin(t * 0.45) * 0.08;
    }
    if (tracksRef.current && isTimelinePhase) {
      tracksRef.current.rotation.y += 0.002;
      tracksRef.current.rotation.z = Math.sin(t * 0.2) * 0.03;
    }

    if (groupRef.current && !isReadingBackgroundPhase) {
      const idleY =
        step === 'ready'
          ? Math.sin(t * 0.72) * 0.05
          : isBridgeStep
            ? Math.sin(t * 0.58) * 0.012
          : isGiftPhase
            ? Math.sin(t * 0.58) * 0.03
            : isTextStep
              ? Math.sin(t * 0.5) * 0.015
              : 0;
      groupRef.current.position.y += (idleY - groupRef.current.position.y) * 0.035;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        step === 'ready' ? Math.sin(t * 0.22) * 0.16 : isBridgeStep ? Math.sin(t * 0.18) * 0.018 : groupRef.current.rotation.y,
        0.04,
      );
    }

    if (boxGroupRef.current && step === 'ready') {
      boxGroupRef.current.rotation.y = Math.sin(t * 0.22) * 0.14;
      boxGroupRef.current.rotation.z = Math.sin(t * 0.32) * 0.018;
    }

    if (step === 'opening-bridge' && boxGroupRef.current) {
      const dragState = bridgeGiftDragStateRef.current;
      if (!dragState.active) {
        bridgeGiftSpinVelocityRef.current *= 0.9;
        if (Math.abs(bridgeGiftSpinVelocityRef.current) < 0.0001) {
          bridgeGiftSpinVelocityRef.current = 0;
        }
        const idleTarget = 0.02 + Math.sin(t * 0.42) * 0.06 + bridgeGiftSpinVelocityRef.current * 10;
        bridgeGiftRotationYRef.current = THREE.MathUtils.lerp(bridgeGiftRotationYRef.current, idleTarget, 0.08);
      }

      bridgeGiftRotationYRef.current = THREE.MathUtils.clamp(bridgeGiftRotationYRef.current, -0.72, 0.72);
      boxGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        boxGroupRef.current.rotation.y,
        bridgeGiftRotationYRef.current,
        dragState.active ? 0.24 : 0.1,
      );
      const tiltX = -0.045 + Math.min(Math.abs(bridgeGiftRotationYRef.current) * 0.035, 0.028);
      boxGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        boxGroupRef.current.rotation.x,
        tiltX,
        dragState.active ? 0.18 : 0.08,
      );
      const tiltZ = THREE.MathUtils.clamp(
        -bridgeGiftRotationYRef.current * 0.075 + bridgeGiftSpinVelocityRef.current * 4.2,
        -0.075,
        0.075,
      );
      boxGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        boxGroupRef.current.rotation.z,
        tiltZ,
        dragState.active ? 0.22 : 0.1,
      );
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
      const targetPull = storyGiftOpened ? 1 : storyGiftPullProgress;
      storyGiftPullVisualRef.current = THREE.MathUtils.lerp(
        storyGiftPullVisualRef.current,
        targetPull,
        storyGiftOpened ? 0.18 : 0.22,
      );

      const visualPull = storyGiftPullVisualRef.current;
      const seamProgress = THREE.MathUtils.clamp(visualPull / 0.22, 0, 1);
      const peekProgress = THREE.MathUtils.clamp((visualPull - 0.22) / 0.36, 0, 1);
      const heroProgress = THREE.MathUtils.clamp((visualPull - 0.58) / 0.42, 0, 1);
      const lidSettle = Math.sin(t * 8) * 0.012 * (1 - heroProgress);

      if (groupRef.current) {
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.18);
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          storyGiftViewportProfile.boxGroupY,
          0.12,
        );
        groupRef.current.position.z = THREE.MathUtils.lerp(
          groupRef.current.position.z,
          storyGiftViewportProfile.boxGroupZ,
          0.12,
        );
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.14);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.14);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.14);
        const groupScale =
          storyGiftViewportProfile.boxScale +
          seamProgress * 0.012 +
          peekProgress * storyGiftViewportProfile.openingScaleBoost +
          heroProgress * (storyGiftWalletFocused ? storyGiftViewportProfile.focusScaleBoost : storyGiftViewportProfile.openingScaleBoost);
        groupRef.current.scale.lerp(new THREE.Vector3(groupScale, groupScale, groupScale), 0.12);
      }

      insertCardRef.current.position.y =
        THREE.MathUtils.lerp(
          insertCardRef.current.position.y,
          -0.34 +
            seamProgress * 0.01 +
            peekProgress * 0.06 +
            heroProgress * (storyGiftWalletFocused ? storyGiftViewportProfile.walletLift : 0.12),
          0.14,
        );
      insertCardRef.current.position.z =
        THREE.MathUtils.lerp(
          insertCardRef.current.position.z,
          0.14 +
            seamProgress * 0.02 +
            peekProgress * 0.08 +
            heroProgress * (storyGiftWalletFocused ? storyGiftViewportProfile.walletPush : 0.16),
          0.14,
        );
      insertCardRef.current.rotation.x =
        THREE.MathUtils.lerp(
          insertCardRef.current.rotation.x,
          0.08 -
            seamProgress * 0.02 -
            peekProgress * 0.06 -
            heroProgress * (storyGiftWalletFocused ? 0.02 : 0.04),
          0.16,
        );
      insertCardRef.current.rotation.y =
        THREE.MathUtils.lerp(
          insertCardRef.current.rotation.y,
          0.22 +
            seamProgress * 0.05 +
            peekProgress * 0.1 +
            heroProgress * (storyGiftWalletFocused ? 0.12 : 0.08),
          0.16,
        );
      insertCardRef.current.rotation.z =
        THREE.MathUtils.lerp(
          insertCardRef.current.rotation.z,
          -0.03 +
            seamProgress * 0.004 +
            peekProgress * 0.01 +
            heroProgress * 0.012,
          0.16,
        );
      const walletScale =
        0.84 +
        seamProgress * 0.03 +
        peekProgress * 0.08 +
        heroProgress * (storyGiftWalletFocused ? 0.22 : 0.12);
      insertCardRef.current.scale.lerp(new THREE.Vector3(walletScale, walletScale, walletScale), 0.14);

      lidGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        lidGroupRef.current.rotation.x,
        -Math.PI * (0.12 * seamProgress + 0.34 * peekProgress + 0.5 * heroProgress) + lidSettle,
        0.15,
      );
      lidGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        lidGroupRef.current.rotation.y,
        0.015 * peekProgress + 0.04 * heroProgress,
        0.15,
      );
      lidGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        lidGroupRef.current.rotation.z,
        -0.01 * seamProgress - 0.025 * heroProgress,
        0.15,
      );
      lidGroupRef.current.position.y = THREE.MathUtils.lerp(
        lidGroupRef.current.position.y,
        0.48 +
          seamProgress * 0.12 +
          peekProgress * 0.32 +
          heroProgress * 0.82,
        0.15,
      );
      lidGroupRef.current.position.z = THREE.MathUtils.lerp(
        lidGroupRef.current.position.z,
        -1.08 +
          seamProgress * 0.08 +
          peekProgress * 0.22 +
          heroProgress * 0.42,
        0.15,
      );

      boxGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        boxGroupRef.current.rotation.x,
        -0.02 -
          seamProgress * 0.05 -
          peekProgress * 0.06 -
          heroProgress * 0.08,
        0.14,
      );
      boxGroupRef.current.rotation.y = THREE.MathUtils.lerp(boxGroupRef.current.rotation.y, 0, 0.16);
      boxGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        boxGroupRef.current.rotation.z,
        heroProgress * 0.025,
        0.14,
      );
      boxGroupRef.current.position.y = THREE.MathUtils.lerp(
        boxGroupRef.current.position.y,
        -0.01 -
          seamProgress * 0.01 -
          peekProgress * 0.02 -
          heroProgress * 0.03,
        0.14,
      );

      const cameraTargetX = 0;
      const cameraTargetY =
        (storyGiftWalletFocused
          ? storyGiftViewportProfile.focusCameraY
          : storyGiftViewportProfile.revealCameraY) +
        seamProgress * 0.08 +
        peekProgress * 0.18 +
        heroProgress * (storyGiftWalletFocused ? 0.22 : 0.18);
      const cameraTargetZ =
        (storyGiftWalletFocused
          ? storyGiftViewportProfile.focusCameraZ
          : storyGiftViewportProfile.revealCameraZ) -
        seamProgress * 0.04 -
        peekProgress * 0.1 -
        heroProgress * (storyGiftWalletFocused ? 0.18 : 0.14);
      const cameraRotX =
        (storyGiftWalletFocused
          ? storyGiftViewportProfile.focusCameraRotX
          : storyGiftViewportProfile.revealCameraRotX) -
        seamProgress * 0.02 -
        peekProgress * 0.04 -
        heroProgress * (storyGiftWalletFocused ? 0.04 : 0.03);
      const cameraRotY = 0;
      const cameraRotZ = -0.02;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, cameraTargetX, 0.08);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, cameraTargetY, 0.08);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, cameraTargetZ, 0.08);
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, cameraRotX, 0.08);
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, cameraRotY, 0.08);
      camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, cameraRotZ, 0.08);

      if (storyGiftGlowRef.current) {
        storyGiftGlowRef.current.intensity =
          0.35 +
          seamProgress * 1.1 +
          peekProgress * 1.5 +
          heroProgress * 2.6;
        storyGiftGlowRef.current.distance =
          2.2 +
          seamProgress * 0.4 +
          peekProgress * 0.7 +
          heroProgress * 1.5;
        storyGiftGlowRef.current.position.y = 0.22 + seamProgress * 0.08 + peekProgress * 0.12 + heroProgress * 0.24;
        storyGiftGlowRef.current.position.z = -0.02 + seamProgress * 0.06 + peekProgress * 0.1 + heroProgress * 0.16;
        storyGiftGlowRef.current.color.set(heroProgress > 0.2 ? '#FFE9B8' : peekProgress > 0.15 ? '#FFF1D6' : '#FFE7F1');
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
    if (step !== 'story-gift' || storyGiftPhase !== 'idle') {
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
    if (step !== 'story-gift' || storyGiftPhase !== 'idle' || !simpleInteractionMode) {
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

  const handleStoryGiftConfirmClick = (event: ThreeEvent<MouseEvent | PointerEvent>) => {
    if (step !== 'story-gift' || storyGiftPhase !== 'wallet-focus') {
      return;
    }

    event.stopPropagation();
    onStoryGiftConfirm?.();
  };

  const finishBridgeGiftDrag = () => {
    const dragState = bridgeGiftDragStateRef.current;
    if (!dragState.active) {
      return;
    }

    detachBridgeGiftListenersRef.current?.();
    detachBridgeGiftListenersRef.current = null;
    dragState.active = false;
    dragState.pointerId = -1;
  };

  const handleBridgeGiftPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (step !== 'opening-bridge') {
      return;
    }

    event.stopPropagation();
    const pointerId = event.pointerId;
    const dragState = bridgeGiftDragStateRef.current;
    dragState.active = true;
    dragState.pointerId = pointerId;
    dragState.startClientX = event.clientX;
    dragState.lastClientX = event.clientX;
    bridgeGiftSpinVelocityRef.current = 0;

    const handleWindowPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId || !bridgeGiftDragStateRef.current.active) {
        return;
      }

      const deltaX = moveEvent.clientX - bridgeGiftDragStateRef.current.lastClientX;
      bridgeGiftDragStateRef.current.lastClientX = moveEvent.clientX;
      bridgeGiftRotationYRef.current += deltaX * 0.0064;
      bridgeGiftSpinVelocityRef.current = THREE.MathUtils.clamp(deltaX * 0.0011, -0.016, 0.016);
    };

    const handleWindowPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) {
        return;
      }

      finishBridgeGiftDrag();
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp, { passive: true });
    window.addEventListener('pointercancel', handleWindowPointerUp, { passive: true });
    detachBridgeGiftListenersRef.current = () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  };

  const handleBridgeGiftPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (bridgeGiftDragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    finishBridgeGiftDrag();
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
      detachBridgeGiftListenersRef.current?.();
      detachClosingGiftListenersRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (step !== 'opening-bridge' && bridgeGiftDragStateRef.current.active) {
      finishBridgeGiftDrag();
    }
    if (step !== 'closing-gift' && closingGiftDragStateRef.current.active) {
      finishClosingGiftDrag(false);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'opening-bridge') {
      bridgeGiftRotationYRef.current = 0.02;
      bridgeGiftSpinVelocityRef.current = 0;
    }
  }, [step]);

  useEffect(() => {
    if (step === 'closing-gift') {
      closingGiftRotationYRef.current = 0.35;
      closingGiftSpinVelocityRef.current = 0;
    }
  }, [step]);

  useEffect(() => {
    if (step !== 'story-gift' || storyGiftPhase !== 'idle') {
      return;
    }

    storyGiftPullVisualRef.current = 0;

    if (groupRef.current) {
      groupRef.current.position.set(0, storyGiftViewportProfile.boxGroupY, storyGiftViewportProfile.boxGroupZ);
      groupRef.current.scale.setScalar(storyGiftViewportProfile.boxScale);
    }

    if (boxGroupRef.current) {
      boxGroupRef.current.rotation.set(-0.05, 0, 0);
      boxGroupRef.current.position.set(0, -0.01, 0);
    }

    if (lidGroupRef.current) {
      lidGroupRef.current.rotation.set(0, 0, 0);
      lidGroupRef.current.position.set(0, 0.48, -1.08);
    }

    if (insertCardRef.current) {
      insertCardRef.current.position.set(0, -0.34, 0.14);
      insertCardRef.current.rotation.set(0.08, 0.22, -0.04);
      insertCardRef.current.scale.setScalar(0.84);
    }

    if (storyGiftGlowRef.current) {
      storyGiftGlowRef.current.intensity = 0.35;
      storyGiftGlowRef.current.distance = 2.2;
      storyGiftGlowRef.current.position.set(0, 0.22, -0.02);
      storyGiftGlowRef.current.color.set('#FFE7F1');
    }

    camera.position.set(
      0,
      storyGiftViewportProfile.idleCameraY,
      storyGiftViewportProfile.idleCameraZ,
    );
    camera.rotation.set(
      storyGiftViewportProfile.idleCameraRotX,
      0,
      -0.02,
    );
  }, [camera.position, camera.rotation, storyGiftViewportProfile, step, storyGiftPhase]);

  useEffect(() => {
    if (step !== 'opening-bridge') {
      return;
    }

    if (groupRef.current) {
      groupRef.current.position.set(0, storyGiftViewportProfile.boxGroupY, storyGiftViewportProfile.boxGroupZ);
      groupRef.current.scale.setScalar(storyGiftViewportProfile.boxScale);
    }

    if (boxGroupRef.current) {
      boxGroupRef.current.rotation.set(-0.04, bridgeGiftRotationYRef.current, -0.01);
      boxGroupRef.current.position.set(0, -0.01, 0);
    }

    if (lidGroupRef.current) {
      lidGroupRef.current.rotation.set(0, 0, 0);
      lidGroupRef.current.position.set(0, 0.48, -1.08);
    }

    if (insertCardRef.current) {
      insertCardRef.current.position.set(0, -0.3, 0.14);
      insertCardRef.current.rotation.set(0.06, 0.34, -0.05);
      insertCardRef.current.scale.setScalar(0.64);
    }

    if (storyGiftGlowRef.current) {
      storyGiftGlowRef.current.intensity = 0.22;
      storyGiftGlowRef.current.distance = 1.9;
      storyGiftGlowRef.current.position.set(0, 0.12, -0.14);
      storyGiftGlowRef.current.color.set('#FFEAD8');
    }
  }, [step, storyGiftViewportProfile]);

  useEffect(() => {
    const isClosingGiftStep = step === 'closing-gift';
    if (step === 'story-gift') {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera.rotation);
      return;
    }

    const tweenCamera = (
      position: { x: number; y: number; z: number },
      rotation: { x: number; y: number; z: number },
      duration: number,
      ease: string,
    ) => {
      gsap.to(camera.position, {
        ...position,
        duration,
        ease,
        overwrite: 'auto',
      });
      gsap.to(camera.rotation, {
        ...rotation,
        duration,
        ease,
        overwrite: 'auto',
      });
    };

    if (isClosingGiftStep) {
      tweenCamera(
        {
          x: isMobileViewport ? 0.22 : 0.35,
          y: isMobileViewport ? 1.5 : 1.35,
          z: isMobileViewport ? 10.2 : 9.2,
        },
        {
          x: isMobileViewport ? -0.12 : -0.09,
          y: isMobileViewport ? 0.02 : 0.035,
          z: isMobileViewport ? -0.01 : -0.015,
        },
        2.6,
        'power3.inOut',
      );
    } else if (isBridgeStep) {
      tweenCamera(
        {
          x: 0,
          y: storyGiftViewportProfile.idleCameraY,
          z: storyGiftViewportProfile.idleCameraZ,
        },
        {
          x: storyGiftViewportProfile.idleCameraRotX,
          y: 0,
          z: -0.02,
        },
        0.9,
        'power3.inOut',
      );
    } else if (isReadingBackgroundPhase || isTextStep) {
      tweenCamera(
        {
          x: isMobileViewport ? 0.1 : 0.16,
          y: isMobileViewport ? 5.45 : 5.3,
          z: isMobileViewport ? 4.4 : 4.05,
        },
        {
          x: isMobileViewport ? -0.9 : -0.84,
          y: isMobileViewport ? 0.02 : 0.03,
          z: isMobileViewport ? -0.02 : -0.015,
        },
        1.9,
        'power3.inOut',
      );
    } else if (step === 'opening') {
      tweenCamera(
        {
          x: isMobileViewport ? 0.55 : 0.72,
          y: isMobileViewport ? 1.2 : 1.05,
          z: isMobileViewport ? 6.2 : 5.6,
        },
        {
          x: isMobileViewport ? -0.08 : -0.1,
          y: isMobileViewport ? 0.12 : 0.14,
          z: isMobileViewport ? -0.02 : -0.03,
        },
        1.95,
        'power3.inOut',
      );
    } else {
      tweenCamera(
        {
          x: isMobileViewport ? 0.32 : 0.45,
          y: isMobileViewport ? 0.7 : 0.56,
          z: isMobileViewport ? 7.1 : 6.55,
        },
        {
          x: isMobileViewport ? -0.04 : -0.05,
          y: isMobileViewport ? 0.06 : 0.08,
          z: isMobileViewport ? -0.01 : -0.02,
        },
        1.8,
        'power3.inOut',
      );
    }

    if (step === 'opening' && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: -Math.PI * 0.68,
        y: 0.04,
        z: -0.03,
        duration: 2.1,
        ease: 'back.out(1.2)',
        overwrite: 'auto',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 1.26,
        z: -0.46,
        duration: 2.1,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }

    if (step === 'closing-gift' && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 2.1,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 0.48,
        z: -1.08,
        duration: 2.1,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
    }

    if (step === 'opening-bridge' && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.95,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 0.48,
        z: -1.08,
        duration: 0.95,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }

    if (cornerBoxSteps.includes(step) && lidGroupRef.current) {
      gsap.to(lidGroupRef.current.rotation, {
        x: -Math.PI * 0.9,
        y: 0.03,
        z: -0.02,
        duration: 1.35,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 1.5,
        z: -0.66,
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
      if (step === 'opening-bridge') {
        gsap.to(insertCardRef.current.position, {
          y: -0.66,
          z: -0.22,
          duration: 0.9,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        gsap.to(insertCardRef.current.rotation, {
          x: 0.12,
          z: 0,
          duration: 0.9,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        gsap.to(insertCardRef.current.scale, {
          x: 0.52,
          y: 0.52,
          z: 0.52,
          duration: 0.9,
          ease: 'power2.out',
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

    const readingCornerPlacement = readingCornerPlacements[step];
    const isReadingCornerStep = Boolean(readingCornerPlacement);
    if (step === 'opening-bridge' && groupRef.current) {
      gsap.to(groupRef.current.position, {
        x: 0,
        y: -0.04,
        z: 0.02,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      gsap.to(groupRef.current.scale, {
        x: 1.02,
        y: 1.02,
        z: 1.02,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      if (boxGroupRef.current) {
        gsap.to(boxGroupRef.current.rotation, {
          x: -0.04,
          y: bridgeGiftRotationYRef.current,
          z: -0.01,
          duration: 0.9,
          ease: 'power2.out',
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
        z: isMobileViewport ? -2.08 : -1.25,
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
          x: isTopCorner ? -0.52 : -0.32,
          y: isLeftCorner
            ? isMobileViewport
              ? 0.38
              : 0.42
            : isMobileViewport
              ? -0.38
              : -0.42,
          z: isLeftCorner ? 0.1 : -0.1,
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
          x: 0.24,
          y: isMobileViewport ? 0.48 : 0.4,
          z: isMobileViewport ? -0.03 : -0.05,
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
        x: -Math.PI * 0.8,
        y: 0.02,
        z: -0.015,
        duration: 1.25,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      gsap.to(lidGroupRef.current.position, {
        y: 1.34,
        z: -0.52,
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
        gsap.killTweensOf(insertCardRef.current.scale);
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
  }, [camera.position, camera.rotation, isMobileViewport, isReadingBackgroundPhase, readingCornerPlacements, step, storyGiftOpening, storyGiftViewportProfile, storyGiftWalletFocused]);

  const isTimelineActive = isCosmicPhase || isTimelinePhase;

  return (
    <>
      <ambientLight intensity={isReadingBackgroundPhase ? 0.48 : isBridgeStep ? 0.66 : isClosingPhase ? 0.58 : 0.82} color={isBridgeStep ? '#FFF7F0' : isClosingPhase ? '#FFE9F7' : '#FFF7FB'} />
      <directionalLight position={[5, 6, 4]} intensity={isBridgeStep ? 0.82 : 1.05} color={isBridgeStep ? '#FFF1E1' : '#FFF4FD'} />
      <directionalLight position={[-3, 2, -4]} intensity={isReadingBackgroundPhase ? 0.22 : isBridgeStep ? 0.18 : 0.38} color="#F5CCFF" />
      <pointLight ref={pointLightRef} position={[0, 2, 4]} intensity={2.1} color="#F8F4EE" />
      
      <fog attach="fog" args={['#07050D', 5, isReadingBackgroundPhase ? 19 : 25]} />
      
      {/* Layered Starry Sky - More subtle */}
      <Stars radius={90} depth={42} count={isReadingBackgroundPhase ? 28 : isBridgeStep ? (isMobileViewport ? 20 : 34) : isMobileViewport ? (showSecondaryStars ? 96 : 52) : showSecondaryStars ? 180 : 96} factor={1.2} saturation={0} fade speed={isReadingBackgroundPhase || isBridgeStep ? 0 : 0.04} />
      {showSecondaryStars && (
        <Stars radius={130} depth={42} count={isMobileViewport ? 18 : 34} factor={1.55} saturation={0.12} fade speed={0.08} />
      )}
      
      {/* Nebula Glow Effect - Deeper and more subtle */}
      <Sphere args={[56, 10, 10]} scale={[-1, 1, 1]}>
        <meshBasicMaterial 
          color="#120714" 
          side={THREE.BackSide} 
          transparent 
          opacity={0.56} 
        />
      </Sphere>
      <Sphere args={[42, 12, 12]} scale={[-1, 1, 1]}>
        <meshBasicMaterial color="#2A1131" side={THREE.BackSide} transparent opacity={isReadingBackgroundPhase ? 0.08 : 0.14} />
      </Sphere>
      
      {/* Gentle floating light particles */}
      {showAmbientSparkles && !isBridgeStep && (
        <Sparkles count={isMobileViewport ? (isTimelinePhase ? 2 : 1) : isTimelinePhase ? 4 : 3} scale={7.5} size={0.68} speed={0.08} opacity={0.16} color="#F3C6FF" />
      )}
      
      <group scale={[responsiveSceneScale, responsiveSceneScale, responsiveSceneScale]}>
        <Float
          speed={isReadingBackgroundPhase ? 0 : isBridgeStep ? 0.22 : isGiftPhase ? 0.44 : isMobileViewport ? 0.48 : 0.8}
          rotationIntensity={isReadingBackgroundPhase ? 0 : isBridgeStep ? 0.02 : isGiftPhase ? 0.08 : isMobileViewport ? 0.08 : 0.16}
          floatIntensity={isReadingBackgroundPhase ? 0 : isBridgeStep ? 0.06 : isGiftPhase ? 0.16 : isMobileViewport ? 0.22 : 0.38}
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
            storyGiftPhase={storyGiftPhase}
            handleStoryGiftTap={handleStoryGiftTap}
            handleStoryGiftConfirmClick={handleStoryGiftConfirmClick}
            handleStoryGiftPointerDown={handleStoryGiftPointerDown}
            handleStoryGiftPointerUp={handleStoryGiftPointerUp}
            finishStoryGiftPull={finishStoryGiftPull}
            handleBridgeGiftPointerDown={handleBridgeGiftPointerDown}
            handleBridgeGiftPointerUp={handleBridgeGiftPointerUp}
            finishBridgeGiftDrag={finishBridgeGiftDrag}
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
      </group>
    </>
  );
});
