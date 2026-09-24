'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createShieldMaterial } from './shieldMaterial';
import { COLOR } from './palette';
import { MoteField } from './MoteField';
import { sceneState } from '@/lib/scene';

interface PrivacyShieldProps {
  radius?: number;
  /** Number of inbound data motes; 0 disables the system entirely. */
  motes?: number;
  opacity?: number;
  /** Renders the inner counter-rotating lattice shell. */
  inner?: boolean;
}

/**
 * Identity Protection.
 *
 * A Fresnel glass shell with a near-subliminal cryptographic lattice. Data
 * motes stream in from outside and dissolve on contact — the visual argument
 * that data exists, but identity never escapes.
 */
export function PrivacyShield({ radius = 3.5, motes = 0, opacity = 1, inner = true }: PrivacyShieldProps) {
  const shellRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  const shellFx = useMemo(
    () => createShieldMaterial({ intensity: 0.5, color: COLOR.indigoDeep, rim: COLOR.indigoBright }),
    [],
  );

  const innerFx = useMemo(
    () => createShieldMaterial({ intensity: 0.24, color: COLOR.violetDeep, rim: COLOR.violet }),
    [],
  );

  useEffect(
    () => () => {
      shellFx.material.dispose();
      innerFx.material.dispose();
    },
    [shellFx, innerFx],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const brightness = Math.min(1.6, 0.5 + sceneState.draw * 0.85 + sceneState.energy * 0.3);

    shellFx.uniforms.uTime.value = t;
    shellFx.uniforms.uIntensity.value = THREE.MathUtils.damp(
      shellFx.uniforms.uIntensity.value,
      brightness * opacity,
      3,
      delta,
    );
    innerFx.uniforms.uTime.value = t * 1.4;
    innerFx.uniforms.uIntensity.value = shellFx.uniforms.uIntensity.value * 0.45;

    if (shellRef.current) {
      shellRef.current.rotation.y += delta * 0.035;
      const breathe = 1 + Math.sin(t * 0.5) * 0.008 + sceneState.draw * 0.03;
      shellRef.current.scale.setScalar(breathe);
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.06;
      innerRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group>
      <mesh ref={shellRef}>
        <sphereGeometry args={[radius, 64, 48]} />
        <primitive object={shellFx.material} attach="material" />
      </mesh>

      {inner && (
        <mesh ref={innerRef}>
          <icosahedronGeometry args={[radius * 0.82, 2]} />
          <primitive object={innerFx.material} attach="material" />
        </mesh>
      )}

      <MoteField count={motes} radius={radius} direction="inbound" reactive impactColor={COLOR.violet} />
    </group>
  );
}
