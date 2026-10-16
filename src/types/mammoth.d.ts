// mammoth ships no TypeScript types; declare the one API this project uses.
declare module "mammoth" {
  export interface ExtractRawTextResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  export function extractRawText(input: { buffer: Buffer }): Promise<ExtractRawTextResult>;
  const mammoth: { extractRawText: typeof extractRawText };
  export default mammoth;
}
