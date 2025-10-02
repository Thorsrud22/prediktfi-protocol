'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Dock, { type DockItemType } from './dock/Dock';
import { useSimplifiedWallet } from './wallet/SimplifiedWalletProvider';
import { useIsPro } from '../lib/use-plan';

// Icons using inline SVG for better performance
const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const StudioIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const LeaderboardIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const PredictionsIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const AccountIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const UpgradeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-3)}`;
}

export default function AppDock() {
  const pathname = usePathname();
  const router = useRouter();
  const isPro = useIsPro();
  const { isConnected, publicKey, connect, disconnect } = useSimplifiedWallet();
  
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);

  // Close wallet menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
        setWalletMenuOpen(false);
      }
    };

    if (walletMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [walletMenuOpen]);

  const navigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const handleWalletClick = useCallback(() => {
    if (!isConnected) {
      connect();
    } else {
      setWalletMenuOpen(prev => !prev);
    }
  }, [isConnected, connect]);

  const dockItems: DockItemType[] = [
    {
      icon: <HomeIcon />,
      label: 'Feed',
      onClick: () => navigate('/feed'),
      className: pathname === '/feed' ? 'ring-2 ring-blue-400/50' : ''
    },
    {
      icon: <StudioIcon />,
      label: 'Studio',
      onClick: () => navigate('/studio'),
      className: pathname === '/studio' ? 'ring-2 ring-blue-400/50' : ''
    },
    {
      icon: <LeaderboardIcon />,
      label: 'Leaderboard',
      onClick: () => navigate('/leaderboard'),
      className: pathname === '/leaderboard' ? 'ring-2 ring-blue-400/50' : ''
    },
    {
      icon: <PredictionsIcon />,
      label: 'My Predictions',
      onClick: () => navigate('/my-predictions'),
      className: pathname === '/my-predictions' ? 'ring-2 ring-blue-400/50' : ''
    },
    {
      icon: <AccountIcon />,
      label: 'Account',
      onClick: () => navigate('/account'),
      className: pathname === '/account' ? 'ring-2 ring-blue-400/50' : ''
    },
    {
      icon: <WalletIcon />,
      label: isConnected ? (publicKey ? shortAddress(publicKey) : 'Wallet') : 'Connect',
      onClick: handleWalletClick,
      className: isConnected ? 'ring-2 ring-emerald-400/50' : ''
    },
  ];

  // Add upgrade button if not pro
  if (!isPro) {
    dockItems.push({
      icon: <UpgradeIcon />,
      label: 'Upgrade',
      onClick: () => navigate('/pay'),
      className: 'ring-2 ring-amber-400/50'
    });
  }

  return (
    <>
      <Dock 
        items={dockItems}
        spring={{ mass: 0.1, stiffness: 150, damping: 12 }}
        magnification={64}
        distance={140}
        panelHeight={64}
        baseItemSize={48}
      />
      
      {/* Wallet dropdown menu */}
      {walletMenuOpen && isConnected && (
        <div 
          ref={walletMenuRef}
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[60] w-64"
          style={{ marginLeft: '140px' }} // Offset to align with wallet icon
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Connected Wallet</div>
              <div className="font-mono text-sm text-slate-200">
                {publicKey ? shortAddress(publicKey) : 'Unknown'}
              </div>
            </div>
            
            <div className="p-2">
              <button
                onClick={() => {
                  disconnect();
                  setWalletMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect
              </button>
              
              {!isPro && (
                <button
                  onClick={() => {
                    navigate('/pay');
                    setWalletMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 mt-1 text-sm bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 hover:from-amber-500/30 hover:to-orange-500/30 rounded-lg transition-colors flex items-center gap-2 border border-amber-500/30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
