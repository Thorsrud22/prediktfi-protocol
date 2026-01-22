
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function verifyStream() {
    const model = "gpt-5.2";
    console.log(`Testing streaming support for model: ${model}`);

    try {
        const stream = await openai.chat.completions.create({
            model: model,
            messages: [{ role: "system", content: 'Count to 3 and return valid JSON with a "numbers" array.' }],
            stream: true,
            max_completion_tokens: 100, // Correct param for O1/GPT-5
            response_format: { type: "json_object" } // Checking if JSON + Stream works
        });

        console.log("Stream connection established. Reading chunks...");

        for await (const chunk of stream) {
            process.stdout.write(chunk.choices[0]?.delta?.content || "");
        }
        console.log("\n\n✅ Success: Model supports streaming.");
    } catch (error: any) {
        console.error("\n❌ Streaming Failed:", error.message);
        if (error.response) {
            console.error("Status:", error.status);
            console.error("Data:", error.response.data);
        }
    }
}

verifyStream();
