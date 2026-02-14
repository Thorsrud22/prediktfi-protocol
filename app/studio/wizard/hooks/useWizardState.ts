import { useState, useCallback, useRef, useEffect } from 'react';
import { WizardFormData, WizardErrors, ProjectType } from '../types';
import { normalizeIdeaProjectType } from '@/lib/ideaCategories';

const toInitialProjectType = (projectType: WizardFormData['projectType'] | undefined): ProjectType => {
    if (!projectType) return null;
    return normalizeIdeaProjectType(projectType as any);
};

const buildWizardFormData = (initialData?: Partial<WizardFormData>): WizardFormData => ({
    projectType: toInitialProjectType(initialData?.projectType),
    name: initialData?.name || '',
    description: initialData?.description || '',
    website: initialData?.website || '',
    memecoinVibe: initialData?.memecoinVibe || '',
    memecoinNarrative: initialData?.memecoinNarrative || '',
    defiMechanism: initialData?.defiMechanism || '',
    defiRevenue: initialData?.defiRevenue || '',
    aiModelType: initialData?.aiModelType || '',
    aiDataMoat: initialData?.aiDataMoat || '',
    nftUtility: initialData?.nftUtility || '',
    nftCollectorHook: initialData?.nftCollectorHook || '',
    gamingCoreLoop: initialData?.gamingCoreLoop || '',
    gamingEconomyModel: initialData?.gamingEconomyModel || '',
    otherTargetUser: initialData?.otherTargetUser || '',
    otherDifferentiation: initialData?.otherDifferentiation || '',
    teamSize: initialData?.teamSize || 'solo',
    successDefinition: initialData?.successDefinition || ''
});

export function useWizardState(initialData?: Partial<WizardFormData>) {
    // Lazy initialization to avoid re-computing on every render
    const [formData, setFormData] = useState<WizardFormData>(() => buildWizardFormData(initialData));
    const [errors, setErrors] = useState<WizardErrors>({});

    // We still keep a ref for event listeners that need current state without adding dependencies
    // But we avoid the "parallel state" anti-pattern by strictly syncing it
    const formDataRef = useRef<WizardFormData>(formData);

    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const updateField = useCallback(<K extends keyof WizardFormData>(field: K, value: WizardFormData[K]) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            formDataRef.current = next; // Sync ref immediately for any synchronous checks
            return next;
        });

        // Clear errors for this field
        setErrors(prev => {
            if (!prev[field] && !prev.name) return prev; // Optimization
            const next = { ...prev };
            delete next[field];
            if (field === 'projectType' || field === 'name') delete next.name; // specialized clearing
            return next;
        });
    }, []);

    const resetFormData = useCallback((data?: Partial<WizardFormData>) => {
        const newData = buildWizardFormData(data);
        setFormData(newData);
        formDataRef.current = newData;
        setErrors({});
    }, []);

    return {
        formData,
        formDataRef, // Exposed only for legacy event listeners that can't use closures
        errors,
        setErrors,
        updateField,
        setFormData,
        resetFormData
    };
}
