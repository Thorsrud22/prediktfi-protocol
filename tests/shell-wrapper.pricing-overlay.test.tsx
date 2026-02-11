import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePathname } from 'next/navigation';

vi.mock('@/app/components/PersistentLogo', () => ({
  default: () => <div data-testid="persistent-logo" />,
}));

import ShellWrapper from '@/app/components/ShellWrapper';

describe('ShellWrapper pricing overlay', () => {
  const mockedUsePathname = vi.mocked(usePathname);

  beforeEach(() => {
    mockedUsePathname.mockReturnValue('/');
  });

  it('renders stronger matte overlay on /pricing', () => {
    mockedUsePathname.mockReturnValue('/pricing');
    const { container } = render(
      <ShellWrapper navbar={<nav />} footer={<footer />}>
        <div>content</div>
      </ShellWrapper>
    );

    const overlay = container.querySelector('.bg-\\[\\#0f1012\\]\\/93');
    expect(overlay).toBeTruthy();
  });

  it('does not render pricing overlay outside /pricing', () => {
    mockedUsePathname.mockReturnValue('/studio');
    const { container } = render(
      <ShellWrapper navbar={<nav />} footer={<footer />}>
        <div>content</div>
      </ShellWrapper>
    );

    const overlay = container.querySelector('.bg-\\[\\#0f1012\\]\\/93');
    expect(overlay).toBeNull();
  });
});

