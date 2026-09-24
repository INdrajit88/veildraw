'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion, useScroll } from 'framer-motion';
import { Act } from './home/Act';
import { HeroSection } from './home/HeroSection';
import { PipelineSection } from './home/PipelineSection';
import { PrivacySection } from './home/PrivacySection';
import { ExplorerSection } from './home/ExplorerSection';
import { VaultSection } from './home/VaultSection';
import { ClosingSections } from './home/ClosingSections';
import { WinnerRevealOverlay } from './WinnerRevealOverlay';
import { CursorGlow } from '@/components/motion/CursorGlow';
import { SceneFallback } from '@/components/3d/SceneFallback';
import { useSceneScroll } from '@/hooks/useSceneScroll';
import { useDeviceQuality } from '@/hooks/useDeviceQuality';
import { useDrawSequence } from '@/hooks/useDrawSequence';
import { scheduleIdle } from '@/lib/idle';
import type { SceneProps } from '@/components/3d/Scene';
import type { QualityTier } from '@/lib/scene';
import type { GiveawayItem, WalletState } from '@/lib/types';

type SceneCanvasComponent = React.ComponentType<SceneProps>;

/**
 * The 3D environment is fetched with a runtime `import()` rather than
 * `next/dynamic`.
 *
 * `next/dynamic` with `ssr: false` still emits the chunk into the route's
 * initial `<script>` list, so the whole three.js / R3F graph downloads during
 * page load even though it only *renders* later. A raw import keeps it out of
 * the critical path entirely: the CSS `SceneFallback` paints immediately and
 * the bundle is fetched once the main thread goes idle.
 */

/** Bloom budget for the full-screen reveal, per tier. */
const REVEAL_PARTICLES: Record<QualityTier, number> = {
  high: 2400,
  medium: 1200,
  low: 500,
  minimal: 0,
};

/**
 * Act heights. These proportions are what align the DOM story with the camera
 * track in `lib/scene.ts`: the cumulative boundaries land on the stage windows,
 * so each act is centred on screen exactly as the camera arrives at its object.
 * Mobile uses shorter but similarly proportioned acts.
 */
const ACT_HEIGHTS = {
  enter: 'h-[105vh] lg:h-[140vh]',
  pipeline: 'h-[110vh] lg:h-[190vh]',
  privacy: 'h-[105vh] lg:h-[150vh]',
  explorer: 'h-[105vh] lg:h-[140vh]',
  vault: 'h-[110vh] lg:h-[180vh]',
} as const;

interface HomePageProps {
  giveaway: GiveawayItem;
  wallet: WalletState;
  onOpenWalletModal: () => void;
  indexerConnected?: boolean;
}

export function HomePage({ giveaway, wallet, onOpenWalletModal, indexerConnected = false }: HomePageProps) {
  const quality = useDeviceQuality();
  const reduceMotion = useReducedMotion();
  const storyRef = useRef<HTMLDivElement>(null);
  const [revealOpen, setRevealOpen] = useState(false);
  const [SceneCanvas, setSceneCanvas] = useState<SceneCanvasComponent | null>(null);

  // One scroll observer for the whole page: it feeds both the scene bridge and
  // any section that needs to stay in sync with the camera.
  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ['start start', 'end end'],
  });
  useSceneScroll(scrollYProgress);

  const draw = useDrawSequence();

  // Fetch the 3D bundle once the main thread is idle. The scroll bridge is
  // already live by then, so the camera starts at the correct pose rather than
  // snapping from zero. On failure the CSS backdrop simply stays put.
  useEffect(() => {
    let cancelled = false;
    const handle = scheduleIdle(() => {
      void import('@/components/3d/VeilCanvas')
        .then((module) => {
          if (!cancelled) setSceneCanvas(() => module.VeilCanvas);
        })
        .catch(() => {});
    }, 1500);

    return () => {
      cancelled = true;
      handle.cancel();
    };
  }, []);

  // The vault highlights a fragment derived from the real winning commitment
  // when the indexer has one; otherwise nothing is highlighted.
  const seedHex = giveaway.winningCommitment.length > 0 ? giveaway.winningCommitment : undefined;

  return (
    <div className="relative bg-void text-body">
      {SceneCanvas ? (
        <SceneCanvas quality={quality} seedHex={seedHex} reducedMotion={!!reduceMotion} />
      ) : (
        <SceneFallback />
      )}
      <CursorGlow />

      {/* ── The scroll story ─────────────────────────────────────────── */}
      <div ref={storyRef} className="relative z-10">
        <Act heightClass={ACT_HEIGHTS.enter} id="enter" labelledBy="hero-headline">
          <HeroSection
            phase={draw.phase}
            running={draw.running}
            onEnterTheVeil={draw.start}
            indexerConnected={indexerConnected}
          />
        </Act>

        <Act heightClass={ACT_HEIGHTS.pipeline} id="how-it-works" labelledBy="pipeline-heading">
          <PipelineSection scrollYProgress={scrollYProgress} />
        </Act>

        <Act heightClass={ACT_HEIGHTS.privacy} id="privacy" labelledBy="privacy-heading">
          <PrivacySection />
        </Act>

        <Act heightClass={ACT_HEIGHTS.explorer} id="explorer" labelledBy="explorer-heading">
          <ExplorerSection
            giveaway={giveaway}
            wallet={wallet}
            indexerConnected={indexerConnected}
            onOpenWalletModal={onOpenWalletModal}
          />
        </Act>

        <Act heightClass={ACT_HEIGHTS.vault} id="vault" labelledBy="vault-heading">
          <VaultSection
            giveaway={giveaway}
            indexerConnected={indexerConnected}
            onOpenReveal={() => setRevealOpen(true)}
          />
        </Act>
      </div>

      {/* ── Tail: opaque, outside the camera track ───────────────────── */}
      <ClosingSections
        wallet={wallet}
        giveaway={giveaway}
        indexerConnected={indexerConnected}
        onOpenWalletModal={onOpenWalletModal}
      />

      <WinnerRevealOverlay
        open={revealOpen}
        onOpenChange={setRevealOpen}
        giveaway={giveaway}
        wallet={wallet}
        indexerConnected={indexerConnected}
        particles={REVEAL_PARTICLES[quality]}
      />
    </div>
  );
}
