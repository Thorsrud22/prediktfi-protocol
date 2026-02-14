import React from 'react';
import { WizardFormData } from '../types';
import { getCategoryContextualFields } from '@/lib/ideaCategories';

interface ContextStepProps {
    formData: WizardFormData;
    updateField: <K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
}

export function ContextStep({ formData, updateField, onKeyDown }: ContextStepProps) {
    const contextualFields = getCategoryContextualFields(formData.projectType);

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8 max-w-2xl">
            {contextualFields.map((field) => (
                <div key={field.key} className="space-y-3">
                    <label htmlFor={`context-${field.key}`} className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                        {field.label}
                    </label>
                    <input
                        id={`context-${field.key}`}
                        type="text"
                        value={formData[field.key] || ''}
                        onChange={(e) => updateField(field.key as keyof WizardFormData, e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={field.placeholder}
                        className="w-full bg-transparent text-2xl sm:text-4xl font-bold text-white placeholder:text-white/10 outline-none border-b border-white/10 focus:border-blue-500 pb-2 transition-colors"
                    />
                </div>
            ))}
        </div>
    );
}
