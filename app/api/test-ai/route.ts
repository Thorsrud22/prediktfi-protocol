import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'OpenAI API key not found in environment variables',
        instructions: [
          '1. Go to https://platform.openai.com/api-keys',
          '2. Create a new secret key',
          '3. Add OPENAI_API_KEY=sk-your-key-here to .env.local',
          '4. Restart the development server',
        ],
      });
    }

    // Test API connection
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Use cheaper model for testing
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant. Respond with a brief confirmation that the API is working.',
        },
        {
          role: 'user',
          content:
            "Test connection - respond with 'API connection successful' and the current date.",
        },
      ],
      max_tokens: 50,
      temperature: 0.1,
    });

    const aiResponse = response.choices[0]?.message?.content || 'No response';

    return NextResponse.json({
      status: 'success',
      message: 'OpenAI API connection successful!',
      ai_response: aiResponse,
      model_used: response.model,
      tokens_used: response.usage?.total_tokens || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('OpenAI API test failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to OpenAI API',
        error: error.message,
        troubleshooting: [
          'Check if your API key is correct',
          'Verify you have credits in your OpenAI account',
          'Make sure the API key has not expired',
          'Check OpenAI service status at https://status.openai.com/',
        ],
      },
      { status: 500 },
    );
  }
}
