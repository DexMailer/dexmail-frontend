'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Wallet, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import { useEffect, useState } from "react";
import { priceService } from "@/lib/price-service";
import { nftService, NFT } from "@/lib/nft-service";


export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: address,
  });
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [ethImage, setEthImage] = useState<string>("");
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Price & Image
      const priceData = await priceService.getEthPrice();
      setEthPrice(priceData.price);
      setEthImage(priceData.image);

      // Fetch NFTs
      if (address) {
        setIsLoadingNfts(true);
        const userNfts = await nftService.getNfts(address);
        setNfts(userNfts);
        setIsLoadingNfts(false);
      }
    };
    fetchData();
  }, [address]);

  const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar-1');

  const ethBalanceStr = balanceData ? formatEther(balanceData.value) : "0";
  const ethBalanceNum = parseFloat(ethBalanceStr);
  const usdValue = (ethBalanceNum * ethPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // Mock token holdings but update ETH with real balance
  const tokenHoldings = [
    {
      id: "eth",
      name: "Ethereum",
      symbol: "ETH",
      logoUrl: ethImage || "https://i.pravatar.cc/150?u=eth",
      balance: ethBalanceNum.toFixed(4),
      usdValue: usdValue,
    },
  ];

  if (!isConnected) {
    return (
      <div className="flex-1 p-8 pt-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Wallet Not Connected</h2>
          <p className="text-muted-foreground">Please connect your wallet to view your portfolio.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <ArrowUp className="mr-2 h-4 w-4" /> Send
          </Button>
          <Button variant="outline">
            <ArrowDown className="mr-2 h-4 w-4" /> Receive
          </Button>
        </div>
      </div>

      <Card className="relative overflow-hidden bg-primary/20 backdrop-blur-md border-primary/30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 -z-10"></div>
        <CardHeader>
          <CardDescription className="text-primary-foreground/80">Total Balance</CardDescription>
          <CardTitle className="text-4xl md:text-5xl font-bold text-primary-foreground">
            {isBalanceLoading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              usdValue !== "$0.00" ? usdValue : `${ethBalanceNum.toFixed(4)} ETH`
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-primary-foreground/80">
            <Wallet className="mr-2 h-4 w-4" />
            <span className="font-mono">{address}</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tokens" className="space-y-4">
        <TabsList className="rounded-full">
          <TabsTrigger value="tokens" className="data-[state=active]:rounded-full">Tokens</TabsTrigger>
          <TabsTrigger value="nfts" className="data-[state=active]:rounded-full">NFTs</TabsTrigger>
        </TabsList>
        <TabsContent value="tokens" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {tokenHoldings.map(token => (
              <Card key={token.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{token.name}</CardTitle>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={token.logoUrl} alt={token.name} />
                    <AvatarFallback>{token.symbol}</AvatarFallback>
                  </Avatar>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{token.usdValue}</div>
                  <p className="text-xs text-muted-foreground">{token.balance} {token.symbol}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="nfts" className="space-y-4">
          {isLoadingNfts ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : nfts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {nfts.map(nft => (
                <Card key={nft.id} className="overflow-hidden group">
                  <div className="aspect-square relative">
                    <Image
                      src={nft.imageUrl}
                      alt={nft.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={nft.imageHint}
                    />
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base truncate">{nft.name}</CardTitle>
                    <CardDescription className="truncate">{nft.collection}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              No NFTs found in this wallet on Base Sepolia.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
