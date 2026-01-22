
import fs from 'fs';
import path from 'path';
import { openai } from '../src/lib/openaiClient';

// Load .env manually for script execution
const envPath = path.resolve(process.cwd(), '.env');
console.log(`📂 Loading environment from: ${envPath}`);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        if (!line || line.startsWith('#')) return;
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

async function verifyModel() {
    const modelName = process.env.EVAL_MODEL || "gpt-5.2";
    console.log(`🔍 Testing model configuration: '${modelName}'`);

    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY is missing.');
        process.exit(1);
    }

    // Force O1 mode logic for this test to see if JSON is supported
    const params: any = {
        model: modelName,
        messages: [{ role: 'user', content: 'Ping (return JSON {"pong": true})' }],
        max_completion_tokens: 20,
        response_format: { type: "json_object" }
    };

    console.log('⚙️ Testing with response_format: { type: "json_object" } ...');

    try {
        const completion = await openai().chat.completions.create(params);
        console.log('✅ Success! The model supports JSON mode.');
        console.log('Content:', completion.choices[0]?.message?.content);
    } catch (error: any) {
        console.error('❌ Failed. JSON mode likely not supported.');
        console.error('Message:', error.message);
        process.exit(1);
    }
}

verifyModel();
