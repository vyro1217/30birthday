import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GiftBoxScene } from './GiftBoxScene';
import { BirthdayStep } from '../types/birthday';

type SceneMode =
  | 'none'
  | 'gift-opening'
  | 'cosmic-core'
  | 'timeline-expand'
  | 'reading-background-box'
  | 'closing-gift';

interface FullSceneCanvasProps {
  sceneMode: SceneMode;
  step: BirthdayStep;
  onSceneFailure: () => void;
  simpleInteractionMode?: boolean;
  storyGiftOpening?: boolean;
  storyGiftPullProgress?: number;
  onStoryGiftPullChange?: (distance: number) => void;
  onStoryGiftPullEnd?: (distance: number) => void;
}

export const FullSceneCanvas = React.memo(function FullSceneCanvas({
  sceneMode,
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
      frameloop="always"
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
