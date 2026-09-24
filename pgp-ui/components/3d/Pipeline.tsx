'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PIPELINE_STAGES, PipelineStage } from './PipelineStage';
import { PALETTE } from './palette';
import { sceneState } from '@/lib/scene';

interface PipelineProps {
  detail?: number;
}

/**
 * The full JOIN → COMMIT → SELECT → PROVE → CLAIM assembly, laid out along X at
 * the pipeline stage's world Y. A light rail connects the stages and brightens
 * under the currently active one, so the camera dolly reads as a journey.
 */
export function Pipeline({ detail = 1 }: PipelineProps) {
  const railMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_state, delta) => {
    // Position a travelling pulse at the active stage and fade it in/out.
    const active = sceneState.scroll >= 0.15 && sceneState.scroll <= 0.42;
    const x = THREE.MathUtils.mapLinear(
      THREE.MathUtils.clamp(sceneState.scroll, 0.235, 0.365),
      0.235,
      0.365,
      PIPELINE_STAGES[0].x,
      PIPELINE_STAGES[PIPELINE_STAGES.length - 1].x,
    );

    if (pulseRef.current) {
      pulseRef.current.position.x = THREE.MathUtils.damp(pulseRef.current.position.x, x, 4, delta);
      pulseRef.current.rotation.z += delta * 1.6;
    }
    if (pulseMatRef.current) {
      pulseMatRef.current.opacity = THREE.MathUtils.damp(pulseMatRef.current.opacity, active ? 0.5 : 0, 4, delta);
    }
    if (railMatRef.current) {
      railMatRef.current.opacity = THREE.MathUtils.damp(railMatRef.current.opacity, active ? 0.22 : 0.05, 3, delta);
    }
  });

  return (
    <group>
      {/* Connecting rail */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -2.1, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 18.5, 6, 1, true]} />
        <meshBasicMaterial
          ref={railMatRef}
          color={PALETTE.indigo}
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Travelling pulse marking the active stage */}
      <mesh ref={pulseRef} position={[0, -2.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.02, 8, 40]} />
        <meshBasicMaterial
          ref={pulseMatRef}
          color={PALETTE.indigoBright}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {PIPELINE_STAGES.map((config, index) => (
        <PipelineStage key={config.id} config={config} index={index} detail={detail} />
      ))}
    </group>
  );
}
