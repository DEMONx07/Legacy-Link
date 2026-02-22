/// <reference types="@react-three/fiber" />
'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, RootState } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Environment, Torus } from '@react-three/drei';
import * as THREE from 'three';

// ── Animated glowing orb representing the avatar ──
function AvatarOrb({
  color,
  expression,
  isSpeaking,
}: {
  color: string;
  expression: string;
  isSpeaking: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state: RootState) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Breathing animation
    const breathScale = 1 + Math.sin(t * 1.5) * 0.03;
    meshRef.current.scale.setScalar(breathScale);

    // Speaking pulse
    if (isSpeaking) {
      const speakScale = 1 + Math.sin(t * 8) * 0.06;
      meshRef.current.scale.setScalar(breathScale * speakScale);
    }

    // Gentle rotation
    meshRef.current.rotation.y = t * 0.2;
    meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;

    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.3;
      innerRef.current.rotation.z = t * 0.15;
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.z = t * 0.1;
      ringsRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
  });

  // Expression-based distortion
  const distortMap: Record<string, number> = {
    neutral: 0.25,
    smile: 0.15,
    happy: 0.2,
    thoughtful: 0.4,
    sad: 0.5,
    proud: 0.2,
    laugh: 0.35,
    nostalgic: 0.3,
  };

  const distort = distortMap[expression] ?? 0.25;
  const speed = isSpeaking ? 3 : 1.5;

  return (
    <group>
      {/* Outer glow ring */}
      <group ref={ringsRef}>
        <Torus args={[1.6, 0.02, 16, 100]} rotation={[0.7, 0.4, 0]}>
          <meshBasicMaterial color={color} transparent opacity={0.1} />
        </Torus>
        <Torus args={[1.9, 0.02, 16, 100]} rotation={[1.4, 0.8, 0]}>
          <meshBasicMaterial color={color} transparent opacity={0.08} />
        </Torus>
        <Torus args={[2.2, 0.02, 16, 100]} rotation={[2.1, 1.2, 0]}>
          <meshBasicMaterial color={color} transparent opacity={0.06} />
        </Torus>
      </group>

      {/* Main orb */}
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
        <Sphere ref={meshRef} args={[1, 64, 64]}>
          <MeshDistortMaterial
            color={color}
            distort={distort}
            speed={speed}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.9}
          />
        </Sphere>

        {/* Inner core */}
        <Sphere ref={innerRef} args={[0.6, 32, 32]}>
          <MeshDistortMaterial
            color={color}
            distort={0.5}
            speed={speed * 1.5}
            roughness={0}
            metalness={1}
            emissive={color}
            emissiveIntensity={0.3}
          />
        </Sphere>
      </Float>

      {/* Particle field */}
      <ParticleField color={color} isSpeaking={isSpeaking} />
    </group>
  );
}

// ── Surrounding particles ──────────────────────
function ParticleField({ color, isSpeaking }: { color: string; isSpeaking: boolean }) {
  const points = useRef<THREE.Points>(null);

  const particleCount = 80;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.8 + Math.random() * 1.5;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state: RootState) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.05;
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    const s = isSpeaking ? 1 + Math.sin(state.clock.elapsedTime * 6) * 0.05 : 1;
    points.current.scale.setScalar(s);
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.03} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ── Main export ────────────────────────────────
export default function Avatar3D({
  color = '#d4a853',
  expression = 'neutral',
  isSpeaking = false,
}: {
  color?: string;
  expression?: string;
  isSpeaking?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color={color} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#ffffff" />
      <Environment preset="night" />

      <AvatarOrb color={color} expression={expression} isSpeaking={isSpeaking} />
    </Canvas>
  );
}
