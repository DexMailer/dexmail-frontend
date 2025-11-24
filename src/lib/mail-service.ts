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

    // 2. Call Smart Contract to index mail
    let txHash = '';

    if (data.to.length > 0) {
      const recipient = data.to[0];
      const hasCrypto = !!data.cryptoTransfer?.enabled;

      // We use a dummy bytes32 for CID because real CID doesn't fit in bytes32 usually
      // In a real app we'd convert or use a different contract storage
      const cidBytes32 = '0x' + '0'.repeat(64);

      txHash = await writeContract(wagmiConfig, {
        address: BASEMAILER_ADDRESS,
        abi: baseMailerAbi,
        functionName: 'indexMail',
        args: [recipient, cidBytes32, false, hasCrypto]
      });
    }

    return {
      messageId: txHash,
      cid: cid,
      key: 'mock-key'
    };
  }

  async getInbox(email: string): Promise<EmailMessage[]> {
    try {
      const mailIds = await readContract(wagmiConfig, {
        address: BASEMAILER_ADDRESS,
        abi: baseMailerAbi,
        functionName: 'getInbox',
        args: [email]
      }) as bigint[];

      const messages: EmailMessage[] = [];

      for (const id of mailIds) {
        const mail = await readContract(wagmiConfig, {
          address: BASEMAILER_ADDRESS,
          abi: baseMailerAbi,
          functionName: 'getMail',
          args: [id]
        }) as any;

        messages.push({
          messageId: id.toString(),
          from: mail.sender,
          to: [mail.recipientEmail],
          subject: 'Loading...',
          body: 'Loading...',
          timestamp: mail.timestamp.toString(),
          hasCryptoTransfer: mail.hasCrypto,
          ipfsCid: mail.cid
        });
      }

      return messages.reverse();
    } catch (error) {
      console.error('Error fetching inbox:', error);
      return [];
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
