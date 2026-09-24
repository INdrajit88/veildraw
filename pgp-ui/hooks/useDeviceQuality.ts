'use client';

import { useEffect, useState } from 'react';
import type { QualityTier } from '@/lib/scene';

/**
 * Resolve a render-quality tier from device capability.
 *
 * Decided once per mount: the tier drives geometry budgets, so changing it
 * mid-session would rebuild every buffer for no visible benefit. The only live
 * subscription is `prefers-reduced-motion`, which must win immediately.
 */
function detectTier(): QualityTier {
  if (typeof window === 'undefined') return 'medium';
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'minimal';

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrow = window.innerWidth < 820;

  if (cores <= 2 || memory <= 2) return 'minimal';
  if (coarse || narrow || cores <= 4 || memory <= 4) return 'low';
  if (cores >= 8 && memory >= 8) return 'high';
  return 'medium';
}

export function useDeviceQuality(): QualityTier {
  const [tier, setTier] = useState<QualityTier>('medium');

  useEffect(() => {
    setTier(detectTier());

    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = () => setTier(detectTier());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return tier;
}
