'use server';
/**
 * @fileOverview Summarizes email content to provide a quick understanding of the main points.
 *
 * - summarizeEmailContent - A function that summarizes the email content.
 * - SummarizeEmailContentInput - The input type for the summarizeEmailContent function.
 * - SummarizeEmailContentOutput - The return type for the summarizeEmailContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SummarizeEmailContentInputSchema = z.object({
  emailContent: z.string().describe('The content of the email to summarize.'),
});
export type SummarizeEmailContentInput = z.infer<typeof SummarizeEmailContentInputSchema>;

const SummarizeEmailContentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the email content.'),
});
export type SummarizeEmailContentOutput = z.infer<typeof SummarizeEmailContentOutputSchema>;

export async function summarizeEmailContent(input: SummarizeEmailContentInput): Promise<SummarizeEmailContentOutput> {
  return summarizeEmailContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeEmailContentPrompt',
  input: {schema: SummarizeEmailContentInputSchema},
  output: {schema: SummarizeEmailContentOutputSchema},
  prompt: `You are an AI assistant designed to summarize email content.
  Please provide a concise summary of the following email content:
  \n
  {{{emailContent}}}
  `,
});

const summarizeEmailContentFlow = ai.defineFlow(
  {
    name: 'summarizeEmailContentFlow',
    inputSchema: SummarizeEmailContentInputSchema,
    outputSchema: SummarizeEmailContentOutputSchema,
  },
  async (input: any) => {
    const {output} = await prompt(input);
    return output!;
  }
);
