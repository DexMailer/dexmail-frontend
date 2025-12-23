import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { useSendTransaction, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits, isAddress, parseAbi, encodeFunctionData } from "viem";
import { toast } from "@/hooks/use-toast";
import { Token } from "@/lib/token-service";
import { useAuth } from '@/contexts/auth-context';
import { useSendUserOperation, useCurrentUser, useIsSignedIn } from '@coinbase/cdp-hooks';

interface SendDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tokens: Token[];
    ethBalance: string;
}

const erc20Abi = parseAbi([
    'function transfer(address to, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)'
]);

export function SendDialog({ open, onOpenChange, tokens, ethBalance }: SendDialogProps) {
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [selectedAsset, setSelectedAsset] = useState("eth"); // 'eth' or token address
    const [isLoading, setIsLoading] = useState(false);

    const { sendTransactionAsync } = useSendTransaction();
    const { writeContractAsync } = useWriteContract();

    const { user } = useAuth();
    const { sendUserOperation } = useSendUserOperation();
    const { currentUser } = useCurrentUser();
    const { isSignedIn } = useIsSignedIn();

    // Calculate available balance for real-time validation
    let availableBalance = 0;
    let tokenSymbol = 'ETH';

    if (selectedAsset === 'eth') {
        availableBalance = parseFloat(ethBalance);
    } else {
        const token = tokens.find(t => t.contractAddress === selectedAsset);
        if (token) {
            availableBalance = parseFloat(token.balance);
            tokenSymbol = token.symbol;
        }
    }

    const isInsufficient = amount && parseFloat(amount) > availableBalance;

    const handleSend = async () => {
        if (!recipient || !amount) {
            toast({
                title: "Missing fields",
                description: "Please enter a recipient address and amount.",
                variant: "destructive",
            });
            return;
        }

        if (!isAddress(recipient)) {
            toast({
                title: "Invalid Address",
                description: "Please enter a valid valid 0x address.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            // Balance Guard Check
            let availableBalance = 0;
            let decimals = 18;
            let tokenSymbol = 'ETH';

            if (selectedAsset === 'eth') {
                availableBalance = parseFloat(ethBalance);
            } else {
                const token = tokens.find(t => t.contractAddress === selectedAsset);
                if (token) {
                    availableBalance = parseFloat(token.balance);
                    tokenSymbol = token.symbol;
                }
            }

            if (parseFloat(amount) > availableBalance) {
                throw new Error(`Insufficient funds. You have ${availableBalance.toFixed(4)} ${tokenSymbol} available.`);
            }

            let hash;

            // Handle Coinbase Embedded Wallet
            if (user?.authType === 'coinbase-embedded') {
                if (!isSignedIn) {
                    throw new Error("Embedded wallet session expired. Please sign in again.");
                }
                const smartAccount = currentUser?.evmSmartAccounts?.[0];
                if (!smartAccount) {
                    throw new Error('Smart account not found');
                }

                let callData;
                let callTo;
                let callValue = BigInt(0);

                if (selectedAsset === "eth") {
                    callTo = recipient as `0x${string}`;
                    callValue = parseEther(amount);
                    callData = "0x";
                } else {
                    const token = tokens.find(t => t.contractAddress === selectedAsset);
                    if (!token) throw new Error("Token not found");
                    // decimals = 18; // Defaulting to 18 as before

                    callTo = token.contractAddress as `0x${string}`;
                    callData = encodeFunctionData({
                        abi: erc20Abi,
                        functionName: 'transfer',
                        args: [recipient as `0x${string}`, parseUnits(amount, decimals)]
                    });
                }

                const result = await sendUserOperation({
                    evmSmartAccount: smartAccount,
                    network: "base",
                    calls: [{
                        to: callTo,
                        data: callData as `0x${string}`,
                        value: callValue,
                    }],
                    useCdpPaymaster: true
                });
                hash = result.userOperationHash;

            } else {
                // Standard Wallet (Wagmi)
                if (selectedAsset === "eth") {
                    hash = await sendTransactionAsync({
                        to: recipient as `0x${string}`,
                        value: parseEther(amount),
                    });
                } else {
                    const token = tokens.find(t => t.contractAddress === selectedAsset);
                    if (!token) throw new Error("Token not found");

                    // decimals = 18;

                    hash = await writeContractAsync({
                        address: token.contractAddress as `0x${string}`,
                        abi: erc20Abi,
                        functionName: 'transfer',
                        args: [recipient as `0x${string}`, parseUnits(amount, decimals)],
                    });
                }
            }

            toast({
                title: "Transaction Sent",
                description: `Tx Hash: ${hash.slice(0, 10)}...`,
            });

            onOpenChange(false);
            setRecipient("");
            setAmount("");

        } catch (error: any) {
            console.error("Send error:", error);
            toast({
                title: "Transaction Failed",
                description: error.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Send Assets</DialogTitle>
                    <DialogDescription>
                        Send ETH or tokens to another wallet.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="asset">Asset</Label>
                        <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="eth">Ethereum (ETH) - Balance: {parseFloat(ethBalance).toFixed(4)}</SelectItem>
                                {tokens.map((token) => (
                                    <SelectItem key={token.contractAddress} value={token.contractAddress}>
                                        {token.name} ({token.symbol}) - Balance: {parseFloat(token.balance).toFixed(4)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="recipient">Recipient Address</Label>
                        <Input
                            id="recipient"
                            placeholder="0x..."
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={isInsufficient ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {isInsufficient && (
                            <p className="text-xs text-red-500 font-medium">
                                Insufficient balance. Available: {availableBalance.toFixed(4)} {tokenSymbol}
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Send
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
