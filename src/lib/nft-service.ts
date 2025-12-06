
export interface NFT {
  id: string;
  name: string;
  collection: string;
  imageUrl: string;
  imageHint: string;
}

export const nftService = {
  async getNfts(walletAddress: string): Promise<NFT[]> {
    if (!walletAddress) return [];

    try {
      console.log('[NftService] Fetching NFTs for:', walletAddress);
      // Call our internal API proxy to avoid CORS
      const response = await fetch(`/api/nfts?address=${walletAddress}`);

      if (!response.ok) {
        console.warn(`[NftService] API proxy failed: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();

      if (!data.nfts) return [];

      return data.nfts.map((nft: any) => ({
        id: `${nft.contract}-${nft.identifier}`,
        name: nft.name || `#${nft.identifier}`,
        collection: nft.collection || 'Unknown Collection',
        imageUrl: nft.image_url || nft.display_image_url || 'https://via.placeholder.com/300?text=No+Image',
        imageHint: nft.description || 'NFT Image'
      }));

    } catch (error) {
      console.error('[NftService] Error fetching NFTs:', error);
      return [];
    }
  }
};