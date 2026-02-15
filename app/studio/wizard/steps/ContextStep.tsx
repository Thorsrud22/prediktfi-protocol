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
            {contextualFields.map((field, index) => {
                const inputId = `context-${field.key}`;
                const hintId = `context-hint-${field.key}`;

                return (
                <div key={field.key} className="space-y-3">
                    <label htmlFor={inputId} className="text-xs font-mono text-white/60 uppercase tracking-wider">
                        {field.label}
                    </label>
                    <input
                        id={inputId}
                        type="text"
                        value={formData[field.key] || ''}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={field.placeholder}
                        autoFocus={index === 0}
                        aria-describedby={hintId}
                        className="w-full bg-transparent text-2xl sm:text-4xl font-bold text-white placeholder:text-white/25 outline-none border-b border-white/10 focus:border-blue-500 pb-2 transition-colors"
                    />
                    <p id={hintId} className="text-xs text-white/40">
                        {field.placeholder}
                    </p>
                </div>
            )})}
        </div>
    );
}
