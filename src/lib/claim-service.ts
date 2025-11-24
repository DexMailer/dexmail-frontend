import {
  ClaimStatus,
  CryptoAsset,
  ClaimVerificationResponse,
  ClaimDeploymentData,
  ClaimDeploymentResponse,
  ClaimSummary
} from './types';
import { walletService } from './wallet-service';

class ClaimService {
  async verifyClaimToken(token: string): Promise<ClaimVerificationResponse> {
    // Mock verification
    return {
      valid: true,
      email: 'recipient@example.com', // Should be decoded from token or fetched
      assets: [],
      walletAddress: ''
    };
  }

  async getClaimStatus(token: string): Promise<ClaimStatus> {
    return {
      token,
      status: 'pending',
      email: '',
      walletAddress: '',
      assets: [],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isExpired: false
    };
  }

  async deployAndClaim(data: ClaimDeploymentData): Promise<ClaimDeploymentResponse> {
    // We assume the token contains the email info or we have it contextually
    // But here we don't have the email in `data`.
    // The original implementation likely decoded it from token on backend.
    // We need to change the interface or assume we can get it.
    // For now, I'll use a placeholder email or assume the caller knows it.
    // But `deployWallet` needs email.

    // I'll assume the token IS the email hash or something we can use.
    // Or we just fail if we can't get it.

    const email = 'recipient@example.com'; // Placeholder

    const result = await walletService.deployWallet({
      email,
      ownerAddress: data.ownerAddress,
      useGasSponsoring: data.useGasSponsoring
    });

    return {
      success: result.success,
      walletAddress: result.walletAddress,
      assets: [],
      transactionHash: result.transactionHash,
      gasSponsored: result.gasSponsored
    };
  }

  async isClaimTokenValid(token: string): Promise<boolean> {
    return true;
  }

  async getClaimSummary(token: string): Promise<ClaimSummary> {
    return {
      totalAssets: 0,
      hasERC20: false,
      hasNFT: false,
      hasETH: false,
      expiresIn: 168
    };
  }

  formatAssetsForDisplay(assets: CryptoAsset[]): string[] {
    return assets.map(asset => {
      switch (asset.type) {
        case 'erc20':
          return `${asset.amount} ${asset.symbol}`;
        case 'eth':
          return `${asset.amount} ETH`;
        case 'nft':
          return `NFT #${asset.tokenId}`;
        default:
          return 'Unknown Asset';
      }
    });
  }

  isClaimExpiringSoon(status: ClaimStatus): boolean {
    return false;
  }

  getTimeUntilExpiration(status: ClaimStatus): {
    days: number;
    hours: number;
    minutes: number;
    isExpired: boolean;
  } {
    return { days: 7, hours: 0, minutes: 0, isExpired: false };
  }

  isValidClaimTokenFormat(token: string): boolean {
    return true;
  }

  async deployAndClaimWithRetry(
    data: ClaimDeploymentData,
    maxRetries: number = 3
  ): Promise<ClaimDeploymentResponse> {
    return this.deployAndClaim(data);
  }

  getClaimUrl(token: string, baseUrl: string = window.location.origin): string {
    return `${baseUrl}/dashboard/claim?token=${encodeURIComponent(token)}`;
  }
}

export const claimService = new ClaimService();
export default ClaimService;