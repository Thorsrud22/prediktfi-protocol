/**
 * MetricPills Component
 * Displays model calibration status with tooltips and proper UI rules
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CalibrationResult } from '../../../src/server/models/calibration';

interface MetricPillsProps {
  calibration: CalibrationResult;
  maturedN: number;
  brierScore: number;
  className?: string;
}

interface TooltipProps {
  isVisible: boolean;
  calibration: CalibrationResult;
  brierScore: number;
  position: { x: number; y: number };
}

function CalibrationTooltip({ isVisible, calibration, brierScore, position }: TooltipProps) {
  if (!isVisible) return null;
  
  return (
    <div
      className="fixed z-50 bg-slate-800 text-white p-4 rounded-lg shadow-xl border border-slate-600 max-w-sm"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -120%)'
      }}
    >
      <div className="space-y-2">
        <div className="font-semibold text-sm">
          Calibration: {calibration.status}
        </div>
        
        <div className="text-xs text-slate-300 space-y-1">
          <div>Brier Score: {brierScore.toFixed(3)}</div>
          <div>Sample Size: {calibration.matured_n} matured trades</div>
          <div>Coverage: {(calibration.matured_coverage * 100).toFixed(1)}%</div>
          
          {calibration.calibrationNote && (
            <div className="text-yellow-300">
              Note: {calibration.calibrationNote === 'standard_horizon' ? 'Using standard 30d horizon' : calibration.calibrationNote}
            </div>
          )}
          
          {calibration.bins.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-600">
              <div className="font-medium text-xs mb-1">Calibration Bins:</div>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="text-slate-400">Pred</div>
                <div className="text-slate-400">Actual</div>
                <div className="text-slate-400">N</div>
                {calibration.bins.slice(0, 5).map((bin, idx) => (
                  <React.Fragment key={idx}>
                    <div>{(bin.p * 100).toFixed(0)}%</div>
                    <div>{(bin.hit_rate * 100).toFixed(0)}%</div>
                    <div>{bin.n}</div>
                  </React.Fragment>
                ))}
                {calibration.bins.length > 5 && (
                  <div className="col-span-3 text-center text-slate-400">
                    ... and {calibration.bins.length - 5} more bins
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tooltip arrow */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2 top-full"
        style={{ 
          width: 0, 
          height: 0, 
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid rgb(30 41 59)' // slate-800
        }}
      />
    </div>
  );
}

function getCalibrationPillStyle(status: string): string {
  const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-help";
  
  switch (status) {
    case 'Good':
      return `${baseClasses} bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30`;
    case 'Fair':
      return `${baseClasses} bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30`;
    case 'Poor':
      return `${baseClasses} bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30`;
    default:
      return `${baseClasses} bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500/30`;
  }
}

function InsufficientSamplePill({ maturedN }: { maturedN: number }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const pillRef = useRef<HTMLDivElement>(null);
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (pillRef.current) {
      const rect = pillRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
    setShowTooltip(true);
  };
  
  return (
    <>
      <div
        ref={pillRef}
        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30 cursor-help transition-colors hover:bg-slate-500/30"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="w-2 h-2 bg-slate-400 rounded-full mr-2"></span>
        Insufficient Sample
      </div>
      
      {showTooltip && (
        <div
          className="fixed z-50 bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-600"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -120%)'
          }}
        >
          <div className="text-sm">
            <div className="font-medium">Insufficient Data</div>
            <div className="text-xs text-slate-300 mt-1">
              Need at least 50 matured trades for calibration analysis.
              <br />
              Current: {maturedN} trades
            </div>
          </div>
          
          {/* Tooltip arrow */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 top-full"
            style={{ 
              width: 0, 
              height: 0, 
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgb(30 41 59)' // slate-800
            }}
          />
        </div>
      )}
    </>
  );
}

export default function MetricPills({ 
  calibration, 
  maturedN, 
  brierScore, 
  className = '' 
}: MetricPillsProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const pillRef = useRef<HTMLDivElement>(null);
  
  // Check if we have sufficient data according to MATURED_MIN_N (50)
  const hasSufficientData = maturedN >= 50;
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (pillRef.current) {
      const rect = pillRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
    setShowTooltip(true);
  };
  
  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowTooltip(false);
    if (showTooltip) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showTooltip]);
  
  if (!hasSufficientData) {
    return (
      <div className={className}>
        <InsufficientSamplePill maturedN={maturedN} />
      </div>
    );
  }
  
  return (
    <div className={className}>
      <div
        ref={pillRef}
        className={getCalibrationPillStyle(calibration.status)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => e.stopPropagation()} // Prevent tooltip from closing when clicking pill
      >
        <span 
          className={`w-2 h-2 rounded-full mr-2 ${
            calibration.status === 'Good' ? 'bg-green-400' :
            calibration.status === 'Fair' ? 'bg-yellow-400' :
            calibration.status === 'Poor' ? 'bg-red-400' : 'bg-slate-400'
          }`}
        ></span>
        Calibration: {calibration.status}
      </div>
      
      <CalibrationTooltip
        isVisible={showTooltip}
        calibration={calibration}
        brierScore={brierScore}
        position={tooltipPosition}
      />
    </div>
  );
}
