'use server';
/**
 * @fileOverview Flow for composing an email from a template.
 *
 * This flow allows users to quickly create new emails using pre-defined templates.
 *
 * @exports `composeEmailFromTemplate` - The main function to compose an email from a template.
 * @exports `ComposeEmailFromTemplateInput` - The input type for the `composeEmailFromTemplate` function.
 * @exports `ComposeEmailFromTemplateOutput` - The output type for the `composeEmailFromTemplate` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ComposeEmailFromTemplateInputSchema = z.object({
  templateName: z.string().describe('The name of the email template to use.'),
  templateVariables: z
    .record(z.string(), z.string())
    .optional()
    .describe('A map of variable names to values to populate the template.'),
  additionalContext: z
    .string()
    .optional()
    .describe('Any additional context to include in the email.'),
});

export type ComposeEmailFromTemplateInput = z.infer<
  typeof ComposeEmailFromTemplateInputSchema
>;

const ComposeEmailFromTemplateOutputSchema = z.object({
  subject: z.string().describe('The subject of the composed email.'),
  body: z.string().describe('The body of the composed email.'),
});

export type ComposeEmailFromTemplateOutput = z.infer<
  typeof ComposeEmailFromTemplateOutputSchema
>;

const emailTemplates = {
  welcome: {
    subject: 'Welcome to DexMail!',
    body: `Dear {{name}},

Welcome to DexMail! We are excited to have you join our community.

Sincerely,
The DexMail Team`,
  },
  paymentReminder: {
    subject: 'Payment Reminder',
    body: `Dear {{name}},

This is a friendly reminder that your payment of {{amount}} is due on {{dueDate}}.

Sincerely,
The DexMail Team`,
  },
  cryptoTransfer: {
    subject: 'You\'ve Received Crypto via DexMail!',
    body: `Dear {{name}},

You have received {{amount}} {{token}} via DexMail. Click the link below to claim your crypto:

{{claimLink}}

Sincerely,
The DexMail Team`,
  },
};

export async function composeEmailFromTemplate(
  input: ComposeEmailFromTemplateInput
): Promise<ComposeEmailFromTemplateOutput> {
  return composeEmailFromTemplateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'composeEmailFromTemplatePrompt',
  input: {schema: ComposeEmailFromTemplateInputSchema},
  output: {schema: ComposeEmailFromTemplateOutputSchema},
  prompt: `You are an email composition assistant. The user will provide a template name and optionally some variables and additional context.

  Compose the email subject and body based on the provided template and variables.

  The available templates are:
  {{#each (keys emailTemplates)}}
  - {{this}}
  {{/each}}

  Template Name: {{templateName}}
  Template Variables: {{templateVariables}}
  Additional Context: {{additionalContext}}

  Here are the templates:
  {{json emailTemplates}}

  Subject: {{emailTemplates.[templateName].subject}}
  Body: {{emailTemplates.[templateName].body}}

  Subject: 
  Body:
  `,
});

const composeEmailFromTemplateFlow = ai.defineFlow(
  {
    name: 'composeEmailFromTemplateFlow',
    inputSchema: ComposeEmailFromTemplateInputSchema,
    outputSchema: ComposeEmailFromTemplateOutputSchema,
  },
  async (input: any) => {
    const template = emailTemplates[input.templateName as keyof typeof emailTemplates];

    if (!template) {
      throw new Error(`Template ${input.templateName} not found.`);
    }

    let subject = template.subject;
    let body = template.body;

    if (input.templateVariables) {
      for (const [key, value] of Object.entries(input.templateVariables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value as string);
        body = body.replace(regex, value as string);
      }
    }

    return {subject: subject, body: body};
  }
);
