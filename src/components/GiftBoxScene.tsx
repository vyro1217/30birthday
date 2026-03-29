import React, { useRef, useState, useEffect, memo, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Box, useCursor, Float, Environment, Stars, Sphere, Sparkles, OrbitControls, Preload } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { BirthdayStep } from '../types/birthday';

interface GiftBoxProps {
  step: BirthdayStep;
  onOpen: () => void;
}

export const GiftBoxScene = memo(function GiftBoxScene({ step, onOpen }: GiftBoxProps) {
  const groupRef = useRef<THREE.Group>(null);
  const boxGroupRef = useRef<THREE.Group>(null);
  const lidGroupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  const tracksRef = useRef<THREE.Group>(null);
  const timelineGroupRef = useRef<THREE.Group>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && step === 'ready');

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

  const textSteps = useMemo(
    () => ['node-before', 'node-us', 'memory-1', 'memory-2', 'memory-3', 'node-now', 'title', 'message', 'message2', 'final'],
    [],
  );

    // Slow, gentle rotations
    useFrame((state) => {
      const t = state.clock.getElapsedTime();
      if (pointLightRef.current) {
        // Shift intensity and position slightly
        pointLightRef.current.intensity = 4 + Math.sin(t * 0.5) * 1.5;
        pointLightRef.current.position.x = Math.sin(t * 0.3) * 2;
        pointLightRef.current.position.y = 1 + Math.cos(t * 0.4) * 0.5;
      }
      
      // Rotate core and tracks
      if (coreRef.current) {
        coreRef.current.rotation.y += 0.01;
      }
      if (tracksRef.current) {
        tracksRef.current.rotation.y += 0.002;
      }

      // Subtle rotation for the box base
      if (boxGroupRef.current && step === 'ready') {
        boxGroupRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
      }
    });

  useEffect(() => {
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

    // Move box to the side when text steps are active
    const isTextStep = textSteps.includes(step);
    const isMobile = window.innerWidth < 768;

    if (isTextStep && groupRef.current) {
      gsap.to(groupRef.current.position, {
        x: isMobile ? 0 : 2.8,
        y: isMobile ? -2.2 : -1.2,
        z: isMobile ? -2 : -1,
        duration: 2,
        ease: 'power3.inOut'
      });
      gsap.to(groupRef.current.scale, {
        x: isMobile ? 0.3 : 0.4,
        y: isMobile ? 0.3 : 0.4,
        z: isMobile ? 0.3 : 0.4,
        duration: 2,
        ease: 'power3.inOut'
      });
    } else if (step === 'ready' && groupRef.current) {
      gsap.to(groupRef.current.position, { x: 0, y: 0, z: 0, duration: 1.5 });
      gsap.to(groupRef.current.scale, { x: 1, y: 1, z: 1, duration: 1.5 });
    }

    // Move and scale timeline elements when text is active
    if (isTextStep && timelineGroupRef.current) {
      gsap.to(timelineGroupRef.current.position, {
        x: isMobile ? 0 : -2.2,
        y: isMobile ? 2.0 : 0.5,
        z: isMobile ? -3 : -2,
        duration: 2,
        ease: 'power3.inOut'
      });
      gsap.to(timelineGroupRef.current.scale, {
        x: isMobile ? 0.5 : 0.7,
        y: isMobile ? 0.5 : 0.7,
        z: isMobile ? 0.5 : 0.7,
        duration: 2,
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
  }, [step]);

  const handleInteraction = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (step === 'ready') {
      // Scale pop effect
      if (groupRef.current) {
        gsap.to(groupRef.current.scale, {
          x: 1.15,
          y: 1.15,
          z: 1.15,
          duration: 0.15,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
        });
      }
      onOpen();
    }
  };

  const isTimelineActive = step === 'cosmic-core' || step === 'timeline-expand' || textSteps.includes(step);

  return (
    <>
      <OrbitControls 
        enablePan={false} 
        enableRotate={false}
        enableZoom={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.5}
        autoRotate={step === 'ready' || isTimelineActive}
        autoRotateSpeed={step === 'ready' ? 0.4 : 0.2}
        makeDefault
      />
      
      <ambientLight intensity={0.72} />
      <directionalLight position={[5, 5, 5]} intensity={1.25} />
      <pointLight ref={pointLightRef} position={[0, 2, 4]} intensity={2.6} color="#F8F4EE" />
      
      <fog attach="fog" args={['#05050A', 5, 25]} />
      
      {/* Layered Starry Sky - More subtle */}
      <Stars radius={100} depth={50} count={900} factor={2} saturation={0} fade speed={0.08} />
      <Stars radius={150} depth={50} count={180} factor={3} saturation={0.15} fade speed={0.2} />
      
      {/* Nebula Glow Effect - Deeper and more subtle */}
      <Sphere args={[60, 16, 16]} scale={[-1, 1, 1]}>
        <meshBasicMaterial 
          color="#05050A" 
          side={THREE.BackSide} 
          transparent 
          opacity={0.5} 
        />
      </Sphere>
      
      {/* Gentle floating light particles */}
      <Sparkles count={42} scale={15} size={1.2} speed={0.16} opacity={0.28} color="#D8C4A8" />
      
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.6}>
        <group 
          ref={groupRef} 
          onPointerDown={handleInteraction} 
          onPointerOver={() => setHovered(true)} 
          onPointerOut={() => setHovered(false)}
        >
          <group ref={boxGroupRef}>
            {/* Box Base - Luxurious Polished Crystal with Iridescence & Gold Frame */}
            <group position={[0, -0.25, 0]}>
              <Box args={[2.1, 1.4, 2.1]}>
                <meshPhysicalMaterial 
                  color="#FFFFFF"
                  transmission={1}
                  thickness={2}
                  roughness={0.02}
                  metalness={0.02}
                  ior={1.45} 
                  clearcoat={1}
                  clearcoatRoughness={0}
                  transparent
                  opacity={0.3}
                  envMapIntensity={5}
                  attenuationColor="#F8F4EE"
                  attenuationDistance={4}
                  emissive="#C5A059"
                  emissiveIntensity={0.2} 
                  iridescence={0.3}
                  iridescenceIOR={1.3}
                  sheen={0.5}
                  sheenColor="#F8F4EE"
                />
              </Box>
              
              {/* Gold Wireframe/Edge Accents for the Base */}
              <group>
                {/* Vertical Edges */}
                {verticalEdgePositions.map((pos, i) => (
                  <Box key={`v-${i}`} args={[0.02, 1.41, 0.02]} position={pos}>
                    <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} emissive="#D4AF37" emissiveIntensity={0.3} />
                  </Box>
                ))}
                {/* Horizontal Edges - Bottom */}
                <Box args={[2.12, 0.02, 0.02]} position={[0, -0.7, 1.05]}>
                  <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                </Box>
                <Box args={[2.12, 0.02, 0.02]} position={[0, -0.7, -1.05]}>
                  <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                </Box>
                <Box args={[0.02, 0.02, 2.12]} position={[1.05, -0.7, 0]}>
                  <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                </Box>
                <Box args={[0.02, 0.02, 2.12]} position={[-1.05, -0.7, 0]}>
                  <meshPhysicalMaterial color="#D4AF37" metalness={1} roughness={0.05} />
                </Box>
              </group>
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
                <pointLight intensity={8} color="#C5A059" distance={8} decay={2} />
                <Sparkles count={20} scale={2} size={3} speed={0.8} color="#C5A059" opacity={0.45} />
              </group>
            )}
            
            {/* Box Lid Group (for pivoting) */}
            <group ref={lidGroupRef} position={[0, 0.45, -1.05]}>
              <Box args={[2.2, 0.3, 2.2]} position={[0, 0.15, 1.05]}>
                <meshPhysicalMaterial 
                  color="#FDFBF7" 
                  metalness={0.1}
                  roughness={0.05}
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
              </Box>
              
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
              <Sphere args={[0.4, 24, 24]}>
                <meshStandardMaterial 
                  color="#D8C4A8" 
                  transparent 
                  opacity={0.15}
                  emissive="#D8C4A8"
                  emissiveIntensity={2}
                />
              </Sphere>
              <pointLight intensity={4} color="#F8F4EE" distance={10} decay={2} />
              <Sparkles count={10} scale={2} size={1} speed={0.22} color="#F8F4EE" opacity={0.18} />
            </group>

            {/* Timeline Tracks & Nodes - Ultra-thin lines */}
            <group ref={tracksRef} position={[0, 1.5, 0]}>
              {/* Node 1: Before (Top Left) */}
              <group position={[-2.5, 1.5, -1]}>
                <Sphere args={[0.08, 12, 12]}>
                  <meshStandardMaterial 
                    color={['node-before', 'node-us', 'memory-1', 'memory-2', 'memory-3', 'node-now', 'title', 'message', 'message2', 'final'].includes(step) ? "#C5A059" : "#333"} 
                    emissive="#C5A059"
                    emissiveIntensity={['node-before', 'node-us', 'memory-1', 'memory-2', 'memory-3', 'node-now', 'title', 'message', 'message2', 'final'].includes(step) ? 2 : 0}
                  />
                </Sphere>
                {/* Node Glow */}
                {['node-before', 'node-us', 'memory-1', 'memory-2', 'memory-3', 'node-now', 'title', 'message', 'message2', 'final'].includes(step) && (
                  <pointLight intensity={1} color="#C5A059" distance={2} />
                )}
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
                    color={['node-us', 'memory-1', 'memory-2', 'memory-3', 'node-now', 'title', 'message', 'message2', 'final'].includes(step) ? "#7D6B9D" : "#333"} 
                    emissive="#7D6B9D"
                    emissiveIntensity={['node-us', 'memory-1', 'memory-2', 'memory-3', 'node-now', 'title', 'message', 'message2', 'final'].includes(step) ? 2 : 0}
                  />
                </Sphere>
                {/* Node Glow */}
                {['node-us', 'memory-1', 'memory-2', 'memory-3', 'node-now', 'title', 'message', 'message2', 'final'].includes(step) && (
                  <pointLight intensity={1} color="#7D6B9D" distance={2} />
                )}
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
                    color={['node-now', 'title', 'message', 'message2', 'final'].includes(step) ? "#F8F4EE" : "#333"} 
                    emissive="#F8F4EE"
                    emissiveIntensity={['node-now', 'title', 'message', 'message2', 'final'].includes(step) ? 2.5 : 0}
                  />
                </Sphere>
                {/* Node Glow */}
                {['node-now', 'title', 'message', 'message2', 'final'].includes(step) && (
                  <pointLight intensity={1.5} color="#F8F4EE" distance={3} />
                )}
                {/* Track to core */}
                <mesh rotation={[Math.PI / 3, 0, 0]}>
                  <cylinderGeometry args={[0.0015, 0.0015, 2.5]} />
                  <meshBasicMaterial color="#F8F4EE" transparent opacity={0.2} />
                </mesh>
              </group>
            </group>
            
            {/* Magic dust - Very subtle */}
            <Sparkles count={10} scale={3} size={1} speed={0.16} color="#F8F4EE" opacity={0.14} />
          </group>
        )}
      </Float>

      <Environment preset="night" />
      <Preload all />
    </>
  );
});
