import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectType, WizardFormData, WizardErrors } from '../types';
import { SECTOR_OPTIONS } from '../constants';

interface SectorStepProps {
    formData: WizardFormData;
    updateField: <K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => void;
    errors: Pick<WizardErrors, 'projectType'>;
}

export function SectorStep({ formData, updateField, errors }: SectorStepProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-right-8 duration-500 relative">
            {/* Error overlay */}
            {errors.projectType && (
                <div
                    role="alert"
                    aria-live="polite"
                    className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full text-[10px] font-mono text-red-400 uppercase tracking-widest animate-in zoom-in duration-300 z-50"
                >
                    {errors.projectType}
                </div>
            )}

            {SECTOR_OPTIONS.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    aria-pressed={formData.projectType === option.id}
                    onClick={() => {
                        updateField('projectType', option.id as ProjectType);
                    }}
                    className={cn(
                        "group relative p-4 sm:p-5 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center text-center gap-2 hover:scale-[1.02] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1221]",
                        formData.projectType === option.id
                            ? "bg-[#0B1221] border-blue-400 shadow-[0_0_0_1px_rgba(59,130,246,0.95),0_0_28px_-8px_rgba(37,99,235,0.85)]"
                            : "bg-[#0B1221] border-white/20 hover:border-white/30 hover:bg-white/5"
                    )}
                >
                    <div className={cn(
                        "p-3 rounded-full transition-colors",
                        formData.projectType === option.id ? "bg-blue-500/20 text-white" : "bg-white/5 text-white/60 group-hover:text-white"
                    )}>
                        <option.icon size={24} />
                    </div>
                    <div className="min-h-[44px] flex flex-col justify-center">
                        <h3 className="text-base sm:text-lg font-bold text-white leading-tight">{option.label}</h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{option.desc}</p>
                    </div>

                    {/* Selection Indicator */}
                    <div className={cn(
                        "absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        formData.projectType === option.id
                            ? "border-white bg-white text-blue-600 scale-100 opacity-100"
                            : "opacity-0 scale-0 pointer-events-none"
                    )}>
                        <Check size={14} strokeWidth={4} />
                    </div>
                </button>
            ))}
        </div>
    );
}
