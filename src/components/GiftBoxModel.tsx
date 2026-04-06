import React, { memo } from 'react';
import { Box, RoundedBox, Sparkles, Sphere, Torus } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { BirthdayStep } from '../types/birthday';

interface GiftBoxModelProps {
  step: BirthdayStep;
  isMobileViewport: boolean;
  verticalEdgePositions: [number, number, number][];
  cornerPositions: [number, number, number][];
  boxGroupRef: React.RefObject<THREE.Group | null>;
  lidGroupRef: React.RefObject<THREE.Group | null>;
  insertCardRef: React.RefObject<THREE.Group | null>;
  storyGiftGlowRef: React.RefObject<THREE.PointLight | null>;
  handleStoryGiftTap: (event: ThreeEvent<MouseEvent>) => void;
  handleStoryGiftPointerDown: (event: ThreeEvent<PointerEvent>) => void;
  handleStoryGiftPointerUp: (event: ThreeEvent<PointerEvent>) => void;
  finishStoryGiftPull: () => void;
  handleClosingGiftPointerDown: (event: ThreeEvent<PointerEvent>) => void;
  handleClosingGiftPointerUp: (event: ThreeEvent<PointerEvent>) => void;
  finishClosingGiftDrag: (allowTap?: boolean) => void;
}

export const GiftBoxModel = memo(function GiftBoxModel({
  step,
  isMobileViewport,
  verticalEdgePositions,
  cornerPositions,
  boxGroupRef,
  lidGroupRef,
  insertCardRef,
  storyGiftGlowRef,
  handleStoryGiftTap,
  handleStoryGiftPointerDown,
  handleStoryGiftPointerUp,
  finishStoryGiftPull,
  handleClosingGiftPointerDown,
  handleClosingGiftPointerUp,
  finishClosingGiftDrag,
}: GiftBoxModelProps) {
  const storyGiftHitAreaArgs: [number, number, number] = isMobileViewport ? [2.36, 1.54, 2.18] : [2, 1.1, 1.92];
  const storyGiftHitAreaPosition: [number, number, number] = isMobileViewport ? [0, 0.32, 0.08] : [0, 0.4, 0.04];
  const closingGiftHitAreaArgs: [number, number, number] = isMobileViewport ? [2.86, 3.06, 2.82] : [2.45, 2.35, 2.4];
  const closingGiftHitAreaPosition: [number, number, number] = isMobileViewport ? [0, 0.1, 0] : [0, 0.2, 0];
  const roundedSmoothness = isMobileViewport ? 2 : 4;
  const torusRadialSegments = isMobileViewport ? 8 : 12;
  const torusTubularSegments = isMobileViewport ? 18 : 24;
  const glowSphereSegments: [number, number] = isMobileViewport ? [16, 16] : [24, 24];

  return (
    <group ref={boxGroupRef}>
      <group position={[0, -0.25, 0]}>
        <RoundedBox args={[2.1, 1.68, 2.1]} radius={0.08} smoothness={roundedSmoothness}>
          <meshPhysicalMaterial color="#FFF8EE" transmission={0.82} thickness={1.4} roughness={0.08} metalness={0.05} ior={1.45} clearcoat={1} clearcoatRoughness={0.06} transparent opacity={0.5} envMapIntensity={3.2} attenuationColor="#F7E9D1" attenuationDistance={4} emissive="#C5A059" emissiveIntensity={0.12} iridescence={0.1} iridescenceIOR={1.25} sheen={0.22} sheenColor="#F8F4EE" />
        </RoundedBox>
        <RoundedBox args={[1.78, 0.92, 1.78]} radius={0.06} smoothness={roundedSmoothness} position={[0, -0.08, 0]}>
          <meshStandardMaterial color="#2A1912" roughness={0.9} metalness={0.05} />
        </RoundedBox>
        <RoundedBox args={[1.56, 0.52, 1.56]} radius={0.05} smoothness={roundedSmoothness} position={[0, 0.14, 0]}>
          <meshStandardMaterial color="#120D0A" roughness={0.96} metalness={0.02} />
        </RoundedBox>
        <group ref={insertCardRef} position={[0, -0.36, 0.02]}>
          <RoundedBox args={[1.22, 0.08, 1.02]} radius={0.03} smoothness={roundedSmoothness}>
            <meshStandardMaterial color="#C08C57" roughness={0.92} metalness={0.04} />
          </RoundedBox>
          <RoundedBox args={[1.08, 0.04, 0.86]} radius={0.04} smoothness={roundedSmoothness} position={[0, 0.055, 0]}>
            <meshPhysicalMaterial color="#FFF8EE" roughness={0.22} transmission={0.08} clearcoat={0.6} clearcoatRoughness={0.08} />
          </RoundedBox>
          <group position={[0, 0.085, 0]}>
            {[0.2, 0.08, -0.04, -0.16].map((zOffset, index) => (
              <Box key={zOffset} args={[index === 0 ? 0.62 : index === 1 ? 0.74 : index === 2 ? 0.68 : 0.56, 0.006, 0.028]} position={[0, 0, zOffset]}>
                <meshStandardMaterial color={step === 'story-gift' ? '#8B5E3C' : '#A6784D'} emissive={step === 'story-gift' ? '#E8D8BE' : '#000000'} emissiveIntensity={step === 'story-gift' ? 0.08 : 0} roughness={0.92} metalness={0.02} />
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
          <mesh position={storyGiftHitAreaPosition} onClick={handleStoryGiftTap} onPointerDown={handleStoryGiftPointerDown} onPointerUp={handleStoryGiftPointerUp} onPointerCancel={handleStoryGiftPointerUp} onPointerMissed={() => { finishStoryGiftPull(); }}>
            <boxGeometry args={storyGiftHitAreaArgs} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}
        {step === 'closing-gift' && (
          <mesh position={closingGiftHitAreaPosition} onPointerDown={handleClosingGiftPointerDown} onPointerUp={handleClosingGiftPointerUp} onPointerCancel={handleClosingGiftPointerUp} onPointerMissed={() => { finishClosingGiftDrag(false); }}>
            <boxGeometry args={closingGiftHitAreaArgs} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}
        <group>
          {verticalEdgePositions.map((pos, i) => (
            <Box key={`v-${i}`} args={[0.02, 1.69, 0.02]} position={[pos[0], 0.14, pos[2]]}>
              <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} emissive="#D4AF37" emissiveIntensity={0.3} />
            </Box>
          ))}
          <Box args={[2.12, 0.02, 0.02]} position={[0, -0.84, 1.05]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} /></Box>
          <Box args={[2.12, 0.02, 0.02]} position={[0, -0.84, -1.05]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} /></Box>
          <Box args={[0.02, 0.02, 2.12]} position={[1.05, -0.84, 0]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} /></Box>
          <Box args={[0.02, 0.02, 2.12]} position={[-1.05, -0.84, 0]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} /></Box>
        </group>
        <group position={[0, -0.44, 0]}>
          <RoundedBox args={[1.42, 0.28, 1.18]} radius={0.04} smoothness={roundedSmoothness}><meshStandardMaterial color="#3C241A" roughness={0.94} metalness={0.02} /></RoundedBox>
          <RoundedBox args={[1.28, 0.18, 1.02]} radius={0.04} smoothness={roundedSmoothness} position={[0, 0.12, 0]}><meshStandardMaterial color="#6E4A36" roughness={0.92} metalness={0.02} /></RoundedBox>
          <RoundedBox args={[0.92, 0.1, 0.62]} radius={0.03} smoothness={roundedSmoothness} position={[0, 0.23, -0.15]}><meshStandardMaterial color="#8A6147" roughness={0.9} metalness={0.02} /></RoundedBox>
          <RoundedBox args={[0.66, 0.08, 0.44]} radius={0.03} smoothness={roundedSmoothness} position={[-0.14, 0.31, 0.22]}><meshStandardMaterial color="#4E3327" roughness={0.94} metalness={0.02} /></RoundedBox>
        </group>
        {step === 'story-gift' && <pointLight ref={storyGiftGlowRef} position={[0, 0.42, 0.12]} intensity={1.6} color="#F6E6C8" distance={2.8} decay={2} />}
      </group>
      {step === 'ready' && (
        <group position={[0, -0.25, 0]}>
          <Sphere args={[0.9, glowSphereSegments[0], glowSphereSegments[1]]}><meshBasicMaterial color="#C5A059" transparent opacity={0.08} /></Sphere>
          <pointLight intensity={5.8} color="#C5A059" distance={6} decay={2} />
          <Sparkles count={4} scale={1.5} size={1.5} speed={0.34} color="#C5A059" opacity={0.2} />
        </group>
      )}
      <group ref={lidGroupRef} position={[0, 0.45, -1.05]}>
        <RoundedBox args={[2.2, 0.3, 2.2]} radius={0.08} smoothness={roundedSmoothness} position={[0, 0.15, 1.05]}>
          <meshPhysicalMaterial color="#FDFBF7" metalness={0.1} roughness={0.08} clearcoat={0.8} clearcoatRoughness={0.1} envMapIntensity={3} transmission={0.1} thickness={0.5} ior={1.4} sheen={1} sheenColor="#FFF" sheenRoughness={0.1} />
        </RoundedBox>
        <group position={[0, 0.15, 1.05]}>
          <Box args={[0.04, 0.34, 2.22]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} emissive="#D4AF37" emissiveIntensity={0.5} /></Box>
          <Box args={[2.22, 0.34, 0.04]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} emissive="#D4AF37" emissiveIntensity={0.5} /></Box>
          {cornerPositions.map((pos, i) => (
            <group key={`corner-${i}`} position={pos}>
              <Box args={[0.15, 0.35, 0.02]} position={[pos[0] > 0 ? -0.065 : 0.065, 0, 0]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} /></Box>
              <Box args={[0.02, 0.35, 0.15]} position={[0, 0, pos[2] > 0 ? -0.065 : 0.065]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} /></Box>
            </group>
          ))}
          <Box args={[2.26, 0.05, 2.26]} position={[0, 0.17, 0]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} /></Box>
          <Box args={[2.26, 0.05, 2.26]} position={[0, -0.17, 0]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} /></Box>
          <group position={[0, 0.19, 0]} rotation={[0, Math.PI / 4, 0]}>
            <Box args={[0.4, 0.06, 0.4]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} emissive="#D4AF37" emissiveIntensity={0.5} /></Box>
            <Box args={[0.25, 0.1, 0.25]} rotation={[0, -Math.PI / 4, 0]}><meshPhysicalMaterial color="#F8F4EE" metalness={0.4} roughness={0.05} clearcoat={0.5} /></Box>
          </group>
          <group position={[0, 0.36, 0]}>
            <Torus args={[0.2, 0.035, torusRadialSegments, torusTubularSegments]} rotation={[Math.PI / 2.2, 0, Math.PI / 4]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.08} /></Torus>
            <Torus args={[0.2, 0.035, torusRadialSegments, torusTubularSegments]} rotation={[Math.PI / 2.2, 0, -Math.PI / 4]}><meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.08} /></Torus>
          </group>
        </group>
      </group>
    </group>
  );
});
