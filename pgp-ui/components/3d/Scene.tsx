'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from './palette';
import { ParticleUniverse } from './ParticleUniverse';
import { CoinDraw } from './CoinDraw';
import { PrivacyComparison } from './PrivacyComparison';
import { Pipeline } from './Pipeline';
import { FloatingTicket } from './FloatingTicket';
import { GiveawayVault } from './GiveawayVault';
import {
  PARTICLE_BUDGET,
  SHIELD_MOTES,
  STAGE_WINDOWS,
  STAGE_Y,
  VAULT_TICKETS,
  sampleCameraTrack,
  sceneState,
  smoothstep,
  stageActive,
  type QualityTier,
  type StageName,
} from '@/lib/scene';

export interface SceneProps {
  quality: QualityTier;
  /** Real `winningCommitment` from the indexer; drives which vault fragment lights up. */
  seedHex?: string;
  /** Mirrors `prefers-reduced-motion`; freezes idle animation and switches to demand rendering. */
  reducedMotion?: boolean;
}

/** Per-tier detail multiplier for tessellation-heavy geometry. */
const DETAIL: Record<QualityTier, number> = { high: 1, medium: 0.8, low: 0.55, minimal: 0.4 };

/** Participants sharing coins into the hero draw pool, per tier. */
const DRAW_PARTICIPANTS: Record<QualityTier, number> = { high: 8, medium: 8, low: 6, minimal: 5 };

/** Trail points per in-flight coin; 0 disables trails entirely. */
const DRAW_TRAILS: Record<QualityTier, number> = { high: 6, medium: 5, low: 3, minimal: 0 };

/** Entry shards accumulated inside the draw vessel, per tier. */
const DRAW_SHARDS: Record<QualityTier, number> = { high: 18, medium: 14, low: 10, minimal: 8 };

/**
 * Stage groups in ref-slot order. Both `StageGates` and the stage groups index
 * into this one list, so the ordering can never drift apart.
 */
const STAGE_ORDER: readonly StageName[] = ['core', 'pipeline', 'privacy', 'explorer', 'vault'];

/**
 * Under reduced motion the canvas runs `frameloop="demand"` and paints a single
 * static pose, so the only thing that needs a new frame is a viewport resize.
 * Deliberately does not listen to scroll: the 3D stays still while the DOM
 * sections fade past it.
 */
function FrameInvalidator({ enabled }: { enabled: boolean }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!enabled) return;
    const request = () => invalidate();
    window.addEventListener('resize', request);
    request();
    return () => window.removeEventListener('resize', request);
  }, [invalidate, enabled]);

  return null;
}

/**
 * Drives the camera along the scroll track and keeps the scene bridge in sync.
 * Mounted once; owns no React state, so it never re-renders the tree.
 */
function CameraRig() {
  const camera = useThree((state) => state.camera);
  const lookAt = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());

  useFrame((_state, delta) => {
    // Damp toward the raw scroll value so the camera carries weight.
    const lambda = sceneState.reducedMotion ? 60 : 3.4;
    sceneState.scroll = THREE.MathUtils.damp(sceneState.scroll, sceneState.scrollRaw, lambda, delta);

    const pose = sampleCameraTrack(sceneState.scroll);
    const pointerScale = sceneState.reducedMotion ? 0 : 1;
    // "Enter the Veil" pushes the camera into the core without fighting the track.
    const dolly = THREE.MathUtils.clamp(sceneState.dolly, 0, 1);

    const aspect = camera instanceof THREE.PerspectiveCamera ? camera.aspect : 1;

    // A fixed vertical fov gives portrait screens a very narrow horizontal
    // frustum, so dolly back rather than crop the subject. Clamped to 1 on the
    // wide end so desktop keeps exactly the authored framing.
    const fit = THREE.MathUtils.clamp(1.25 / Math.max(0.4, aspect), 1, 2.1);

    // The hero copy sits in the left column on wide screens, so pan the world
    // right to clear it. Fades out before the pipeline, where the camera tracks
    // stage objects along X and any bias would desync it from the DOM labels.
    const heroFade = 1 - smoothstep(0.1, 0.18, sceneState.scroll);
    const lateral = THREE.MathUtils.clamp((aspect - 0.9) * 3.2, 0, 3.4) * heroFade;

    desired.current.set(
      pose.position[0] - lateral + sceneState.pointerX * 0.55 * pointerScale,
      pose.position[1] + sceneState.pointerY * 0.3 * pointerScale,
      pose.position[2] * fit * (1 - dolly * 0.34),
    );

    const camLambda = sceneState.reducedMotion ? 60 : 4.2;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, desired.current.x, camLambda, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desired.current.y, camLambda, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desired.current.z, camLambda, delta);

    lookAt.current.set(
      pose.target[0] - lateral + sceneState.pointerX * 0.22 * pointerScale,
      pose.target[1] + sceneState.pointerY * 0.12 * pointerScale,
      pose.target[2],
    );
    camera.lookAt(lookAt.current);

    if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - pose.fov) > 0.01) {
      camera.fov = THREE.MathUtils.damp(camera.fov, pose.fov, 4, delta);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

/** Advances bridge values that are derived from scroll rather than from the DOM. */
function SceneClock() {
  const keyLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((_state, delta) => {
    // The vault resolves as the story reaches its final act, unless the viewer
    // triggered the draw explicitly from the DOM.
    const fromScroll = smoothstep(0.8, 1, sceneState.scrollRaw);
    sceneState.vault = THREE.MathUtils.damp(
      sceneState.vault,
      Math.max(fromScroll, sceneState.vaultTrigger),
      2.2,
      delta,
    );

    // Key light leans with the cursor — subtle, but it sells the parallax.
    if (keyLightRef.current && !sceneState.reducedMotion) {
      keyLightRef.current.position.x = THREE.MathUtils.damp(
        keyLightRef.current.position.x,
        8 + sceneState.pointerX * 5,
        2,
        delta,
      );
      keyLightRef.current.position.y = THREE.MathUtils.damp(
        keyLightRef.current.position.y,
        9 + sceneState.pointerY * 3,
        2,
        delta,
      );
    }
  });

  return <directionalLight ref={keyLightRef} position={[8, 9, 10]} intensity={1.15} color={PALETTE.white} />;
}

/** Sets `visible` on each stage group so off-screen subtrees are never traversed. */
function StageGates({ refs }: { refs: React.RefObject<(THREE.Group | null)[]> }) {
  useFrame(() => {
    const groups = refs.current;
    if (!groups) return;
    const t = sceneState.scrollRaw;
    for (let i = 0; i < STAGE_ORDER.length; i++) {
      const group = groups[i];
      if (!group) continue;
      const [start, end] = STAGE_WINDOWS[STAGE_ORDER[i]];
      // Pad the window slightly so a stage never pops out while the damped
      // camera is still arriving.
      const active = stageActive(t, [start - 0.035, end + 0.035]);
      if (group.visible !== active) group.visible = active;
    }
  });

  return null;
}

/**
 * The persistent VeilDraw environment.
 *
 * Stages are stacked along Y and the camera flies between them, so one
 * continuous particle field carries the viewer through the whole story while
 * each act gets its own hero object.
 */
export function Scene({ quality, seedHex, reducedMotion = false }: SceneProps) {
  const stageRefs = useRef<(THREE.Group | null)[]>([]);

  // Stable ref callbacks — recreating them each render would detach and reattach
  // every stage group and drop the `visible` state StageGates maintains.
  const stageRefCallbacks = useMemo(
    () =>
      STAGE_ORDER.map((_, index) => (node: THREE.Group | null) => {
        stageRefs.current[index] = node;
      }),
    [],
  );

  const particles = PARTICLE_BUDGET[quality];
  const shieldMotes = SHIELD_MOTES[quality];
  const vaultTickets = VAULT_TICKETS[quality];
  const drawParticipants = DRAW_PARTICIPANTS[quality];
  const drawTrails = DRAW_TRAILS[quality];
  const drawShards = DRAW_SHARDS[quality];
  const detail = DETAIL[quality];

  return (
    <>
      <CameraRig />
      <SceneClock />
      <StageGates refs={stageRefs} />
      <FrameInvalidator enabled={reducedMotion} />

      <ambientLight intensity={0.4} />
      <hemisphereLight args={[PALETTE.indigoBright, PALETTE.void, 0.35]} />
      <pointLight
        position={[0, STAGE_Y.pipeline + 4, 6]}
        intensity={0.8}
        color={PALETTE.indigo}
        distance={30}
        decay={2}
      />

      {/* Persistent participant field, wrapped around the camera's Y. */}
      <ParticleUniverse count={particles} spread={[28, 16, 22]} size={1.5} opacity={0.9} />

      {/* ── 01 · ENTER ─────────────────────────────────────────────── */}
      <group ref={stageRefCallbacks[0]} position={[0, STAGE_Y.core, 0]}>
        {/* Participants sharing coins into the sealed draw. Extent stays inside
            the camera's visible height (~9.7 units at the hero pose) so the
            pool never crowds the copy column. */}
        <CoinDraw participants={drawParticipants} trails={drawTrails} shards={drawShards} />
      </group>

      {/* ── 02 · PIPELINE ──────────────────────────────────────────── */}
      <group ref={stageRefCallbacks[1]} position={[0, STAGE_Y.pipeline, 0]}>
        <Pipeline detail={detail} />
      </group>

      {/* ── 03 · PRIVACY ───────────────────────────────────────────── */}
      <group ref={stageRefCallbacks[2]} position={[0, STAGE_Y.privacy, 0]}>
        <PrivacyComparison
          leaks={Math.round(shieldMotes * 0.55)}
          motes={Math.round(shieldMotes * 0.7)}
          // Narrow viewports get a tighter split so both sides stay in frame even
          // after the aspect-aware dolly-back.
          offset={quality === 'high' || quality === 'medium' ? 5.4 : 3.4}
          detail={detail}
        />
      </group>

      {/* ── 04 · EXPLORER ──────────────────────────────────────────── */}
      <group ref={stageRefCallbacks[3]} position={[0, STAGE_Y.explorer, 0]}>
        {/* The central slab backs the real giveaway card rendered in the DOM. */}
        <FloatingTicket
          width={5.4}
          height={3.3}
          radius={0.22}
          reactivity={0.7}
          glow={0.75}
          motes={Math.round(particles * 0.02)}
        />
        {/* Ambient depth — deliberately blank, these are atmosphere not data. */}
        <group position={[-4.6, 1.1, -3.4]} rotation={[0, 0.42, 0.06]}>
          <FloatingTicket width={3.2} height={2} radius={0.18} reactivity={1.3} glow={0.28} />
        </group>
        <group position={[4.7, -0.9, -4.2]} rotation={[0, -0.4, -0.05]}>
          <FloatingTicket width={3.4} height={2.1} radius={0.18} reactivity={1.15} glow={0.24} tint={PALETTE.violet} />
        </group>
        <group position={[2.9, 2.2, -6.2]} rotation={[0.1, -0.2, 0.1]}>
          <FloatingTicket width={2.6} height={1.6} radius={0.16} reactivity={1.6} glow={0.16} />
        </group>
      </group>

      {/* ── 05 · VAULT ─────────────────────────────────────────────── */}
      <group ref={stageRefCallbacks[4]} position={[0, STAGE_Y.vault, 0]}>
        <GiveawayVault
          tickets={vaultTickets}
          seedHex={seedHex}
          streams={Math.round(shieldMotes * 0.4)}
          detail={detail}
        />
      </group>
    </>
  );
}
