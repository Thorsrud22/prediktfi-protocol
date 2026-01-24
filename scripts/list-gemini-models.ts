
import { gemini } from '../src/lib/geminiClient';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    try {
        const client = gemini();
        console.log("Listing models...");
        // The list models API might be on client.models or client.listModels depending on SDK version
        // Based on previous inspection: client.models.list()

        const response = await client.models.list();

        // Response structure might need inspection
        const models = (response as any).models || (response as any).response?.models;

        if (models) {
            console.log("Available models:");
            models.forEach((m: any) => {
                if (m.name.includes('image') || m.name.includes('flash')) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log("Raw response:", JSON.stringify(response, null, 2));
        }

    } catch (e) {
        console.error("List models failed:", e);
    }
}

main();
