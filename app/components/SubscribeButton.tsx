'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubscribeButtonProps {
    priceId: string;
    className?: string;
    children: React.ReactNode;
}

export default function SubscribeButton({ priceId, className, children }: SubscribeButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubscribe = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId,
                    redirectPath: window.location.pathname,
                }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('Failed to create checkout session');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error during checkout:', error);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSubscribe}
            disabled={loading}
            className={`${className} ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                </span>
            ) : (
                children
            )}
        </button>
    );
}
