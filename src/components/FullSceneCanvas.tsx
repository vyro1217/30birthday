import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GiftBoxScene } from './GiftBoxScene';
import { BirthdayStep } from '../types/birthday';

interface FullSceneCanvasProps {
  step: BirthdayStep;
  onOpen: () => void;
  onSceneFailure: () => void;
}

export const FullSceneCanvas = React.memo(function FullSceneCanvas({
  step,
  onOpen,
  onSceneFailure,
}: FullSceneCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: 'default',
      }}
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          'webglcontextlost',
          () => {
            onSceneFailure();
          },
          { once: true },
        );
      }}
    >
      <Suspense fallback={null}>
        <GiftBoxScene step={step} onOpen={onOpen} />
      </Suspense>
    </Canvas>
  );
});
