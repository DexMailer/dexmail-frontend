'use client';

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { useCallback, useState } from 'react';
import { authService } from '@/lib/auth-service';

export function useWallet() {
  const { address, isConnected, status } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const connectWallet = useCallback(async () => {
    try {
      // Try to find Coinbase Wallet connector first
      const coinbaseConnector = connectors.find(
        (connector) => connector.name.toLowerCase().includes('coinbase')
      );

      if (coinbaseConnector) {
        await new Promise((resolve, reject) => {
          connect({ connector: coinbaseConnector }, {
            onSuccess: resolve,
            onError: reject,
          });
        });
      } else if (connectors.length > 0) {
        // Fallback to first available connector
        await new Promise((resolve, reject) => {
          connect({ connector: connectors[0] }, {
            onSuccess: resolve,
            onError: reject,
          });
        });
      } else {
        throw new Error('No wallet connectors available');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }, [connect, connectors]);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    return await signMessageAsync({ message });
  }, [signMessageAsync]);

  const authenticateWithWallet = useCallback(async (email: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsAuthenticating(true);
    try {
      // Get challenge from backend
      const challenge = await authService.getChallenge(email);

      // Sign the challenge
      const signature = await signMessage(challenge.nonce);

      // Login with signature using the new method
      const authResponse = await authService.loginWithWallet(email, address, signature);

      return authResponse;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, signMessage]);

  const registerWithWallet = useCallback(async (email: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsAuthenticating(true);
    try {
      // Get challenge and sign it
      const challenge = await authService.getChallenge(email);
      const signature = await signMessage(challenge.nonce);

      // Register with wallet
      const authResponse = await authService.register({
        email,
        authType: 'wallet',
        walletAddress: address,
        signature,
      });

      return authResponse;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, signMessage]);

  return {
    address,
    isConnected,
    isConnecting,
    isSigning,
    isAuthenticating,
    status,
    connectWallet,
    disconnect,
    signMessage,
    authenticateWithWallet,
    registerWithWallet,
  };
}
