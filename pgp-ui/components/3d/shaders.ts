/**
 * GLSL for the VeilDraw immersive scene.
 *
 * Every animated quantity lives in a uniform or a per-particle attribute, so a
 * frame costs one uniform upload per system rather than a CPU buffer rewrite.
 * Written in GLSL ES 1.00 (attribute/varying/gl_FragColor) — accepted by both
 * WebGL1 and WebGL2 contexts and the safest baseline across browsers.
 *
 * No `precision` qualifier appears in any fragment shader here, deliberately:
 * three.js prepends its own default precision to both stages, and declaring a
 * different one makes every shared uniform mismatch between vertex and
 * fragment, which fails program validation at link time.
 */

/** Soft round sprite with a hot core — shared by every point system. */
const POINT_FRAGMENT_BODY = /* glsl */ `
  vec2 puv = gl_PointCoord - 0.5;
  float d = length(puv);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  float glow = pow(core, 2.4);
`;

// ─────────────────────────────────────────────────────────────────────────────
// Particle universe — participants as abstract points
// ─────────────────────────────────────────────────────────────────────────────

export const PARTICLE_VERTEX = /* glsl */ `
attribute vec3 aSeed;
attribute float aSize;
attribute float aTint;

uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uConverge;
uniform float uEnergy;
uniform vec2 uPointer;
uniform float uCenterY;
uniform vec3 uSpread;
uniform float uOpacity;

varying float vTint;
varying float vAlpha;

void main() {
  vec3 p = position;

  float speed = 0.055 + aSeed.z * 0.1 + uEnergy * 0.5;
  float t = uTime * speed;
  float sx = aSeed.x * 6.2831853;
  float sy = aSeed.y * 6.2831853;
  float sz = aSeed.z * 6.2831853;

  // Slow organic drift — two out-of-phase sines per axis.
  p.x += sin(t + sx) * (0.35 + aSeed.y * 0.55);
  p.y += cos(t * 0.85 + sy) * (0.30 + aSeed.z * 0.50);
  p.z += sin(t * 0.70 + sz) * (0.35 + aSeed.x * 0.55);

  // Occasional clustering: a fraction of the field gathers onto sparse lattice
  // anchors, then releases. The phase is per-particle so clusters breathe
  // asynchronously instead of pulsing as one block.
  float clusterPhase = sin(uTime * 0.13 + sy) * 0.5 + 0.5;
  float isClustered = step(0.74, aSeed.x);
  vec3 anchor = (floor(position / 9.0) + 0.5) * 9.0;
  p = mix(p, anchor + (aSeed - 0.5) * 2.6, isClustered * clusterPhase * 0.85);

  // CTA activation pulls the field into the core at the origin.
  p = mix(p, vec3(0.0), uConverge * (0.55 + aSeed.z * 0.45));

  // Infinite vertical travel: wrap the field around the camera's Y so density
  // stays constant as the scroll story flies the camera down the stage stack.
  float spanY = uSpread.y * 2.0;
  p.y = mod(p.y - uCenterY + uSpread.y, spanY) - uSpread.y + uCenterY;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);

  // Cursor parallax, stronger for distant points so the field reads as deep.
  float depth = clamp(-mv.z / 46.0, 0.0, 1.0);
  mv.xy += uPointer * (0.35 + depth * 1.9);

  gl_Position = projectionMatrix * mv;

  float distFade = 1.0 - smoothstep(16.0, 84.0, -mv.z);
  vAlpha = uOpacity * mix(0.28, 1.0, distFade) * (0.32 + 0.68 * aSeed.y);
  vTint = aTint;

  float scale = uSize * aSize * (1.0 + uEnergy * 0.85);
  gl_PointSize = clamp(scale * uPixelRatio * (17.0 / max(0.001, -mv.z)), 0.5, 40.0 * uPixelRatio);
}
`;

export const PARTICLE_FRAGMENT = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uEnergy;

varying float vTint;
varying float vAlpha;

void main() {
  ${POINT_FRAGMENT_BODY}
  vec3 col = mix(uColorA, uColorB, vTint);
  col += uEnergy * 0.4 * glow;
  gl_FragColor = vec4(col, glow * vAlpha);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Privacy shield — Fresnel glass shell with a faint lattice and scan sweep
// ─────────────────────────────────────────────────────────────────────────────

export const SHIELD_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const SHIELD_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColor;
uniform vec3 uColorRim;

varying vec3 vNormal;
varying vec3 vView;
varying vec2 vUv;

void main() {
  float rim = 1.0 - clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
  float fresnel = pow(rim, 2.7);

  // Cryptographic lattice — two crossed band sets, kept near-subliminal.
  float bands = sin(vUv.y * 170.0 + uTime * 0.5) * 0.5 + 0.5;
  float cells = sin(vUv.x * 96.0) * sin(vUv.y * 96.0);
  float lattice = smoothstep(0.90, 1.0, abs(cells)) * 0.55 + bands * 0.05;

  // Slow sweep travelling up the shell.
  float sweepPos = fract(uTime * 0.045);
  float sweep = 1.0 - smoothstep(0.0, 0.09, abs(vUv.y - sweepPos));

  float a = fresnel * 0.85 + lattice * 0.14 + sweep * 0.16;
  vec3 col = mix(uColor, uColorRim, fresnel);
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uIntensity);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Inbound data motes — travel toward the shield, then dissolve on contact
// ─────────────────────────────────────────────────────────────────────────────

export const MOTE_VERTEX = /* glsl */ `
attribute vec3 aSeed;
attribute float aSize;

uniform float uTime;
uniform float uRadius;
uniform float uPixelRatio;
uniform float uSize;
uniform float uOpacity;
uniform float uSpeed;
uniform float uOutbound;

varying float vAlpha;
varying float vDissolve;

void main() {
  float theta = aSeed.x * 6.2831853;
  float phi = acos(2.0 * aSeed.y - 1.0);
  vec3 dir = vec3(sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi));

  float k = fract(uTime * (uSpeed * (0.6 + aSeed.z * 0.8)) + aSeed.x * 3.7 + aSeed.y * 1.3);

  float rFar = uRadius * (2.4 + aSeed.z * 2.0);
  float rNear = uRadius * 1.002;
  // uOutbound 0 → motes fall inward and dissolve on the shell (identity blocked).
  // uOutbound 1 → motes escape outward and dissipate (data leaked).
  float r = mix(mix(rFar, rNear, k), mix(rNear, rFar, k), uOutbound);
  vec3 p = dir * r;

  // Impact: scatter tangentially and shrink — identity dissolves at the boundary.
  float dissolve = smoothstep(0.78, 1.0, k);
  vec3 up = abs(dir.y) > 0.94 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 tangent = normalize(cross(dir, up));
  p += tangent * dissolve * (0.6 + aSeed.z * 1.8);
  p += dir * dissolve * 0.30;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float fadeIn = smoothstep(0.0, 0.14, k);
  vAlpha = uOpacity * fadeIn * (1.0 - dissolve * 0.8);
  vDissolve = dissolve;

  float scale = uSize * aSize * (1.0 - dissolve * 0.6);
  gl_PointSize = clamp(scale * uPixelRatio * (15.0 / max(0.001, -mv.z)), 0.5, 26.0 * uPixelRatio);
}
`;

export const MOTE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uColorImpact;

varying float vAlpha;
varying float vDissolve;

void main() {
  ${POINT_FRAGMENT_BODY}
  vec3 col = mix(uColor, uColorImpact, vDissolve);
  gl_FragColor = vec4(col, glow * vAlpha);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Data streams — spiral inward toward the core, brightening under load
// ─────────────────────────────────────────────────────────────────────────────

export const STREAM_VERTEX = /* glsl */ `
attribute vec3 aSeed;
attribute float aSize;

uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uFlow;
uniform float uRadius;
uniform float uOpacity;

varying float vAlpha;

void main() {
  float k = fract(uTime * (0.10 + aSeed.z * 0.16) * (0.35 + uFlow * 1.8) + aSeed.x);

  // Inbound spiral: radius collapses, angle advances, Y flattens toward the core.
  float angle = aSeed.y * 6.2831853 + k * (2.2 + aSeed.z * 3.4) + uTime * 0.12;
  float r = uRadius * mix(1.0, 0.16, k);
  float y = (aSeed.x - 0.5) * uRadius * 1.5 * (1.0 - k * 0.88);

  vec3 p = vec3(cos(angle) * r, y, sin(angle) * r);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  // Heads brighten as they reach the core, then pop out.
  vAlpha = uOpacity * smoothstep(0.0, 0.10, k) * (1.0 - smoothstep(0.86, 1.0, k)) * (0.4 + k * 0.9);

  float scale = uSize * aSize * (0.6 + k * 1.1);
  gl_PointSize = clamp(scale * uPixelRatio * (14.0 / max(0.001, -mv.z)), 0.5, 22.0 * uPixelRatio);
}
`;

export const STREAM_FRAGMENT = /* glsl */ `
uniform vec3 uColor;

varying float vAlpha;

void main() {
  ${POINT_FRAGMENT_BODY}
  gl_FragColor = vec4(uColor, glow * vAlpha);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Winner reveal — one point expands into a field
// ─────────────────────────────────────────────────────────────────────────────

export const REVEAL_VERTEX = /* glsl */ `
attribute vec3 aSeed;
attribute float aSize;

uniform float uTime;
uniform float uProgress;
uniform float uPixelRatio;
uniform float uSize;
uniform float uOpacity;

varying float vAlpha;
varying float vTint;

void main() {
  float theta = aSeed.x * 6.2831853;
  float phi = acos(2.0 * aSeed.y - 1.0);
  vec3 dir = vec3(sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi));

  // Staggered expansion: each particle leaves at its own moment, so the burst
  // reads as a bloom rather than a uniformly scaled sphere.
  float stagger = aSeed.z * 0.55;
  float local = clamp((uProgress - stagger) / max(0.001, 1.0 - stagger), 0.0, 1.0);
  float eased = 1.0 - pow(1.0 - local, 3.0);

  float radius = mix(0.02, 5.2 + aSeed.z * 3.4, eased);
  vec3 p = dir * radius;

  // Gentle turbulence once expanded.
  p += vec3(
    sin(uTime * 0.6 + aSeed.x * 12.0),
    cos(uTime * 0.5 + aSeed.y * 11.0),
    sin(uTime * 0.7 + aSeed.z * 13.0)
  ) * eased * 0.35;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  vAlpha = uOpacity * smoothstep(0.0, 0.06, local) * (0.35 + 0.65 * aSeed.y);
  vTint = aSeed.x;

  float scale = uSize * aSize * (0.35 + eased * 1.15);
  gl_PointSize = clamp(scale * uPixelRatio * (16.0 / max(0.001, -mv.z)), 0.5, 34.0 * uPixelRatio);
}
`;

export const REVEAL_FRAGMENT = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;

varying float vAlpha;
varying float vTint;

void main() {
  ${POINT_FRAGMENT_BODY}
  vec3 col = mix(uColorA, uColorB, vTint);
  gl_FragColor = vec4(col, glow * vAlpha);
}
`;
