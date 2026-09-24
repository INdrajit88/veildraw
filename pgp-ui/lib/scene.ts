/**
 * Scene bridge — the single mutable channel between the DOM and the WebGL loop.
 *
 * The scroll story is driven by Framer Motion `MotionValue`s on the DOM side.
 * Writing those into React state would re-render the tree on every scroll frame,
 * so instead we publish into this plain object and read it inside `useFrame`.
 * Nothing here is reactive on purpose: it is a shared mutable buffer.
 */

/** Render-quality tiers, resolved once from device capability. */
export type QualityTier = 'high' | 'medium' | 'low' | 'minimal';

/**
 * World-space Y of each story stage. Stages are stacked vertically rather than
 * overlapping so the camera can physically travel between them and so off-stage
 * groups can be culled with `visible = false`.
 */
export const STAGE_Y = {
  core: 0,
  pipeline: -26,
  privacy: -52,
  explorer: -78,
  vault: -104,
} as const;

export type StageName = keyof typeof STAGE_Y;

/** One keyframe on the camera track. `t` is normalised 0..1 over the story. */
export interface CameraKey {
  t: number;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
}

/**
 * Camera choreography for the whole scroll story (GSAP-free).
 * Keys are interpolated linearly then damped in the frame loop, which gives the
 * smooth, heavy, "expensive" feel without a scroll-jacked timeline.
 */
export const CAMERA_TRACK: readonly CameraKey[] = [
  // ── 01 · ENTER — authored centred in world space. CameraRig applies the
  // aspect-aware lateral pan that clears the hero copy column on wide screens,
  // and the distance fit that keeps the subject inside a portrait frustum. ──
  { t: 0.0, position: [0, 0.55, 12.8], target: [0, 0, 0], fov: 42 },
  { t: 0.09, position: [0, 0.2, 11.2], target: [0, 0, 0], fov: 43 },

  // ── 02 · PIPELINE — dolly along JOIN → COMMIT → SELECT → PROVE → CLAIM ──
  { t: 0.17, position: [-2.0, STAGE_Y.pipeline + 1.6, 13.0], target: [0, STAGE_Y.pipeline, 0], fov: 52 },
  { t: 0.235, position: [-9.6, STAGE_Y.pipeline + 0.6, 5.4], target: [-8, STAGE_Y.pipeline, 0], fov: 50 },
  { t: 0.365, position: [9.6, STAGE_Y.pipeline + 0.6, 5.4], target: [8, STAGE_Y.pipeline, 0], fov: 50 },

  // ── 03 · PRIVACY — pulled back for the left/right comparison ────
  { t: 0.44, position: [0, STAGE_Y.privacy + 0.5, 14.5], target: [0, STAGE_Y.privacy, 0], fov: 50 },
  { t: 0.565, position: [0, STAGE_Y.privacy + 0.2, 11.5], target: [0, STAGE_Y.privacy, 0], fov: 48 },

  // ── 04 · EXPLORER — close on the floating glass giveaway ────────
  { t: 0.645, position: [0.5, STAGE_Y.explorer + 0.25, 7.2], target: [0, STAGE_Y.explorer, 0], fov: 40 },
  { t: 0.745, position: [-0.7, STAGE_Y.explorer - 0.35, 6.3], target: [0, STAGE_Y.explorer, 0], fov: 40 },

  // ── 05 · VAULT — approach, then push in as it opens ─────────────
  { t: 0.825, position: [0, STAGE_Y.vault + 1.8, 9.4], target: [0, STAGE_Y.vault, 0], fov: 46 },
  { t: 0.925, position: [0, STAGE_Y.vault + 0.5, 6.2], target: [0, STAGE_Y.vault, 0], fov: 42 },
  { t: 1.0, position: [0, STAGE_Y.vault + 0.2, 4.7], target: [0, STAGE_Y.vault, 0], fov: 38 },
];

/** Normalised scroll window in which each stage group is rendered at all. */
export const STAGE_WINDOWS: Readonly<Record<StageName, readonly [number, number]>> = {
  core: [0.0, 0.24],
  pipeline: [0.15, 0.42],
  privacy: [0.39, 0.63],
  explorer: [0.575, 0.8],
  vault: [0.755, 1.0],
};

/**
 * Normalised story progress at which the camera is centred on each pipeline
 * stage, derived from the camera keys at JOIN (t = 0.235) and CLAIM (t = 0.365).
 *
 * Lives here rather than in the 3D layer so the DOM stage labels can share the
 * exact same numbers without importing a module that pulls in three.js.
 */
export const STAGE_CENTRE_T: readonly [number, number, number, number, number] = [0.235, 0.2675, 0.3, 0.3325, 0.365];

/** 0..1 activation for a pipeline stage index at the current story progress. */
export function stageActivation(scroll: number, index: number): number {
  const centre = STAGE_CENTRE_T[index] ?? 0;
  const distance = Math.abs(scroll - centre);
  return Math.max(0, 1 - distance / 0.055);
}

/** Shared mutable frame state. Read in `useFrame`, written from the DOM. */
export interface SceneFrameState {
  /** Normalised story progress, 0..1, already damped. */
  scroll: number;
  /** Raw (undamped) story progress — used for gating so input feels immediate. */
  scrollRaw: number;
  /** Normalised pointer in -1..1, damped. */
  pointerX: number;
  pointerY: number;
  /** 0..1 — CTA activation: particles converge, core spins faster, shield brightens. */
  energy: number;
  /** 0..1 — the "Enter the Veil" draw sequence. */
  draw: number;
  /** 0..1 — vault spin-up derived from scroll position. */
  vault: number;
  /** 0..1 — DOM-initiated vault run; `vault` resolves to max(scroll, trigger). */
  vaultTrigger: number;
  /** 0..1 — camera push toward the core during the "Enter the Veil" sequence. */
  dolly: number;
  /** True when the viewer has asked for reduced motion. */
  reducedMotion: boolean;
}

export const sceneState: SceneFrameState = {
  scroll: 0,
  scrollRaw: 0,
  pointerX: 0,
  pointerY: 0,
  energy: 0,
  draw: 0,
  vault: 0,
  vaultTrigger: 0,
  dolly: 0,
  reducedMotion: false,
};

/** Particle budget per tier. Kept deliberately conservative — see `useDeviceQuality`. */
export const PARTICLE_BUDGET: Readonly<Record<QualityTier, number>> = {
  high: 6000,
  medium: 3200,
  low: 1400,
  // Not zero: `minimal` still paints one static frame under reduced motion, and
  // an empty environment would read as a broken page rather than a calm one.
  minimal: 900,
};

/** Device pixel ratio ceiling per tier. */
export const DPR_CEILING: Readonly<Record<QualityTier, number>> = {
  high: 1.9,
  medium: 1.5,
  low: 1.2,
  minimal: 1,
};

/** Instanced ticket-fragment count inside the vault, per tier. */
export const VAULT_TICKETS: Readonly<Record<QualityTier, number>> = {
  high: 260,
  medium: 150,
  low: 70,
  minimal: 60,
};

/** Data particles that stream toward — and dissolve against — the shield. */
export const SHIELD_MOTES: Readonly<Record<QualityTier, number>> = {
  high: 900,
  medium: 520,
  low: 240,
  minimal: 180,
};

/**
 * Interpolated camera pose for a given story progress.
 * Exported for reuse by tests and by the reduced-motion static pose.
 */
export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export function sampleCameraTrack(t: number, track: readonly CameraKey[] = CAMERA_TRACK): CameraPose {
  const clamped = Math.min(1, Math.max(0, t));
  if (track.length === 0) return { position: [0, 0, 10], target: [0, 0, 0], fov: 45 };

  let a = track[0];
  let b = track[track.length - 1];
  for (let i = 0; i < track.length - 1; i++) {
    if (clamped >= track[i].t && clamped <= track[i + 1].t) {
      a = track[i];
      b = track[i + 1];
      break;
    }
  }

  const span = b.t - a.t;
  const local = span <= 0 ? 0 : (clamped - a.t) / span;
  // Smoothstep between keys so direction changes ease instead of snapping.
  const k = local * local * (3 - 2 * local);

  return {
    position: [
      a.position[0] + (b.position[0] - a.position[0]) * k,
      a.position[1] + (b.position[1] - a.position[1]) * k,
      a.position[2] + (b.position[2] - a.position[2]) * k,
    ],
    target: [
      a.target[0] + (b.target[0] - a.target[0]) * k,
      a.target[1] + (b.target[1] - a.target[1]) * k,
      a.target[2] + (b.target[2] - a.target[2]) * k,
    ],
    fov: a.fov + (b.fov - a.fov) * k,
  };
}

/** True when a stage should be rendered at all — lets us skip whole subtrees. */
export function stageActive(t: number, window: readonly [number, number]): boolean {
  return t >= window[0] && t <= window[1];
}

/**
 * Smoothstep matching the GLSL builtin, shared by the DOM controllers and the
 * frame loop so both sides of the bridge ease identically.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
