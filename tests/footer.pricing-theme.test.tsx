import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePathname } from 'next/navigation';
import Footer from '@/app/components/Footer';

describe('Footer pricing theme', () => {
  const mockedUsePathname = vi.mocked(usePathname);

  beforeEach(() => {
    mockedUsePathname.mockReturnValue('/');
  });

  it('applies matte footer classes on /pricing', () => {
    mockedUsePathname.mockReturnValue('/pricing');
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');

    expect(footer).toBeTruthy();
    expect(footer?.className).toContain('bg-[#0f1012]/92');
    expect(footer?.className).toContain('border-white/10');
  });

  it('keeps default footer classes on non-pricing routes', () => {
    mockedUsePathname.mockReturnValue('/studio');
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');

    expect(footer).toBeTruthy();
    expect(footer?.className).toContain('bg-slate-900/50');
    expect(footer?.className).toContain('border-white/5');
  });
});

