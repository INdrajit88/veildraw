'use client';

/* eslint-disable react/no-unknown-property -- R3F extended JSX intrinsics (args, emissive, attach, …) */
import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// When the canvas is off-screen / tab hidden / reduced-motion, the parent
// switches frameloop to "never" or "demand" — no frame work runs at all.

// ── Palette (calm, single-accent) ──────────────────────────────
const INDIGO = '#5b7cfa';
const INDIGO_BRIGHT = '#7b93fc';
const VIOLET = '#8b5cf6';
const SLATE = '#94a3b8';

// Central sealed vault: core + polyhedral cage
function VaultCore() {
  const coreRef = useRef<THREE.Group>(null);
  const innerSphereRef = useRef<THREE.Mesh>(null);
  const outerCageRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.12;
    if (outerCageRef.current) {
      outerCageRef.current.rotation.x -= delta * 0.16;
      outerCageRef.current.rotation.z += delta * 0.08;
    }
    if (innerSphereRef.current) {
      const mat = innerSphereRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.1 + Math.sin(state.clock.elapsedTime * 2) * 0.35;
    }
  });

  return (
    <group ref={coreRef}>
      <mesh ref={innerSphereRef}>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshStandardMaterial
          color="#1e2a5e"
          emissive={INDIGO}
          emissiveIntensity={1.2}
          roughness={0.15}
          metalness={0.6}
        />
      </mesh>
      <mesh ref={outerCageRef}>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial color={INDIGO_BRIGHT} wireframe transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// Orbital rings — the "veil" layer
function OrbitalRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.18;
      ring1Ref.current.rotation.x += delta * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 0.24;
      ring2Ref.current.rotation.z -= delta * 0.14;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x -= delta * 0.2;
      ring3Ref.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.5, 0.015, 8, 96]} />
        <meshStandardMaterial
          color={INDIGO}
          emissive={INDIGO}
          emissiveIntensity={0.7}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.75, 0.012, 8, 96]} />
        <meshStandardMaterial
          color={VIOLET}
          emissive={VIOLET}
          emissiveIntensity={0.45}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      <mesh ref={ring3Ref} rotation={[0, Math.PI / 3, 0]}>
        <torusGeometry args={[3.0, 0.01, 8, 96]} />
        <meshStandardMaterial
          color="#64748b"
          emissive="#64748b"
          emissiveIntensity={0.35}
          roughness={0.5}
          metalness={0.5}
        />
      </mesh>
    </group>
  );
}

// The translucent veil mesh (no transmission pass — cheap transparency)
function VeilMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.08;
    meshRef.current.rotation.y += delta * 0.12;
    const scale = 1 + Math.sin(state.clock.elapsedTime * 0.9) * 0.03;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1.9, 0.4, 96, 20, 2, 3]} />
      <meshPhysicalMaterial
        color="#111a3a"
        emissive="#1d2b6b"
        emissiveIntensity={0.5}
        roughness={0.35}
        metalness={0.55}
        clearcoat={0.6}
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

// Private entry nodes orbiting the vault, chained into the accumulator
function EntryNodes({ count = 30, radius = 4.1 }: { count?: number; radius?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, linePositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const linePos: number[] = [];

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius * (0.75 + Math.random() * 0.5);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Half the nodes tether to the vault (entry → accumulator)
      if (i % 2 === 0) linePos.push(x, y, z, 0, 0, 0);
      // Every third node links to its predecessor (chained hash)
      if (i > 0 && i % 3 === 0) {
        const prevIdx = (i - 1) * 3;
        linePos.push(x, y, z, pos[prevIdx], pos[prevIdx + 1], pos[prevIdx + 2]);
      }
    }
    return [pos, new Float32Array(linePos)];
  }, [count, radius]);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06;
      groupRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.12} color={INDIGO_BRIGHT} transparent opacity={0.7} sizeAttenuation />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={INDIGO} transparent opacity={0.12} />
      </lineSegments>
    </group>
  );
}

// Ambient dust
function AmbientDust({ count = 90 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, [count]);

  useFrame((_state, delta) => {
    if (pointsRef.current) pointsRef.current.rotation.y += delta * 0.015;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={SLATE} transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

// Pointer parallax rig — the whole ecosystem leans gently toward the cursor
export function VeilVaultScene() {
  const { pointer } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      const targetRotX = pointer.y * 0.18;
      const targetRotY = pointer.x * 0.28;
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 2.5, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 2.5, delta);
    }
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[10, 10, 10]} intensity={1.4} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={1.0} color={VIOLET} />
      <pointLight position={[0, 0, 0]} intensity={2.2} color={INDIGO} distance={6} />

      <group ref={groupRef}>
        <VaultCore />
        <OrbitalRings />
        <VeilMesh />
        <EntryNodes count={30} radius={4.0} />
        <AmbientDust count={90} />
      </group>
    </>
  );
}
