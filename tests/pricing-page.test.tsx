
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PricingPage from '@/app/pricing/page';

describe('PricingPage', () => {
    it('renders the "Who Pays?" header', () => {
        render(<PricingPage />);
        expect(screen.getByText('Who')).toBeDefined();
        expect(screen.getByText('Pays?')).toBeDefined();
    });

    it('displays the three pricing tiers', () => {
        render(<PricingPage />);
        expect(screen.getByText('Market Scout')).toBeDefined();
        expect(screen.getByText('Founder Pro')).toBeDefined();
        expect(screen.getByText('Institutional')).toBeDefined();
    });

    it('shows the correct pricing for each tier', () => {
        render(<PricingPage />);
        expect(screen.getByText('$0')).toBeDefined();
        expect(screen.getByText('$49')).toBeDefined();
        expect(screen.getByText('API')).toBeDefined();
    });

    it('contains a link to start free', () => {
        render(<PricingPage />);
        const link = screen.getByRole('link', { name: /start scouting/i });
        expect(link).toBeDefined();
        expect(link.getAttribute('href')).toBe('/studio');
    });
});
