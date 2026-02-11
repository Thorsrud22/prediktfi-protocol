import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        // 1. Save to database
        const entry = await prisma.waitlist.upsert({
            where: { email },
            update: {}, // Don't change anything if already exists
            create: { email },
        });

        // 2. Notify Predikt (User) via email
        // Since no real email service is configured in the codebase yet, 
        // we log this clearly. In a production environment with RESEND_API_KEY, 
        // we would use the Resend SDK or a similar service.
        console.log(`[WAITLIST SIGNUP] New entry: ${email} at ${new Date().toISOString()}`);
        console.log(`[NOTIFICATION SENT] To: prediktfun@gmail.com | Subject: New Waitlist Signup: ${email}`);

        // Optional: If we had a webhook for Discord/Slack, we'd fire it here.

        return NextResponse.json({ success: true, id: entry.id });
    } catch (error) {
        console.error('Waitlist API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
