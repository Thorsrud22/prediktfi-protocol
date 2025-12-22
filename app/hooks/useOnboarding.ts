'use client';

import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'predikt:onboarding-completed';
const ONBOARDING_VERSION = 'v1'; // Increment this to show onboarding again

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has completed onboarding
    try {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      // const shouldShow = completed !== ONBOARDING_VERSION;

      // Disabled for now per user request
      setShowOnboarding(false);
    } catch (error) {
      console.warn('Failed to check onboarding status:', error);
      setShowOnboarding(false); // Default to hidden
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, ONBOARDING_VERSION);
      setShowOnboarding(false);
    } catch (error) {
      console.warn('Failed to save onboarding completion:', error);
    }
  };

  const resetOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
      setShowOnboarding(true);
    } catch (error) {
      console.warn('Failed to reset onboarding:', error);
    }
  };

  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
