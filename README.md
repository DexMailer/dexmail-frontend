# 📧 DexMail Frontend

**Building the Next Generation Email OS.**

DexMail bridges the gap between Web2 communication and Web3 finance, creating a unified operating system for your digital identity and assets.

---

## 🌟 Key Features

### 📨 Core Messaging
- **Decentralized Storage**: Messages are indexed on-chain and stored securely.
- **Web2 Compatibility**: Send to and receive from standard providers (Gmail, Outlook).
- **Rich Experience**: Full-featured inbox, drafts, and sent folders.

### 💰 Crypto Transfers
- **Email-to-Email**: Send ETH, ERC20 tokens, and NFTs directly to email addresses.
- **Gas-Sponsored Claims**: Recipients without wallets can claim funds easily via account abstraction.
- **Balance Guard**: Real-time validation to prevent insufficient fund errors.

### 🔐 Advanced Security
- **Rate Limiting**: Intelligent token-bucket limiting (20 req/min) per IP using `lru-cache`.
- **Strict Validation**: Rigorous validation for Ethereum addresses and email identifiers.
- **Input Sanitization**: comprehensive protection against XSS and injection attacks.
- **Security Headers**: Production-grade HTTP headers (CSP, X-Frame-Options).

### 🆔 Authentication
- **Coinbase Embedded Wallet**: Seamless email-based sign-in for non-crypto users.
- **External Wallets**: Connect with MetaMask, Rainbow, or Coinbase Wallet.
- **Unique Identity**: Policies enforce a strict **one-wallet-per-account** rule to prevent identity spoofing.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + [Radix UI](https://www.radix-ui.com/)
- **Blockchain**:
  - [Viem](https://viem.sh/) & [Wagmi](https://wagmi.sh/) for interactions
  - [RainbowKit](https://www.rainbowkit.com/) for wallet connections
  - [Coinbase CDP SDK](https://docs.cloud.coinbase.com/) for embedded wallets
- **Database**: MongoDB (User metadata & indexes)
- **Security**: `lru-cache` (Rare limiting), custom middleware

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB instance (local or Atlas)
- Base Sepolia (or Mainnet) RPC URL

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DexMail-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory:
   ```env
   # Blockchain
   NEXT_PUBLIC_CHAIN_ID=8453
   NEXT_PUBLIC_RPC_URL=https://mainnet.base.org

   # Smart Contracts
   NEXT_PUBLIC_BASE_MAILER_ADDRESS=0x...
   NEXT_PUBLIC_TRUSTED_RELAYER_ADDRESS=0x...

   # API & Backend
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   JWT_SECRET=your-secure-secret-key
   MONGODB_URI=mongodb://localhost:27017/dexmail

   # IPFS (Optional)
   NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Visit the app**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security Architecture

DexMail places a high priority on security and user safety:

- **Middleware Protection**: All API routes are protected by a global middleware that enforces rate limits and sets security headers.
- **Address Validation**: We distinguish between "Usernames" (email-like) and "Addresses" (0x...). The API rigorously checks these formats to prevent injection attacks on blockchain calls.
- **Account Integrity**: The system checks for duplicate wallet registrations during the onboarding flow, ensuring that a single wallet address cannot claim multiple DexMail identities.

### 🛡️ Spam Prevention
A core pillar of DexMail's "Next Gen" philosophy is rethinking email spam. 
- **Pay-to-Contact (Economic Spam Filter)**: If you are not in a recipient's whitelist, you can still reach them but must pay a micro-fee (ETH). This economic barrier effectively eliminates automated spam bots while allowing legitimate urgent access.
- **Whitelist System**: Contacts you reply to are automatically whitelisted, creating a zero-friction experience for known connections.

---

## 📂 Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Login & Register pages
│   ├── api/              # Backend API Routes
│   │   ├── auth/         # Authentication & Wallet Checks
│   │   ├── email/        # Drafts, Status, Sending
│   │   └── tokens/       # Token & NFT fetching
│   └── dashboard/        # Main User Interface
├── components/
│   ├── auth/             # Auth forms & dialogs
│   ├── mail/             # Mail list & view components
│   └── ui/               # Radix UI primitives
├── lib/
│   ├── models/           # Mongoose Data Models (User, Draft, etc.)
│   ├── services/         # Mail & Blockchain Services
│   └── validation.ts     # Input validation logic
└── middleware.ts         # Global Security Middleware
```

---

## 🤝 Contributing



## 🗺️ Roadmap

### Phase 1: Foundation (Current)
- [x] Core Email Protocol (Send/Receive)
- [x] Crypto Transfers (ETH, ERC20)
- [x] Basic Wallet Integration
- [x] Security Enhancements (Rate Limiting, Validation)
- [x] Spam Prevention (Pay-to-Contact)

### Phase 2: Expansion (Q1 2026)
- [ ] **Cross-Chain Support**: Expansion to Optimism, Arbitrum, and Polygon.
- [ ] **Mobile Application**: Native React Native app for iOS and Android.
- [ ] **Advanced DeFi**: Yield-bearing attachments (send aDAI/cUSDC).
- [ ] **Smart Filters**: AI-driven spam detection and categorization.

### Phase 3: Ecosystem (Q3 2026)
- [ ] **Developer SDK**: Libraries for building on top of DexMail protocol.
- [ ] **DAO Governance**: Community-driven protocol upgrades.
- [ ] **Custom Domains**: Support for `@yourdao.eth` email aliases.
- [ ] **Encrypted Group Chats**: Secure mailing lists and group threads.

---

