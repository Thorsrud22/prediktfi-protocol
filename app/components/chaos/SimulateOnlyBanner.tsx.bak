'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface SimulateOnlyBannerProps {
  className?: string;
}

export function SimulateOnlyBanner({ className }: SimulateOnlyBannerProps) {
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkChaosTestStatus();
    // Check every 30 seconds
    const interval = setInterval(checkChaosTestStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkChaosTestStatus = async () => {
    try {
      const response = await fetch('/api/chaos/status');
      if (response.ok) {
        const data = await response.json();
        const simulationTest = data.tests.find((test: any) => test.id === 'force_simulation_only');
        
        if (simulationTest?.enabled) {
          setIsActive(true);
          // Calculate time remaining if we have start time and duration
          if (simulationTest.startTime && simulationTest.config?.duration) {
            const startTime = new Date(simulationTest.startTime).getTime();
            const duration = simulationTest.config.duration;
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            setTimeRemaining(remaining);
          }
        } else {
          setIsActive(false);
          setTimeRemaining(null);
        }
      }
    } catch (error) {
      console.error('Failed to check chaos test status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return null;
  }

  if (!isActive) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-yellow-800">
              🧪 Chaos Testing Active: Simulation-Only Mode
            </h3>
            {timeRemaining !== null && (
              <div className="flex items-center text-sm text-yellow-700">
                <Clock className="w-4 h-4 mr-1" />
                {formatTimeRemaining(timeRemaining)} remaining
              </div>
            )}
          </div>
          
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              The system is currently in simulation-only mode for chaos testing. 
              All trading intents will be simulated but not executed.
            </p>
            
            <div className="mt-2 flex items-center text-xs text-yellow-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              This is a temporary testing condition and will automatically resolve.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
