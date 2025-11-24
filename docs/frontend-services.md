# Dexmail Frontend Services Documentation

This document provides comprehensive examples of how to use the Dexmail frontend services to interact with all backend API endpoints.

## Overview

The frontend provides several service layers:
- **Individual Services**: Direct API wrappers for each endpoint category
- **Integration Service**: High-level workflows combining multiple services
- **React Hook**: Complete state management for React components

## Quick Start

```typescript
import { useDexmail } from '@/hooks/use-dexmail';
import { 
  authService, 
  mailService, 
  cryptoService, 
  nftService, 
  walletService, 
  claimService 
} from '@/lib';

// Using the React hook (recommended for components)
function MyComponent() {
  const {
    user,
    login,
    sendEmail,
    sendCrypto,
    deployWallet,
    claimAssets
  } = useDexmail({ autoRefresh: true });

  return (
    // Your component JSX
  );
}

// Using services directly (for utilities, middleware, etc.)
const user = await authService.login({ email, password, authType: 'traditional' });
const emails = await mailService.getInbox(user.email);
```

## Authentication Examples

### Traditional Email/Password Authentication

```typescript
import { authService } from '@/lib';

// Register new user
const registerUser = async () => {
  try {
    const response = await authService.register({
      email: 'user@example.com',
      password: 'securePassword123',
      authType: 'traditional'
    });
    console.log('User registered:', response.user);
    console.log('Token:', response.token);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

// Login user
const loginUser = async () => {
  try {
    const response = await authService.login({
      email: 'user@example.com',
      password: 'securePassword123',
      authType: 'traditional'
    });
    console.log('User logged in:', response.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Wallet-Based Authentication

```typescript
import { authService } from '@/lib';

// Get challenge for wallet signing
const walletLogin = async (userEmail: string, userWallet: any) => {
  try {
    // Step 1: Get challenge
    const challenge = await authService.getChallenge(userEmail);
    console.log('Challenge:', challenge.nonce);
    
    // Step 2: Sign challenge with wallet
    const signature = await userWallet.signMessage(challenge.nonce);
    
    // Step 3: Login with signature
    const response = await authService.login({
      email: userEmail,
      signature,
      authType: 'wallet'
    });
    
    console.log('Wallet login successful:', response.user);
  } catch (error) {
    console.error('Wallet login failed:', error);
  }
};

// Link wallet to existing account
const linkWallet = async (email: string, walletAddress: string, signature: string) => {
  try {
    const response = await authService.linkWallet({
      email,
      walletAddress,
      signature
    });
    console.log('Wallet linked:', response.user);
  } catch (error) {
    console.error('Wallet linking failed:', error);
  }
};
```

## Email Operations

### Basic Email Operations

```typescript
import { mailService } from '@/lib';

// Send simple email
const sendSimpleEmail = async () => {
  try {
    const response = await mailService.sendEmail({
      from: 'sender@example.com',
      to: ['recipient@example.com'],
      subject: 'Hello from Dexmail',
      body: 'This is a test email!'
    });
    console.log('Email sent:', response.messageId);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

// Get inbox
const getInbox = async (userEmail: string) => {
  try {
    const emails = await mailService.getInbox(userEmail);
    console.log('Inbox emails:', emails);
  } catch (error) {
    console.error('Failed to get inbox:', error);
  }
};

// Get specific email
const getEmail = async (messageId: string, userEmail: string) => {
  try {
    const email = await mailService.getMessage(messageId, userEmail);
    console.log('Email content:', email.content);
  } catch (error) {
    console.error('Failed to get email:', error);
  }
};
```

### Email with Crypto Transfer

```typescript
import { mailService } from '@/lib';

// Send email with crypto assets
const sendEmailWithCrypto = async () => {
  try {
    const response = await mailService.sendEmail({
      from: 'sender@example.com',
      to: ['recipient@example.com'],
      subject: 'Payment via Email',
      body: 'Here is your payment: [SEND: 100 USDC]',
      cryptoTransfer: {
        enabled: true,
        assets: [
          {
            type: 'erc20',
            token: '0xA0b86a33E6441b9e87DFba14aa6dfc8BDF2eB7Ab', // USDC contract
            amount: '100',
            symbol: 'USDC'
          },
          {
            type: 'eth',
            amount: '0.1'
          }
        ]
      }
    });
    console.log('Email with crypto sent:', response);
  } catch (error) {
    console.error('Failed to send email with crypto:', error);
  }
};
```

## Crypto Transfer Operations

### Standalone Crypto Transfers

```typescript
import { cryptoService } from '@/lib';

// Send crypto to email address
const sendCryptoAssets = async () => {
  try {
    const response = await cryptoService.sendCrypto({
      recipientEmail: 'recipient@example.com',
      senderEmail: 'sender@example.com',
      assets: [
        {
          type: 'erc20',
          token: '0xA0b86a33E6441b9e87DFba14aa6dfc8BDF2eB7Ab',
          amount: '100',
          symbol: 'USDC'
        }
      ]
    });
    console.log('Crypto sent, claim token:', response.claimToken);
  } catch (error) {
    console.error('Crypto transfer failed:', error);
  }
};

// Get pending transfers
const getPendingTransfers = async (userEmail: string) => {
  try {
    const transfers = await cryptoService.getPendingTransfers(userEmail);
    console.log('Pending transfers:', transfers);
  } catch (error) {
    console.error('Failed to get pending transfers:', error);
  }
};

// Get blockchain transfers
const getBlockchainTransfers = async (userEmail: string) => {
  try {
    const result = await cryptoService.getPendingBlockchainTransfers(userEmail);
    console.log('Blockchain transfers:', result.transfers);
  } catch (error) {
    console.error('Failed to get blockchain transfers:', error);
  }
};
```

## Wallet Management

### Wallet Deployment

```typescript
import { walletService } from '@/lib';

// Deploy wallet with gas sponsoring
const deployUserWallet = async (userEmail: string, ownerAddress: string) => {
  try {
    const response = await walletService.deployWallet({
      email: userEmail,
      ownerAddress,
      useGasSponsoring: true
    });
    
    console.log('Wallet deployed:', {
      address: response.walletAddress,
      txHash: response.transactionHash,
      gasSponsored: response.gasSponsored
    });
  } catch (error) {
    console.error('Wallet deployment failed:', error);
  }
};

// Batch deploy wallets
const batchDeployWallets = async () => {
  try {
    const deployments = [
      { email: 'user1@example.com', ownerAddress: '0x123...', useGasSponsoring: true },
      { email: 'user2@example.com', ownerAddress: '0x456...', useGasSponsoring: true }
    ];
    
    const response = await walletService.batchDeployWallets(deployments);
    console.log(`Deployed ${response.successCount}/${response.totalCount} wallets`);
  } catch (error) {
    console.error('Batch deployment failed:', error);
  }
};

// Get wallet info
const getWalletInfo = async (userEmail: string) => {
  try {
    const walletInfo = await walletService.getWalletInfo(userEmail);
    console.log('Wallet info:', {
      deployed: walletInfo.isDeployed,
      address: walletInfo.walletAddress,
      computed: walletInfo.computedAddress
    });
  } catch (error) {
    console.error('Failed to get wallet info:', error);
  }
};
```

### Sponsored Transactions

```typescript
import { cryptoService } from '@/lib';

// Execute sponsored transaction
const executeSponsoredTx = async (senderPrivateKey: string) => {
  try {
    const response = await cryptoService.sponsorTransaction({
      recipientEmail: 'recipient@example.com',
      token: '0xA0b86a33E6441b9e87DFba14aa6dfc8BDF2eB7Ab',
      amount: '100',
      isNFT: false
    }, senderPrivateKey);
    
    console.log('Sponsored transaction:', response.userOperationHash);
  } catch (error) {
    console.error('Sponsored transaction failed:', error);
  }
};
```

## NFT Operations

### NFT Transfers

```typescript
import { nftService } from '@/lib';

// Send single NFT
const sendNFT = async (senderPrivateKey: string) => {
  try {
    const response = await nftService.sendNFT({
      recipientEmail: 'recipient@example.com',
      contractAddress: '0x789...',
      tokenId: '123',
      useGasSponsoring: true
    }, senderPrivateKey);
    
    console.log('NFT sent:', response.transactionHash);
  } catch (error) {
    console.error('NFT transfer failed:', error);
  }
};

// Batch send NFTs
const batchSendNFTs = async (senderPrivateKey: string) => {
  try {
    const response = await nftService.batchSendNFTs({
      transfers: [
        {
          recipientEmail: 'user1@example.com',
          contractAddress: '0x789...',
          tokenId: '123'
        },
        {
          recipientEmail: 'user2@example.com',
          contractAddress: '0x789...',
          tokenId: '456'
        }
      ],
      useGasSponsoring: true
    }, senderPrivateKey);
    
    console.log(`Sent ${response.successCount}/${response.totalCount} NFTs`);
  } catch (error) {
    console.error('Batch NFT transfer failed:', error);
  }
};

// Get NFT metadata
const getNFTInfo = async (contractAddress: string, tokenId: string) => {
  try {
    const nftInfo = await nftService.getNFTMetadata(contractAddress, tokenId);
    console.log('NFT Info:', {
      name: nftInfo.metadata.name,
      description: nftInfo.metadata.description,
      image: nftService.getNFTImageUrl(nftInfo),
      attributes: nftService.getNFTAttributesMap(nftInfo)
    });
  } catch (error) {
    console.error('Failed to get NFT metadata:', error);
  }
};
```

### NFT Approvals

```typescript
import { nftService } from '@/lib';

// Approve specific NFT
const approveNFT = async (senderPrivateKey: string) => {
  try {
    const response = await nftService.approveNFT({
      contractAddress: '0x789...',
      tokenId: '123',
      spender: '0xSpender...',
      useGasSponsoring: true
    }, senderPrivateKey);
    
    console.log('NFT approved:', response.transactionHash);
  } catch (error) {
    console.error('NFT approval failed:', error);
  }
};

// Approve all NFTs in collection
const approveAllNFTs = async (senderPrivateKey: string) => {
  try {
    const response = await nftService.approveAllNFTs({
      contractAddress: '0x789...',
      operator: '0xOperator...',
      approved: true,
      useGasSponsoring: true
    }, senderPrivateKey);
    
    console.log('All NFTs approved:', response.transactionHash);
  } catch (error) {
    console.error('NFT approval for all failed:', error);
  }
};
```

## Claim Operations

### Claim Process

```typescript
import { claimService } from '@/lib';

// Verify claim token
const verifyClaim = async (claimToken: string) => {
  try {
    const verification = await claimService.verifyClaimToken(claimToken);
    if (verification.valid) {
      console.log('Valid claim for:', verification.email);
      console.log('Assets:', verification.assets);
    }
  } catch (error) {
    console.error('Claim verification failed:', error);
  }
};

// Get claim status
const getClaimStatus = async (claimToken: string) => {
  try {
    const status = await claimService.getClaimStatus(claimToken);
    const timeRemaining = claimService.getTimeUntilExpiration(status);
    
    console.log('Claim status:', {
      status: status.status,
      timeRemaining: `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`,
      isExpired: timeRemaining.isExpired
    });
  } catch (error) {
    console.error('Failed to get claim status:', error);
  }
};

// Claim assets
const claimAssets = async (claimToken: string, ownerAddress: string) => {
  try {
    const response = await claimService.deployAndClaim({
      token: claimToken,
      ownerAddress,
      useGasSponsoring: true
    });
    
    console.log('Assets claimed:', {
      wallet: response.walletAddress,
      assets: response.assets,
      txHash: response.transactionHash
    });
  } catch (error) {
    console.error('Claim failed:', error);
  }
};
```

## Integration Service Examples

### High-Level Workflows

```typescript
import { integrationService } from '@/lib';

// Complete onboarding workflow
const onboardNewUser = async () => {
  try {
    const result = await integrationService.onboardUser({
      email: 'newuser@example.com',
      password: 'securePassword',
      walletAddress: '0x123...',
      authType: 'hybrid'
    });
    
    console.log('User onboarded:', {
      user: result.user,
      walletDeployed: result.walletDeployed,
      walletAddress: result.walletAddress
    });
  } catch (error) {
    console.error('Onboarding failed:', error);
  }
};

// Complete email + crypto workflow
const sendEmailWithCryptoAssets = async () => {
  try {
    const result = await integrationService.sendEmailWithCrypto({
      from: 'sender@example.com',
      to: ['recipient@example.com'],
      subject: 'Payment',
      body: 'Your payment is attached',
      assets: [
        { type: 'erc20', token: '0x...', amount: '100', symbol: 'USDC' }
      ]
    });
    
    console.log('Email sent with crypto:', {
      messageId: result.messageId,
      claimToken: result.claimToken
    });
  } catch (error) {
    console.error('Email with crypto failed:', error);
  }
};

// Get complete user portfolio
const getUserPortfolio = async (userEmail: string) => {
  try {
    const portfolio = await integrationService.getUserPortfolio(userEmail);
    
    console.log('User Portfolio:', {
      pendingClaims: portfolio.pendingClaims.length,
      blockchainTransfers: portfolio.blockchainTransfers.length,
      walletDeployed: portfolio.walletInfo.isDeployed,
      inboxCount: portfolio.emails.inbox.length,
      sentCount: portfolio.emails.sent.length
    });
  } catch (error) {
    console.error('Failed to get portfolio:', error);
  }
};
```

## React Hook Examples

### Complete Component Example

```typescript
import React, { useState } from 'react';
import { useDexmail } from '@/hooks/use-dexmail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DexmailDashboard() {
  const {
    user,
    isAuthenticated,
    isLoading,
    inbox,
    pendingTransfers,
    walletInfo,
    error,
    login,
    logout,
    sendEmail,
    sendCrypto,
    deployWallet,
    claimAssets,
    clearError
  } = useDexmail({ autoRefresh: true, refreshInterval: 30000 });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(loginEmail, loginPassword);
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  const handleSendEmail = async () => {
    try {
      await sendEmail(
        ['recipient@example.com'],
        'Test Email',
        'Hello from Dexmail!'
      );
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2>Login</h2>
        <Input
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          placeholder=\"Email\"
        />
        <Input
          type=\"password\"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          placeholder=\"Password\"
        />
        <Button onClick={handleLogin}>Login</Button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      
      <div>
        <h2>Inbox ({inbox.length})</h2>
        {inbox.map(email => (
          <div key={email.messageId}>
            <h3>{email.subject}</h3>
            <p>From: {email.from}</p>
            {email.hasCryptoTransfer && <span>💰 Has crypto transfer</span>}
          </div>
        ))}
      </div>

      <div>
        <h2>Pending Claims ({pendingTransfers.length})</h2>
        {pendingTransfers.map(transfer => (
          <div key={transfer.claimToken}>
            <p>From: {transfer.senderEmail}</p>
            <p>Assets: {transfer.transfers.length}</p>
            <p>Expires: {new Date(transfer.expiresAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      <div>
        <h2>Wallet</h2>
        {walletInfo ? (
          <div>
            <p>Address: {walletInfo.walletAddress}</p>
            <p>Deployed: {walletInfo.isDeployed ? 'Yes' : 'No'}</p>
          </div>
        ) : (
          <p>No wallet info</p>
        )}
      </div>

      <Button onClick={handleSendEmail}>Send Test Email</Button>
      <Button onClick={logout}>Logout</Button>
      
      {error && (
        <div style={{ color: 'red' }}>
          {error}
          <Button onClick={clearError}>Clear Error</Button>
        </div>
      )}
    </div>
  );
}
```

## Error Handling

All services include proper error handling. Here are common patterns:

```typescript
import { authService } from '@/lib';

// Basic try-catch
try {
  const user = await authService.login(loginData);
} catch (error) {
  console.error('Login failed:', error.message);
}

// With typed errors
import { ApiError } from '@/lib/types';

try {
  const user = await authService.login(loginData);
} catch (error) {
  if (error instanceof Error) {
    // Handle known error
    console.error('Login failed:', error.message);
  } else {
    // Handle unknown error
    console.error('Unknown error occurred');
  }
}

// Using the hook's error state
const { error, clearError } = useDexmail();

useEffect(() => {
  if (error) {
    // Display error to user
    toast.error(error);
    
    // Clear error after displaying
    setTimeout(clearError, 5000);
  }
}, [error, clearError]);
```

## Environment Configuration

Make sure to set up your environment variables:

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud
```

## TypeScript Support

All services are fully typed with TypeScript. Import types as needed:

```typescript
import type {
  User,
  EmailMessage,
  CryptoAsset,
  CryptoTransfer,
  ClaimStatus,
  NFTInfo,
  WalletInfo
} from '@/lib/types';

// Use types in your components
interface Props {
  user: User;
  emails: EmailMessage[];
}
```

This comprehensive service implementation covers all the API endpoints from your backend and provides both low-level service access and high-level React integration.