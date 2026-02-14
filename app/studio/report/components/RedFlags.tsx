import { Flag } from 'lucide-react';

interface RedFlagsProps {
    redFlags: string[];
}

export function RedFlags({ redFlags }: RedFlagsProps) {
    if (redFlags.length === 0) return null;

    return (
        <div className={`border-2 border-red-900/50 bg-[#1a0505] p-4 rounded-xl mb-6 pulse-glow`}>
            <div className="flex items-center gap-2 mb-3 text-red-400">
                <Flag size={16} />
                <h3 className="font-bold uppercase tracking-[0.2em] text-xs">Critical Warnings</h3>
            </div>
            <ul className="space-y-2">
                {redFlags.map((flag, i) => (
                    <li key={i} className="flex gap-3 text-red-200/80 text-xs">
                        <span className="text-red-500">🚩</span>
                        <span className="font-medium">{flag}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
