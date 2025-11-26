'use client';

import React, { useState } from 'react';
import { ideaSubmissionSchema, IdeaSubmission } from '@/lib/ideaSchema';
import { z } from 'zod';

interface IdeaSubmissionFormProps {
    onSubmit: (data: IdeaSubmission) => void;
    isSubmitting: boolean;
    initialData?: Partial<IdeaSubmission>;
}

export default function IdeaSubmissionForm({ onSubmit, isSubmitting, initialData }: IdeaSubmissionFormProps) {
    const [formData, setFormData] = useState<Partial<IdeaSubmission>>(initialData || {
        description: '',
        projectType: undefined,
        teamSize: undefined,
        resources: [],
        successDefinition: '',
        attachments: '',
        responseStyle: undefined,
        focusHints: [],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: keyof IdeaSubmission, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const toggleArrayItem = (field: 'resources' | 'focusHints', item: string) => {
        const currentItems = formData[field] || [];
        const newItems = currentItems.includes(item)
            ? currentItems.filter((i) => i !== item)
            : [...currentItems, item];
        handleChange(field, newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const validatedData = ideaSubmissionSchema.parse(formData);
            onSubmit(validatedData);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as string] = err.message;
                    }
                });
                setErrors(newErrors);
            }
        }
    };

    const formatProjectTypeLabel = (type: string) => {
        if (type === 'ai') return 'AI';
        if (type === 'defi') return 'DeFi';
        return type
            .replace('_', ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Submit Your Idea</h2>

            {/* Project Type */}
            <div>
                <label className="block text-blue-200 mb-2 font-medium">Project Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['memecoin', 'defi', 'ai', 'other'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleChange('projectType', type)}
                            className={`p-3 rounded-lg border text-sm transition-all ${formData.projectType === type
                                ? 'bg-blue-500 text-white border-blue-400'
                                : 'bg-white/5 text-blue-200 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {formatProjectTypeLabel(type)}
                        </button>
                    ))}
                </div>
                {errors.projectType && <p className="text-red-400 text-sm mt-1">{errors.projectType}</p>}
            </div>

            {/* Description */}
            <div>
                <label className="block text-blue-200 mb-2 font-medium">Short Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe your project in a few sentences..."
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                    rows={4}
                />
                {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Team Size */}
            <div>
                <label className="block text-blue-200 mb-2 font-medium">Team Size</label>
                <div className="flex gap-4">
                    {['solo', 'team_2_5', 'team_6_plus'].map((size) => (
                        <label key={size} className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="teamSize"
                                value={size}
                                checked={formData.teamSize === size}
                                onChange={() => handleChange('teamSize', size)}
                                className="mr-2 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-blue-200">
                                {size === 'solo' ? 'Solo' : size === 'team_2_5' ? '2-5 Members' : '6+ Members'}
                            </span>
                        </label>
                    ))}
                </div>
                {errors.teamSize && <p className="text-red-400 text-sm mt-1">{errors.teamSize}</p>}
            </div>

            {/* Available Resources */}
            <div>
                <label className="block text-blue-200 mb-2 font-medium">Available Resources</label>
                <div className="flex flex-wrap gap-3">
                    {['time', 'budget', 'skills', 'network'].map((resource) => (
                        <button
                            key={resource}
                            type="button"
                            onClick={() => toggleArrayItem('resources', resource)}
                            className={`px-4 py-2 rounded-full text-sm border transition-all ${formData.resources?.includes(resource)
                                ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                                : 'bg-white/5 text-blue-200 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {resource.charAt(0).toUpperCase() + resource.slice(1)}
                        </button>
                    ))}
                </div>
                {errors.resources && <p className="text-red-400 text-sm mt-1">{errors.resources}</p>}
            </div>

            {/* Success Definition */}
            <div>
                <label className="block text-blue-200 mb-2 font-medium">What does success look like in 6-12 months?</label>
                <input
                    type="text"
                    value={formData.successDefinition}
                    onChange={(e) => handleChange('successDefinition', e.target.value)}
                    placeholder="e.g., 10k users, $1M TVL, mainnet launch..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                {errors.successDefinition && <p className="text-red-400 text-sm mt-1">{errors.successDefinition}</p>}
            </div>

            {/* Attachments */}
            <div>
                <label className="block text-blue-200 mb-2 font-medium">Attachments (Optional)</label>
                <input
                    type="text"
                    value={formData.attachments}
                    onChange={(e) => handleChange('attachments', e.target.value)}
                    placeholder="Link to Pitch Deck, Notion, or Website..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
            </div>

            {/* Response Style */}
            <div>
                <label className="block text-blue-200 mb-2 font-medium">Desired Response Style</label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'short', label: 'Short Verdict' },
                        { id: 'full', label: 'Full Report' },
                        { id: 'next_steps', label: 'Next Steps Focus' },
                    ].map((style) => (
                        <button
                            key={style.id}
                            type="button"
                            onClick={() => handleChange('responseStyle', style.id)}
                            className={`p-3 rounded-lg border text-sm transition-all ${formData.responseStyle === style.id
                                ? 'bg-purple-500 text-white border-purple-400'
                                : 'bg-white/5 text-blue-200 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {style.label}
                        </button>
                    ))}
                </div>
                {errors.responseStyle && <p className="text-red-400 text-sm mt-1">{errors.responseStyle}</p>}
            </div>

            {/* Focus Hints */}
            <div>
                <label className="block text-blue-200 mb-2 font-medium">Focus Hints (Optional)</label>
                <div className="flex flex-wrap gap-3">
                    {['meme potential', 'risk', 'long term', 'technical feasibility', 'marketing'].map((hint) => (
                        <button
                            key={hint}
                            type="button"
                            onClick={() => toggleArrayItem('focusHints', hint)}
                            className={`px-3 py-1 rounded-full text-xs border transition-all ${formData.focusHints?.includes(hint)
                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                                : 'bg-white/5 text-blue-200 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {hint}
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-teal-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Submitting...
                    </span>
                ) : (
                    'Evaluate Idea →'
                )}
            </button>
        </form>
    );
}
