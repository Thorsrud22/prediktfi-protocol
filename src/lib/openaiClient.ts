import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

/**
 * Gets or creates the OpenAI client instance.
 * Throws an error if OPENAI_API_KEY is not set.
 */
function getOpenAIClient(): OpenAI {
    if (openaiInstance) {
        return openaiInstance;
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error(
            'OPENAI_API_KEY environment variable is not set. Please configure it in your .env file.'
        );
    }

    openaiInstance = new OpenAI({
        apiKey,
    });

    return openaiInstance;
}

export { getOpenAIClient as openai };
