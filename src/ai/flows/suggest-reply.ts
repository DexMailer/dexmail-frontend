// src/ai/flows/suggest-reply.ts
'use server';
/**
 * @fileOverview A flow to suggest replies to an email.
 *
 * - suggestReply - A function that suggests replies to an email.
 * - SuggestReplyInput - The input type for the suggestReply function.
 * - SuggestReplyOutput - The return type for the suggestReply function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestReplyInputSchema = z.object({
  emailBody: z.string().describe('The content of the email to reply to.'),
});
export type SuggestReplyInput = z.infer<typeof SuggestReplyInputSchema>;

const SuggestReplyOutputSchema = z.object({
  suggestedReplies: z.array(z.string()).describe('An array of suggested replies to the email.'),
});
export type SuggestReplyOutput = z.infer<typeof SuggestReplyOutputSchema>;

export async function suggestReply(input: SuggestReplyInput): Promise<SuggestReplyOutput> {
  return suggestReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestReplyPrompt',
  input: {schema: SuggestReplyInputSchema},
  output: {schema: SuggestReplyOutputSchema},
  prompt: `You are an AI assistant that suggests replies to emails. Given the content of an email, suggest a few possible replies.

Email content: {{{emailBody}}}

Suggest 3 possible replies:`,
});

const suggestReplyFlow = ai.defineFlow(
  {
    name: 'suggestReplyFlow',
    inputSchema: SuggestReplyInputSchema,
    outputSchema: SuggestReplyOutputSchema,
  },
  async (input: any) => {
    const {output} = await prompt(input);
    return output!;
  }
);
