'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createShieldMaterial } from './shieldMaterial';
import { COLOR, PALETTE } from './palette';
import { sceneState } from '@/lib/scene';

interface CoinDrawProps {
  /** Anonymous participant nodes orbiting the draw; one coin slot each. */
  participants?: number;
  /** Trail points per in-flight coin (head + ghosts); 0 disables trails. */
  trails?: number;
  /** Entry shards that accumulate inside the vessel as coins are absorbed. */
  shards?: number;
}

const RING_RADIUS = 3.55;
const VESSEL_RADIUS = 1.02;
const RIPPLES = 4;
const RIPPLE_LIFE = 0.7;

const STATE_REST = 0;
const STATE_CHARGE = 1;
const STATE_FLY = 2;

interface CoinSlot {
  owner: number;
  state: number;
  timer: number;
  p: number;
  dur: number;
  c1: THREE.Vector3;
  c2: THREE.Vector3;
  target: THREE.Vector3;
  rotation: THREE.Euler;
  spin: THREE.Vector3;
}

interface Ripple {
  active: boolean;
  age: number;
}

function easeFlight(p: number): number {
  // Slow launch, fast impact — the coin falls into the draw rather than gliding.
  return 1 - Math.cos(THREE.MathUtils.clamp(p, 0, 1) * Math.PI * 0.5);
}

function cubicBezier(
  p0: THREE.Vector3,
  c1: THREE.Vector3,
  c2: THREE.Vector3,
  p3: THREE.Vector3,
  t: number,
  out: THREE.Vector3,
): THREE.Vector3 {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return out.set(
    a * p0.x + b * c1.x + c * c2.x + d * p3.x,
    a * p0.y + b * c1.y + c * c2.y + d * p3.y,
    a * p0.z + b * c1.z + c * c2.z + d * p3.z,
  );
}

/**
 * The Draw Pool — hero stage object.
 *
 * Anonymous participants orbit a sealed glass vessel and share coins into it:
 * each node charges, launches a coin along an arced bezier, and the coin is
 * absorbed with a ripple while an entry shard lights up inside the shell.
 * Nothing about *who* sent a coin is encoded — only that an entry landed.
 *
 * CTA hover (`energy`) and the "Enter the Veil" sequence (`draw`) speed up
 * emission and brighten the vessel, matching the rest of the scene bridge.
 */
export function CoinDraw({ participants = 8, trails = 6, shards = 18 }: CoinDrawProps) {
  const count = Math.max(1, Math.floor(participants));
  const trailCount = Math.max(0, Math.floor(trails));
  const shardCount = Math.max(0, Math.floor(shards));

  const spinRef = useRef<THREE.Group>(null);
  const coinsRef = useRef<THREE.InstancedMesh>(null);
  const shardsRef = useRef<THREE.InstancedMesh>(null);
  const trailRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const participantRefs = useRef<(THREE.Group | null)[]>([]);
  const orbRefs = useRef<(THREE.Mesh | null)[]>([]);
  const haloRefs = useRef<(THREE.Mesh | null)[]>([]);
  const rippleRefs = useRef<(THREE.Mesh | null)[]>([]);

  const shell = useMemo(() => createShieldMaterial({ intensity: 0.55, color: COLOR.indigoDeep, rim: COLOR.ice }), []);
  useEffect(() => () => shell.material.dispose(), [shell]);

  /** Participant home positions on a gently uneven ring. */
  const bases = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + 0.4;
        return new THREE.Vector3(
          Math.cos(angle) * RING_RADIUS,
          Math.sin(i * 2.4) * 0.55,
          Math.sin(angle) * RING_RADIUS,
        );
      }),
    [count],
  );

  const slots = useMemo<CoinSlot[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        owner: i,
        state: STATE_FLY,
        timer: 0,
        // Pre-seeded mid-flight so the very first frame already shows sharing.
        p: (i * 0.17) % 0.7,
        dur: 2.2,
        c1: new THREE.Vector3(),
        c2: new THREE.Vector3(),
        target: new THREE.Vector3(),
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        spin: new THREE.Vector3(),
      })),
    [count],
  );

  const ripples = useMemo<Ripple[]>(() => Array.from({ length: RIPPLES }, () => ({ active: false, age: 0 })), []);
  const shardFlash = useMemo(() => new Float32Array(shardCount), [shardCount]);
  const glow = useMemo(() => new Float32Array(count), [count]);
  const pop = useMemo(() => new Float32Array(count), [count]);

  const trailPositions = useMemo(() => new Float32Array(count * trailCount * 3), [count, trailCount]);
  const trailColors = useMemo(() => new Float32Array(count * trailCount * 3), [count, trailCount]);

  /** Faint standing arcs so the eye reads each participant's path to the draw. */
  const arcs = useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(PALETTE.indigo),
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const center = new THREE.Vector3();
    return bases.map((base) => {
      const c1 = base.clone().multiplyScalar(1.1);
      c1.y += 1.3;
      const c2 = base.clone().setY(0).normalize().multiplyScalar(0.7);
      c2.y += 0.6;
      const curve = new THREE.CubicBezierCurve3(base.clone(), c1, c2, center.clone());
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(28)), material);
    });
  }, [bases]);

  useEffect(
    () => () => {
      arcs.forEach((line) => line.geometry.dispose());
      arcs[0]?.material.dispose();
    },
    [arcs],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  const tmpVec2 = useMemo(() => new THREE.Vector3(), []);
  const zAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  const charge = useRef(0.35);
  const pulse = useRef(0);
  const absorbed = useRef(0);
  const staticPose = useRef(false);

  const setParticipantRef = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => (node: THREE.Group | null) => {
        participantRefs.current[i] = node;
      }),
    [count],
  );
  const setOrbRef = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => (node: THREE.Mesh | null) => {
        orbRefs.current[i] = node;
      }),
    [count],
  );
  const setHaloRef = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => (node: THREE.Mesh | null) => {
        haloRefs.current[i] = node;
      }),
    [count],
  );
  const setRippleRef = useMemo(
    () =>
      Array.from({ length: RIPPLES }, (_, i) => (node: THREE.Mesh | null) => {
        rippleRefs.current[i] = node;
      }),
    [],
  );

  // Seed shard colours once so flashes have a base to multiply.
  useEffect(() => {
    const mesh = shardsRef.current;
    if (!mesh || shardCount === 0) return;
    for (let i = 0; i < shardCount; i++) {
      tmpColor.set(i % 4 === 0 ? PALETTE.violet : PALETTE.indigoBright);
      mesh.setColorAt(i, tmpColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [shardCount, tmpColor]);

  useEffect(() => {
    if (coinsRef.current) coinsRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (shardsRef.current) shardsRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, [count, shardCount]);

  /** Arm a coin's arc from its owner's home position into the vessel. */
  const launch = (slot: CoinSlot) => {
    const base = bases[slot.owner];
    slot.target.set((Math.random() - 0.5) * 0.34, (Math.random() - 0.5) * 0.34, (Math.random() - 0.5) * 0.34);
    slot.c1.copy(base).multiplyScalar(1.1);
    slot.c1.y += 1.1 + Math.random() * 0.55;
    slot.c2.copy(slot.target).addScaledVector(tmpVec.copy(base).setY(0).normalize(), 0.7);
    slot.c2.y += 0.45 + Math.random() * 0.35;
    slot.spin.set(2 + Math.random() * 4, 2 + Math.random() * 4, Math.random() * 3);
    slot.dur = 1.9 + Math.random() * 0.8;
    slot.p = 0;
    slot.state = STATE_FLY;
  };

  const spawnRipple = (direction: THREE.Vector3) => {
    for (let i = 0; i < RIPPLES; i++) {
      if (ripples[i].active) continue;
      ripples[i].active = true;
      ripples[i].age = 0;
      const mesh = rippleRefs.current[i];
      if (mesh) {
        mesh.visible = true;
        mesh.quaternion.setFromUnitVectors(zAxis, tmpVec2.copy(direction).normalize());
      }
      return;
    }
  };

  const absorb = (slot: CoinSlot) => {
    cubicBezier(bases[slot.owner], slot.c1, slot.c2, slot.target, easeFlight(0.9), tmpVec);
    tmpVec2.copy(slot.target).sub(tmpVec);
    spawnRipple(tmpVec2);
    charge.current = Math.min(1.4, charge.current + 0.22);
    pulse.current = 1;
    if (absorbed.current < shardCount) {
      shardFlash[absorbed.current] = 1;
      absorbed.current += 1;
    }
    pop[slot.owner] = Math.min(1, pop[slot.owner] + 0.7);
  };

  useFrame((state, delta) => {
    const reduced = sceneState.reducedMotion;
    const dt = Math.min(delta, 0.05);
    const t = reduced ? 14 : state.clock.elapsedTime;
    const energy = Math.min(1, sceneState.energy * 0.75 + sceneState.draw);

    // ── Reduced motion: one deterministic composed frame, then idle. ──
    if (reduced) {
      if (staticPose.current) return;
      slots.forEach((slot, i) => {
        launch(slot);
        slot.p = 0.22 + (i % 5) * 0.16;
      });
      charge.current = 0.55;
      absorbed.current = Math.min(shardCount, Math.floor(shardCount * 0.6));
      renderCoins(t);
      renderTrails();
      renderParticipants(t, 0);
      renderVessel(t, 0, 0.15);
      renderRipples(0);
      staticPose.current = true;
      return;
    }
    staticPose.current = false;

    // ── Emission state machine ────────────────────────────────────────
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.state === STATE_REST) {
        slot.timer -= dt;
        if (slot.timer <= 0) {
          slot.state = STATE_CHARGE;
          slot.timer = 0.5 * (1 - energy * 0.3);
        }
      } else if (slot.state === STATE_CHARGE) {
        glow[i] = 1 - THREE.MathUtils.clamp(slot.timer / 0.5, 0, 1);
        slot.timer -= dt;
        if (slot.timer <= 0) {
          launch(slot);
          pop[i] = 1;
          glow[i] = 0;
        }
      } else {
        slot.p += dt / (slot.dur * (1 - energy * 0.25));
        slot.rotation.x += dt * slot.spin.x;
        slot.rotation.y += dt * slot.spin.y;
        slot.rotation.z += dt * slot.spin.z;
        if (slot.p >= 1) {
          absorb(slot);
          slot.state = STATE_REST;
          slot.timer = (0.9 + Math.random() * 2.4) * (1 - energy * 0.55);
        }
      }
    }

    charge.current += (0.35 - charge.current) * Math.min(1, dt * 0.6);
    pulse.current = Math.max(0, pulse.current - dt * 2.2);
    for (let i = 0; i < count; i++) {
      pop[i] = Math.max(0, pop[i] - dt * 2.6);
      if (slots[i].state !== STATE_CHARGE) glow[i] = Math.max(0, glow[i] - dt * 3);
    }
    for (let i = 0; i < shardCount; i++) shardFlash[i] = Math.max(0, shardFlash[i] - dt * 1.8);

    renderCoins(t);
    renderTrails();
    renderParticipants(t, dt);
    renderVessel(t, dt, energy);
    renderRipples(dt);
  });

  /** Write coin instance matrices along their arcs. */
  const renderCoins = (t: number) => {
    const mesh = coinsRef.current;
    if (!mesh) return;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.state !== STATE_FLY) {
        dummy.position.set(0, 0, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }
      const eased = easeFlight(slot.p);
      cubicBezier(bases[slot.owner], slot.c1, slot.c2, slot.target, eased, dummy.position);
      const grow = THREE.MathUtils.smoothstep(slot.p, 0, 0.08);
      const shrink = 1 - THREE.MathUtils.smoothstep(slot.p, 0.9, 1) * 0.55;
      dummy.rotation.copy(slot.rotation);
      dummy.scale.setScalar(0.95 * grow * shrink * (1 + Math.sin(t * 9 + i) * 0.04));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  /** Head + ghost trail points, additive-faded toward black. */
  const renderTrails = () => {
    if (trailCount === 0 || !trailRef.current) return;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      for (let g = 0; g < trailCount; g++) {
        const idx = (i * trailCount + g) * 3;
        if (slot.state !== STATE_FLY) {
          trailColors[idx] = 0;
          trailColors[idx + 1] = 0;
          trailColors[idx + 2] = 0;
          continue;
        }
        const pr = slot.p - g * 0.055;
        if (pr <= 0) {
          trailColors[idx] = 0;
          trailColors[idx + 1] = 0;
          trailColors[idx + 2] = 0;
          continue;
        }
        cubicBezier(bases[slot.owner], slot.c1, slot.c2, slot.target, easeFlight(pr), tmpVec);
        trailPositions[idx] = tmpVec.x;
        trailPositions[idx + 1] = tmpVec.y;
        trailPositions[idx + 2] = tmpVec.z;
        const fade = Math.pow(1 - g / trailCount, 1.7) * (g === 0 ? 1.5 : 0.85);
        tmpColor.set(PALETTE.indigoBright).multiplyScalar(fade);
        trailColors[idx] = tmpColor.r;
        trailColors[idx + 1] = tmpColor.g;
        trailColors[idx + 2] = tmpColor.b;
      }
    }
    const geometry = trailRef.current.geometry;
    (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  };

  /** Participant charge glow, emit pop and lean toward the draw. */
  const renderParticipants = (t: number, dt: number) => {
    for (let i = 0; i < count; i++) {
      const group = participantRefs.current[i];
      const orb = orbRefs.current[i];
      const halo = haloRefs.current[i];
      if (group) {
        const lean = glow[i] * 0.14 + pop[i] * 0.06;
        group.position.set(
          bases[i].x * (1 - lean),
          bases[i].y + Math.sin(t * 0.7 + i * 1.7) * 0.06,
          bases[i].z * (1 - lean),
        );
      }
      if (orb) {
        const material = orb.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 1.15 + glow[i] * 1.7 + pop[i] * 1.4;
        orb.scale.setScalar(1 + pop[i] * 0.35);
      }
      if (halo) {
        halo.rotation.z += dt * 0.6;
        halo.rotation.x += dt * 0.25;
        const material = halo.material as THREE.MeshBasicMaterial;
        material.opacity = 0.26 + glow[i] * 0.4 + pop[i] * 0.3;
      }
    }
  };

  /** Vessel glow, rings, light and the accumulated entry shards. */
  const renderVessel = (t: number, dt: number, energy: number) => {
    if (spinRef.current) spinRef.current.rotation.y += dt * (0.05 + energy * 0.14);
    if (ringARef.current) ringARef.current.rotation.z += dt * (0.5 + energy * 2.2);
    if (ringBRef.current) ringBRef.current.rotation.z -= dt * (0.32 + energy * 1.4);

    if (coreRef.current) {
      coreRef.current.rotation.y -= dt * (0.4 + energy * 1.6);
      coreRef.current.rotation.x += dt * 0.22;
      const swell = 1 + pulse.current * 0.18 + energy * 0.1;
      coreRef.current.scale.setScalar(swell);
    }
    if (coreMatRef.current) {
      coreMatRef.current.emissiveIntensity = 1.2 + charge.current * 2.4 + pulse.current * 2.2 + energy * 1.8;
    }
    if (glowRef.current) {
      glowRef.current.intensity = THREE.MathUtils.damp(
        glowRef.current.intensity,
        1.6 + charge.current * 4 + pulse.current * 5 + energy * 3,
        5,
        dt,
      );
    }

    shell.uniforms.uTime.value = t;
    shell.uniforms.uIntensity.value = THREE.MathUtils.damp(
      shell.uniforms.uIntensity.value,
      0.5 + charge.current * 0.45 + energy * 0.6,
      4,
      dt,
    );

    const mesh = shardsRef.current;
    if (mesh && shardCount > 0) {
      for (let i = 0; i < shardCount; i++) {
        if (i >= absorbed.current) {
          dummy.scale.setScalar(0);
          dummy.position.set(0, 0, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
        const angle = i * 2.39996323 + t * (0.25 + (i % 5) * 0.06);
        const radius = 0.42 + (((i * 37) % 100) / 100) * 0.28;
        dummy.position.set(
          Math.cos(angle) * radius,
          (((i * 53) % 100) / 100 - 0.5) * 0.9 + Math.sin(t * 0.6 + i) * 0.05,
          Math.sin(angle) * radius,
        );
        dummy.rotation.set(angle * 0.7, angle, t * 0.3 + i);
        dummy.scale.setScalar(0.9 + shardFlash[i] * 0.9);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        tmpColor.set(i % 4 === 0 ? PALETTE.violet : PALETTE.indigoBright);
        tmpColor.multiplyScalar(0.4 + shardFlash[i] * 2.4 + energy * 0.25);
        mesh.setColorAt(i, tmpColor);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  };

  /** Expanding absorption rings at the vessel mouth. */
  const renderRipples = (dt: number) => {
    for (let i = 0; i < RIPPLES; i++) {
      const ripple = ripples[i];
      const mesh = rippleRefs.current[i];
      if (!mesh) continue;
      if (!ripple.active) continue;
      ripple.age += dt;
      if (ripple.age >= RIPPLE_LIFE) {
        ripple.active = false;
        mesh.visible = false;
        continue;
      }
      const k = ripple.age / RIPPLE_LIFE;
      const scale = 0.5 + k * 1.5;
      mesh.scale.setScalar(scale);
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.45;
    }
  };

  return (
    <group rotation={[-0.14, 0, 0.06]}>
      <group ref={spinRef}>
        {/* Standing arcs — the paths coins travel */}
        {arcs.map((line, i) => (
          <primitive key={i} object={line} />
        ))}

        {/* Anonymous participants */}
        {bases.map((base, i) => (
          <group key={i} ref={setParticipantRef[i]} position={base}>
            <mesh ref={setOrbRef[i]}>
              <sphereGeometry args={[0.13, 20, 20]} />
              <meshStandardMaterial
                color={PALETTE.indigoDeep}
                emissive={PALETTE.indigoBright}
                emissiveIntensity={1.15}
                roughness={0.25}
                metalness={0.5}
              />
            </mesh>
            <mesh ref={setHaloRef[i]} rotation={[Math.PI / 2.2, 0, 0]}>
              <torusGeometry args={[0.24, 0.006, 6, 48]} />
              <meshBasicMaterial
                color={PALETTE.indigo}
                transparent
                opacity={0.26}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}

        {/* Sealed draw vessel */}
        <group>
          <mesh>
            <sphereGeometry args={[VESSEL_RADIUS, 48, 32]} />
            <primitive object={shell.material} attach="material" />
          </mesh>
          <mesh ref={coreRef}>
            <icosahedronGeometry args={[0.34, 0]} />
            <meshStandardMaterial
              ref={coreMatRef}
              color={PALETTE.indigoDeep}
              emissive={PALETTE.indigo}
              emissiveIntensity={1.2}
              roughness={0.16}
              metalness={0.7}
              flatShading
            />
          </mesh>
          <mesh ref={ringARef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.006, 6, 128]} />
            <meshBasicMaterial
              color={PALETTE.ice}
              transparent
              opacity={0.4}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={ringBRef} rotation={[Math.PI / 2.15, 0.4, 0]}>
            <torusGeometry args={[1.38, 0.005, 6, 128]} />
            <meshBasicMaterial
              color={PALETTE.violet}
              transparent
              opacity={0.28}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>

          {/* Accumulated private entries */}
          {shardCount > 0 && (
            <instancedMesh ref={shardsRef} args={[undefined, undefined, shardCount]} frustumCulled={false}>
              <octahedronGeometry args={[0.08, 0]} />
              <meshBasicMaterial
                transparent
                opacity={0.9}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </instancedMesh>
          )}

          <pointLight ref={glowRef} color={PALETTE.indigo} intensity={1.6} distance={9} decay={2} />
        </group>

        {/* Shared coins in flight */}
        <instancedMesh ref={coinsRef} args={[undefined, undefined, count]} frustumCulled={false}>
          <cylinderGeometry args={[0.11, 0.11, 0.032, 24]} />
          <meshStandardMaterial
            color={PALETTE.ice}
            emissive={PALETTE.indigo}
            emissiveIntensity={1.1}
            roughness={0.3}
            metalness={0.6}
            toneMapped={false}
          />
        </instancedMesh>

        {/* Coin trails */}
        {trailCount > 0 && (
          <points ref={trailRef} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
              <bufferAttribute attach="attributes-color" args={[trailColors, 3]} />
            </bufferGeometry>
            <pointsMaterial
              size={0.075}
              vertexColors
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
              sizeAttenuation
            />
          </points>
        )}

        {/* Absorption ripples */}
        {ripples.map((_, i) => (
          <mesh key={i} ref={setRippleRef[i]} visible={false} frustumCulled={false}>
            <ringGeometry args={[0.88, 0.94, 48]} />
            <meshBasicMaterial
              color={PALETTE.indigoBright}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
