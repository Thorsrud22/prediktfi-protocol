import React from 'react';

interface SimpleGradientBgProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'blue' | 'purple' | 'cyan' | 'slate';
}

/**
 * SimpleGradientBg - A clean, non-animated gradient background
 * Use this for app pages, dashboards, and forms where Aurora would be too distracting
 */
export default function SimpleGradientBg({ 
  children, 
  className = '',
  variant = 'slate'
}: SimpleGradientBgProps) {
  const gradients = {
    blue: 'bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950/30',
    purple: 'bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/30',
    cyan: 'bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/30',
    slate: 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950'
  };

  return (
    <div className={`relative min-h-screen ${gradients[variant]} ${className}`}>
      {children}
    </div>
  );
}
