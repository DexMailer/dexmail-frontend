import { createPublicClient, createWalletClient, http, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { config } from 'dotenv';
import { baseMailerAbi } from '../../contracts/abi';

config(); // Load env vars

// Configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_JWT = process.env.PINATA_JWT;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_BASEMAILER_ADDRESS as `0x${string}`;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;

// Viem Clients
export const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

const account = RELAYER_PRIVATE_KEY ? privateKeyToAccount(RELAYER_PRIVATE_KEY) : undefined;

export const walletClient = account ? createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
}) : undefined;

// IPFS Upload (Node.js version)
export async function uploadJSONToIPFS(data: any) {
    if (!PINATA_JWT) throw new Error('PINATA_JWT not found');

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: JSON.stringify({
            pinataContent: data,
            pinataMetadata: {
                name: `email-${Date.now()}`
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    return response.json();
}

// Contract Interactions
export async function indexMailOnChain(
    cid: string,
    recipient: string,
    isExternal: boolean,
    hasCrypto: boolean
) {
    if (!walletClient || !account) throw new Error('Relayer wallet not configured');

    // Convert CID to bytes32 if possible, or use a hash
    // The contract expects bytes32. IPFS CID is usually string.
    // We'll use a placeholder or hash of CID for now if it doesn't fit.
    // Real implementation needs proper CID handling (e.g. storing full CID in event or IPFS hash in bytes32)
    // For this prototype, we'll use a dummy bytes32
    const cidBytes32 = '0x' + '0'.repeat(64);

    const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: baseMailerAbi,
        functionName: 'indexMail',
        args: [recipient, cidBytes32, isExternal, hasCrypto]
    });

    return hash;
}

export async function getInboxFromChain(email: string) {
    // This would need to call the contract
    // But since we are in Node.js, we can use publicClient
    const inbox = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: baseMailerAbi,
        functionName: 'getInbox',
        args: [email]
    }) as bigint[];

    return inbox;
}

export async function getMailFromChain(mailId: bigint) {
    const mail = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: baseMailerAbi,
        functionName: 'getMail',
        args: [mailId]
    }) as any;

    return mail;
}
