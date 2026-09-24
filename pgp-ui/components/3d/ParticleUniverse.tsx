'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_FRAGMENT, PARTICLE_VERTEX } from './shaders';
import { COLOR } from './palette';
import { sceneState } from '@/lib/scene';

interface ParticleUniverseProps {
  count: number;
  /** Half-extents of the field. Y is wrapped around the camera for infinite travel. */
  spread?: readonly [number, number, number];
  size?: number;
  opacity?: number;
}

/**
 * Participants rendered as an abstract point cloud — one draw call, no per-frame
 * CPU writes. Drift, clustering, cursor parallax, convergence into the core and
 * vertical wrap-around all happen in the vertex shader.
 */
export function ParticleUniverse({ count, spread = [26, 15, 20], size = 1.5, opacity = 0.85 }: ParticleUniverseProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const gl = useThree((state) => state.gl);

  // Destructured so the memo depends on numbers rather than on a fresh array
  // identity from the caller's inline `spread={[...]}` literal.
  const [spreadX, spreadY, spreadZ] = spread;

  const { positions, seeds, sizes, tints } = useMemo(() => {
    const n = Math.max(0, Math.floor(count));
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 3);
    const siz = new Float32Array(n);
    const tint = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      // Bias toward a shell so the centre stays legible for the core object.
      const r = 0.35 + Math.pow(Math.random(), 0.7) * 0.65;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * spreadX * r;
      pos[i * 3 + 1] = Math.cos(phi) * spreadY * r;
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * spreadZ * r;

      seed[i * 3] = Math.random();
      seed[i * 3 + 1] = Math.random();
      seed[i * 3 + 2] = Math.random();

      // Long-tail size distribution: mostly dust, a few bright anchors.
      siz[i] = Math.random() < 0.92 ? 0.45 + Math.random() * 0.7 : 1.6 + Math.random() * 1.9;
      tint[i] = Math.random();
    }

    return { positions: pos, seeds: seed, sizes: siz, tints: tint };
  }, [count, spreadX, spreadY, spreadZ]);

  /**
   * Held separately from the material so the frame loop writes to a strongly
   * typed object — `ShaderMaterial.uniforms` is indexed as `IUniform<any>`,
   * which would silently drop every type check on these values.
   */
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: size },
      uConverge: { value: 0 },
      uEnergy: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uCenterY: { value: 0 },
      uSpread: { value: new THREE.Vector3(spreadX, spreadY, spreadZ) },
      uOpacity: { value: opacity },
      uColorA: { value: COLOR.indigo.clone() },
      uColorB: { value: COLOR.ice.clone() },
    }),
    [size, opacity, spreadX, spreadY, spreadZ],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERTEX,
        fragmentShader: PARTICLE_FRAGMENT,
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
    uniforms.uCenterY.value = state.camera.position.y;

    // Convergence is a hero-only gesture: particles fall into the core while the
    // "Enter the Veil" sequence runs, and settle back afterwards.
    const targetConverge = sceneState.draw * 0.9 + sceneState.energy * 0.25;
    uniforms.uConverge.value = THREE.MathUtils.damp(uniforms.uConverge.value, targetConverge, 2.6, delta);

    const targetEnergy = Math.min(1, sceneState.energy * 0.8 + sceneState.draw);
    uniforms.uEnergy.value = THREE.MathUtils.damp(uniforms.uEnergy.value, targetEnergy, 3.2, delta);

    uniforms.uPointer.value.set(
      THREE.MathUtils.damp(uniforms.uPointer.value.x, sceneState.pointerX, 2.2, delta),
      THREE.MathUtils.damp(uniforms.uPointer.value.y, sceneState.pointerY * 0.6, 2.2, delta),
    );
  });

  if (count <= 0) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aTint" args={[tints, 1]} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  );
}
