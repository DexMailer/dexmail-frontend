import { useState, useEffect, useCallback } from 'react';
import { 
  authService,
  mailService,
  cryptoService,
  nftService,
  walletService,
  claimService,
  integrationService
} from '../lib';
import { 
  User,
  EmailMessage,
  CryptoTransfer,
  ClaimStatus,
  EnhancedWalletInfo,
  NFTInfo,
  CryptoAsset
} from '../lib/types';

export interface UseDexmailOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export interface DexmailState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Email state
  inbox: EmailMessage[];
  sentEmails: EmailMessage[];
  
  // Crypto state
  pendingTransfers: CryptoTransfer[];
  walletInfo: EnhancedWalletInfo | null;
  
  // Error state
  error: string | null;
}

export const useDexmail = (options: UseDexmailOptions = {}) => {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [state, setState] = useState<DexmailState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    inbox: [],
    sentEmails: [],
    pendingTransfers: [],
    walletInfo: null,
    error: null
  });

  // Auth methods
  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await authService.login({
        email,
        password,
        authType: 'traditional'
      });
      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
        isLoading: false
      }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, []);

  const loginWithWallet = useCallback(async (email: string, signature: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await authService.login({
        email,
        signature,
        authType: 'wallet'
      });
      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
        isLoading: false
      }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Wallet login failed';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, authType: 'traditional' | 'wallet' = 'traditional') => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await authService.register({
        email,
        password,
        authType
      });
      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
        isLoading: false
      }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      inbox: [],
      sentEmails: [],
      pendingTransfers: [],
      walletInfo: null,
      error: null
    });
  }, []);

  // Email methods
  const sendEmail = useCallback(async (
    to: string[],
    subject: string,
    body: string,
    assets?: CryptoAsset[]
  ) => {
    if (!state.user) throw new Error('User not authenticated');
    
    try {
      if (assets && assets.length > 0) {
        return await integrationService.sendEmailWithCrypto({
          from: state.user.email,
          to,
          subject,
          body,
          assets
        });
      } else {
        return await mailService.sendEmail({
          from: state.user.email,
          to,
          subject,
          body
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [state.user]);

  const refreshEmails = useCallback(async () => {
    if (!state.user) return;
    
    try {
      const [inbox, sent] = await Promise.all([
        mailService.getInbox(state.user.email),
        mailService.getSent(state.user.email)
      ]);
      setState(prev => ({ ...prev, inbox, sentEmails: sent }));
    } catch (error) {
      console.error('Failed to refresh emails:', error);
    }
  }, [state.user]);

  // Crypto methods
  const sendCrypto = useCallback(async (recipientEmail: string, assets: CryptoAsset[]) => {
    if (!state.user) throw new Error('User not authenticated');
    
    try {
      return await cryptoService.sendCrypto({
        recipientEmail,
        senderEmail: state.user.email,
        assets
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send crypto';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [state.user]);

  const refreshCryptoData = useCallback(async () => {
    if (!state.user) return;
    
    try {
      const [pendingTransfers, walletInfo] = await Promise.all([
        cryptoService.getPendingTransfers(state.user.email),
        walletService.getWalletInfo(state.user.email)
      ]);
      setState(prev => ({ ...prev, pendingTransfers, walletInfo }));
    } catch (error) {
      console.error('Failed to refresh crypto data:', error);
    }
  }, [state.user]);

  // Wallet methods
  const deployWallet = useCallback(async (ownerAddress: string, useGasSponsoring = true) => {
    if (!state.user) throw new Error('User not authenticated');
    
    try {
      const response = await walletService.deployWallet({
        email: state.user.email,
        ownerAddress,
        useGasSponsoring
      });
      
      // Refresh wallet info after deployment
      await refreshCryptoData();
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deploy wallet';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [state.user, refreshCryptoData]);

  // Claim methods
  const verifyClaim = useCallback(async (token: string) => {
    try {
      return await claimService.verifyClaimToken(token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify claim';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const claimAssets = useCallback(async (token: string, ownerAddress: string, useGasSponsoring = true) => {
    try {
      const response = await integrationService.claimAssets({
        claimToken: token,
        ownerAddress,
        useGasSponsoring
      });
      
      // Refresh data after claiming
      if (state.user) {
        await Promise.all([refreshEmails(), refreshCryptoData()]);
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim assets';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [state.user, refreshEmails, refreshCryptoData]);

  // NFT methods
  const sendNFT = useCallback(async (
    recipientEmail: string,
    contractAddress: string,
    tokenId: string,
    senderKey: string,
    useGasSponsoring = true
  ) => {
    try {
      return await nftService.sendNFT({
        recipientEmail,
        contractAddress,
        tokenId,
        useGasSponsoring
      }, senderKey);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send NFT';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const getNFTMetadata = useCallback(async (contractAddress: string, tokenId: string) => {
    try {
      return await nftService.getNFTMetadata(contractAddress, tokenId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get NFT metadata';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Utility methods
  const refreshAllData = useCallback(async () => {
    if (!state.user) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await Promise.all([
        refreshEmails(),
        refreshCryptoData()
      ]);
    } catch (error) {
      console.error('Failed to refresh all data:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.user, refreshEmails, refreshCryptoData]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize user data
  useEffect(() => {
    const initializeUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          const user = await authService.getProfile();
          setState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            isLoading: false
          }));
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Failed to initialize user:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeUser();
  }, []);

  // Auto refresh data
  useEffect(() => {
    if (!autoRefresh || !state.user || !state.isAuthenticated) return;

    const interval = setInterval(refreshAllData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, state.user, state.isAuthenticated, refreshAllData]);

  // Load initial data when user is authenticated
  useEffect(() => {
    if (state.user && state.isAuthenticated && !state.isLoading) {
      refreshAllData();
    }
  }, [state.user, state.isAuthenticated, state.isLoading]);

  return {
    // State
    ...state,
    
    // Auth methods
    login,
    loginWithWallet,
    register,
    logout,
    
    // Email methods
    sendEmail,
    refreshEmails,
    
    // Crypto methods
    sendCrypto,
    refreshCryptoData,
    
    // Wallet methods
    deployWallet,
    
    // Claim methods
    verifyClaim,
    claimAssets,
    
    // NFT methods
    sendNFT,
    getNFTMetadata,
    
    // Utility methods
    refreshAllData,
    clearError,
    
    // Service instances for advanced usage
    services: {
      auth: authService,
      mail: mailService,
      crypto: cryptoService,
      nft: nftService,
      wallet: walletService,
      claim: claimService,
      integration: integrationService
    }
  };
};