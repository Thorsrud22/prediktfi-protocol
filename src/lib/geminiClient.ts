
import { GoogleGenAI } from "@google/genai";

let geminiInstance: GoogleGenAI | null = null;

/**
 * Gets or creates the Google GenAI client instance.
 * Throws an error if GEMINI_API_KEY is not set.
 */
export function getGeminiClient(): GoogleGenAI {
    if (geminiInstance) {
        return geminiInstance;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY environment variable is not set. Please configure it in your .env file.'
        );
    }

    geminiInstance = new GoogleGenAI({ apiKey });
    return geminiInstance;
}

// Export singleton getter as default or named
export const gemini = getGeminiClient;
