import dynamic from 'next/dynamic';
import Image from 'next/image';

// Use same dynamic import as original
const RadarChart = dynamic(() => import('@/components/charts/RadarChart'), {
    ssr: false,
    loading: () => (
        <div
            className="h-[300px] w-[300px] animate-pulse rounded-full bg-white/5"
            aria-hidden="true"
        />
    ),
});

interface RadarDataPoint {
    label: string;
    value: number;
    fullMark: number;
}

interface PerformanceRadarProps {
    chartData: RadarDataPoint[];
}

export function PerformanceRadar({ chartData }: PerformanceRadarProps) {
    const hasValidChartData =
        chartData.length > 0 &&
        chartData.every(
            point =>
                Number.isFinite(point.value) &&
                Number.isFinite(point.fullMark) &&
                point.fullMark > 0,
        );

    const header = (
        <div className="flex items-center gap-2 mb-4 text-white/60 border-b border-white/5 pb-3 w-full">
            <Image src="/images/logo.png" width={16} height={16} alt="Predikt" className="object-contain" />
            <h3 className="font-bold uppercase tracking-[0.2em] text-xs">Performance Radar</h3>
        </div>
    );

    if (!hasValidChartData) {
        return (
            <div className="border border-white/5 bg-[#0B1221] p-6 rounded-2xl flex flex-col items-center justify-center min-h-[360px]" style={{ contain: 'layout style' }}>
                {header}
                <div className="h-[300px] w-[300px] rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    No chart data
                </div>
            </div>
        );
    }

    return (
        <div className="border border-white/5 bg-[#0B1221] p-6 rounded-2xl flex flex-col items-center justify-center min-h-[360px]" style={{ contain: 'layout style' }}>
            {header}
            <RadarChart data={chartData} width={300} height={300} />
        </div>
    );
}
