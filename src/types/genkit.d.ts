// Type declarations for missing genkit modules
declare module 'genkit' {
  export namespace z {
    export function object(schema: any): any;
    export function string(): any;
    export function array(schema: any): any;
    export function infer<T>(schema: T): any;
  }
  export function genkit(config: any): any;
  export { z };
}

declare module '@genkit-ai/google-genai' {
  export const googleAI: any;
}

declare module 'dotenv' {
  export function config(options?: any): any;
}