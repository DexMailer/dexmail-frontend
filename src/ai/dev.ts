import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-reply.ts';
import '@/ai/flows/parse-crypto-transfer-instruction.ts';
import '@/ai/flows/summarize-email-content.ts';
import '@/ai/flows/compose-email-from-template.ts';