import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { WizardFormData, WizardErrors } from '../types';
import { WIZARD_CONSTANTS } from '../constants';

interface PitchStepProps {
    formData: WizardFormData;
    updateField: <K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => void;
    errors: WizardErrors;
    onKeyDown: (e: React.KeyboardEvent) => void;
}

export const PitchStep = forwardRef<HTMLTextAreaElement, PitchStepProps>(
    ({ formData, updateField, errors, onKeyDown }, ref) => {
        return (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="relative group space-y-3">
                    <label
                        htmlFor="project-pitch"
                        className="text-[10px] font-mono text-white/30 uppercase tracking-widest block"
                    >
                        The Pitch
                    </label>
                    <textarea
                        ref={ref}
                        id="project-pitch"
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={
                            formData.projectType === 'memecoin'
                                ? "Explain the viral potential, community vibe, and core narrative..."
                                : formData.projectType === 'ai'
                                    ? "Describe the model architecture, data source, and agent behavior..."
                                    : "Explain your mechanism, unique selling point, or narrative..."
                        }
                        className="w-full h-[300px] bg-white/5 rounded-xl border border-white/10 p-6 text-xl sm:text-2xl font-medium text-white placeholder:text-white/20 resize-none outline-none focus:border-blue-500 focus:bg-white/10 transition-all leading-relaxed"
                        aria-describedby={cn(errors.description ? "pitch-error" : undefined, "pitch-counter")}
                        aria-invalid={!!errors.description}
                    />
                    {errors.description && (
                        <div
                            id="pitch-error"
                            role="alert"
                            className="absolute left-0 -bottom-6 text-sm text-red-400 font-mono animate-in fade-in slide-in-from-top-1 duration-300"
                        >
                            {errors.description}
                        </div>
                    )}
                    <div className="absolute bottom-6 right-6 flex items-center gap-4 pointer-events-none">
                        <span
                            id="pitch-counter"
                            className={cn(
                                "text-xs font-mono transition-colors",
                                formData.description.replace(/\s/g, '').length >= WIZARD_CONSTANTS.MIN_PITCH_CHARS ? "text-emerald-400" : "text-white/30"
                            )}
                        >
                            {formData.description.replace(/\s/g, '').length} meaningful chars (min {WIZARD_CONSTANTS.MIN_PITCH_CHARS})
                        </span>
                        <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded hidden sm:inline-block">
                            Cmd + Enter ↵
                        </span>
                    </div>
                </div>
            </div>
        );
    }
);

PitchStep.displayName = 'PitchStep';
