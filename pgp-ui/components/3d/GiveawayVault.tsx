'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from './palette';
import { DataStream } from './DataStream';
import { sceneState } from '@/lib/scene';

interface GiveawayVaultProps {
  /** Instanced ticket-fragment count; 0 disables the fragments. */
  tickets?: number;
  /**
   * Hex string the highlighted fragment is derived from. Pass the real
   * `winningCommitment` when the indexer is live so the visualisation is bound
   * to on-chain state rather than a hardcoded pick.
   */
  seedHex?: string;
  streams?: number;
  detail?: number;
}

/** Smoothstep helper matching the GLSL builtin. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Deterministic fragment index derived from a hex digest.
 * Returns -1 when there is nothing real to derive from, so callers can render a
 * neutral idle state instead of inventing a winner.
 */
export function fragmentIndexFromHex(hex: string | undefined, count: number): number {
  if (!hex || count <= 0) return -1;
  const clean = hex.replace(/^0x/, '').toLowerCase();
  if (!/^[0-9a-f]+$/.test(clean) || clean.length < 8) return -1;
  const tail = clean.slice(-8);
  const value = Number.parseInt(tail, 16);
  if (!Number.isFinite(value)) return -1;
  return value % count;
}

/**
 * Verifiable Randomness.
 *
 * A cylindrical vault of instanced encrypted ticket fragments. Driven entirely
 * by `sceneState.vault` (0..1): idle creep → spin-up → deceleration → fragments
 * converge → one is highlighted in emerald → the caps part.
 */
export function GiveawayVault({ tickets = 0, seedHex, streams = 0, detail = 1 }: GiveawayVaultProps) {
  const rootRef = useRef<THREE.Group>(null);
  const fragmentRef = useRef<THREE.InstancedMesh>(null);
  const capTopRef = useRef<THREE.Mesh>(null);
  const capBottomRef = useRef<THREE.Mesh>(null);
  const shellMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const ringCRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const count = Math.max(0, Math.floor(tickets));
  const winningIndex = useMemo(() => fragmentIndexFromHex(seedHex, count), [seedHex, count]);

  /** Stable per-fragment orbital parameters, generated once. */
  const fragments = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const t = count > 1 ? i / (count - 1) : 0;
      // Golden-angle distribution keeps fragments from stacking into visible rows.
      const angle = i * 2.39996323;
      const radius = 0.42 + (((i * 37) % 100) / 100) * 0.78;
      const y = (t - 0.5) * 3.4;
      return {
        angle,
        radius,
        y,
        scale: 0.6 + (((i * 53) % 100) / 100) * 0.8,
        tumble: 0.4 + ((i * 29) % 100) / 100,
      };
    });
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  // Seed instance colours once so the highlight has something to override.
  useEffect(() => {
    const mesh = fragmentRef.current;
    if (!mesh || count === 0) return;
    for (let i = 0; i < count; i++) {
      tmpColor.set(i % 5 === 0 ? PALETTE.violet : PALETTE.indigoBright);
      mesh.setColorAt(i, tmpColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, tmpColor, fragments]);

  useEffect(() => {
    const mesh = fragmentRef.current;
    if (mesh) mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, [count]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const v = THREE.MathUtils.clamp(sceneState.vault, 0, 1);
    const open = smoothstep(0.86, 1, v);
    const converge = smoothstep(0.6, 0.9, v);
    const spinUp = smoothstep(0.04, 0.45, v);
    const spinDown = smoothstep(0.5, 0.9, v);

    // Integrated rotation: accelerates, then bleeds off so the settle feels physical.
    const speed = 0.3 + spinUp * 8.5 * (1 - spinDown);

    if (rootRef.current) rootRef.current.rotation.y += delta * speed * 0.22;

    if (ringARef.current) ringARef.current.rotation.z += delta * speed * 0.5;
    if (ringBRef.current) ringBRef.current.rotation.z -= delta * speed * 0.38;
    if (ringCRef.current) ringCRef.current.rotation.y += delta * speed * 0.3;

    if (capTopRef.current)
      capTopRef.current.position.y = THREE.MathUtils.damp(capTopRef.current.position.y, 1.95 + open * 1.5, 4, delta);
    if (capBottomRef.current)
      capBottomRef.current.position.y = THREE.MathUtils.damp(
        capBottomRef.current.position.y,
        -1.95 - open * 1.5,
        4,
        delta,
      );

    if (shellMatRef.current) {
      shellMatRef.current.opacity = THREE.MathUtils.damp(shellMatRef.current.opacity, 0.2 - open * 0.1, 3, delta);
      shellMatRef.current.emissiveIntensity = 0.35 + v * 1.1;
    }

    if (glowRef.current)
      glowRef.current.intensity = THREE.MathUtils.damp(glowRef.current.intensity, 1.5 + v * 9 + open * 12, 4, delta);

    if (haloMatRef.current) haloMatRef.current.opacity = 0.05 + v * 0.14 + open * 0.1;
    if (haloRef.current) haloRef.current.rotation.z += delta * 0.15;

    // ── Instanced fragments ──────────────────────────────────────────────
    const mesh = fragmentRef.current;
    if (mesh && count > 0) {
      const rot = t * speed * 0.5;
      const frontAngle = Math.PI / 2; // faces the camera, which sits on +Z

      for (let i = 0; i < count; i++) {
        const f = fragments[i];
        const isWinner = winningIndex >= 0 && i === winningIndex;

        let angle = f.angle + rot * f.tumble;
        let radius = f.radius;
        let y = f.y + Math.sin(t * 0.8 + f.angle) * 0.06;
        let scale = f.scale * (0.85 + Math.sin(t * 1.4 + f.angle * 2) * 0.08);

        if (isWinner) {
          // Pull the selected fragment to the front, grow it, level it out.
          const shortest = ((frontAngle - angle + Math.PI) % (Math.PI * 2)) - Math.PI;
          angle += shortest * converge;
          radius = THREE.MathUtils.lerp(radius, 1.15, converge);
          y = THREE.MathUtils.lerp(y, 0, converge);
          scale = THREE.MathUtils.lerp(scale, scale * 2.6, converge);
        } else {
          // Everything else recedes as the selection resolves.
          radius *= 1 + converge * 0.22;
          scale *= 1 - converge * 0.55;
        }

        dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        dummy.rotation.set(angle * 0.6 + t * 0.2 * f.tumble, angle, Math.sin(t * 0.5 + f.angle) * 0.3);
        dummy.scale.set(scale * 0.19, scale * 0.035, scale * 0.12);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        if (isWinner) {
          tmpColor.set(PALETTE.emerald);
          tmpColor.multiplyScalar(1 + converge * 2.2);
          mesh.setColorAt(i, tmpColor);
        }
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  const radialSegments = Math.max(12, Math.round(64 * detail));

  return (
    <group ref={rootRef}>
      {/* Vault shell */}
      <mesh>
        <cylinderGeometry args={[1.55, 1.55, 3.9, radialSegments, 1, true]} />
        <meshPhysicalMaterial
          ref={shellMatRef}
          color="#0c1120"
          emissive={PALETTE.indigoDeep}
          emissiveIntensity={0.4}
          roughness={0.25}
          metalness={0.85}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Caps that part on open */}
      <mesh ref={capTopRef} position={[0, 1.95, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 0.14, radialSegments]} />
        <meshStandardMaterial
          color="#161d31"
          emissive={PALETTE.indigo}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.85}
        />
      </mesh>
      <mesh ref={capBottomRef} position={[0, -1.95, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 0.14, radialSegments]} />
        <meshStandardMaterial
          color="#161d31"
          emissive={PALETTE.indigo}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.85}
        />
      </mesh>

      {/* Containment rings */}
      <mesh ref={ringARef} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.2, 0]}>
        <torusGeometry args={[1.72, 0.022, 8, Math.round(96 * detail)]} />
        <meshStandardMaterial
          color={PALETTE.indigo}
          emissive={PALETTE.indigo}
          emissiveIntensity={1.1}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      <mesh ref={ringBRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <torusGeometry args={[1.72, 0.022, 8, Math.round(96 * detail)]} />
        <meshStandardMaterial
          color={PALETTE.violet}
          emissive={PALETTE.violet}
          emissiveIntensity={0.9}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      <mesh ref={ringCRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.95, 0.012, 8, Math.round(110 * detail)]} />
        <meshStandardMaterial
          color={PALETTE.slate}
          emissive={PALETTE.slate}
          emissiveIntensity={0.5}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* Encrypted ticket fragments. Emissive is kept low because instanceColor
          only modulates the diffuse term — a strong emissive would hide the
          emerald highlight on the selected fragment. */}
      {count > 0 && (
        <instancedMesh ref={fragmentRef} args={[undefined, undefined, count]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={PALETTE.white}
            emissive={PALETTE.indigo}
            emissiveIntensity={0.25}
            roughness={0.3}
            metalness={0.7}
            toneMapped={false}
          />
        </instancedMesh>
      )}

      {/* Particle trails inside the vault */}
      <DataStream count={streams} radius={1.3} size={0.9} opacity={0.5} />

      <pointLight ref={glowRef} color={PALETTE.indigo} intensity={1.5} distance={9} decay={2} />

      {/* Base halo */}
      <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.35, 0]}>
        <ringGeometry args={[1.7, 3.1, 64]} />
        <meshBasicMaterial
          ref={haloMatRef}
          color={PALETTE.indigo}
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
