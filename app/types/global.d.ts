declare global {
  interface Window {
    phantom?: {
      solana?: {
        on(arg0: string, handleAccountChange: (publicKey: { toString: () => string; } | null) => void): unknown;
        isPhantom?: boolean;
        connect?: () => Promise<{ publicKey: { toString: () => string } }>;
        disconnect?: () => Promise<void>;
      };
    };
  }
}

export {};
