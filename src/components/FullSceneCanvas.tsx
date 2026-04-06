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
  onClosingGiftOpen?: () => void;
}

function CanvasPlaybackController({
  playbackMode,
  transitionKey,
  active,
}: {
  playbackMode: ScenePlaybackMode;
  transitionKey: string;
  active: boolean;
}) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!active || playbackMode !== 'demand') {
      invalidate();
      return;
    }

    let frameId = 0;
    const scheduledFrames = new Set<number>();
    const startedAt = performance.now();
    const transitionDurationMs = 2200;

    const tick = () => {
      invalidate();

      if (performance.now() - startedAt < transitionDurationMs) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    tick();

    const wakeScene = () => {
      [0, 120, 280].forEach((delay) => {
        const scheduled = window.setTimeout(() => {
          scheduledFrames.delete(scheduled);
          invalidate();
        }, delay);
        scheduledFrames.add(scheduled);
      });
    };

    const handleVisibilityWake = () => {
      if (document.visibilityState === 'visible') {
        wakeScene();
      }
    };

    window.addEventListener('pageshow', wakeScene);
    window.addEventListener('resize', wakeScene);
    window.addEventListener('orientationchange', wakeScene);
    window.visualViewport?.addEventListener('resize', wakeScene);
    document.addEventListener('visibilitychange', handleVisibilityWake);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      scheduledFrames.forEach((scheduled) => {
        window.clearTimeout(scheduled);
      });
      window.removeEventListener('pageshow', wakeScene);
      window.removeEventListener('resize', wakeScene);
      window.removeEventListener('orientationchange', wakeScene);
      window.visualViewport?.removeEventListener('resize', wakeScene);
      document.removeEventListener('visibilitychange', handleVisibilityWake);
    };
  }, [active, invalidate, playbackMode, transitionKey]);

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
  onClosingGiftOpen,
}: FullSceneCanvasProps) {
  const dpr: [number, number] =
    typeof window !== 'undefined' && window.innerWidth < 768 ? [0.8, 1] : [1, 1.2];

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: 'default',
        stencil: false,
        depth: true,
      }}
      dpr={dpr}
      frameloop={playbackMode}
      performance={{ min: 0.3 }}
      onCreated={({ gl, invalidate }) => {
        let restored = false;

        const handleContextLost = (event: Event) => {
          event.preventDefault();
          window.setTimeout(() => {
            if (!restored) {
              onSceneFailure();
            }
          }, 1200);
        };

        const handleContextRestored = () => {
          restored = true;
          invalidate();
        };

        gl.domElement.addEventListener(
          'webglcontextlost',
          handleContextLost,
        );
        gl.domElement.addEventListener('webglcontextrestored', handleContextRestored);
      }}
    >
      <Suspense fallback={null}>
        <CanvasPlaybackController
          playbackMode={playbackMode}
          transitionKey={`${sceneMode}:${step}`}
          active={sceneMode !== 'none'}
        />
        <GiftBoxScene
          sceneMode={sceneMode}
          step={step}
          simpleInteractionMode={simpleInteractionMode}
          storyGiftOpening={storyGiftOpening}
          storyGiftPullProgress={storyGiftPullProgress}
          onStoryGiftPullChange={onStoryGiftPullChange}
          onStoryGiftPullEnd={onStoryGiftPullEnd}
          onClosingGiftOpen={onClosingGiftOpen}
        />
      </Suspense>
    </Canvas>
  );
});
