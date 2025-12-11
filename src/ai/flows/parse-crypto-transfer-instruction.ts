'use server';
/**
 * @fileOverview Parses natural language instructions for crypto transfers embedded in emails.
 *
 * - parseCryptoTransferInstruction - A function that handles the parsing process.
 * - ParseCryptoTransferInstructionInput - The input type for the parseCryptoTransferInstruction function.
 * - ParseCryptoTransferInstructionOutput - The return type for the parseCryptoTransferInstruction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ParseCryptoTransferInstructionInputSchema = z.object({
  instruction: z
    .string()
    .describe(
      'A natural language instruction for a crypto transfer, e.g., \'Send 100 USDC to user@example.com\'.'
    ),
});
export type ParseCryptoTransferInstructionInput = z.infer<
  typeof ParseCryptoTransferInstructionInputSchema
>;

const ParseCryptoTransferInstructionOutputSchema = z.object({
  recipientEmail: z.string().describe('The email address of the recipient.'),
  assetType: z.string().describe('The type of asset to transfer (e.g., ETH, USDC, NFT).'),
  amount: z.string().describe('The amount of the asset to transfer.'),
  nftContractAddress: z.string().optional().describe('The contract address of the NFT, if applicable.'),
  nftTokenId: z.string().optional().describe('The token ID of the NFT, if applicable.'),
});
export type ParseCryptoTransferInstructionOutput = z.infer<
  typeof ParseCryptoTransferInstructionOutputSchema
>;

export async function parseCryptoTransferInstruction(
  input: ParseCryptoTransferInstructionInput
): Promise<ParseCryptoTransferInstructionOutput> {
  return parseCryptoTransferInstructionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseCryptoTransferInstructionPrompt',
  input: {schema: ParseCryptoTransferInstructionInputSchema},
  output: {schema: ParseCryptoTransferInstructionOutputSchema},
  prompt: `You are a service that extracts information about crypto transfers from natural language instructions.

  Given the following instruction, extract the recipient's email address, the asset type, and the amount to transfer.  If the asset type is an NFT, also extract the contract address and token ID.

  Instruction: {{{instruction}}}
  Output the response in JSON format.
  `,
});

const parseCryptoTransferInstructionFlow = ai.defineFlow(
  {
    name: 'parseCryptoTransferInstructionFlow',
    inputSchema: ParseCryptoTransferInstructionInputSchema,
    outputSchema: ParseCryptoTransferInstructionOutputSchema,
  },
  async (input: any) => {
    const {output} = await prompt(input);
    return output!;
  }
);
