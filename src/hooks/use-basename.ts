import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { base } from 'viem/chains';
import { useName, getName } from '@coinbase/onchainkit/identity';

export function useBasename() {
  const { address } = useAccount();

  // Use the official hook from OnchainKit
  const { data: basename, isLoading, error } = useName({
    address: address as `0x${string}`,
    chain: base,
  });

  const generateEmailFromBasename = useCallback((basename: string, domain: string = '@dexmail.app'): string => {
    return basename + domain;
  }, []);

  // Restore imperative fetch functionality using getName
  const fetchBasename = useCallback(async (walletAddress?: string) => {
    const addr = walletAddress || address;
    if (!addr) return null;

    try {
      const name = await getName({
        address: addr as `0x${string}`,
        chain: base,
      });
      return name;
    } catch (e) {
      console.error('Error fetching basename imperatively:', e);
      return null;
    }
  }, [address]);

  return {
    basename: basename || null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch name') : null,
    fetchBasename,
    generateEmailFromBasename,
  };
}
