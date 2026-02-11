import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
};

const mockPathname = vi.fn(() => '/');
const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: mockPathname,
  useSearchParams: mockSearchParams,
}));

vi.mock('next/font/google', () => ({
  Inter: vi.fn(() => ({
    className: '',
    variable: '--font-inter',
  })),
  Merriweather: vi.fn(() => ({
    className: '',
  })),
}));

// Mock Solana wallet adapter
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    wallet: null,
    publicKey: null,
    connected: false,
    connecting: false,
    disconnecting: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendTransaction: vi.fn(),
    signTransaction: vi.fn(),
    signAllTransactions: vi.fn(),
  }),
  useConnection: () => ({
    connection: {
      getBalance: vi.fn(),
      getAccountInfo: vi.fn(),
      getLatestBlockhash: vi.fn(),
      sendRawTransaction: vi.fn(),
    },
  }),
}));

// Mock environment variables
Object.defineProperty(process, 'env', {
  value: {
    NODE_ENV: 'test',
    NEXT_PUBLIC_SOLANA_NETWORK: 'devnet',
    NEXT_PUBLIC_RPC_ENDPOINT: 'https://api.devnet.solana.com',
    DATABASE_URL: 'file:./dev.db',
    ...process.env,
  },
});

// Mock global fetch
global.fetch = vi.fn();

// Setup DOM globals
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock @/lib/analytics to fix import errors
vi.mock('@/lib/analytics', () => ({
  trackServer: vi.fn(),
}));

// Virtual SDK mocks for environments where optional packages are not installed.
vi.mock('langfuse', () => ({
  Langfuse: class {
    trace() {
      return {
        generation: () => ({
          end: vi.fn(),
        }),
        update: vi.fn(),
      };
    }
    flushAsync() {
      return Promise.resolve();
    }
  },
}), { virtual: true });

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
  },
}), { virtual: true });

vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: unknown }) => children,
  usePostHog: () => ({
    capture: vi.fn(),
  }),
}), { virtual: true });
