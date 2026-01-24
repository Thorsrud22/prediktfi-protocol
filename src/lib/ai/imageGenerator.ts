
import { gemini } from '../geminiClient';

/**
 * Generates an image based on a text prompt using Gemini 2.5 Flash Image.
 * Returns a base64 string of the image.
 */
export async function generateIdeaImage(prompt: string): Promise<{ imageData: string | null; error?: string }> {
    try {
        const client = gemini();

        // Using the same pattern as evaluator.ts for consistency and reliability
        const response = await client.models.generateContent({
            model: "gemini-3-pro-image-preview",
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        // Gemini 2.5 Flash Image returns inline data for images
        // The response structure might be slightly different depending on the client version helper
        // Safely inspecting the result

        // Check for inline data directly if available in the typed response or fallback to candidates
        const result = response as any;
        const candidates = result.candidates || (result.response && result.response.candidates);
        if (!candidates || candidates.length === 0) {
            console.warn("No candidates returned from image generation");
            return { imageData: null, error: "No image generated" };
        }

        const content = candidates[0].content;
        const parts = content.parts;

        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                return {
                    imageData: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                };
            }
        }

        console.warn("No image data found in response parts");
        return { imageData: null, error: "No valid image data in response" };

    } catch (error: any) {
        console.error("Error generating image:", error);
        if (error.response) {
            console.error("Error response data:", JSON.stringify(error.response, null, 2));
        }

        let errorMessage = "Failed to generate image";

        if (error.status === 429 || error.message?.includes('429')) {
            errorMessage = "Gemini Quota Exceeded (Limit 0/Free Tier). Check billing.";
        } else if (error.message) {
            errorMessage = error.message;
        }

        return { imageData: null, error: errorMessage };
    }
}
