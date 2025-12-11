# Dexmail API Documentation

This document describes all available API endpoints for frontend integration.

## Base URL
```
http://localhost:4000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/register`
Register a new user account with traditional email/password authentication.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "authType": "traditional"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "email": "user@example.com",
    "authType": "traditional",
    "walletAddress": null,
    "emailVerified": false
  }
}
```

#### POST `/api/auth/login`
Login with email and password (traditional) or wallet signature.

**Traditional Login:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "authType": "traditional"
}
```

**Wallet Login:**
```json
{
  "email": "user@example.com",
  "signature": "0x...",
  "authType": "wallet"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "email": "user@example.com",
    "authType": "traditional",
    "walletAddress": "0x...",
    "emailVerified": false
  }
}
```

#### POST `/api/auth/challenge`
Generate authentication challenge for wallet-based login.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "nonce": "Sign this message to authenticate: 0x...",
  "expires": 1234567890
}
```

#### POST `/api/auth/link-wallet`
Link a wallet address to an existing email account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "walletAddress": "0x...",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "authType": "hybrid",
    "walletAddress": "0x..."
  }
}
```

---

### User Profile (`/api/user`)

#### GET `/api/user/profile`
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "email": "user@example.com",
  "authType": "traditional",
  "walletAddress": "0x...",
  "emailVerified": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-01T00:00:00.000Z"
}
```

#### PATCH `/api/user/profile`
Update user profile (currently only wallet address).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "walletAddress": "0x..."
}
```

**Response:**
```json
{
  "email": "user@example.com",
  "authType": "traditional",
  "walletAddress": "0x...",
  "emailVerified": false
}
```

---

### Mail (`/api/mail`)

#### POST `/api/mail/send`
Send an email with optional crypto transfers (supports both attached assets and email content parsing).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "from": "sender@example.com",
  "to": ["recipient@example.com"],
  "subject": "Hello",
  "body": "Email content with [SEND: 100 USDC] for automatic parsing",
  "cryptoTransfer": {
    "enabled": true,
    "assets": [
      {
        "type": "erc20",
        "token": "0x...",
        "amount": "100",
        "symbol": "USDC"
      },
      {
        "type": "nft",
        "token": "0x...",
        "tokenId": "123"
      },
      {
        "type": "eth",
        "amount": "0.1"
      }
    ]
  }
}
```

**Email Content Parsing:**
The system automatically detects crypto transfer markers in email content:
- `[SEND: 100 USDC]` - Send 100 USDC tokens
- `[SEND: 0.1 ETH]` - Send 0.1 ETH
- `[SEND: 1 NFT_0x123...:456]` - Send NFT with contract address and token ID

**Response:**
```json
{
  "messageId": "uuid",
  "cid": "ipfs_cid",
  "key": "encryption_key"
}
```

#### GET `/api/mail/inbox?email=user@example.com`
Get inbox messages for a user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "messageId": "uuid",
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "Hello",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "hasCryptoTransfer": true
  }
]
```

#### GET `/api/mail/sent?email=user@example.com`
Get sent messages for a user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "messageId": "uuid",
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "Hello",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "hasCryptoTransfer": true
  }
]
```

#### GET `/api/mail/message/:messageId?email=user@example.com`
Get a specific email message.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "messageId": "uuid",
  "from": "sender@example.com",
  "to": ["recipient@example.com"],
  "subject": "Hello",
  "ipfsCid": "ipfs_cid",
  "encryptionKey": "encryption_key",
  "hasCryptoTransfer": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "content": {
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "Hello",
    "body": "Email content",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### DELETE `/api/mail/message/:messageId?email=user@example.com`
Delete an email message.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "messageId": "uuid"
}
```

---

### Crypto Transfers (`/api/crypto`)

#### POST `/api/crypto/send`
Send crypto assets to an email address (standalone, not via email).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "recipientEmail": "recipient@example.com",
  "senderEmail": "sender@example.com",
  "assets": [
    {
      "type": "erc20",
      "token": "0x...",
      "amount": "100",
      "symbol": "USDC"
    },
    {
      "type": "nft",
      "token": "0x...",
      "tokenId": "123"
    },
    {
      "type": "eth",
      "amount": "0.1"
    }
  ]
}
```

**Response:**
```json
{
  "claimToken": "hex_token",
  "walletAddress": "0x..."
}
```

#### POST `/api/crypto/quote`
Get wallet address for an email (before sending).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "recipientEmail": "recipient@example.com"
}
```

**Response:**
```json
{
  "walletAddress": "0x..."
}
```

#### GET `/api/crypto/pending/:email`
Get pending crypto transfers for an email (from database).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "emailHash": "0x...",
    "recipientEmail": "recipient@example.com",
    "senderEmail": "sender@example.com",
    "walletAddress": "0x...",
    "transfers": [
      {
        "type": "erc20",
        "token": "0x...",
        "amount": "100",
        "symbol": "USDC"
      }
    ],
    "status": "pending",
    "claimToken": "hex_token",
    "expiresAt": "2024-01-08T00:00:00.000Z"
  }
]
```

#### GET `/api/crypto/wallet/:email`
Get wallet address for an email.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "email": "user@example.com",
  "walletAddress": "0x..."
}
```

#### GET `/api/crypto/pending/blockchain/:email`
Get pending transfers from blockchain for an email.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "email": "user@example.com",
  "transfers": [
    {
      "token": "0x...",
      "amount": "100000000",
      "isNFT": false,
      "sender": "0x...",
      "recipientEmail": "user@example.com",
      "timestamp": "1234567890",
      "claimed": false
    }
  ]
}
```

---

### Wallet Management (`/api/wallet`)

#### POST `/api/wallet/deploy`
Deploy a smart wallet for an email address with optional gas sponsoring.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "user@example.com",
  "ownerAddress": "0x...",
  "useGasSponsoring": true
}
```

**Response:**
```json
{
  "success": true,
  "walletAddress": "0x...",
  "transactionHash": "0x...",
  "alreadyDeployed": false,
  "gasSponsored": true
}
```

#### POST `/api/wallet/sponsor/transaction`
Execute a sponsored transaction (gasless).

**Headers:** 
- `Authorization: Bearer <token>`
- `x-sender-key: <private_key>` (for transaction signing)

**Request Body:**
```json
{
  "recipientEmail": "recipient@example.com",
  "token": "0x...",
  "amount": "100",
  "isNFT": false
}
```

**Response:**
```json
{
  "success": true,
  "userOperationHash": "0x...",
  "recipientEmail": "recipient@example.com",
  "token": "0x...",
  "amount": "100"
}
```

#### POST `/api/wallet/batch/deploy`
Deploy multiple wallets in batch.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "deployments": [
    {
      "email": "user1@example.com",
      "ownerAddress": "0x...",
      "useGasSponsoring": true
    },
    {
      "email": "user2@example.com", 
      "ownerAddress": "0x...",
      "useGasSponsoring": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "deployments": [
    {
      "email": "user1@example.com",
      "ownerAddress": "0x...",
      "result": {
        "success": true,
        "walletAddress": "0x...",
        "transactionHash": "0x..."
      }
    }
  ],
  "successCount": 1,
  "totalCount": 2
}
```

#### GET `/api/wallet/info/:email`
Get wallet deployment status and information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "email": "user@example.com",
  "walletAddress": "0x...",
  "isDeployed": true,
  "owner": null,
  "computedAddress": "0x..."
}
```

---

### NFT Operations (`/api/nft`)

#### POST `/api/nft/send`
Send an NFT to an email address with optional gas sponsoring.

**Headers:** 
- `Authorization: Bearer <token>`
- `x-sender-key: <private_key>` (for transaction signing)

**Request Body:**
```json
{
  "recipientEmail": "recipient@example.com",
  "contractAddress": "0x...",
  "tokenId": "123",
  "useGasSponsoring": true
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "recipientEmail": "recipient@example.com",
  "contractAddress": "0x...",
  "tokenId": "123"
}
```

#### POST `/api/nft/send/batch`
Send multiple NFTs in batch.

**Headers:** 
- `Authorization: Bearer <token>`
- `x-sender-key: <private_key>` (for transaction signing)

**Request Body:**
```json
{
  "transfers": [
    {
      "recipientEmail": "user1@example.com",
      "contractAddress": "0x...",
      "tokenId": "123"
    },
    {
      "recipientEmail": "user2@example.com",
      "contractAddress": "0x...",
      "tokenId": "456"
    }
  ],
  "useGasSponsoring": true
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "recipientEmail": "user1@example.com",
      "success": true,
      "transactionHash": "0x..."
    },
    {
      "recipientEmail": "user2@example.com", 
      "success": false,
      "error": "Transfer failed"
    }
  ],
  "successCount": 1,
  "totalCount": 2
}
```

#### GET `/api/nft/metadata/:contractAddress/:tokenId`
Get NFT metadata.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "contractAddress": "0x...",
  "tokenId": "123",
  "metadata": {
    "name": "Cool NFT #123",
    "description": "A very cool NFT",
    "image": "https://example.com/image.png",
    "attributes": [
      {
        "trait_type": "Color",
        "value": "Blue"
      }
    ]
  },
  "owner": "0x...",
  "tokenURI": "https://example.com/metadata/123"
}
```

#### POST `/api/nft/approve`
Approve NFT transfer (set approval for specific token).

**Headers:** 
- `Authorization: Bearer <token>`
- `x-sender-key: <private_key>` (for transaction signing)

**Request Body:**
```json
{
  "contractAddress": "0x...",
  "tokenId": "123",
  "spender": "0x...",
  "useGasSponsoring": false
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "contractAddress": "0x...",
  "tokenId": "123",
  "spender": "0x..."
}
```

#### POST `/api/nft/approve/all`
Set approval for all NFTs in a collection.

**Headers:** 
- `Authorization: Bearer <token>`
- `x-sender-key: <private_key>` (for transaction signing)

**Request Body:**
```json
{
  "contractAddress": "0x...",
  "operator": "0x...",
  "approved": true,
  "useGasSponsoring": false
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "contractAddress": "0x...",
  "operator": "0x...",
  "approved": true
}
```

---

### Claim Process (`/api/claim`)

#### POST `/api/claim/verify`
Verify a claim token (public endpoint, no auth required).

**Request Body:**
```json
{
  "token": "claim_token_hex"
}
```

**Response:**
```json
{
  "valid": true,
  "email": "recipient@example.com",
  "assets": [
    {
      "type": "erc20",
      "token": "0x...",
      "amount": "100",
      "symbol": "USDC"
    }
  ],
  "walletAddress": "0x..."
}
```

#### GET `/api/claim/status/:token`
Get claim status for a token (public endpoint, no auth required).

**Response:**
```json
{
  "token": "claim_token_hex",
  "status": "pending",
  "email": "recipient@example.com",
  "walletAddress": "0x...",
  "assets": [
    {
      "type": "erc20",
      "token": "0x...",
      "amount": "100",
      "symbol": "USDC"
    }
  ],
  "expiresAt": "2024-01-08T00:00:00.000Z",
  "claimedAt": null,
  "isExpired": false
}
```

#### POST `/api/claim/deploy`
Deploy wallet and claim crypto assets with optional gas sponsoring.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "token": "claim_token_hex",
  "ownerAddress": "0x...",
  "useGasSponsoring": true
}
```

**Response:**
```json
{
  "success": true,
  "walletAddress": "0x...",
  "assets": [
    {
      "type": "erc20",
      "token": "0x...",
      "amount": "100",
      "symbol": "USDC"
    }
  ],
  "transactionHash": "0x...",
  "gasSponsored": true
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message or error object"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already registered)
- `500` - Internal Server Error

---

## Features Implemented

### Phase 1: MVP ✅
- ✅ Basic SMTP/IMAP server implementation
- ✅ Traditional email/password authentication
- ✅ Web client interface (API ready)
- ✅ IPFS integration
- ✅ Base blockchain integration

### Phase 2: Crypto Features ✅
- ✅ ERC20 token transfers via email (attached and parsed from content)
- ✅ Smart contract wallet factory with gas sponsoring
- ✅ Claim process implementation with optional gas sponsoring
- ✅ Coinbase CDP Paymaster integration for gasless transactions
- ✅ NFT support (ERC721) with batch operations
- ✅ Wallet management and deployment APIs
- ✅ Account abstraction (ERC-4337) implementation
- ✅ Email content parsing for crypto transfer markers
- ✅ Dual authentication (traditional + wallet-based)
- ✅ Automatic claim email notifications for external recipients

---

## Notes

1. **Dual Authentication**: The system supports both traditional email/password and wallet-based authentication:
   - Traditional: Use email and password for standard authentication
   - Wallet: Generate a challenge, sign it with your wallet, and authenticate with the signature
   - Hybrid: Link a wallet to your email account to use both authentication methods

2. **Email Content Parsing**: The system automatically detects crypto transfer markers in email content:
   - `[SEND: 100 USDC]` - Automatically sends 100 USDC to recipients
   - `[SEND: 0.1 ETH]` - Automatically sends 0.1 ETH to recipients
   - `[SEND: 1 NFT_0x123...:456]` - Automatically sends NFT to recipients
   - Works with both BaseMailer and external email addresses

3. **Crypto Transfers**: Supports ERC20 tokens, NFTs (ERC721), and ETH. Transfers are executed on-chain and stored in pending transfers until claimed.

4. **Gas Sponsorship**: Wallet deployment and transactions can be gas-sponsored by the relayer. Users don't need to pay gas fees for supported operations.

5. **IPFS Storage**: Email content is encrypted and stored on IPFS via Pinata.cloud for reliable, fast access. The encryption key is returned with the message.

6. **Claim Process**: 
   - Crypto transfers create a claim token
   - Recipient verifies the claim token
   - Recipient deploys wallet (optionally gas-sponsored)
   - Assets are automatically transferred to the deployed wallet

7. **Smart Wallets**: 
   - ERC-4337 account abstraction implementation
   - Deterministic wallet addresses based on email hash
   - Gas-sponsored deployments via Coinbase CDP Paymaster
   - Support for batch operations and CREATE2 deployment

8. **NFT Operations**:
   - Send NFTs via email with optional gas sponsoring
   - Batch NFT transfers for multiple recipients
   - NFT metadata fetching and approval management
   - Support for ERC721 tokens

9. **Gas Sponsorship**:
   - Coinbase CDP Paymaster integration
   - Gasless wallet deployments and transactions
   - Configurable per-user and global limits
   - Support for allowlisted contract functions

10. **External Email Support**:
    - Send crypto to any email address (Gmail, Outlook, Yahoo, etc.)
    - Automatic claim email notifications sent to external recipients
    - Non-custodial wallet creation via email verification

## Configuration Requirements

### Environment Variables

The following environment variables are required for proper operation:

**Pinata IPFS Configuration:**
```bash
PINATA_JWT=your_pinata_jwt_token
PINATA_API_KEY=your_pinata_api_key  
PINATA_SECRET_API_KEY=your_pinata_secret_api_key
```

Get your Pinata credentials from: https://app.pinata.cloud/developers/api-keys

**Other Required Variables:**
- Database connection strings (MONGO_URI)
- Base blockchain RPC (BASE_RPC_URL)
- Smart contract addresses (BASEMAILER_CONTRACT_ADDRESS)
- SMTP configuration for email delivery
- JWT secret for authentication

See `.env.example` for a complete configuration template.

