'use server';

/**
 * @fileOverview Upscales an image by 2x or 4x using Google's generative AI.
 *
 * - aiUpscale - A function that handles the image upscaling process.
 * - AiUpscaleInput - The input type for the aiUpscale function.
 * - AiUpscaleOutput - The return type for the aiUpscale function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiUpscaleInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo to be upscaled, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
  scale: z.enum(['2x', '4x']).describe('The upscale factor (2x or 4x).'),
});
export type AiUpscaleInput = z.infer<typeof AiUpscaleInputSchema>;

const AiUpscaleOutputSchema = z.object({
  upscaledPhotoDataUri: z
    .string()
    .describe('The upscaled photo, as a data URI.'),
});
export type AiUpscaleOutput = z.infer<typeof AiUpscaleOutputSchema>;

export async function aiUpscale(input: AiUpscaleInput): Promise<AiUpscaleOutput> {
  return aiUpscaleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiUpscalePrompt',
  input: {schema: AiUpscaleInputSchema},
  output: {schema: AiUpscaleOutputSchema},
  prompt: `You are an expert image upscaler. Take the image provided and upscale it by the factor specified.

Image: {{media url=photoDataUri}}
Scale factor: {{{scale}}}

Ensure the upscaled image retains as much detail as possible.`, // Removed extra newline
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const aiUpscaleFlow = ai.defineFlow(
  {
    name: 'aiUpscaleFlow',
    inputSchema: AiUpscaleInputSchema,
    outputSchema: AiUpscaleOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {media: {url: input.photoDataUri}},
        {text: `Upscale this image by ${input.scale}`},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('No media returned from image generation.');
    }

    return {upscaledPhotoDataUri: media.url};
  }
);
