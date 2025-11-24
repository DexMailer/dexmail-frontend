import {
  NFTInfo,
  NFTTransfer,
  NFTBatchResponse,
  NFTApprovalData,
  NFTApprovalAllData,
  NFTApprovalResponse
} from './types';
import { cryptoService } from './crypto-service';

export interface SendNFTData extends NFTTransfer {
  useGasSponsoring?: boolean;
}

export interface SendNFTResponse {
  success: boolean;
  transactionHash: string;
  recipientEmail: string;
  contractAddress: string;
  tokenId: string;
}

export interface BatchNFTData {
  transfers: NFTTransfer[];
  useGasSponsoring?: boolean;
}

class NFTService {
  async sendNFT(data: SendNFTData, senderKey: string): Promise<SendNFTResponse> {
    const response = await cryptoService.sendCrypto({
      recipientEmail: data.recipientEmail,
      senderEmail: '', // Current user
      assets: [{
        type: 'nft',
        token: data.contractAddress,
        tokenId: data.tokenId
      }]
    });

    return {
      success: true,
      transactionHash: response.claimToken,
      recipientEmail: data.recipientEmail,
      contractAddress: data.contractAddress,
      tokenId: data.tokenId
    };
  }

  async batchSendNFTs(data: BatchNFTData, senderKey: string): Promise<NFTBatchResponse> {
    // Not implemented
    return {
      success: false,
      results: [],
      successCount: 0,
      totalCount: data.transfers.length
    };
  }

  async getNFTMetadata(contractAddress: string, tokenId: string): Promise<NFTInfo> {
    // Should fetch from NFT contract
    // For now return mock
    return {
      contractAddress,
      tokenId,
      metadata: {
        name: `NFT #${tokenId}`,
        description: 'Mock NFT',
        image: 'https://via.placeholder.com/150'
      },
      owner: '',
      tokenURI: ''
    };
  }

  async approveNFT(data: NFTApprovalData, senderKey: string): Promise<NFTApprovalResponse> {
    // Should call approve on NFT contract
    return {
      success: true,
      transactionHash: '0x...',
      contractAddress: data.contractAddress,
      tokenId: data.tokenId,
      spender: data.spender,
      approved: true
    };
  }

  async approveAllNFTs(data: NFTApprovalAllData, senderKey: string): Promise<NFTApprovalResponse> {
    return {
      success: true,
      transactionHash: '0x...',
      contractAddress: data.contractAddress,
      operator: data.operator,
      approved: data.approved
    };
  }

  async isNFT(contractAddress: string, tokenId: string): Promise<boolean> {
    return true;
  }

  formatNFTName(nftInfo: NFTInfo): string {
    return `${nftInfo.metadata.name} #${nftInfo.tokenId}`;
  }

  getNFTImageUrl(nftInfo: NFTInfo, fallback?: string): string {
    if (nftInfo.metadata.image.startsWith('ipfs://')) {
      return nftInfo.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    return nftInfo.metadata.image || fallback || '';
  }

  getNFTAttributesMap(nftInfo: NFTInfo): Record<string, string> {
    if (!nftInfo.metadata.attributes) return {};

    return nftInfo.metadata.attributes.reduce((acc, attr) => {
      acc[attr.trait_type] = attr.value;
      return acc;
    }, {} as Record<string, string>);
  }
}

export const nftService = new NFTService();
export default NFTService;