'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from './palette';
import { sceneState } from '@/lib/scene';

interface FloatingTicketProps {
  width?: number;
  height?: number;
  radius?: number;
  /** 0..1 — how strongly this slab reacts to the cursor. */
  reactivity?: number;
  /** 0..1 — base brightness of the edge glow. */
  glow?: number;
  /** Number of internal particles; 0 disables them. */
  motes?: number;
  tint?: string;
}

/** Rounded-rectangle panel shape, rebuilt only when dimensions change. */
function useRoundedRect(width: number, height: number, radius: number) {
  return useMemo(() => {
    const w = Math.max(0.01, width);
    const h = Math.max(0.01, height);
    const r = THREE.MathUtils.clamp(radius, 0.001, Math.min(w, h) / 2 - 0.001);
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;

    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    return shape;
  }, [width, height, radius]);
}

/**
 * A physical glass slab floating in the environment.
 *
 * Deliberately carries no text: every string in the explorer section is real
 * on-chain data rendered in the DOM, so it stays selectable, translatable and
 * screen-reader reachable. The slab is the object; the DOM is the label.
 */
export function FloatingTicket({
  width = 3.4,
  height = 2.1,
  radius = 0.16,
  reactivity = 1,
  glow = 0.5,
  motes = 0,
  tint = PALETTE.indigo,
}: FloatingTicketProps) {
  const groupRef = useRef<THREE.Group>(null);
  const edgeRef = useRef<THREE.LineLoop>(null);
  const edgeMatRef = useRef<THREE.LineBasicMaterial>(null);
  const fillMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const motesRef = useRef<THREE.Points>(null);

  const shape = useRoundedRect(width, height, radius);

  const fillGeometry = useMemo(() => new THREE.ShapeGeometry(shape, 12), [shape]);
  const edgeGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(shape.getPoints(28)), [shape]);

  const moteGeometry = useMemo(() => {
    const n = Math.max(0, Math.floor(motes));
    if (n === 0) return null;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * width * 0.9;
      pos[i * 3 + 1] = (Math.random() - 0.5) * height * 0.9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [motes, width, height]);

  useEffect(
    () => () => {
      fillGeometry.dispose();
      edgeGeometry.dispose();
      moteGeometry?.dispose();
    },
    [fillGeometry, edgeGeometry, moteGeometry],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      // Tilt toward the cursor and float; damping keeps it smooth, never twitchy.
      const targetX = -sceneState.pointerY * 0.22 * reactivity;
      const targetY = sceneState.pointerX * 0.3 * reactivity;
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetX, 3, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetY, 3, delta);
      groupRef.current.position.y = Math.sin(t * 0.6) * 0.09 * reactivity;
      groupRef.current.position.z = Math.sin(t * 0.4 + 1.1) * 0.06 * reactivity;
    }

    const lift = 0.5 + Math.abs(sceneState.pointerX) * 0.5 * reactivity;
    if (edgeMatRef.current) {
      edgeMatRef.current.opacity = THREE.MathUtils.damp(
        edgeMatRef.current.opacity,
        glow * (0.45 + lift * 0.55),
        4,
        delta,
      );
    }
    if (fillMatRef.current) {
      fillMatRef.current.opacity = 0.07 + lift * 0.05;
    }
    if (motesRef.current) {
      motesRef.current.rotation.z += delta * 0.05;
      const mat = motesRef.current.material as THREE.PointsMaterial;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, 0.18 + lift * 0.5, 4, delta);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={fillGeometry}>
        <meshPhysicalMaterial
          ref={fillMatRef}
          color="#0a0e1a"
          roughness={0.12}
          metalness={0.35}
          clearcoat={0.9}
          clearcoatRoughness={0.15}
          transparent
          opacity={0.09}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <lineLoop ref={edgeRef} geometry={edgeGeometry}>
        <lineBasicMaterial ref={edgeMatRef} color={tint} transparent opacity={glow * 0.5} depthWrite={false} />
      </lineLoop>

      {moteGeometry && (
        <points ref={motesRef} geometry={moteGeometry} frustumCulled={false}>
          <pointsMaterial
            color={PALETTE.ice}
            size={0.028}
            transparent
            opacity={0.2}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </group>
  );
}
