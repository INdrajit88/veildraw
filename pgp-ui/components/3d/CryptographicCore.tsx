'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createShieldMaterial } from './shieldMaterial';
import { COLOR, PALETTE } from './palette';
import { sceneState } from '@/lib/scene';

interface CryptographicCoreProps {
  /** Overall scale of the assembly. */
  scale?: number;
  /** Points in the orbital mote halo; 0 disables it. */
  motes?: number;
}

/**
 * Radii are deliberately well separated. Stacking additive layers at similar
 * distances produces one bright mush instead of a readable object, so every
 * element here owns its own band of depth.
 */
const R = {
  heart: 0.4,
  shell: 0.76,
  equator: 0.94,
  gyroA: 1.14,
  gyroB: 1.42,
  haloInner: 1.62,
  haloOuter: 1.98,
} as const;

/**
 * Private Winner Selection.
 *
 * A faceted crystalline heart inside a glass shell, girded by one precision
 * equator and two counter-rotating gyros carrying three proof nodes, with a thin
 * orbital mote halo. The whole assembly floats and yaws slowly; interaction
 * energy spins it up, brightens the shell, contracts the halo inward and swells
 * the heart — then everything settles back down.
 *
 * Outer extent is ~2 units, roughly a third of the frame at the hero camera pose.
 */
export function CryptographicCore({ scale = 1, motes = 260 }: CryptographicCoreProps) {
  const rootRef = useRef<THREE.Group>(null);
  const heartRef = useRef<THREE.Mesh>(null);
  const heartMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const equatorRef = useRef<THREE.Mesh>(null);
  const gyroARef = useRef<THREE.Group>(null);
  const gyroBRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Points>(null);
  const haloMatRef = useRef<THREE.PointsMaterial>(null);

  const shell = useMemo(() => createShieldMaterial({ intensity: 0.6, color: COLOR.indigoDeep, rim: COLOR.ice }), []);

  useEffect(() => () => shell.material.dispose(), [shell]);

  const haloPositions = useMemo(() => {
    const n = Math.max(0, Math.floor(motes));
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      // Sum of three uniforms approximates a gaussian: most motes sit near the
      // equatorial plane, so the halo reads as a disc rather than a dust ball.
      const band = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const y = THREE.MathUtils.clamp(band, -1, 1) * 0.4;
      const radius = R.haloInner + Math.random() * (R.haloOuter - R.haloInner);
      const flat = Math.sqrt(Math.max(0, 1 - y * y));

      pos[i * 3] = Math.cos(theta) * radius * flat;
      pos[i * 3 + 1] = y * radius;
      pos[i * 3 + 2] = Math.sin(theta) * radius * flat;
    }
    return pos;
  }, [motes]);

  // Three proof nodes riding the outer gyro — a restrained accent, not a swarm.
  const nodeSlots = useMemo(
    () =>
      [0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return [Math.cos(a) * R.gyroB, Math.sin(a) * R.gyroB, 0] as [number, number, number];
      }),
    [],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const energy = Math.min(1, sceneState.energy * 0.75 + sceneState.draw);
    const spin = 0.1 + energy * 1.5;

    if (rootRef.current) {
      rootRef.current.rotation.y += delta * spin * 0.28;
      // Gentle float and sway so it never looks bolted to the origin.
      rootRef.current.position.y = Math.sin(t * 0.55) * 0.045;
      rootRef.current.rotation.z = Math.sin(t * 0.31) * (0.05 + energy * 0.035);
    }

    if (heartRef.current) {
      heartRef.current.rotation.y -= delta * (0.35 + energy * 1.7);
      heartRef.current.rotation.x += delta * (0.18 + energy * 0.7);
      heartRef.current.scale.setScalar(1 + Math.sin(t * 1.7) * 0.05 + energy * 0.14);
    }
    if (heartMatRef.current) {
      heartMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        heartMatRef.current.emissiveIntensity,
        1.3 + energy * 3.4 + Math.sin(t * 2.6) * 0.25,
        6,
        delta,
      );
    }

    if (equatorRef.current) equatorRef.current.rotation.z += delta * (0.9 + energy * 3.6);

    // Counter-rotating gyros on perpendicular axes — the gyroscopic read.
    if (gyroARef.current) {
      gyroARef.current.rotation.y += delta * (0.24 + energy * 1.15);
      gyroARef.current.rotation.z -= delta * 0.06;
    }
    if (gyroBRef.current) gyroBRef.current.rotation.z -= delta * (0.3 + energy * 1.35);

    if (haloRef.current) {
      haloRef.current.rotation.y -= delta * (0.09 + energy * 0.55);
      haloRef.current.rotation.x = Math.sin(t * 0.25) * 0.12;
      // Focus gesture: the halo contracts toward the heart as the draw charges.
      const s = 1 - energy * 0.14;
      haloRef.current.scale.setScalar(THREE.MathUtils.damp(haloRef.current.scale.x, s, 4, delta));
    }
    if (haloMatRef.current) haloMatRef.current.opacity = 0.3 + energy * 0.42;

    shell.uniforms.uTime.value = t;
    shell.uniforms.uIntensity.value = THREE.MathUtils.damp(
      shell.uniforms.uIntensity.value,
      0.55 + energy * 0.75,
      4,
      delta,
    );
  });

  return (
    <group ref={rootRef} scale={scale}>
      {/* Crystalline heart */}
      <mesh ref={heartRef}>
        <octahedronGeometry args={[R.heart, 0]} />
        <meshStandardMaterial
          ref={heartMatRef}
          color={PALETTE.indigoDeep}
          emissive={PALETTE.indigo}
          emissiveIntensity={1.3}
          roughness={0.16}
          metalness={0.7}
          flatShading
        />
      </mesh>

      {/* Encrypted glass shell */}
      <mesh>
        <sphereGeometry args={[R.shell, 48, 32]} />
        <primitive object={shell.material} attach="material" />
      </mesh>

      {/* Precision equator — one hairline ring instead of a stack of fat ones */}
      <mesh ref={equatorRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R.equator, 0.006, 6, 128]} />
        <meshBasicMaterial
          color={PALETTE.ice}
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Inner gyro */}
      <group ref={gyroARef} rotation={[Math.PI / 2.4, 0, 0]}>
        <mesh>
          <torusGeometry args={[R.gyroA, 0.011, 8, 128]} />
          <meshStandardMaterial
            color={PALETTE.indigo}
            emissive={PALETTE.indigo}
            emissiveIntensity={0.95}
            roughness={0.32}
            metalness={0.6}
          />
        </mesh>
      </group>

      {/* Outer gyro, carrying the three proof nodes */}
      <group ref={gyroBRef} rotation={[Math.PI / 2.05, 0, 0]}>
        <mesh>
          <torusGeometry args={[R.gyroB, 0.008, 8, 128]} />
          <meshStandardMaterial
            color={PALETTE.violet}
            emissive={PALETTE.violet}
            emissiveIntensity={0.6}
            roughness={0.38}
            metalness={0.55}
          />
        </mesh>
        {nodeSlots.map((position, i) => (
          <mesh key={i} position={position} scale={0.034}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial
              color={PALETTE.ice}
              emissive={i === 0 ? PALETTE.emerald : PALETTE.indigoBright}
              emissiveIntensity={2.2}
              roughness={0.25}
              metalness={0.6}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Orbital mote halo */}
      {motes > 0 && (
        <points ref={haloRef} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[haloPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            ref={haloMatRef}
            color={PALETTE.indigoBright}
            size={0.03}
            transparent
            opacity={0.3}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      )}
    </group>
  );
}
