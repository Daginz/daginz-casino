import type { NextConfig } from 'next';
import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';

const withVanillaExtract = createVanillaExtractPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
