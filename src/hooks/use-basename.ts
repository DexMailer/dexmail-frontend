'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { base } from 'viem/chains';
import { createPublicClient, http } from 'viem';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// Mock basename resolution for now - replace with actual ENS/basename resolution
const mockBasenameResolution = async (address: string): Promise<string | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock different basenames for different addresses
  const mockBasenames: Record<string, string> = {
    '0x1234': 'alice.base',
    '0x5678': 'bob.base',
    '0x9abc': 'charlie.base',
  };
  
  // Use first 6 chars of address as key
  const key = address.slice(0, 6).toLowerCase();
  return mockBasenames[key] || null;
};

export function useBasename() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [basename, setBasename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBasename = useCallback(async (walletAddress?: string) => {
    const addressToUse = walletAddress || address;
    
    if (!addressToUse) {
      setError('No wallet address provided');
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Try to resolve basename
      const resolvedBasename = await mockBasenameResolution(addressToUse);
      setBasename(resolvedBasename);
      return resolvedBasename;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch basename';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const generateEmailFromBasename = useCallback((basename: string, domain: string = '@dexmail.app'): string => {
    return basename + domain;
  }, []);

  return {
    basename,
    isLoading,
    error,
    fetchBasename,
    generateEmailFromBasename,
  };
}
