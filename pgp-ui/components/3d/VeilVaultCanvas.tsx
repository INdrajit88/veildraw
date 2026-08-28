'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { VeilVaultScene } from './VeilVaultScene';

// Calm CSS-only visual when WebGL is unavailable
function WebGLFallback() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-[#0f1118] to-[#0a0b0f]">
      <div className="ambient absolute inset-0" aria-hidden />
      <div className="relative flex size-48 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-primary/25 [animation:spin_32s_linear_infinite]" />
        <div className="absolute inset-5 rounded-full border border-dashed border-violet/20 [animation:spin_20s_linear_infinite_reverse]" />
        <div className="flex size-20 items-center justify-center rounded-full border border-primary/30 bg-primary-soft">
          <Lock className="size-8 text-primary-bright" aria-hidden />
        </div>
      </div>
      <div className="absolute bottom-5 rounded-pill border border-white/[0.08] bg-black/50 px-4 py-1.5 font-mono text-[11px] text-ink-muted-80">
        Sealed vault · Midnight ZK
      </div>
    </div>
  );
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function VeilVaultCanvas() {
  const [mounted, setMounted] = useState(false);
  const [webglOk, setWebglOk] = useState(false);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    setWebglOk(detectWebGL());
  }, []);

  // Pause the render loop when off-screen
  useEffect(() => {
    const el = document.getElementById('veil-vault-canvas-host');
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Pause when the tab is hidden
  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div
          className="size-8 animate-spin rounded-full border-2 border-primary/60 border-t-transparent"
          role="status"
          aria-label="Loading 3D scene"
        />
      </div>
    );
  }

  if (!webglOk || hasWebGLError) {
    return <WebGLFallback />;
  }

  const frameloop: 'always' | 'never' | 'demand' = reduceMotion ? 'demand' : inView && tabVisible ? 'always' : 'never';

  return (
    <div id="veil-vault-canvas-host" className="relative h-full w-full select-none" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 45 }}
        dpr={[1, 1.75]}
        frameloop={frameloop}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        onError={() => setHasWebGLError(true)}
      >
        <Suspense fallback={null}>
          <VeilVaultScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
