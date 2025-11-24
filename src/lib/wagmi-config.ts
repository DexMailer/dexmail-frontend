'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '3b2df2ae3d12134e87cf4397c8657e7a';

export const wagmiConfig = getDefaultConfig({
  appName: 'DexMail',
  projectId,
  chains: [base],
  ssr: true,
});

export default wagmiConfig;
