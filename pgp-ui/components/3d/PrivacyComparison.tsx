'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE, COLOR } from './palette';
import { PrivacyShield } from './PrivacyShield';
import { MoteField } from './MoteField';

interface PrivacyComparisonProps {
  /** Outbound leak motes on the traditional side. */
  leaks?: number;
  /** Inbound motes on the VeilDraw side. */
  motes?: number;
  /** Horizontal offset of each side from centre. */
  offset?: number;
  detail?: number;
}

/** TRADITIONAL GIVEAWAY — an exposed node with data streaming out of it. */
function ExposedNode({ leaks, detail }: { leaks: number; detail: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const cageRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.16;
      groupRef.current.position.y = Math.sin(t * 0.7) * 0.07;
    }
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.3;
      coreRef.current.rotation.z -= delta * 0.22;
    }
    if (coreMatRef.current) coreMatRef.current.emissiveIntensity = 1.1 + Math.sin(t * 2.6) * 0.35;
    if (cageRef.current) cageRef.current.rotation.y -= delta * 0.4;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <boxGeometry args={[0.78, 0.78, 0.78]} />
        <meshStandardMaterial
          ref={coreMatRef}
          color="#2a1420"
          emissive={PALETTE.rose}
          emissiveIntensity={1.2}
          roughness={0.3}
          metalness={0.55}
        />
      </mesh>
      {/* Broken cage — the container that fails to hold identity in. */}
      <mesh ref={cageRef}>
        <boxGeometry args={[1.32, 1.32, 1.32]} />
        <meshBasicMaterial color={PALETTE.rose} wireframe transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <MoteField
        count={leaks}
        radius={0.95}
        direction="outbound"
        speed={0.095}
        size={1.05}
        opacity={0.6}
        color={COLOR.rose}
        impactColor={COLOR.slate}
      />
      <pointLight color={PALETTE.rose} intensity={1.4} distance={7} decay={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.05, 0]}>
        <ringGeometry args={[0.9, 2.2, Math.round(48 * detail)]} />
        <meshBasicMaterial
          color={PALETTE.rose}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** VEIL — the same node, sealed: inbound data dissolves at the boundary. */
function SealedNode({ motes, detail }: { motes: number; detail: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y -= delta * 0.1;
      groupRef.current.position.y = Math.sin(t * 0.6 + 1.4) * 0.07;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.4;
      coreRef.current.rotation.x += delta * 0.18;
    }
    if (coreMatRef.current) coreMatRef.current.emissiveIntensity = 1.3 + Math.sin(t * 1.8) * 0.3;
  });

  return (
    <group ref={groupRef}>
      <PrivacyShield radius={1.85} motes={motes} inner={false} />
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial
          ref={coreMatRef}
          color={PALETTE.indigoDeep}
          emissive={PALETTE.indigoBright}
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.05, 0]}>
        <ringGeometry args={[0.9, 2.2, Math.round(48 * detail)]} />
        <meshBasicMaterial
          color={PALETTE.indigo}
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/**
 * Section 3 — the privacy comparison.
 *
 * Left: data leaves the participant and dissipates into the open.
 * Right: data reaches the boundary and is absorbed; identity stays inside.
 * The DOM layer supplies the labels so both sides remain readable and accessible.
 */
export function PrivacyComparison({ leaks = 0, motes = 0, offset = 5.4, detail = 1 }: PrivacyComparisonProps) {
  return (
    <group>
      <group position={[-offset, 0, 0]}>
        <ExposedNode leaks={leaks} detail={detail} />
      </group>
      <group position={[offset, 0, 0]}>
        <SealedNode motes={motes} detail={detail} />
      </group>

      {/* Divider filament between the two models. */}
      <mesh position={[0, 0, -1.6]}>
        <cylinderGeometry args={[0.006, 0.006, 5.4, 4, 1, true]} />
        <meshBasicMaterial color={PALETTE.slate} transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  );
}
