'use client';

import * as THREE from 'three';

/**
 * Scene palette.
 *
 * Deliberately mirrors the Tailwind tokens in `tailwind.config.ts` so the WebGL
 * environment and the DOM share one colour language:
 *   primary indigo  → the protocol / interactive accent
 *   violet          → ZK + privacy moments only (per the token comment)
 *   emerald         → verification / proof succeeded
 *   near-black      → the void the whole scene sits in
 */
export const PALETTE = {
  void: '#030407',
  indigo: '#5b7cfa',
  indigoBright: '#7b93fc',
  indigoDeep: '#1e2a5e',
  violet: '#8b5cf6',
  violetDeep: '#2a1a55',
  emerald: '#34d399',
  /** Exposure / leakage — used only on the "traditional giveaway" side. */
  rose: '#fb7185',
  slate: '#94a3b8',
  ice: '#cfe0ff',
  white: '#ffffff',
} as const;

export const COLOR = {
  void: new THREE.Color(PALETTE.void),
  indigo: new THREE.Color(PALETTE.indigo),
  indigoBright: new THREE.Color(PALETTE.indigoBright),
  indigoDeep: new THREE.Color(PALETTE.indigoDeep),
  violet: new THREE.Color(PALETTE.violet),
  violetDeep: new THREE.Color(PALETTE.violetDeep),
  emerald: new THREE.Color(PALETTE.emerald),
  rose: new THREE.Color(PALETTE.rose),
  slate: new THREE.Color(PALETTE.slate),
  ice: new THREE.Color(PALETTE.ice),
} as const;

/** Clear colour must match `.veil-void` so canvas and page are one volume. */
export const CLEAR_COLOR = 0x030407;
