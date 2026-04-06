import React, { memo } from 'react';
import { Box, RoundedBox, Sphere, Torus } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { BirthdayStep, StoryGiftPhase } from '../types/birthday';

interface GiftBoxModelProps {
  step: BirthdayStep;
  isMobileViewport: boolean;
  verticalEdgePositions: [number, number, number][];
  cornerPositions: [number, number, number][];
  boxGroupRef: React.RefObject<THREE.Group | null>;
  lidGroupRef: React.RefObject<THREE.Group | null>;
  insertCardRef: React.RefObject<THREE.Group | null>;
  storyGiftGlowRef: React.RefObject<THREE.PointLight | null>;
  storyGiftPhase: StoryGiftPhase;
  handleStoryGiftTap: (event: ThreeEvent<MouseEvent>) => void;
  handleStoryGiftConfirmClick: (event: ThreeEvent<MouseEvent | PointerEvent>) => void;
  handleStoryGiftPointerDown: (event: ThreeEvent<PointerEvent>) => void;
  handleStoryGiftPointerUp: (event: ThreeEvent<PointerEvent>) => void;
  finishStoryGiftPull: () => void;
  handleBridgeGiftPointerDown: (event: ThreeEvent<PointerEvent>) => void;
  handleBridgeGiftPointerUp: (event: ThreeEvent<PointerEvent>) => void;
  finishBridgeGiftDrag: () => void;
  handleClosingGiftPointerDown: (event: ThreeEvent<PointerEvent>) => void;
  handleClosingGiftPointerUp: (event: ThreeEvent<PointerEvent>) => void;
  finishClosingGiftDrag: (allowTap?: boolean) => void;
}

const dreamyPearlMaterial = {
  color: '#FFF8F6',
  roughness: 0.14,
  metalness: 0.08,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  sheen: 0.85,
  sheenColor: '#FFF6FB',
  iridescence: 0.2,
  iridescenceIOR: 1.2,
  emissive: '#E8D1F4',
  emissiveIntensity: 0.07,
};

const champagneMaterial = {
  color: '#E3C37A',
  metalness: 0.95,
  roughness: 0.22,
  emissive: '#B98B34',
  emissiveIntensity: 0.18,
};

const bambooWalletMaterial = {
  color: '#5E8960',
  roughness: 0.5,
  metalness: 0.08,
  clearcoat: 0.38,
  clearcoatRoughness: 0.22,
  emissive: '#29422C',
  emissiveIntensity: 0.08,
};

export const GiftBoxModel = memo(function GiftBoxModel({
  step,
  isMobileViewport,
  verticalEdgePositions,
  cornerPositions,
  boxGroupRef,
  lidGroupRef,
  insertCardRef,
  storyGiftGlowRef,
  storyGiftPhase,
  handleStoryGiftTap,
  handleStoryGiftConfirmClick,
  handleStoryGiftPointerDown,
  handleStoryGiftPointerUp,
  finishStoryGiftPull,
  handleBridgeGiftPointerDown,
  handleBridgeGiftPointerUp,
  finishBridgeGiftDrag,
  handleClosingGiftPointerDown,
  handleClosingGiftPointerUp,
  finishClosingGiftDrag,
}: GiftBoxModelProps) {
  const storyGiftOpening = storyGiftPhase === 'opening';
  const storyGiftWalletFocused = storyGiftPhase === 'wallet-focus';
  const storyGiftOpened = storyGiftPhase !== 'idle';
  const storyGiftHitAreaArgs: [number, number, number] = isMobileViewport ? [2.36, 1.54, 2.18] : [2, 1.1, 1.92];
  const storyGiftHitAreaPosition: [number, number, number] = isMobileViewport ? [0, 0.32, 0.08] : [0, 0.4, 0.04];
  const bridgeGiftHitAreaArgs: [number, number, number] = isMobileViewport ? [2.58, 2.12, 2.42] : [2.18, 1.84, 2.16];
  const bridgeGiftHitAreaPosition: [number, number, number] = isMobileViewport ? [0, 0.14, 0.04] : [0, 0.18, 0.02];
  const closingGiftHitAreaArgs: [number, number, number] = isMobileViewport ? [2.86, 3.06, 2.82] : [2.45, 2.35, 2.4];
  const closingGiftHitAreaPosition: [number, number, number] = isMobileViewport ? [0, 0.1, 0] : [0, 0.2, 0];
  const roundedSmoothness = isMobileViewport ? 2 : 4;
  const torusRadialSegments = isMobileViewport ? 8 : 12;
  const torusTubularSegments = isMobileViewport ? 18 : 28;
  const glowSphereSegments: [number, number] = isMobileViewport ? [18, 18] : [28, 28];
  const ribbonOpacity = step === 'story-gift' ? (storyGiftWalletFocused ? 0.16 : 0.38) : step === 'closing-gift' ? 0.54 : 0.92;
  const boxShellOpacity = storyGiftWalletFocused ? 0.22 : 0.96;
  const boxShellTransmission = storyGiftWalletFocused ? 0.82 : 0.36;
  const lidShellOpacity = storyGiftWalletFocused ? 0.18 : 0.52;
  const lidShellTransmission = storyGiftWalletFocused ? 0.88 : 0.6;

  return (
    <group ref={boxGroupRef}>
      <group position={[0, -0.25, 0]}>
        <Sphere args={[1.72, glowSphereSegments[0], glowSphereSegments[1]]} position={[0, 0.08, 0]}>
          <meshBasicMaterial color="#F4D5FF" transparent opacity={0.05} />
        </Sphere>
        <group>
          <RoundedBox args={[2.12, 0.14, 2.12]} radius={0.08} smoothness={roundedSmoothness} position={[0, -0.79, 0]}>
            <meshPhysicalMaterial
              {...dreamyPearlMaterial}
              transmission={boxShellTransmission}
              thickness={0.8}
              ior={1.4}
              attenuationColor="#F8DFF3"
              attenuationDistance={3.2}
              transparent
              opacity={boxShellOpacity}
            />
          </RoundedBox>
          <RoundedBox args={[2.12, 1.58, 0.14]} radius={0.08} smoothness={roundedSmoothness} position={[0, -0.05, -0.99]}>
            <meshPhysicalMaterial
              {...dreamyPearlMaterial}
              transmission={boxShellTransmission}
              thickness={0.74}
              ior={1.4}
              attenuationColor="#F8DFF3"
              attenuationDistance={3.2}
              transparent
              opacity={boxShellOpacity}
            />
          </RoundedBox>
          <RoundedBox args={[0.14, 1.58, 1.84]} radius={0.08} smoothness={roundedSmoothness} position={[0.99, -0.05, 0]}>
            <meshPhysicalMaterial
              {...dreamyPearlMaterial}
              transmission={boxShellTransmission}
              thickness={0.74}
              ior={1.4}
              attenuationColor="#F8DFF3"
              attenuationDistance={3.2}
              transparent
              opacity={boxShellOpacity}
            />
          </RoundedBox>
          <RoundedBox args={[0.14, 1.58, 1.84]} radius={0.08} smoothness={roundedSmoothness} position={[-0.99, -0.05, 0]}>
            <meshPhysicalMaterial
              {...dreamyPearlMaterial}
              transmission={boxShellTransmission}
              thickness={0.74}
              ior={1.4}
              attenuationColor="#F8DFF3"
              attenuationDistance={3.2}
              transparent
              opacity={boxShellOpacity}
            />
          </RoundedBox>
        </group>
        <RoundedBox args={[1.82, 1.08, 1.82]} radius={0.07} smoothness={roundedSmoothness} position={[0, -0.05, 0]}>
          <meshStandardMaterial color="#4A2540" roughness={0.82} metalness={0.08} emissive="#21101D" emissiveIntensity={0.22} />
        </RoundedBox>
        <RoundedBox args={[1.94, 1.34, 1.94]} radius={0.08} smoothness={roundedSmoothness} position={[0, -0.02, 0]}>
          <meshPhysicalMaterial color="#F8E9F3" roughness={0.34} metalness={0.12} clearcoat={0.84} clearcoatRoughness={0.18} transparent opacity={0.18} />
        </RoundedBox>
        <group position={[0, -0.02, 0]}>
          <Box args={[1.96, 0.05, 0.08]} position={[0, 0.66, -0.96]}><meshPhysicalMaterial {...champagneMaterial} emissiveIntensity={0.12} /></Box>
          <Box args={[0.08, 0.05, 1.96]} position={[0.96, 0.66, 0]}><meshPhysicalMaterial {...champagneMaterial} emissiveIntensity={0.12} /></Box>
          <Box args={[0.08, 0.05, 1.96]} position={[-0.96, 0.66, 0]}><meshPhysicalMaterial {...champagneMaterial} emissiveIntensity={0.12} /></Box>
        </group>
        <group position={[0, 0.02, 0]}>
          <Box args={[1.54, 0.48, 0.08]} position={[0, 0.18, -0.77]}>
            <meshPhysicalMaterial color="#F7E4F0" roughness={0.34} metalness={0.03} sheen={0.56} sheenColor="#FFF0FA" />
          </Box>
          <Box args={[0.08, 0.48, 1.54]} position={[0.77, 0.18, 0]}>
            <meshPhysicalMaterial color="#F7E4F0" roughness={0.34} metalness={0.03} sheen={0.56} sheenColor="#FFF0FA" />
          </Box>
          <Box args={[0.08, 0.48, 1.54]} position={[-0.77, 0.18, 0]}>
            <meshPhysicalMaterial color="#F7E4F0" roughness={0.34} metalness={0.03} sheen={0.56} sheenColor="#FFF0FA" />
          </Box>
          <RoundedBox args={[1.24, 0.035, 1.24]} radius={0.03} smoothness={roundedSmoothness} position={[0, 0.38, 0]}>
            <meshStandardMaterial color="#6A3759" roughness={0.74} metalness={0.04} emissive="#B480A7" emissiveIntensity={0.08} />
          </RoundedBox>
        </group>

        <group position={[0, 0.04, 0]}>
          <RoundedBox args={[1.86, 0.16, 0.26]} radius={0.04} smoothness={roundedSmoothness}>
            <meshPhysicalMaterial color="#F5DFB2" metalness={0.6} roughness={0.18} clearcoat={0.5} emissive="#D9B366" emissiveIntensity={0.16} transparent opacity={ribbonOpacity} />
          </RoundedBox>
          <RoundedBox args={[0.26, 0.16, 1.86]} radius={0.04} smoothness={roundedSmoothness}>
            <meshPhysicalMaterial color="#F5DFB2" metalness={0.6} roughness={0.18} clearcoat={0.5} emissive="#D9B366" emissiveIntensity={0.16} transparent opacity={ribbonOpacity} />
          </RoundedBox>
          <group position={[0, 0.12, 0]}>
            <Torus args={[0.23, 0.05, torusRadialSegments, torusTubularSegments]} rotation={[Math.PI / 2.8, 0, Math.PI / 3.5]}>
              <meshPhysicalMaterial color="#FFE7B8" metalness={0.72} roughness={0.16} clearcoat={0.6} transparent opacity={ribbonOpacity} />
            </Torus>
            <Torus args={[0.23, 0.05, torusRadialSegments, torusTubularSegments]} rotation={[Math.PI / 2.8, 0, -Math.PI / 3.5]}>
              <meshPhysicalMaterial color="#FFE7B8" metalness={0.72} roughness={0.16} clearcoat={0.6} transparent opacity={ribbonOpacity} />
            </Torus>
            <Sphere args={[0.11, torusRadialSegments + 4, torusRadialSegments + 4]} position={[0, -0.01, 0]}>
              <meshPhysicalMaterial color="#FFF2D3" metalness={0.42} roughness={0.12} emissive="#F5D793" emissiveIntensity={0.18} transparent opacity={ribbonOpacity} />
            </Sphere>
          </group>
        </group>

        <group ref={insertCardRef} position={[0, -0.22, 0.18]}>
          <RoundedBox args={[1.18, 0.12, 0.82]} radius={0.08} smoothness={roundedSmoothness}>
            <meshPhysicalMaterial {...bambooWalletMaterial} />
          </RoundedBox>
          <RoundedBox args={[1.06, 0.05, 0.72]} radius={0.06} smoothness={roundedSmoothness} position={[0, 0.055, 0.02]}>
            <meshPhysicalMaterial color="#719C6C" roughness={0.44} metalness={0.06} clearcoat={0.28} clearcoatRoughness={0.24} />
          </RoundedBox>
          <Box args={[1.08, 0.014, 0.05]} position={[0, 0.05, 0.38]}>
            <meshPhysicalMaterial color="#E5C47A" metalness={0.72} roughness={0.18} emissive="#A77A29" emissiveIntensity={0.14} />
          </Box>
          <Box args={[0.3, 0.03, 0.08]} position={[0, 0.08, 0.4]}>
            <meshPhysicalMaterial color="#F3D892" metalness={0.66} roughness={0.16} emissive="#C0923F" emissiveIntensity={0.16} />
          </Box>
          <group position={[0, 0.09, 0.08]}>
            {[-0.22, -0.07, 0.08, 0.23].map((xOffset) => (
              <Box key={xOffset} args={[0.02, 0.008, 0.62]} position={[xOffset, 0, 0]}>
                <meshStandardMaterial color="#446B45" roughness={0.72} metalness={0.02} />
              </Box>
            ))}
          </group>
          <group position={[-0.38, 0.09, -0.16]}>
            <Torus args={[0.06, 0.012, torusRadialSegments, torusTubularSegments]} rotation={[Math.PI / 2, 0, 0]}>
              <meshPhysicalMaterial color="#DFC27B" metalness={0.85} roughness={0.16} />
            </Torus>
          </group>
        </group>

        {step === 'story-gift' && !storyGiftOpened && (
          <mesh
            position={storyGiftHitAreaPosition}
            onClick={handleStoryGiftTap}
            onPointerDown={handleStoryGiftPointerDown}
            onPointerUp={handleStoryGiftPointerUp}
            onPointerCancel={handleStoryGiftPointerUp}
            onPointerMissed={() => {
              finishStoryGiftPull();
            }}
          >
            <boxGeometry args={storyGiftHitAreaArgs} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}
        {step === 'story-gift' && storyGiftWalletFocused && (
          <mesh
            position={isMobileViewport ? [0, 0.04, 0.34] : [0, 0.04, 0.28]}
            onClick={handleStoryGiftConfirmClick}
            onPointerUp={handleStoryGiftConfirmClick}
          >
            <boxGeometry args={storyGiftWalletFocused ? [1.46, 0.7, 1.04] : [1.32, 0.58, 0.96]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}
        {step === 'opening-bridge' && (
          <mesh
            position={bridgeGiftHitAreaPosition}
            onPointerDown={handleBridgeGiftPointerDown}
            onPointerUp={handleBridgeGiftPointerUp}
            onPointerCancel={handleBridgeGiftPointerUp}
            onPointerMissed={() => {
              finishBridgeGiftDrag();
            }}
          >
            <boxGeometry args={bridgeGiftHitAreaArgs} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}
        {step === 'closing-gift' && (
          <mesh
            position={closingGiftHitAreaPosition}
            onPointerDown={handleClosingGiftPointerDown}
            onPointerUp={handleClosingGiftPointerUp}
            onPointerCancel={handleClosingGiftPointerUp}
            onPointerMissed={() => {
              finishClosingGiftDrag(false);
            }}
          >
            <boxGeometry args={closingGiftHitAreaArgs} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        )}

        <group>
          {verticalEdgePositions.map((pos, i) => (
            <Box key={`v-${i}`} args={[0.03, 1.72, 0.03]} position={[pos[0], 0, pos[2]]}>
              <meshPhysicalMaterial {...champagneMaterial} />
            </Box>
          ))}
          <Box args={[2.15, 0.04, 0.04]} position={[0, -0.86, 1.05]}><meshPhysicalMaterial {...champagneMaterial} /></Box>
          <Box args={[2.15, 0.04, 0.04]} position={[0, -0.86, -1.05]}><meshPhysicalMaterial {...champagneMaterial} /></Box>
          <Box args={[0.04, 0.04, 2.15]} position={[1.05, -0.86, 0]}><meshPhysicalMaterial {...champagneMaterial} /></Box>
          <Box args={[0.04, 0.04, 2.15]} position={[-1.05, -0.86, 0]}><meshPhysicalMaterial {...champagneMaterial} /></Box>
          {cornerPositions.map((pos, i) => (
            <group key={`pedestal-${i}`} position={[pos[0] * 0.94, -0.73, pos[2] * 0.94]}>
              <Box args={[0.18, 0.12, 0.05]} rotation={[0, Math.PI / 4, 0]}><meshPhysicalMaterial {...champagneMaterial} emissiveIntensity={0.12} /></Box>
              <Box args={[0.05, 0.12, 0.18]} rotation={[0, Math.PI / 4, 0]}><meshPhysicalMaterial {...champagneMaterial} emissiveIntensity={0.12} /></Box>
            </group>
          ))}
          <group position={[0, 0.12, 1.07]}>
            <Box args={[1.34, 0.06, 0.05]}><meshPhysicalMaterial {...champagneMaterial} emissiveIntensity={0.12} /></Box>
            <Box args={[0.42, 0.12, 0.06]} position={[0, 0.08, 0]}><meshPhysicalMaterial color="#F0D496" metalness={0.82} roughness={0.18} emissive="#C09345" emissiveIntensity={0.14} /></Box>
            <Torus args={[0.13, 0.022, torusRadialSegments, torusTubularSegments]} rotation={[0, 0, Math.PI / 2]}>
              <meshPhysicalMaterial color="#E7CC87" metalness={0.82} roughness={0.16} />
            </Torus>
          </group>
        </group>

        <group position={[0, -0.52, 0]}>
          <RoundedBox args={[1.52, 0.16, 1.28]} radius={0.05} smoothness={roundedSmoothness} position={[0, -0.11, 0]}>
            <meshStandardMaterial color="#4B273E" roughness={0.9} metalness={0.03} />
          </RoundedBox>
          <RoundedBox args={[1.28, 0.07, 1.04]} radius={0.045} smoothness={roundedSmoothness} position={[0, -0.03, 0]}>
            <meshPhysicalMaterial color="#F1D9B2" roughness={0.42} metalness={0.08} clearcoat={0.24} emissive="#A86F54" emissiveIntensity={0.05} />
          </RoundedBox>
          <RoundedBox args={[1.36, 0.34, 0.12]} radius={0.04} smoothness={roundedSmoothness} position={[0, 0.09, 0.46]}>
            <meshStandardMaterial color="#59324A" roughness={0.86} metalness={0.03} />
          </RoundedBox>
          <RoundedBox args={[1.36, 0.34, 0.12]} radius={0.04} smoothness={roundedSmoothness} position={[0, 0.09, -0.46]}>
            <meshStandardMaterial color="#59324A" roughness={0.86} metalness={0.03} />
          </RoundedBox>
          <RoundedBox args={[0.12, 0.34, 0.92]} radius={0.04} smoothness={roundedSmoothness} position={[0.62, 0.09, 0]}>
            <meshStandardMaterial color="#59324A" roughness={0.86} metalness={0.03} />
          </RoundedBox>
          <RoundedBox args={[0.12, 0.34, 0.92]} radius={0.04} smoothness={roundedSmoothness} position={[-0.62, 0.09, 0]}>
            <meshStandardMaterial color="#59324A" roughness={0.86} metalness={0.03} />
          </RoundedBox>
          <RoundedBox args={[1.1, 0.04, 0.86]} radius={0.03} smoothness={roundedSmoothness} position={[0, 0.16, 0]}>
            <meshPhysicalMaterial color="#7B4A66" roughness={0.8} metalness={0.03} sheen={0.5} sheenColor="#E8C8D8" />
          </RoundedBox>
          <RoundedBox args={[0.92, 0.02, 0.68]} radius={0.025} smoothness={roundedSmoothness} position={[0, 0.18, 0]}>
            <meshPhysicalMaterial color="#EBC98F" roughness={0.36} metalness={0.12} clearcoat={0.28} />
          </RoundedBox>
        </group>

        {step === 'story-gift' && <pointLight ref={storyGiftGlowRef} position={[0, 0.48, 0.12]} intensity={1.8} color="#FFE9FA" distance={3.2} decay={2} />}
      </group>

      {step === 'ready' && (
        <group position={[0, -0.22, 0]}>
          <Sphere args={[1.05, glowSphereSegments[0], glowSphereSegments[1]]}>
            <meshBasicMaterial color="#F7BFFF" transparent opacity={0.09} />
          </Sphere>
          <pointLight intensity={6.4} color="#F2C3FF" distance={6.4} decay={2} />
        </group>
      )}

      <group ref={lidGroupRef} position={[0, 0.48, -1.08]}>
        <group position={[0, 0.14, 1.08]}>
          <RoundedBox args={[2.22, 0.34, 2.22]} radius={0.09} smoothness={roundedSmoothness}>
            <meshPhysicalMaterial
              {...dreamyPearlMaterial}
              transmission={lidShellTransmission}
              thickness={0.32}
              ior={1.38}
              attenuationColor="#FBE9F8"
              attenuationDistance={3}
              transparent
              opacity={lidShellOpacity}
            />
          </RoundedBox>
          <group position={[0, -0.08, 0]}>
            <Box args={[1.76, 0.06, 0.08]} position={[0, 0, 0.84]}>
              <meshPhysicalMaterial color="#F3D4E5" roughness={0.26} metalness={0.03} sheen={0.72} sheenColor="#FFF4FB" transparent opacity={0.74} />
            </Box>
            <Box args={[1.76, 0.06, 0.08]} position={[0, 0, -0.84]}>
              <meshPhysicalMaterial color="#F3D4E5" roughness={0.26} metalness={0.03} sheen={0.72} sheenColor="#FFF4FB" transparent opacity={0.74} />
            </Box>
            <Box args={[0.08, 0.06, 1.76]} position={[0.84, 0, 0]}>
              <meshPhysicalMaterial color="#F3D4E5" roughness={0.26} metalness={0.03} sheen={0.72} sheenColor="#FFF4FB" transparent opacity={0.74} />
            </Box>
            <Box args={[0.08, 0.06, 1.76]} position={[-0.84, 0, 0]}>
              <meshPhysicalMaterial color="#F3D4E5" roughness={0.26} metalness={0.03} sheen={0.72} sheenColor="#FFF4FB" transparent opacity={0.74} />
            </Box>
          </group>
          <group position={[0, 0.05, 0]}>
            <Box args={[1.94, 0.04, 0.06]} position={[0, 0.14, 0.94]}><meshPhysicalMaterial {...champagneMaterial} emissiveIntensity={0.1} /></Box>
            <Box args={[1.94, 0.04, 0.06]} position={[0, 0.14, -0.94]}><meshPhysicalMaterial {...champagneMaterial} emissiveIntensity={0.1} /></Box>
            <Box args={[0.06, 0.04, 1.94]} position={[0.94, 0.14, 0]}><meshPhysicalMaterial {...champagneMaterial} emissiveIntensity={0.1} /></Box>
            <Box args={[0.06, 0.04, 1.94]} position={[-0.94, 0.14, 0]}><meshPhysicalMaterial {...champagneMaterial} emissiveIntensity={0.1} /></Box>
          </group>
          <RoundedBox args={[1.92, 0.08, 0.24]} radius={0.04} smoothness={roundedSmoothness}>
            <meshPhysicalMaterial color="#F8E4BA" metalness={0.68} roughness={0.18} clearcoat={0.4} transparent opacity={ribbonOpacity} />
          </RoundedBox>
          <RoundedBox args={[0.24, 0.08, 1.92]} radius={0.04} smoothness={roundedSmoothness}>
            <meshPhysicalMaterial color="#F8E4BA" metalness={0.68} roughness={0.18} clearcoat={0.4} transparent opacity={ribbonOpacity} />
          </RoundedBox>
          <group position={[0, 0.19, 0]}>
            {cornerPositions.map((pos, i) => (
              <group key={`corner-${i}`} position={pos}>
                <Box args={[0.16, 0.36, 0.03]} position={[pos[0] > 0 ? -0.07 : 0.07, 0, 0]}>
                  <meshPhysicalMaterial {...champagneMaterial} />
                </Box>
                <Box args={[0.03, 0.36, 0.16]} position={[0, 0, pos[2] > 0 ? -0.07 : 0.07]}>
                  <meshPhysicalMaterial {...champagneMaterial} />
                </Box>
              </group>
            ))}
            <Box args={[2.28, 0.05, 2.28]} position={[0, 0.18, 0]}><meshPhysicalMaterial {...champagneMaterial} /></Box>
            <Box args={[2.28, 0.05, 2.28]} position={[0, -0.18, 0]}><meshPhysicalMaterial {...champagneMaterial} emissiveIntensity={0.12} /></Box>
          </group>
          <group position={[0, 0.34, 0]}>
            <Torus args={[0.28, 0.045, torusRadialSegments, torusTubularSegments]} rotation={[Math.PI / 2.15, 0, Math.PI / 3.4]}>
              <meshPhysicalMaterial color="#FFE7B8" metalness={0.8} roughness={0.14} clearcoat={0.75} transparent opacity={ribbonOpacity} />
            </Torus>
            <Torus args={[0.28, 0.045, torusRadialSegments, torusTubularSegments]} rotation={[Math.PI / 2.15, 0, -Math.PI / 3.4]}>
              <meshPhysicalMaterial color="#FFE7B8" metalness={0.8} roughness={0.14} clearcoat={0.75} transparent opacity={ribbonOpacity} />
            </Torus>
            <Box args={[0.14, 0.12, 0.14]} position={[0, -0.02, 0]}>
              <meshPhysicalMaterial color="#FFF0CB" metalness={0.42} roughness={0.1} emissive="#F5D793" emissiveIntensity={0.18} transparent opacity={ribbonOpacity} />
            </Box>
          </group>
          <group position={[0, 0.31, 0]}>
            <Box args={[0.09, 0.34, 0.09]} rotation={[0, 0, Math.PI / 6]}>
              <meshPhysicalMaterial color="#F7D9F2" metalness={0.34} roughness={0.16} clearcoat={0.72} emissive="#E7BDE3" emissiveIntensity={0.16} />
            </Box>
          </group>
          <group position={[0, 0.09, 1.08]}>
            <Box args={[0.48, 0.12, 0.04]}><meshPhysicalMaterial color="#EDD08A" metalness={0.78} roughness={0.16} /></Box>
            <Box args={[0.16, 0.16, 0.05]} position={[0, 0.08, 0]}><meshPhysicalMaterial color="#FFF0CB" metalness={0.56} roughness={0.14} emissive="#D6A24E" emissiveIntensity={0.18} /></Box>
          </group>
        </group>
      </group>
    </group>
  );
});
