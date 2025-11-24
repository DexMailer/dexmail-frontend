'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export type Asset = {
  type: 'erc20' | 'nft' | 'eth';
  symbol: string;
  amount: string;
  contract?: string;
  tokenId?: string;
};

type CryptoAttachmentProps = {
  assets: Asset[];
  onChange: (assets: Asset[]) => void;
};

export function CryptoAttachment({ assets, onChange }: CryptoAttachmentProps) {
  const [assetType, setAssetType] = useState('erc20');
  const [token, setToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [nftContract, setNftContract] = useState('');
  const [nftTokenId, setNftTokenId] = useState('');

  const addAsset = () => {
    if (assetType === 'erc20' && amount) {
      onChange([...assets, { type: 'erc20', symbol: token, amount }]);
      setAmount('');
    } else if (assetType === 'eth' && amount) {
      onChange([...assets, { type: 'eth', symbol: 'ETH', amount }]);
      setAmount('');
    } else if (assetType === 'nft' && nftContract && nftTokenId) {
      onChange([
        ...assets,
        {
          type: 'nft',
          symbol: 'NFT',
          amount: '1',
          contract: nftContract,
          tokenId: nftTokenId,
        },
      ]);
      setNftContract('');
      setNftTokenId('');
    }
  };
  
  const removeAsset = (index: number) => {
    onChange(assets.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Select value={assetType} onValueChange={setAssetType}>
          <SelectTrigger>
            <SelectValue placeholder="Asset type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="erc20">ERC20 Token</SelectItem>
            <SelectItem value="eth">ETH</SelectItem>
            <SelectItem value="nft">NFT</SelectItem>
          </SelectContent>
        </Select>

        {assetType === 'erc20' && (
          <>
            <Select value={token} onValueChange={setToken}>
              <SelectTrigger>
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="DAI">DAI</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </>
        )}

        {assetType === 'eth' && (
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="md:col-span-2"
          />
        )}

        {assetType === 'nft' && (
          <>
            <Input
              placeholder="NFT Contract Address"
              value={nftContract}
              onChange={(e) => setNftContract(e.target.value)}
            />
            <Input
              placeholder="Token ID"
              value={nftTokenId}
              onChange={(e) => setNftTokenId(e.target.value)}
            />
          </>
        )}
      </div>

      <Button onClick={addAsset} size="sm">
        Add Asset
      </Button>

      {assets.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attached Assets:</h4>
          <div className="flex flex-wrap gap-2">
            {assets.map((asset, i) => (
              <Badge key={i} variant="secondary" className="flex items-center gap-1.5 pr-1">
                {asset.type === 'nft' ? `NFT: ${asset.contract?.substring(0,6)}...` : `${asset.amount} ${asset.symbol}`}
                <button
                  onClick={() => removeAsset(i)}
                  className="rounded-full hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
