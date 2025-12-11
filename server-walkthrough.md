# SMTP/IMAP Server Implementation

I have implemented the SMTP and IMAP servers as standalone Node.js scripts that integrate with the BaseMailer smart contract and IPFS.

## Architecture

*   **SMTP Server (`src/server/smtp.ts`)**:
    *   Listens on port 587.
    *   Receives emails via standard SMTP protocol.
    *   Uploads email content to IPFS using Pinata.
    *   Indexes the email on the Base blockchain by calling `indexMail` on the `BaseMailer` contract.
    *   Uses a "Relayer" wallet (configured via env vars) to pay for the indexing transaction.

*   **IMAP Server (`src/server/imap.ts`)**:
    *   Listens on port 993.
    *   Implements basic IMAP commands (`LOGIN`, `SELECT`, `FETCH`).
    *   Reads user's inbox from the `BaseMailer` contract.
    *   (Prototype) Returns mail counts and basic status. Full content fetching would require fetching IPFS data and parsing it into MIME format.

## Configuration

Add the following to your `.env` or `.env.local` file:

```env
# Pinata (Already configured)
PINATA_JWT=...

# Contract Address
NEXT_PUBLIC_BASEMAILER_ADDRESS=...

# Relayer Wallet (For SMTP server to pay gas)
RELAYER_PRIVATE_KEY=0x...
```

## Running the Servers

To start both servers:

```bash
npm run start:mail-server
```

## Testing

You can use standard email clients (Thunderbird, Outlook) or command line tools like `openssl` or `telnet` to test.

**SMTP Test:**
```bash
openssl s_client -connect localhost:587 -starttls smtp
EHLO localhost
MAIL FROM: <sender@example.com>
RCPT TO: <recipient@example.com>
DATA
Subject: Test Email

Hello World!
.
QUIT
```

**IMAP Test:**
```bash
openssl s_client -connect localhost:993
a1 LOGIN user@example.com password
a2 SELECT INBOX
a3 LOGOUT
```
