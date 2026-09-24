'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MOTE_FRAGMENT, MOTE_VERTEX } from './shaders';
import { COLOR } from './palette';
import { sceneState } from '@/lib/scene';

interface MoteFieldProps {
  count: number;
  radius: number;
  size?: number;
  opacity?: number;
  speed?: number;
  /**
   * `inbound` — motes fall toward the shell and dissolve on contact (identity
   * blocked). `outbound` — motes escape and dissipate (data leaked).
   */
  direction?: 'inbound' | 'outbound';
  /** Couples flow rate to `sceneState.draw` so motes surge during a draw. */
  reactive?: boolean;
  color?: THREE.Color;
  impactColor?: THREE.Color;
}

/**
 * A spherical field of data motes travelling either into or out of a boundary.
 * One draw call; motion is entirely seed- and time-driven on the GPU.
 */
export function MoteField({
  count,
  radius,
  size = 1.15,
  opacity = 0.72,
  speed = 0.075,
  direction = 'inbound',
  reactive = false,
  color,
  impactColor,
}: MoteFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const gl = useThree((state) => state.gl);

  const { positions, seeds, sizes } = useMemo(() => {
    const n = Math.max(0, Math.floor(count));
    // Position values are unused — the vertex shader derives placement from aSeed.
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 3);
    const siz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      seed[i * 3] = Math.random();
      seed[i * 3 + 1] = Math.random();
      seed[i * 3 + 2] = Math.random();
      siz[i] = 0.5 + Math.random() * 1.1;
    }
    return { positions: pos, seeds: seed, sizes: siz };
  }, [count]);

  /** Hoisted out of the material so the frame loop writes to typed values. */
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRadius: { value: radius },
      uPixelRatio: { value: 1 },
      uSize: { value: size },
      uOpacity: { value: opacity },
      uSpeed: { value: speed },
      uOutbound: { value: direction === 'outbound' ? 1 : 0 },
      uColor: { value: (color ?? COLOR.slate).clone() },
      uColorImpact: { value: (impactColor ?? COLOR.violet).clone() },
    }),
    [radius, size, opacity, speed, direction, color, impactColor],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: MOTE_VERTEX,
        fragmentShader: MOTE_FRAGMENT,
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
    if (reactive) {
      uniforms.uSpeed.value = THREE.MathUtils.damp(
        uniforms.uSpeed.value,
        speed + sceneState.draw * 0.22 + sceneState.energy * 0.06,
        2,
        delta,
      );
    }
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
