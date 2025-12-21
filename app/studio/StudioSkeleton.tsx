import React from 'react';
import { Skeleton } from '@/app/components/ui/Skeleton';

export default function StudioSkeleton() {
    return (
        <div className="bg-slate-900 rounded-xl border border-white/10 p-8 shadow-xl space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Submit Your Idea</h2>

            {/* Project Type */}
            <div>
                <div className="mb-2 h-6 w-24 bg-transparent">
                    <Skeleton width={100} height={20} className="bg-white/[0.02]" variant="text" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-[46px] rounded-lg bg-white/[0.02] border border-white/10 animate-pulse relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Description Field */}
            <div>
                <div className="mb-2 h-6 w-32 bg-transparent">
                    <Skeleton width={130} height={20} className="bg-white/[0.02]" variant="text" />
                </div>
                <div className="h-[120px] rounded-lg bg-white/[0.02] border border-white/10 animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>

            {/* Team Size */}
            <div>
                <div className="mb-2 h-6 w-24 bg-transparent">
                    <Skeleton width={90} height={20} className="bg-white/[0.02]" variant="text" />
                </div>
                <div className="flex gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-6 w-24 rounded bg-white/[0.02] animate-pulse"></div>
                    ))}
                </div>
            </div>

            {/* Resources */}
            <div>
                <div className="mb-2 h-6 w-32 bg-transparent">
                    <Skeleton width={140} height={20} className="bg-white/[0.02]" variant="text" />
                </div>
                <div className="flex gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-8 w-20 rounded-full bg-white/[0.02] border border-white/10 animate-pulse"></div>
                    ))}
                </div>
            </div>


            {/* Submit Button */}
            <div className="pt-2">
                <div className="h-[60px] w-full rounded-lg bg-gradient-to-r from-blue-500/20 to-teal-600/20 border border-blue-500/30 animate-pulse relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>
        </div>
    );
}
