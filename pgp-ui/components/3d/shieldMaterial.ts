'use client';

import * as THREE from 'three';
import { SHIELD_FRAGMENT, SHIELD_VERTEX } from './shaders';

/**
 * Strongly-typed view of the Fresnel shell's uniform bag.
 *
 * The `Record<string, IUniform>` base is what makes the object assignable to
 * `ShaderMaterial`'s `uniforms` parameter; the named members keep the frame
 * loop's writes fully typed.
 */
export interface ShieldUniforms extends Record<string, THREE.IUniform> {
  uTime: THREE.IUniform<number>;
  uIntensity: THREE.IUniform<number>;
  uColor: THREE.IUniform<THREE.Color>;
  uColorRim: THREE.IUniform<THREE.Color>;
}

export interface ShieldMaterialOptions {
  intensity: number;
  color: THREE.Color;
  rim: THREE.Color;
}

/**
 * Build the Fresnel glass shell used by the privacy shield, the cryptographic
 * core and the sealed side of the privacy comparison.
 *
 * Returns the uniforms alongside the material so callers can animate them with
 * full type information — `ShaderMaterial.uniforms` is indexed as
 * `IUniform<any>`, which would discard every check at the write site.
 */
export function createShieldMaterial({ intensity, color, rim }: ShieldMaterialOptions): {
  material: THREE.ShaderMaterial;
  uniforms: ShieldUniforms;
} {
  const uniforms: ShieldUniforms = {
    uTime: { value: 0 },
    uIntensity: { value: intensity },
    uColor: { value: color.clone() },
    uColorRim: { value: rim.clone() },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: SHIELD_VERTEX,
    fragmentShader: SHIELD_FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  return { material, uniforms };
}
