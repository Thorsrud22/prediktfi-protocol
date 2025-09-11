'use client';

import { CreatorScore } from '@/src/lib/creatorClient';
import { trackClient } from '@/lib/analytics';

interface KpiGridProps {
  creator: CreatorScore;
  onKpiClick?: (kpiType: string) => void;
}

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  tooltip?: string;
  ariaLabel?: string;
  onClick?: () => void;
  clickable?: boolean;
}

function KpiCard({ title, value, subtitle, tooltip, ariaLabel, onClick, clickable }: KpiCardProps) {
  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div 
      className={`bg-slate-800 rounded-xl p-4 md:p-6 relative group focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 ${
        clickable ? 'cursor-pointer hover:bg-slate-700 transition-colors' : ''
      }`}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? "button" : "region"}
      aria-label={ariaLabel || `${title}: ${value}${subtitle ? ` ${subtitle}` : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="text-2xl md:text-3xl font-bold text-white mb-1">
        {value}
      </div>
      <div className="text-slate-400 text-sm">{title}</div>
      {subtitle && (
        <div className="text-slate-500 text-xs mt-1">{subtitle}</div>
      )}
      
      {/* Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  );
}

export default function KpiGrid({ creator, onKpiClick }: KpiGridProps) {
  const handleLast90dClick = () => {
    // Track the event
    trackClient('creator_profile_kpi_clicked', {
      kpiType: 'last90d',
      creatorId: creator.idHashed,
      handle: creator.handle,
      value: creator.counts.last90d,
      referrer_path: document.referrer || '',
      ts: Date.now(),
    });
    
    // Call the parent callback
    onKpiClick?.('last90d');
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <KpiCard
        title="90d Accuracy"
        value={`${(creator.accuracy90d * 100).toFixed(1)}%`}
        tooltip="Prediction accuracy over the last 90 days"
        ariaLabel={`90-day accuracy: ${(creator.accuracy90d * 100).toFixed(1)} percent`}
      />
      
      <KpiCard
        title="Resolved"
        value={creator.counts.resolved.toString()}
        subtitle="predictions"
        tooltip="Total number of resolved predictions"
        ariaLabel={`Resolved predictions: ${creator.counts.resolved}`}
      />
      
      <KpiCard
        title="Pending"
        value={creator.counts.pending.toString()}
        subtitle="predictions"
        tooltip="Predictions awaiting resolution"
        ariaLabel={`Pending predictions: ${creator.counts.pending}`}
      />
      
      <KpiCard
        title="Last 90d"
        value={creator.counts.last90d.toString()}
        subtitle="predictions"
        tooltip="Predictions made in the last 90 days"
        ariaLabel={`Last 90 days predictions: ${creator.counts.last90d}`}
        clickable={true}
        onClick={handleLast90dClick}
      />
    </div>
  );
}
