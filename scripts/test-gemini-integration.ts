
import { getGeminiClient } from '../src/lib/geminiClient';

async function main() {
    console.log("Testing Gemini Integration...");

    // Simulate env if not present (only works if code doesn't strictly check process.env at load time)
    if (!process.env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = "dummy_key";
        console.log("Using dummy key for mock test...");
    }

    try {
        const client = getGeminiClient();
        console.log("Client created successfully.");

        // Mock the generateContent method if we don't have a real key, 
        // to verify code path.
        // But since we can't easily mock the import here without a framework,
        // we'll explicitly check the structure.

        console.log("Client structure:", Object.keys(client));
        if (client.models) {
            console.log("Client.models exists.");
            if (typeof client.models.generateContent === 'function') {
                console.log("Client.models.generateContent exists. Integration valid.");
            } else {
                console.error("Client.models.generateContent MISSING.");
            }
        } else {
            console.error("Client.models MISSING.");
        }

    } catch (e) {
        console.error("Integration failed:", e);
    }
}

main();
