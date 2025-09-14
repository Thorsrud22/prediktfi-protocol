'use client'

import { useSimplifiedWallet } from './SimplifiedWalletProvider'

function shortAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

export default function SimplifiedConnectButton() {
  const { isConnected, publicKey, connect, disconnect, isConnecting } = useSimplifiedWallet()

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isConnecting}
        className="rounded-2xl px-4 py-2 font-medium bg-gradient-to-r from-[#0ea5e9] to-[#22d3ee] text-black hover:opacity-90 transition-all disabled:opacity-60"
      >
        {isConnecting ? 'Connecting...' : 'Connect Phantom'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="px-3 py-1.5 bg-slate-800/50 border border-slate-600 rounded-xl text-sm text-slate-200 font-mono">
        {publicKey ? shortAddress(publicKey) : 'Connected'}
      </span>
      <button
        onClick={disconnect}
        className="rounded-2xl px-3 py-2 border border-white/10 text-white/80 hover:bg-white/5 transition-all"
      >
        Disconnect
      </button>
    </div>
  )
}
