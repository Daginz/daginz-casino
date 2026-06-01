import type { NextConfig } from 'next';
import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';

const withVanillaExtract = createVanillaExtractPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output bundles a minimal server + only the needed node_modules
  // into .next/standalone — ideal for a small Docker runtime image.
  output: 'standalone',
  // Monorepo: trace files from the repo root so standalone picks up workspace deps.
  outputFileTracingRoot: process.env.NEXT_OUTPUT_TRACING_ROOT,
  webpack: (config) => {
    // @metamask/sdk optionally imports React Native's async-storage; it's not
    // used in the browser build. Alias it to false to silence the noisy
    // "Module not found: @react-native-async-storage/async-storage" warning.
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

export default withVanillaExtract(nextConfig);
