import React, { forwardRef } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardFormData, WizardErrors } from '../types';

interface IdentityStepProps {
    formData: WizardFormData;
    updateField: <K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => void;
    errors: WizardErrors;
    onKeyDown: (e: React.KeyboardEvent) => void;
}

export const IdentityStep = forwardRef<HTMLInputElement, IdentityStepProps>(
    ({ formData, updateField, errors, onKeyDown }, ref) => {
        const namePlaceholder = formData.projectType === 'memecoin' ? "$TICKER" : "Project Name";

        return (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-2xl">
                <div className="relative group space-y-2">
                    <label
                        htmlFor="project-name"
                        className="text-[10px] font-mono text-white/30 uppercase tracking-widest block"
                    >
                        {formData.projectType === 'memecoin' ? "Ticker Symbol" : "Project Name"}
                    </label>
                    <div className="relative border border-white/10 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 focus-within:border-white/20">
                        <input
                            ref={ref}
                            id="project-name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder={namePlaceholder}
                            className="w-full bg-transparent text-4xl sm:text-6xl font-bold text-white placeholder:text-white/10 outline-none border-none focus:border-none focus:outline-none focus:ring-0 focus:shadow-none shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none py-2 transition-colors font-mono uppercase tracking-tight block appearance-none"
                            style={{ outline: 'none', boxShadow: 'none' }}
                            autoComplete="off"
                            aria-describedby={cn(errors.name ? "name-error" : undefined, "name-helper")}
                            aria-invalid={!!errors.name}
                        />
                    </div>
                    {errors.name && (
                        <div
                            id="name-error"
                            role="alert"
                            className="absolute left-0 -bottom-6 text-sm text-red-400 font-mono animate-in fade-in slide-in-from-top-1 duration-300"
                        >
                            {errors.name}
                        </div>
                    )}
                    <div className="absolute right-0 bottom-4 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                        <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded">Enter ↵</span>
                    </div>
                </div>
                <p id="name-helper" className="mt-8 text-white/40 flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-400" />
                    {formData.projectType === 'memecoin'
                        ? "Catchy tickers perform 40% better on analysis."
                        : "Short, memorable names resonate best with VCs."}
                </p>
            </div>
        );
    }
);

IdentityStep.displayName = 'IdentityStep';
