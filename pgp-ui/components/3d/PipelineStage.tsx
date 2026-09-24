'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from './palette';
import { CryptographicCore } from './CryptographicCore';
import { sceneState, stageActivation } from '@/lib/scene';

export type PipelineStageId = 'join' | 'commit' | 'select' | 'prove' | 'claim';

export interface PipelineStageConfig {
  id: PipelineStageId;
  /** Real circuit or contract field this stage corresponds to. */
  circuit: string;
  x: number;
}

/**
 * The five stages, laid out along X. Order follows the real contract lifecycle:
 * enter → publish commitment → organizer closes and selects → ZK proof → claim.
 */
export const PIPELINE_STAGES: readonly PipelineStageConfig[] = [
  { id: 'join', circuit: 'enterGiveaway()', x: -8 },
  { id: 'commit', circuit: 'commitment', x: -4 },
  { id: 'select', circuit: 'closeAndSelectWinner()', x: 0 },
  { id: 'prove', circuit: 'persistentHash', x: 4 },
  { id: 'claim', circuit: 'claimPrize()', x: 8 },
];

interface PipelineStageProps {
  config: PipelineStageConfig;
  index: number;
  /** Scales the whole assembly; used to simplify on low tiers. */
  detail?: number;
}

/** JOIN — a glowing portal that participants pass through. */
function JoinPortal({ detail }: { detail: number }) {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const discRef = useRef<THREE.Mesh>(null);
  const discMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const a = stageActivation(sceneState.scroll, 0);
    const t = state.clock.elapsedTime;
    if (outerRef.current) outerRef.current.rotation.z += delta * (0.2 + a * 0.9);
    if (innerRef.current) innerRef.current.rotation.z -= delta * (0.3 + a * 1.2);
    if (discMatRef.current) discMatRef.current.opacity = 0.05 + a * 0.2 + Math.sin(t * 2) * 0.02;
    if (groupRef.current) {
      const s = 0.82 + a * 0.18;
      groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, s, 5, delta));
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={outerRef}>
        <torusGeometry args={[1.5, 0.05, 12, Math.round(96 * detail)]} />
        <meshStandardMaterial
          color={PALETTE.indigo}
          emissive={PALETTE.indigo}
          emissiveIntensity={1.4}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      <mesh ref={innerRef}>
        <torusGeometry args={[1.18, 0.022, 8, Math.round(72 * detail)]} />
        <meshStandardMaterial
          color={PALETTE.indigoBright}
          emissive={PALETTE.indigoBright}
          emissiveIntensity={1}
          roughness={0.35}
          metalness={0.5}
        />
      </mesh>
      <mesh ref={discRef}>
        <circleGeometry args={[1.16, Math.round(48 * detail)]} />
        <meshBasicMaterial
          ref={discMatRef}
          color={PALETTE.indigo}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** COMMIT — an encrypted cube: only the 32-byte commitment leaves the device. */
function CommitCube({ detail }: { detail: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const innerMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const shellMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    const a = stageActivation(sceneState.scroll, 1);
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (0.18 + a * 0.7);
      groupRef.current.rotation.x += delta * (0.09 + a * 0.32);
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * (0.4 + a * 1.3);
      innerRef.current.rotation.z += delta * 0.2;
    }
    if (innerMatRef.current) innerMatRef.current.emissiveIntensity = 0.8 + a * 2.2;
    if (shellMatRef.current) shellMatRef.current.opacity = 0.16 + a * 0.3;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[1.9, 1.9, 1.9]} />
        <meshBasicMaterial ref={shellMatRef} color={PALETTE.violet} wireframe transparent opacity={0.2} />
      </mesh>
      <mesh>
        <boxGeometry args={[1.92, 1.92, 1.92]} />
        <meshStandardMaterial
          color="#0b1020"
          emissive={PALETTE.violetDeep}
          emissiveIntensity={0.5}
          roughness={0.4}
          metalness={0.7}
          transparent
          opacity={0.55}
        />
      </mesh>
      <mesh ref={innerRef}>
        <octahedronGeometry args={[0.62, Math.max(0, Math.round(detail))]} />
        <meshStandardMaterial
          ref={innerMatRef}
          color={PALETTE.violetDeep}
          emissive={PALETTE.violet}
          emissiveIntensity={1.1}
          roughness={0.2}
          metalness={0.75}
        />
      </mesh>
    </group>
  );
}

/** SELECT — the randomisation core, a miniature of the hero cryptographic core. */
function SelectCore({ detail }: { detail: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const motes = detail > 0.75 ? 90 : 40;

  useFrame((_state, delta) => {
    const a = stageActivation(sceneState.scroll, 2);
    if (groupRef.current) {
      const s = 0.34 + a * 0.08;
      groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, s, 5, delta));
    }
  });

  return (
    <group ref={groupRef} scale={0.34}>
      <CryptographicCore motes={motes} />
    </group>
  );
}

/** PROVE — rotating proof rings closing on a verified point. */
function ProveRings({ detail }: { detail: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const ringCRef = useRef<THREE.Mesh>(null);
  const nodeMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    const a = stageActivation(sceneState.scroll, 3);
    const t = state.clock.elapsedTime;
    if (groupRef.current) groupRef.current.rotation.y += delta * (0.14 + a * 0.6);
    if (ringARef.current) ringARef.current.rotation.x += delta * (0.5 + a * 1.7);
    if (ringBRef.current) ringBRef.current.rotation.y -= delta * (0.42 + a * 1.5);
    if (ringCRef.current) ringCRef.current.rotation.z += delta * (0.3 + a * 1.1);
    if (nodeMatRef.current) {
      nodeMatRef.current.emissiveIntensity = 1 + a * 3 + Math.sin(t * 3) * 0.3;
      nodeMatRef.current.emissive.set(a > 0.5 ? PALETTE.emerald : PALETTE.indigoBright);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={ringARef}>
        <torusGeometry args={[1.45, 0.035, 10, Math.round(96 * detail)]} />
        <meshStandardMaterial
          color={PALETTE.emerald}
          emissive={PALETTE.emerald}
          emissiveIntensity={1.1}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      <mesh ref={ringBRef} rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[1.15, 0.026, 8, Math.round(80 * detail)]} />
        <meshStandardMaterial
          color={PALETTE.indigoBright}
          emissive={PALETTE.indigoBright}
          emissiveIntensity={0.9}
          roughness={0.35}
          metalness={0.55}
        />
      </mesh>
      <mesh ref={ringCRef} rotation={[0, Math.PI / 3, Math.PI / 4]}>
        <torusGeometry args={[0.88, 0.018, 8, Math.round(64 * detail)]} />
        <meshStandardMaterial
          color={PALETTE.violet}
          emissive={PALETTE.violet}
          emissiveIntensity={0.7}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial
          ref={nodeMatRef}
          color="#0d1a17"
          emissive={PALETTE.indigoBright}
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>
    </group>
  );
}

/** CLAIM — a reward vault whose two halves part as the camera arrives. */
function ClaimVault({ detail }: { detail: number }) {
  const topRef = useRef<THREE.Mesh>(null);
  const bottomRef = useRef<THREE.Mesh>(null);
  const prizeRef = useRef<THREE.Mesh>(null);
  const prizeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const a = stageActivation(sceneState.scroll, 4);
    const t = state.clock.elapsedTime;
    const open = a * 0.85;
    if (topRef.current)
      topRef.current.position.y = THREE.MathUtils.damp(topRef.current.position.y, 0.62 + open, 5, delta);
    if (bottomRef.current)
      bottomRef.current.position.y = THREE.MathUtils.damp(bottomRef.current.position.y, -0.62 - open, 5, delta);
    if (prizeRef.current) {
      prizeRef.current.rotation.y += delta * (0.3 + a * 1.4);
      const s = 0.5 + a * 0.42 + Math.sin(t * 2.2) * 0.03;
      prizeRef.current.scale.setScalar(s);
    }
    if (prizeMatRef.current) prizeMatRef.current.emissiveIntensity = 0.4 + a * 3.2;
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.12;
  });

  const segments = Math.max(8, Math.round(48 * detail));

  return (
    <group ref={groupRef}>
      <mesh ref={topRef} position={[0, 0.62, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 0.62, segments, 1, true, 0, Math.PI * 2]} />
        <meshStandardMaterial
          color="#141a2a"
          emissive={PALETTE.indigoDeep}
          emissiveIntensity={0.6}
          roughness={0.35}
          metalness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={bottomRef} position={[0, -0.62, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 0.62, segments, 1, true, 0, Math.PI * 2]} />
        <meshStandardMaterial
          color="#141a2a"
          emissive={PALETTE.indigoDeep}
          emissiveIntensity={0.6}
          roughness={0.35}
          metalness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={prizeRef}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          ref={prizeMatRef}
          color="#0d1a17"
          emissive={PALETTE.emerald}
          emissiveIntensity={0.8}
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>
    </group>
  );
}

const STAGE_COMPONENTS: Readonly<Record<PipelineStageId, React.ComponentType<{ detail: number }>>> = {
  join: JoinPortal,
  commit: CommitCube,
  select: SelectCore,
  prove: ProveRings,
  claim: ClaimVault,
};

/**
 * One stage of the JOIN → COMMIT → SELECT → PROVE → CLAIM pipeline.
 * Activation is read from the scene bridge inside `useFrame`, so scrolling
 * never triggers a React re-render.
 */
export function PipelineStage({ config, index, detail = 1 }: PipelineStageProps) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const Stage = STAGE_COMPONENTS[config.id];

  useFrame((_state, delta) => {
    const a = stageActivation(sceneState.scroll, index);
    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, -a * 0.12, 4, delta);
      const s = 0.9 + a * 0.1;
      groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, s, 5, delta));
    }
    if (haloMatRef.current) haloMatRef.current.opacity = 0.04 + a * 0.16;
    if (haloRef.current) haloRef.current.scale.setScalar(1 + a * 0.25);
  });

  return (
    <group position={[config.x, 0, 0]}>
      {/* Floor halo — anchors the object in space and marks the active stage. */}
      <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]}>
        <ringGeometry args={[1.5, 2.3, 48]} />
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

      <group ref={groupRef}>
        <Stage detail={detail} />
      </group>
    </group>
  );
}
