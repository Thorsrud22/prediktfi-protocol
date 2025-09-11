interface StampStatusProps {
  stamped: boolean;
  txSig?: string;
}

export function StampStatus({ stamped, txSig }: StampStatusProps) {
  if (!stamped) {
    return (
      <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span className="text-gray-600">Not stamped on blockchain</span>
        </div>
      </div>
    );
  }
  
  const explorerUrl = txSig ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet` : undefined;
  const shortTxSig = txSig ? `${txSig.substring(0, 8)}...${txSig.substring(txSig.length - 8)}` : 'Unknown';
  
  return (
    <div className="bg-green-50 border-b border-green-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-800 font-medium">Stamped on Solana</span>
          <span className="text-green-600 text-sm">({shortTxSig})</span>
        </div>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-full hover:bg-green-700 transition-colors"
          >
            View on Explorer
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
