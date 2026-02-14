import { Info } from 'lucide-react';

interface ScoreTooltipProps {
    label: string;
    text: string;
    children: React.ReactNode;
}

export const ScoreTooltip = ({ label, text, children }: ScoreTooltipProps) => {
    return (
        <div className="group relative inline-flex items-center">
            {children}
            {/* Tooltip Popup */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-white/10 rounded-xl p-3 shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none z-50">
                <div className="text-xs font-bold text-white mb-1 flex items-center gap-1">
                    <Info size={10} className="text-blue-400" /> {label}
                </div>
                <div className="text-[10px] text-white/60 leading-relaxed">
                    {text}
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
            </div>
        </div>
    );
};
