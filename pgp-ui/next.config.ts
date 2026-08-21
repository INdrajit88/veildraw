import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Disable ESLint during builds — handled separately
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack(config, { isServer }) {
    // WASM support required by @midnight-ntwrk/onchain-runtime-v3
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };

    // Buffer polyfill for browser
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        // Browser shim — isomorphic-ws is CJS and breaks named ESM imports in webpack
        'isomorphic-ws': path.join(process.cwd(), 'shims', 'isomorphic-ws.mjs'),
      },
      fallback: {
        ...config.resolve?.fallback,
        buffer: 'buffer/index.js',
        stream: false,
        crypto: false,
        path: false,
        fs: false,
      },
      extensionAlias: {
        '.js': ['.ts', '.tsx', '.js', '.jsx'],
      },
    };

    // Ensure WASM assets are handled by the async WebAssembly experiment
    // (asset/resource would expose only a default export and break the wasm-bindgen glue)
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
};

export default nextConfig;
