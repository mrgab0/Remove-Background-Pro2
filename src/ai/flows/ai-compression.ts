'use server';

/**
 * @fileOverview Compresses an image using Google's generative AI.
 *
 * - aiCompression - A function that handles the image compression process.
 * - AiCompressionInput - The input type for the aiCompression function.
 * - AiCompressionOutput - The return type for the aiCompression function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCompressionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be compressed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  targetSizeMB: z.number().describe('The target maximum size for the image in megabytes.'),
});
export type AiCompressionInput = z.infer<typeof AiCompressionInputSchema>;

const AiCompressionOutputSchema = z.object({
  compressedPhotoDataUri: z
    .string()
    .describe('The compressed photo, as a data URI.'),
});
export type AiCompressionOutput = z.infer<typeof AiCompressionOutputSchema>;

export async function aiCompression(input: AiCompressionInput): Promise<AiCompressionOutput> {
  return aiCompressionFlow(input);
}

const aiCompressionFlow = ai.defineFlow(
  {
    name: 'aiCompressionFlow',
    inputSchema: AiCompressionInputSchema,
    outputSchema: AiCompressionOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        { media: { url: input.photoDataUri } },
        { text: `Compress this image to be under ${input.targetSizeMB}MB while maintaining the best possible quality. The output must be a web-friendly format like PNG or JPEG.` },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('No media returned from image compression.');
    }

    return { compressedPhotoDataUri: media.url };
  }
);
