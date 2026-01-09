'use client';
import React from 'react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { ReactNode } from 'react';

if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only', // Use 'always' to create profiles for anonymous users as well
        capture_pageview: false, // We handle pageviews manually in page.tsx or middleware if needed, but for now auto-capture is fine?
        // Actually, manual pageview capture is better in Next.js App Router, but the library might handle it.
        // Let's stick to default for now, but disable autocapture if we want granular control
    });
}

export function CSPostHogProvider({ children }: { children: ReactNode }) {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
