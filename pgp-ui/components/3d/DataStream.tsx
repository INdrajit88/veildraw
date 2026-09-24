'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { STREAM_FRAGMENT, STREAM_VERTEX } from './shaders';
import { COLOR } from './palette';
import { sceneState } from '@/lib/scene';

interface DataStreamProps {
  count: number;
  radius?: number;
  size?: number;
  opacity?: number;
  color?: THREE.Color;
}

/**
 * Data streams flowing inward toward the core.
 *
 * Used around the cryptographic core (entries being committed) and inside the
 * privacy shield (data reaching the boundary). Flow rate is coupled to the
 * interaction energy so the streams visibly surge during a draw.
 */
export function DataStream({ count, radius = 3.2, size = 1, opacity = 0.6, color }: DataStreamProps) {
  const pointsRef = useRef<THREE.Points>(null);
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
      siz[i] = 0.4 + Math.random() * 1.2;
    }
    return { positions: pos, seeds: seed, sizes: siz };
  }, [count]);

  /** Hoisted out of the material so the frame loop writes to typed values. */
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: size },
      uFlow: { value: 0 },
      uRadius: { value: radius },
      uOpacity: { value: opacity },
      uColor: { value: (color ?? COLOR.indigoBright).clone() },
    }),
    [size, radius, opacity, color],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: STREAM_VERTEX,
        fragmentShader: STREAM_FRAGMENT,
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
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uFlow.value = THREE.MathUtils.damp(
      uniforms.uFlow.value,
      Math.min(1, sceneState.energy * 0.7 + sceneState.draw + sceneState.vault * 0.6),
      2.4,
      delta,
    );
  });

  if (count <= 0) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  );
}
