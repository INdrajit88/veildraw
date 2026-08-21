// Shared Framer Motion variants for consistent premium animations
import type { Variants } from 'framer-motion';

/** Standard ease curve — matches Apple's spring feel */
export const ease = [0.16, 1, 0.3, 1] as const;

/** Fade + slide up — used for cards and content blocks */
export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: 'easeIn' } },
};

/** Fade only — for subtle transitions */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

/** Scale + fade — for modals and overlays */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.22, ease } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.16, ease: 'easeIn' } },
};

/** Stagger container — wraps staggered children */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/** Stagger item — child of staggerContainer */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease } },
};

/** Page transition — used in layout */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.16, ease: 'easeIn' } },
};

/** Slide in from right — activity feed items */
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.22, ease } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.15 } },
};

/** Spring config for button micro-interactions */
export const buttonSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};
