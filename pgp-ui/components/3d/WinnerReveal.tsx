'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { REVEAL_FRAGMENT, REVEAL_VERTEX } from './shaders';
import { COLOR, CLEAR_COLOR } from './palette';

interface WinnerRevealProps {
  count: number;
  /** Seconds for the single particle to bloom into the full field. */
  duration?: number;
  size?: number;
}

/** Advances the bloom once on mount, then holds — no idle motion. */
function Bloom({ count, duration, size }: { count: number; duration: number; size: number }) {
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
      siz[i] = 0.4 + Math.random() * 1.4;
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
      uColorA: { value: COLOR.emerald.clone() },
      uColorB: { value: COLOR.ice.clone() },
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

  const ringRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const progress = THREE.MathUtils.clamp(t / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 2.4);

    uniforms.uTime.value = t;
    uniforms.uProgress.value = eased;
    // Fade in fast, then hold — the overlay text needs a stable backdrop.
    uniforms.uOpacity.value = THREE.MathUtils.damp(uniforms.uOpacity.value, progress < 0.98 ? 0.95 : 0.6, 3, delta);

    if (ringRef.current) ringRef.current.scale.setScalar(0.3 + eased * 5.4);
    if (ringMatRef.current) ringMatRef.current.opacity = (1 - eased) * 0.5;
  });

  if (count <= 0) return null;

  return (
    <>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        </bufferGeometry>
        <primitive object={material} attach="material" />
      </points>

      <mesh ref={ringRef} scale={0.3}>
        <torusGeometry args={[1, 0.006, 8, 160]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color={COLOR.emerald}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

/**
 * Full-screen winner reveal field.
 *
 * Mounted only while the overlay is open and torn down on close, so it costs
 * nothing during normal browsing. Everything goes dark, one point appears, and
 * it expands into a glowing field behind the verdict.
 */
export function WinnerReveal({ count, duration = 2.6, size = 1.4 }: WinnerRevealProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 45, near: 0.1, far: 60 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: false, stencil: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor(CLEAR_COLOR, 1)}
      className="absolute inset-0"
    >
      <Bloom count={count} duration={duration} size={size} />
    </Canvas>
  );
}
