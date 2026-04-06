import React, { memo } from 'react';
import { Sparkles, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface GiftBoxTimelineLayerProps {
  isMobileViewport: boolean;
  isTimelinePhase: boolean;
  timelineGroupRef: React.RefObject<THREE.Group | null>;
  coreRef: React.RefObject<THREE.Group | null>;
  tracksRef: React.RefObject<THREE.Group | null>;
}

export const GiftBoxTimelineLayer = memo(function GiftBoxTimelineLayer({
  isMobileViewport,
  isTimelinePhase,
  timelineGroupRef,
  coreRef,
  tracksRef,
}: GiftBoxTimelineLayerProps) {
  return (
    <group ref={timelineGroupRef} position={[0, 0, 0]}>
      <group ref={coreRef} position={[0, 1.5, 0]}>
        <Sphere args={[0.05, 12, 12]}>
          <meshBasicMaterial color="#FFF" />
        </Sphere>
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

      {isTimelinePhase && (
        <>
          <group ref={tracksRef} position={[0, 1.5, 0]}>
            <group position={isMobileViewport ? [-2.1, 1.35, -1.1] : [-2.5, 1.5, -1]}>
              <Sphere args={[0.08, 12, 12]}>
                <meshStandardMaterial color="#C5A059" emissive="#C5A059" emissiveIntensity={1.2} />
              </Sphere>
              <pointLight intensity={0.8} color="#C5A059" distance={1.8} />
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <cylinderGeometry args={[0.0015, 0.0015, 3.5]} />
                <meshBasicMaterial color="#C5A059" transparent opacity={0.15} />
              </mesh>
            </group>

            <group position={isMobileViewport ? [2.2, -0.32, 0.65] : [2.8, -0.5, 0.5]}>
              <Sphere args={[0.08, 12, 12]}>
                <meshStandardMaterial color="#7D6B9D" emissive="#7D6B9D" emissiveIntensity={1.5} />
              </Sphere>
              <pointLight intensity={0.9} color="#7D6B9D" distance={2} />
              <mesh rotation={[0, 0, -Math.PI / 2.5]}>
                <cylinderGeometry args={[0.0015, 0.0015, 3]} />
                <meshBasicMaterial color="#7D6B9D" transparent opacity={0.15} />
              </mesh>
            </group>

            <group position={isMobileViewport ? [0, 2.18, 1.78] : [0, 2.5, 2]}>
              <Sphere args={[0.1, 12, 12]}>
                <meshStandardMaterial color="#F8F4EE" emissive="#F8F4EE" emissiveIntensity={1.8} />
              </Sphere>
              <pointLight intensity={1.1} color="#F8F4EE" distance={2.4} />
              <mesh rotation={[Math.PI / 3, 0, 0]}>
                <cylinderGeometry args={[0.0015, 0.0015, 2.5]} />
                <meshBasicMaterial color="#F8F4EE" transparent opacity={0.2} />
              </mesh>
            </group>
          </group>

          <Sparkles
            count={isMobileViewport ? 1 : 2}
            scale={2.1}
            size={0.58}
            speed={0.06}
            color="#F8F4EE"
            opacity={0.08}
          />
        </>
      )}
    </group>
  );
});
