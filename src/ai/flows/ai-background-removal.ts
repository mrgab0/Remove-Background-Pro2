'use server';

/**
 * @fileOverview Removes the background from an image using Google's generative AI.
 *
 * - aiBackgroundRemoval - A function that handles the background removal process.
 * - AiBackgroundRemovalInput - The input type for the aiBackgroundRemoval function.
 * - AiBackgroundRemovalOutput - The return type for the aiBackgroundRemoval function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiBackgroundRemovalInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to remove the background from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  intensity: z
    .enum(['subtle', 'standard', 'aggressive'])
    .default('standard')
    .describe('The intensity of the background removal.'),
});
export type AiBackgroundRemovalInput = z.infer<typeof AiBackgroundRemovalInputSchema>;

const AiBackgroundRemovalOutputSchema = z.object({
  processedPhotoDataUri: z
    .string()
    .describe('The photo with the background removed, as a data URI.'),
});
export type AiBackgroundRemovalOutput = z.infer<typeof AiBackgroundRemovalOutputSchema>;

export async function aiBackgroundRemoval(input: AiBackgroundRemovalInput): Promise<AiBackgroundRemovalOutput> {
  return aiBackgroundRemovalFlow(input);
}

const aiBackgroundRemovalFlow = ai.defineFlow(
  {
    name: 'aiBackgroundRemovalFlow',
    inputSchema: AiBackgroundRemovalInputSchema,
    outputSchema: AiBackgroundRemovalOutputSchema,
  },
  async input => {
    let promptText = 'Remove the background from this image.';
    switch (input.intensity) {
      case 'subtle':
        promptText =
          'Gently remove the background from this image, preserving as much of the main subject as possible, including fine details like hair. The result should have clean, soft edges.';
        break;
      case 'aggressive':
        promptText =
          'Aggressively and completely remove the background from this image. Create a very clean, sharp cutout of the main subject, even if it means some fine details are lost. Prioritize complete background removal.';
        break;
    }

    const {media} = await ai.generate({
      prompt: [{media: {url: input.photoDataUri}}, {text: promptText}],
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('No media returned from background removal.');
    }

    return {processedPhotoDataUri: media.url};
  }
);
