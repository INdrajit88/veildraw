'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { REVEAL_FRAGMENT, REVEAL_VERTEX } from './shaders';
import { COLOR, PALETTE } from './palette';
import { sceneState } from '@/lib/scene';

interface ProofParticlesProps {
  count: number;
  /** World-space radius the burst expands to. */
  radius?: number;
  size?: number;
}

/**
 * The cryptographic verification burst.
 *
 * Bound to `sceneState.draw`, so it fires once during the "Enter the Veil"
 * sequence and again when the vault resolves — an expanding shell of points
 * plus a shockwave ring that settles into emerald as the proof completes.
 */
export function ProofParticles({ count, radius = 4.2, size = 1.25 }: ProofParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const gl = useThree((state) => state.gl);

  const { positions, seeds, sizes } = useMemo(() => {
    const n = Math.max(0, Math.floor(count));
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 3);
    const siz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      seed[i * 3] = Math.random();
      seed[i * 3 + 1] = Math.random();
      seed[i * 3 + 2] = Math.random();
      siz[i] = 0.4 + Math.random() * 1.3;
    }
    return { positions: pos, seeds: seed, sizes: siz };
  }, [count]);

  /** Hoisted out of the material so the frame loop writes to typed values. */
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: size },
      uOpacity: { value: 0 },
      uColorA: { value: COLOR.indigoBright.clone() },
      uColorB: { value: COLOR.emerald.clone() },
    }),
    [size],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: REVEAL_VERTEX,
        fragmentShader: REVEAL_FRAGMENT,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  useEffect(() => {
    uniforms.uPixelRatio.value = gl.getPixelRatio();
    return () => material.dispose();
  }, [material, uniforms, gl]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    // Draw progress drives the burst; it collapses again as the sequence ends so
    // the field is never left hanging in the air.
    const p = THREE.MathUtils.clamp(sceneState.draw, 0, 1);
    const burst = p > 0.02 ? Math.sin(Math.min(1, p) * Math.PI) : 0;

    uniforms.uTime.value = t;
    uniforms.uProgress.value = p;
    uniforms.uOpacity.value = THREE.MathUtils.damp(uniforms.uOpacity.value, burst * 0.9, 6, delta);

    if (ringRef.current) {
      const s = 0.4 + p * radius * 1.25;
      ringRef.current.scale.setScalar(THREE.MathUtils.damp(ringRef.current.scale.x, s, 6, delta));
      ringRef.current.rotation.z += delta * 0.6;
    }
    if (ringMatRef.current) {
      ringMatRef.current.opacity = THREE.MathUtils.damp(ringMatRef.current.opacity, burst * 0.4, 6, delta);
      ringMatRef.current.color.set(p > 0.72 ? PALETTE.emerald : PALETTE.indigoBright);
    }
  });

  if (count <= 0) return null;

  return (
    <group>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        </bufferGeometry>
        <primitive object={material} attach="material" />
      </points>

      {/* Shockwave ring */}
      <mesh ref={ringRef} scale={0.4}>
        <torusGeometry args={[1, 0.012, 8, 128]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color={PALETTE.indigoBright}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
