import { EmailMessage, CryptoAsset } from './types';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from './wagmi-config';
import { BASEMAILER_ADDRESS, baseMailerAbi } from './contracts';

export interface SendEmailData {
  from: string;
  to: string[];
  subject: string;
  body: string;
  cryptoTransfer?: {
    enabled: boolean;
    assets: CryptoAsset[];
  };
}

export interface SendEmailResponse {
  messageId: string;
  cid: string;
  key: string;
}

class MailService {
  async sendEmail(data: SendEmailData): Promise<SendEmailResponse> {
    // 1. Upload to IPFS via API route
    const ipfsResponse = await fetch('/api/ipfs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: data.from,
        to: data.to,
        subject: data.subject,
        body: data.body,
        timestamp: new Date().toISOString(),
        cryptoTransfer: data.cryptoTransfer
      })
    });

    if (!ipfsResponse.ok) {
      throw new Error('Failed to upload email to IPFS');
    }

    const { cid } = await ipfsResponse.json();
    console.log('[MailService] Uploaded to IPFS with CID:', cid);

    // 2. Call Smart Contract to index mail
    let txHash = '';

    if (data.to.length > 0) {
      const recipient = data.to[0];
      const hasCrypto = !!data.cryptoTransfer?.enabled;

      // Convert IPFS CID to bytes32 by hashing it
      // We'll store the hash and maintain a mapping of hash -> CID in localStorage
      const { keccak256, toHex } = await import('viem');
      const cidBytes32 = keccak256(toHex(cid));

      // Store the mapping in localStorage for retrieval
      if (typeof window !== 'undefined') {
        const cidMap = JSON.parse(localStorage.getItem('ipfs_cid_map') || '{}');
        cidMap[cidBytes32] = cid;
        localStorage.setItem('ipfs_cid_map', JSON.stringify(cidMap));
        console.log('[MailService] Stored CID mapping:', cidBytes32, '->', cid);
      }

      txHash = await writeContract(wagmiConfig, {
        address: BASEMAILER_ADDRESS,
        abi: baseMailerAbi,
        functionName: 'indexMail',
        args: [cidBytes32, recipient, false, hasCrypto] // cid, recipientEmail, isExternal, hasCrypto
      });

      console.log('[MailService] Indexed mail on blockchain with tx:', txHash);
    }

    return {
      messageId: txHash,
      cid: cid,
      key: 'mock-key'
    };
  }

  private async fetchEmailFromIPFS(cidHash: string): Promise<{ subject: string; body: string } | null> {
    try {
      // Skip if it's the dummy CID (all zeros)
      if (cidHash === '0x' + '0'.repeat(64)) {
        console.log('[MailService] Skipping dummy CID');
        return null;
      }

      // Get the actual IPFS CID from localStorage mapping
      let actualCid: string | null = null;

      if (typeof window !== 'undefined') {
        const cidMap = JSON.parse(localStorage.getItem('ipfs_cid_map') || '{}');
        actualCid = cidMap[cidHash];
        console.log('[MailService] Retrieved CID from mapping:', cidHash, '->', actualCid);
      }

      if (!actualCid) {
        console.log('[MailService] No CID mapping found for hash:', cidHash);
        return null;
      }

      // Fetch from IPFS via Pinata gateway
      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${actualCid}`;
      console.log('[MailService] Fetching from IPFS:', gatewayUrl);

      const response = await fetch(gatewayUrl);

      if (!response.ok) {
        console.error(`[MailService] Failed to fetch from IPFS: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      console.log('[MailService] Successfully fetched email from IPFS');

      return {
        subject: data.subject || 'No Subject',
        body: data.body || ''
      };
    } catch (error) {
      console.error('[MailService] Error fetching from IPFS:', error);
      return null;
    }
  }

  async getInbox(email: string): Promise<EmailMessage[]> {
    try {
      console.log(`[MailService] Fetching inbox for: ${email}`);
      console.log(`[MailService] Contract address: ${BASEMAILER_ADDRESS}`);

      // Check if we're connected to the right network
      const { getAccount, getChainId } = await import('@wagmi/core');
      const account = getAccount(wagmiConfig);
      const chainId = getChainId(wagmiConfig);

      console.log(`[MailService] Connected account: ${account.address}`);
      console.log(`[MailService] Chain ID: ${chainId} (Base Sepolia = 84532)`);

      const mailIds = await readContract(wagmiConfig, {
        address: BASEMAILER_ADDRESS,
        abi: baseMailerAbi,
        functionName: 'getInbox',
        args: [email]
      }) as bigint[];

      console.log(`[MailService] Found ${mailIds.length} mail(s) in inbox`);
      console.log(`[MailService] Mail IDs:`, mailIds);

      // Empty inbox is a valid state, not an error
      if (mailIds.length === 0) {
        console.log('[MailService] Inbox is empty - no mails indexed yet');
        return [];
      }

      const messages: EmailMessage[] = [];

      for (const id of mailIds) {
        try {
          console.log(`[MailService] Fetching mail ID: ${id}`);

          // Step 1: Get mail metadata from contract
          const mail = await readContract(wagmiConfig, {
            address: BASEMAILER_ADDRESS,
            abi: baseMailerAbi,
            functionName: 'getMail',
            args: [id]
          }) as any;

          console.log(`[MailService] Mail ${id} - CID: ${mail.cid}, Sender: ${mail.sender}`);

          // Step 2: Get sender's email from their wallet address
          let senderEmail = mail.sender; // Fallback to address if lookup fails
          try {
            const emailFromAddress = await readContract(wagmiConfig, {
              address: BASEMAILER_ADDRESS,
              abi: baseMailerAbi,
              functionName: 'addressToEmail',
              args: [mail.sender]
            }) as string;

            if (emailFromAddress && emailFromAddress.trim() !== '') {
              senderEmail = emailFromAddress;
              console.log(`[MailService] Resolved sender address ${mail.sender} to email: ${senderEmail}`);
            }
          } catch (error) {
            console.warn(`[MailService] Could not resolve email for address ${mail.sender}, using address as fallback`);
          }

          // Step 3: Fetch email content from IPFS using the CID
          const ipfsContent = await this.fetchEmailFromIPFS(mail.cid);

          const subject = ipfsContent?.subject || 'Email from blockchain';
          const body = ipfsContent?.body || 'This email was sent via DexMail';

          messages.push({
            messageId: id.toString(),
            from: senderEmail,
            to: [mail.recipientEmail],
            subject: subject,
            body: body,
            timestamp: mail.timestamp.toString(),
            hasCryptoTransfer: mail.hasCrypto,
            ipfsCid: mail.cid
          });
        } catch (mailError) {
          console.error(`[MailService] Error fetching mail ID ${id}:`, mailError);
          // Continue with other mails even if one fails
        }
      }

      console.log(`[MailService] Successfully fetched ${messages.length} message(s)`);
      return messages.reverse();
    } catch (error: any) {
      // Handle the specific case where contract returns 0x (empty data)
      // This happens when the inbox is empty or the contract doesn't exist
      if (error?.name === 'ContractFunctionZeroDataError' ||
        error?.cause?.name === 'ContractFunctionZeroDataError' ||
        error?.message?.includes('returned no data')) {
        console.log('[MailService] Contract returned no data - treating as empty inbox');
        console.log('[MailService] This could mean:');
        console.log('  1. No emails have been sent to this address yet');
        console.log('  2. Wrong network (make sure you are on Base)');
        console.log('  3. Contract not deployed at this address');
        return [];
      }

      // This is an actual error (network issue, wrong network, etc.)
      console.error('[MailService] Error fetching inbox:', error);
      console.error('[MailService] Error details:', {
        name: error?.name,
        message: error?.message,
        cause: error?.cause
      });
      throw error; // Re-throw to let caller handle it
    }
  }

  async getSent(email: string): Promise<EmailMessage[]> {
    return [];
  }

  async getMessage(messageId: string, email: string): Promise<EmailMessage> {
    const mail = await readContract(wagmiConfig, {
      address: BASEMAILER_ADDRESS,
      abi: baseMailerAbi,
      functionName: 'getMail',
      args: [BigInt(messageId)]
    }) as any;

    return {
      messageId: messageId,
      from: mail.sender,
      to: [mail.recipientEmail],
      subject: 'Loading...',
      body: 'Loading...',
      timestamp: mail.timestamp.toString(),
      hasCryptoTransfer: mail.hasCrypto,
      ipfsCid: mail.cid
    };
  }

  async deleteMessage(messageId: string, email: string): Promise<{ success: boolean; messageId: string }> {
    return { success: true, messageId };
  }
}

export const mailService = new MailService();
export default MailService;
