import { Shield, TriangleAlert as AlertTriangle } from 'lucide-react';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';

interface SecurityChecksProps {
    cryptoNativeChecks?: IdeaEvaluationResult['cryptoNativeChecks'];
}

export function SecurityChecks({ cryptoNativeChecks }: SecurityChecksProps) {
    if (!cryptoNativeChecks) return null;

    return (
        <div data-testid="security-checks" className="border border-white/5 bg-slate-900 p-6 mb-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-blue-400">
                    <Shield size={18} />
                    <h3 className="font-bold uppercase tracking-[0.2em] text-xs">Security Check</h3>
                </div>
                {/* Verification status indicator */}
                {cryptoNativeChecks.isVerified ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                        🔗 On-Chain Verified
                    </span>
                ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-bold uppercase tracking-wider">
                        ⚠️ Simulated (Not Checked)
                    </span>
                )}
            </div>

            {/* Show token address when verified */}
            {cryptoNativeChecks.isVerified && cryptoNativeChecks.tokenAddress && (
                <div className="mb-4 bg-slate-800/50 p-3 rounded-lg">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Token Address</div>
                    <div className="text-xs font-mono text-emerald-400 break-all">
                        {cryptoNativeChecks.tokenAddress}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg text-center relative">
                    {!cryptoNativeChecks.isVerified && (
                        <div className="absolute top-1 right-1 text-[9px] text-amber-400/60 font-mono">SIM</div>
                    )}
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Rug Risk</div>
                    <div className={`text-sm font-bold uppercase ${!cryptoNativeChecks.isVerified
                        ? 'text-white/30'
                        : cryptoNativeChecks.rugPullRisk === 'low' ? 'text-emerald-400' :
                            cryptoNativeChecks.rugPullRisk === 'medium' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                        {cryptoNativeChecks.isVerified
                            ? cryptoNativeChecks.rugPullRisk
                            : 'Not Checked'}
                    </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg text-center relative">
                    {!cryptoNativeChecks.isVerified && (
                        <div className="absolute top-1 right-1 text-[9px] text-amber-400/60 font-mono">SIM</div>
                    )}
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Audit</div>
                    <div className={`text-sm font-bold uppercase ${!cryptoNativeChecks.isVerified
                        ? 'text-white/30'
                        : cryptoNativeChecks.auditStatus === 'audited' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                        {cryptoNativeChecks.isVerified
                            ? cryptoNativeChecks.auditStatus
                            : 'Not Checked'}
                    </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg text-center relative">
                    {!cryptoNativeChecks.isVerified && (
                        <div className="absolute top-1 right-1 text-[9px] text-amber-400/60 font-mono">SIM</div>
                    )}
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Liquidity</div>
                    <div className={`text-sm font-bold uppercase ${!cryptoNativeChecks.isVerified
                        ? 'text-white/30'
                        : (cryptoNativeChecks.isLiquidityLocked || cryptoNativeChecks.liquidityStatus === 'locked' || cryptoNativeChecks.liquidityStatus === 'burned')
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}>
                        {cryptoNativeChecks.isVerified
                            ? (cryptoNativeChecks.isLiquidityLocked ? 'Locked' : cryptoNativeChecks.liquidityStatus)
                            : 'Not Checked'}
                    </div>
                </div>
                {cryptoNativeChecks.isVerified && cryptoNativeChecks.top10HolderPercentage != null && (
                    <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Top 10</div>
                        <div className={`text-sm font-bold ${cryptoNativeChecks.top10HolderPercentage > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {cryptoNativeChecks.top10HolderPercentage.toFixed(1)}%
                        </div>
                    </div>
                )}
                {!cryptoNativeChecks.isVerified && (
                    <div className="bg-slate-800/50 p-3 rounded-lg text-center relative">
                        <div className="absolute top-1 right-1 text-[9px] text-amber-400/60 font-mono">SIM</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Holdings</div>
                        <div className="text-sm font-bold uppercase text-white/30">Not Checked</div>
                    </div>
                )}
            </div>

            {/* Checks Performed List (when verified) */}
            {cryptoNativeChecks.isVerified && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Checks Performed</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">✓ Mint Authority</span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">✓ Freeze Authority</span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">✓ Liquidity Status</span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">✓ Holder Distribution</span>
                    </div>
                </div>
            )}

            {/* Help text when not verified */}
            {!cryptoNativeChecks.isVerified && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-amber-400/80 italic flex items-center gap-2">
                        <AlertTriangle size={12} />
                        No token address provided. Security data above is simulated by AI and NOT verified on-chain.
                        Provide a token address for real security checks.
                    </p>
                </div>
            )}
        </div>
    );
}
