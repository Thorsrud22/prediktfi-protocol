import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { z } from 'zod';
import { useToast } from '../components/ToastProvider';
import { getQuota as getUsageQuota, bumpQuota as incrementUsage } from '../lib/quota';
import ReasoningTerminal, { ReasoningStep } from './ReasoningTerminal';
import IdeaSubmissionWizard, { WizardFormData } from './IdeaSubmissionWizard';
import {
    Rocket,
    Target,
    Terminal,
    Shield,
    CheckCircle2,
    ArrowLeft,
    Sparkles,
    Download,
    Link as LinkIcon,
    Flag,
    Check,
    Info,
    History,
    Zap,
    Globe,
    Cpu,
    X,
    Lightbulb,
    Activity,
    ChevronDown
} from 'lucide-react';
import Link from 'next/link';

interface IdeaSubmissionFormProps {
    onSubmit: (data: any) => Promise<void> | void;
    isSubmitting: boolean;
    initialData?: any;
    quota?: { limit: number; remaining: number } | null;
    isConnected?: boolean;
    onConnect?: () => void;
    error?: string | null;
    isQuotaLoading?: boolean;
    resetCountdown?: string;
    streamingSteps?: string[] | ReasoningStep[];
    streamingThoughts?: string;
}

const IdeaSubmissionForm: React.FC<IdeaSubmissionFormProps> = ({
    onSubmit,
    initialData,
    quota,
    isConnected,
    onConnect,
    isQuotaLoading,
    resetCountdown,
    isSubmitting,
    error,
    streamingSteps,
    streamingThoughts
}) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState<any>(initialData || {
        projectType: null,
        name: '',
        description: '',
        website: '',
        teamSize: 'solo',
        successDefinition: ''
    });

    const [quotaModalOpen, setQuotaModalOpen] = useState(false);

    // Update form data when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData((prev: any) => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleWizardSubmit = (data: WizardFormData) => {
        // Map wizard data to existing form structure
        const updatedData = {
            ...formData, // Keep existing fields like teamSize, successDefinition if they exist
            ...data      // Include all fields from wizard (name, description, projectType, and contextual fields)
        };

        setFormData(updatedData);

        // Trigger parent submission logic
        // We use a small timeout to allow state update if needed, but usually not required
        onSubmit(updatedData);
    };

    // Render Logic
    // If submitting or if we have error/results shown by parent via props
    // Note: Parent handles the "Result" view (IdeaEvaluationReport), so we only show Terminal if submitting or error
    if (isSubmitting || (error && isSubmitting)) {
        return (
            <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-500">
                <ReasoningTerminal
                    projectType={formData.projectType || 'other'}
                    streamingSteps={streamingSteps || []}
                    streamingThoughts={streamingThoughts || ""}
                    error={error || null}
                    isSubmitting={isSubmitting}
                />
            </div>
        );
    }

    return (
        <IdeaSubmissionWizard
            onSubmit={handleWizardSubmit}
            initialData={{
                name: formData.name,
                description: formData.description,
                website: formData.website,
                projectType: formData.projectType as any
            }}
            isSubmitting={isSubmitting}
        />
    );
};

export default IdeaSubmissionForm;
