'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { authService } from '@/lib/auth-service';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string, signature?: string, authType?: 'traditional' | 'wallet') => Promise<void>;
  loginWithWallet: (email: string, walletAddress: string, signature: string) => Promise<void>;
  register: (email: string, password: string, authType?: 'traditional' | 'wallet', walletAddress?: string, signature?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();

  useEffect(() => {
    // Check if user is already authenticated on mount
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userProfile = await authService.getProfile();
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Failed to get user profile:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Auto-logout when wallet is disconnected (with delay to allow reconnection)
  useEffect(() => {
    // Don't logout immediately on mount - give wallet time to reconnect
    if (!user?.authType || user.authType !== 'wallet') return;

    // Don't logout if wallet is currently connecting or reconnecting
    if (isConnecting || isReconnecting) {
      console.log('[AuthContext] Wallet is reconnecting, waiting...');
      return;
    }

    // Add a delay to allow wallet to reconnect on page load
    const timeoutId = setTimeout(() => {
      if (!isConnected && !isConnecting && !isReconnecting && user?.authType === 'wallet') {
        console.log('[AuthContext] Wallet disconnected, logging out...');
        logout();
      }
    }, 2000); // 2 second delay to allow reconnection

    return () => clearTimeout(timeoutId);
  }, [isConnected, isConnecting, isReconnecting, user?.authType]);

  const login = async (
    email: string,
    password?: string,
    signature?: string,
    authType: 'traditional' | 'wallet' = 'traditional'
  ) => {
    const response = await authService.login({
      email,
      password,
      signature,
      authType,
    });
    setUser(response.user);
  };

  const loginWithWallet = async (email: string, walletAddress: string, signature: string) => {
    const response = await authService.loginWithWallet(email, walletAddress, signature);
    setUser(response.user);
  };

  const register = async (
    email: string,
    password: string,
    authType: 'traditional' | 'wallet' = 'traditional',
    walletAddress?: string,
    signature?: string
  ) => {
    const response = await authService.register({
      email,
      password,
      authType,
      walletAddress,
      signature,
    });
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userProfile = await authService.getProfile();
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithWallet,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}