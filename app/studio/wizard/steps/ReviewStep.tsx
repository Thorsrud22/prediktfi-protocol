import React from 'react';
import { History } from 'lucide-react';
import { WizardFormData } from '../types';
import { SECTOR_OPTIONS } from '../constants';
import { getCategoryContextualFields, getMissingContextualFields } from '@/lib/ideaCategories';
import { MoreHorizontal } from 'lucide-react'; // Fallback icon

interface ReviewStepProps {
    formData: WizardFormData;
}

export function ReviewStep({ formData }: ReviewStepProps) {
    const contextualFields = getCategoryContextualFields(formData.projectType);
    const missingContextualFields = formData.projectType
        ? getMissingContextualFields(formData.projectType, formData)
        : [];

    const hasContextualFields = contextualFields.length > 0;

    // Dynamic icon lookup
    const sectorOption = SECTOR_OPTIONS.find(opt => opt.id === formData.projectType);
    const SectorIcon = sectorOption?.icon ?? MoreHorizontal;
    const sectorColorClass = sectorOption?.colorClass ?? 'text-slate-300';
    const sectorLabel = sectorOption?.label ?? 'Not selected';
    const identityValue = formData.name.trim() || 'Unnamed Project';
    const pitchValue = formData.description.trim();

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="bg-[#0B1221] border border-white/10 p-8 rounded-3xl space-y-8 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <dl className="space-y-2">
                        <dt className="text-xs text-white/60 uppercase tracking-widest font-mono">Sector</dt>
                        <dd className="text-xl text-white font-bold flex items-center gap-2">
                            <SectorIcon className={sectorColorClass} size={20} />
                            <span>{sectorLabel}</span>
                        </dd>
                    </dl>

                    <dl className="space-y-2">
                        <dt className="text-xs text-white/60 uppercase tracking-widest font-mono">Identity</dt>
                        <dd className="text-xl text-white font-bold tracking-tight">{identityValue}</dd>
                    </dl>
                </div>

                <dl className="space-y-2">
                    <dt className="text-xs text-white/60 uppercase tracking-widest font-mono">The Pitch</dt>
                    <dd className="text-base text-white/70 leading-relaxed italic border-l-2 border-white/10 pl-4">
                        {pitchValue ? `"${pitchValue}"` : 'No pitch provided'}
                    </dd>
                </dl>

                {hasContextualFields && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        {contextualFields.map((field) => (
                            <dl key={`review-${field.key}`} className="space-y-1">
                                <dt className="text-xs text-white/60 uppercase font-mono">{field.reviewLabel}</dt>
                                <dd className="text-sm text-white font-medium">{formData[field.key] || 'Not specified'}</dd>
                            </dl>
                        ))}
                    </div>
                )}

                {missingContextualFields.length > 0 && (
                    <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-4">
                        <div className="text-xs font-mono uppercase tracking-widest text-amber-300 mb-2">
                            Context Quality Warning
                        </div>
                        <p className="text-xs text-amber-100/90 leading-relaxed">
                            You can still submit this evaluation, but missing category-specific inputs will reduce confidence and report quality.
                        </p>
                        <p className="text-xs text-amber-200/80 mt-3 font-mono">
                            Missing: {missingContextualFields.map((field) => field.label).join(', ')}
                        </p>
                    </div>
                )}

                <dl className="space-y-2 pt-4 border-t border-white/5">
                    <dt className="text-xs text-white/60 uppercase tracking-widest font-mono">Estimated Analysis Time</dt>
                    <dd className="text-sm text-emerald-400 font-mono flex items-center gap-2">
                        <History size={14} />
                        {formData.projectType === 'memecoin' ? '~30 Seconds' : '~2 Minutes'}
                    </dd>
                </dl>
            </div>
        </div>
    );
}
