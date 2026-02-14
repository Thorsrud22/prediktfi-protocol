import { Flag } from 'lucide-react';
import Image from 'next/image';

interface CommitteeDebateProps {
    committeeDebate: {
        bearVerdict: string;
        bearRoast: string;
        bullVerdict: string;
        bullPitch: string;
    } | null;
}

export function CommitteeDebate({ committeeDebate }: CommitteeDebateProps) {
    // If no debate data, return null (parent should handle or we handle here)
    if (!committeeDebate) return null;

    const { bearVerdict, bearRoast, bullVerdict, bullPitch } = committeeDebate;

    return (
        <div data-testid="committee-debate" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* BEAR CARD */}
            <div data-testid="bear-case" className="bg-[#1a0505] border border-red-900/50 rounded-2xl p-6 relative overflow-hidden group hover:border-red-800 transition-colors">

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <Flag size={16} className="text-red-500" />
                            </div>
                            <h3 className="text-red-400 font-black uppercase tracking-widest text-xs">The Bear Case</h3>
                        </div>
                        <span className="text-red-500 font-black uppercase tracking-widest text-xs border border-red-500/50 px-2 py-1 rounded bg-red-500/10">
                            {bearVerdict}
                        </span>
                    </div>
                    <p className="text-red-200/90 text-sm leading-relaxed italic border-l-2 border-red-500/30 pl-4">
                        "{bearRoast}"
                    </p>
                </div>
            </div>

            {/* BULL CARD */}
            <div className="bg-[#021810] border border-emerald-900/50 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-800 transition-colors">

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Image src="/images/logo.png" width={16} height={16} alt="Predikt" className="object-contain" />
                            </div>
                            <h3 className="text-emerald-400 font-black uppercase tracking-widest text-xs">The Bull Case</h3>
                        </div>
                        <span className="text-emerald-500 font-black uppercase tracking-widest text-xs border border-emerald-500/50 px-2 py-1 rounded bg-emerald-500/10">
                            {bullVerdict}
                        </span>
                    </div>
                    <p className="text-emerald-200/90 text-sm leading-relaxed italic border-l-2 border-emerald-500/30 pl-4">
                        "{bullPitch}"
                    </p>
                </div>
            </div>
        </div>
    );
}
