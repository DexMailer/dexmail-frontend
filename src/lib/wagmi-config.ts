'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';
import { createStorage } from 'wagmi';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '3b2df2ae3d12134e87cf4397c8657e7a';

export const wagmiConfig = getDefaultConfig({
  appName: 'DexMail',
  projectId,
  chains: [baseSepolia],
  ssr: true,
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
});

export default wagmiConfig;
