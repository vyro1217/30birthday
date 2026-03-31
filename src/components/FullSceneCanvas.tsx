import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { GiftBoxScene } from './GiftBoxScene';
import { BirthdayStep } from '../types/birthday';

type SceneMode =
  | 'none'
  | 'gift-opening'
  | 'cosmic-core'
  | 'timeline-expand'
  | 'reading-background-box'
  | 'closing-gift';
type ScenePlaybackMode = 'always' | 'demand';

interface FullSceneCanvasProps {
  sceneMode: SceneMode;
  playbackMode: ScenePlaybackMode;
  step: BirthdayStep;
  onSceneFailure: () => void;
  simpleInteractionMode?: boolean;
  storyGiftOpening?: boolean;
  storyGiftPullProgress?: number;
  onStoryGiftPullChange?: (distance: number) => void;
  onStoryGiftPullEnd?: (distance: number) => void;
}

function CanvasPlaybackController({
  playbackMode,
  transitionKey,
}: {
  playbackMode: ScenePlaybackMode;
  transitionKey: string;
}) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (playbackMode !== 'demand') {
      invalidate();
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();
    const transitionDurationMs = 1800;

    const tick = () => {
      invalidate();

      if (performance.now() - startedAt < transitionDurationMs) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [invalidate, playbackMode, transitionKey]);

  return null;
}

export const FullSceneCanvas = React.memo(function FullSceneCanvas({
  sceneMode,
  playbackMode,
  step,
  onSceneFailure,
  simpleInteractionMode = false,
  storyGiftOpening = false,
  storyGiftPullProgress = 0,
  onStoryGiftPullChange,
  onStoryGiftPullEnd,
}: FullSceneCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: 'low-power',
        stencil: false,
        depth: true,
      }}
      dpr={[1, 1]}
      frameloop={playbackMode}
      performance={{ min: 0.3 }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          'webglcontextlost',
          (event) => {
            event.preventDefault();
            onSceneFailure();
          },
          { once: true },
        );
      }}
    >
      <Suspense fallback={null}>
        <CanvasPlaybackController playbackMode={playbackMode} transitionKey={`${sceneMode}:${step}`} />
        <GiftBoxScene
          sceneMode={sceneMode}
          step={step}
          simpleInteractionMode={simpleInteractionMode}
          storyGiftOpening={storyGiftOpening}
          storyGiftPullProgress={storyGiftPullProgress}
          onStoryGiftPullChange={onStoryGiftPullChange}
          onStoryGiftPullEnd={onStoryGiftPullEnd}
        />
      </Suspense>
    </Canvas>
  );
});
