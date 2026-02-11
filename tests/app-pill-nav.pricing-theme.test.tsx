import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePathname } from 'next/navigation';

vi.mock('@/app/components/wallet/SimplifiedWalletProvider', () => ({
  useSimplifiedWallet: () => ({
    publicKey: null,
    disconnect: vi.fn(),
    connect: vi.fn(),
  }),
}));

vi.mock('@/app/lib/use-plan', () => ({
  useIsPro: () => false,
}));

vi.mock('@/app/components/ToastProvider', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('@/app/components/InstantLink', () => ({
  InstantLink: ({ children, href, className, ...rest }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

import AppPillNav from '@/app/components/AppPillNav';

describe('AppPillNav pricing theme', () => {
  const mockedUsePathname = vi.mocked(usePathname);

  beforeEach(() => {
    mockedUsePathname.mockReturnValue('/');
  });

  it('applies pricing-specific matte classes on /pricing', () => {
    mockedUsePathname.mockReturnValue('/pricing');
    const { container } = render(<AppPillNav />);

    const desktopNav = screen.getByLabelText('Main navigation');
    expect(desktopNav.className).toContain('bg-[#0f1113]/97');

    const indicator = container.querySelector('span[aria-hidden="true"]');
    expect(indicator?.className).toContain('bg-white/[0.07]');
    expect(indicator?.className).not.toContain('bg-gradient-to-r');

    const accountButton = screen.getByLabelText('Account');
    expect(accountButton.className).toContain('bg-black/25');

    const mobileNav = Array.from(container.querySelectorAll('nav')).find((element) =>
      element.className.includes('sm:hidden')
    );
    expect(mobileNav).toBeTruthy();
    expect(mobileNav?.className).toContain('bg-[#111316]/95');
  });

  it('keeps non-pricing nav styling on other routes', () => {
    mockedUsePathname.mockReturnValue('/studio');
    const { container } = render(<AppPillNav />);

    const desktopNav = screen.getByLabelText('Main navigation');
    expect(desktopNav.className).toContain('bg-slate-900/95');

    const indicator = container.querySelector('span[aria-hidden="true"]');
    expect(indicator?.className).toContain('bg-gradient-to-r');
  });
});
