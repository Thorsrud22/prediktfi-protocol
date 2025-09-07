// app/components/advisor/PortfolioCard.tsx
interface Holding {
  asset: string;
  symbol: string;
  amount: number;
  valueUsd: number;
}

interface PortfolioCardProps {
  totalValue: number;
  holdings: Holding[];
  topPositions: Holding[];
  className?: string;
}

export default function PortfolioCard({ 
  totalValue, 
  holdings, 
  topPositions, 
  className = '' 
}: PortfolioCardProps) {
  return (
    <div className={`bg-[color:var(--surface)] rounded-lg border border-[color:var(--border)] p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-[color:var(--text)] mb-4">
        Portfolio Overview
      </h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-[color:var(--text)]">
            ${totalValue.toLocaleString()}
          </div>
          <div className="text-sm text-[color:var(--muted)]">Total Value</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[color:var(--text)]">
            {holdings.length}
          </div>
          <div className="text-sm text-[color:var(--muted)]">Assets</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[color:var(--text)]">
            {topPositions.length > 0 ? ((topPositions[0].valueUsd / totalValue) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-sm text-[color:var(--muted)]">Largest Position</div>
        </div>
      </div>

      {/* Top Positions */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-[color:var(--text)] mb-3">
          Top Positions
        </h3>
        <div className="space-y-2">
          {topPositions.slice(0, 5).map((holding, index) => (
            <div key={holding.asset} className="flex justify-between items-center p-3 bg-[color:var(--background)] rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-[color:var(--text)]">{holding.symbol}</div>
                  <div className="text-sm text-[color:var(--muted)]">{holding.amount.toFixed(4)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-[color:var(--text)]">
                  ${holding.valueUsd.toLocaleString()}
                </div>
                <div className="text-sm text-[color:var(--muted)]">
                  {((holding.valueUsd / totalValue) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Distribution Chart */}
      <div>
        <h3 className="text-lg font-medium text-[color:var(--text)] mb-3">
          Portfolio Distribution
        </h3>
        <div className="space-y-2">
          {topPositions.slice(0, 5).map((holding, index) => {
            const percentage = (holding.valueUsd / totalValue) * 100;
            return (
              <div key={holding.asset} className="flex items-center space-x-3">
                <div className="w-16 text-sm text-[color:var(--text)] font-medium">
                  {holding.symbol}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="w-12 text-sm text-[color:var(--muted)] text-right">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
