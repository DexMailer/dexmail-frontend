
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
import { ArrowUp, ArrowDown, Wallet } from "lucide-react";
import Image from "next/image";

const tokenHoldings = [
  {
    id: "eth",
    name: "Ethereum",
    symbol: "ETH",
    logoUrl: "https://i.pravatar.cc/150?u=eth",
    balance: "2.5",
    usdValue: "8,750.00",
  },
  {
    id: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    logoUrl: "https://i.pravatar.cc/150?u=usdc",
    balance: "10,000",
    usdValue: "10,000.00",
  },
];

const nftHoldings = [
  {
    id: "nft-1",
    name: "CryptoPunk #7804",
    collection: "CryptoPunks",
    imageUrl: "https://picsum.photos/seed/nft1/300/300",
    imageHint: "pixelated punk",
  },
  {
    id: "nft-2",
    name: "Bored Ape #8817",
    collection: "Bored Ape Yacht Club",
    imageUrl: "https://picsum.photos/seed/nft2/300/300",
    imageHint: "cartoon ape",
  },
  {
    id: "nft-3",
    name: "Fidenza #938",
    collection: "Art Blocks Curated",
    imageUrl: "https://picsum.photos/seed/nft3/300/300",
    imageHint: "abstract art",
  },
  {
    id: 'nft-4',
    name: 'Chromie Squiggle #7583',
    collection: 'Art Blocks',
    imageUrl: 'https://picsum.photos/seed/nft4/300/300',
    imageHint: 'colorful squiggle',
  },
];


export default function ProfilePage() {
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar-1');

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
            $18,750.00
          </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="flex items-center text-sm text-primary-foreground/80">
              <Wallet className="mr-2 h-4 w-4" />
              <span className="font-mono">0x1234...abcd</span>
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
                  <div className="text-2xl font-bold">${token.usdValue}</div>
                  <p className="text-xs text-muted-foreground">{token.balance} {token.symbol}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="nfts" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {nftHoldings.map(nft => (
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
                  <CardDescription>{nft.collection}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
