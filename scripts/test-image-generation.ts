
import { generateIdeaImage } from '../src/lib/ai/imageGenerator';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("Testing Gemini Image Generation...");

    if (!process.env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = "dummy_key";
        console.log("Using dummy key for mock test...");
    }

    try {
        const prompt = "A futuristic crypto logo for a prediction market";
        console.log(`Generating image for prompt: "${prompt}"...`);

        // This will likely fail with a dummy key in a real network call,
        // but it verifies the function imports and runs without syntax errors.
        // To verify success, we'd need a real key.
        // We catch the error to confirm graceful handling.

        const result = await generateIdeaImage(prompt);

        if (result.imageData) {
            console.log("Image generated successfully (base64 length):", result.imageData.length);
        } else {
            console.log("Image generation returned error:", result.error);
        }

    } catch (e) {
        console.error("Test execution failed:", e);
    }
}

main();
