'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import { Scene, type SceneProps } from './Scene';
import { SceneFallback } from './SceneFallback';
import { CLEAR_COLOR } from './palette';
import { DPR_CEILING, sceneState } from '@/lib/scene';
import { useBodyPortal } from '@/hooks/useBodyPortal';

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * The persistent VeilDraw environment.
 *
 * Mounted once per page behind all content with `pointer-events: none`, so it can
 * never intercept a click, tap or focus target. Publishes normalised cursor
 * position into the scene bridge and pauses the render loop when the tab is
 * hidden or the viewer prefers reduced motion.
 */
export function VeilCanvas({ quality, seedHex, reducedMotion }: SceneProps) {
  const [mounted, setMounted] = useState(false);
  const [webglOk, setWebglOk] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const reduceMotion = useReducedMotion() || !!reducedMotion;
  const host = useBodyPortal();

  useEffect(() => {
    setMounted(true);
    setWebglOk(detectWebGL());
    sceneState.reducedMotion = !!reduceMotion;
  }, [reduceMotion]);

  // Publish cursor position for parallax. Pointer-only devices; touch scrolls
  // must never be turned into camera movement.
  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(pointer: coarse)').matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;

    const onMove = (event: PointerEvent) => {
      x = (event.clientX / window.innerWidth) * 2 - 1;
      y = -((event.clientY / window.innerHeight) * 2 - 1);
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        sceneState.pointerX = x;
        sceneState.pointerY = y;
      });
    };

    const onLeave = () => {
      sceneState.pointerX = 0;
      sceneState.pointerY = 0;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      if (frame) window.cancelAnimationFrame(frame);
      sceneState.pointerX = 0;
      sceneState.pointerY = 0;
    };
  }, [reduceMotion]);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const showCanvas = mounted && webglOk && !failed;
  const frameloop: 'always' | 'demand' | 'never' = reduceMotion ? 'demand' : tabVisible ? 'always' : 'never';

  // Portalled to <body>: the page's Framer Motion wrapper keeps a transform
  // applied, which would otherwise become this layer's containing block.
  if (!host) return null;

  if (!showCanvas) return createPortal(<SceneFallback />, host);

  return createPortal(
    <div className="veil-canvas-layer" aria-hidden>
      <Canvas
        camera={{ position: [0, 0.55, 12.8], fov: 42, near: 0.1, far: 260 }}
        dpr={[1, DPR_CEILING[quality]]}
        frameloop={frameloop}
        gl={{
          antialias: quality === 'high' || quality === 'medium',
          alpha: false,
          stencil: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => gl.setClearColor(CLEAR_COLOR, 1)}
        onError={() => setFailed(true)}
      >
        <Suspense fallback={null}>
          <Scene quality={quality} seedHex={seedHex} reducedMotion={reduceMotion} />
        </Suspense>
      </Canvas>
      <div className="veil-noise absolute inset-0" />
    </div>,
    host,
  );
}
