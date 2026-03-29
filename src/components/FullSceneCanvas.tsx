import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GiftBoxScene } from './GiftBoxScene';
import { BirthdayStep } from '../types/birthday';

interface FullSceneCanvasProps {
  step: BirthdayStep;
  onSceneFailure: () => void;
}

export const FullSceneCanvas = React.memo(function FullSceneCanvas({
  step,
  onSceneFailure,
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
      dpr={[1, 1.05]}
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
        <GiftBoxScene step={step} />
      </Suspense>
    </Canvas>
  );
});
