// Browser globals polyfill — loaded client-side only
// Mirrors src/globals.ts but adapted for Next.js (no import.meta.env)

import { Buffer } from 'buffer';

type GlobalScope = typeof globalThis & {
  Buffer?: typeof Buffer;
  process?: { env?: Record<string, string | undefined> };
};

const g = globalThis as GlobalScope;

// Polyfill Buffer for browser libraries that expect it globally
if (typeof globalThis !== 'undefined') {
  g.Buffer = Buffer;
}

// Polyfill process.env for third-party libraries (e.g. Apollo Client)
if (typeof globalThis !== 'undefined' && !g.process?.env?.NODE_ENV) {
  g.process = {
    ...(g.process ?? {}),
    env: {
      NODE_ENV: process.env.NODE_ENV ?? 'production',
    },
  };
}

export {};
