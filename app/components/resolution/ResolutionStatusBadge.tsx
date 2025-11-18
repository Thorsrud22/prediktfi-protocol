'use client';

interface ResolutionStatusBadgeProps {
  status: 'OPEN' | 'COMMITTED' | 'RESOLVED';
  result?: 'YES' | 'NO' | 'INVALID' | null;
  deadline?: string | Date;
  compact?: boolean;
}

export default function ResolutionStatusBadge({
  status,
  result,
  deadline,
  compact = false,
}: ResolutionStatusBadgeProps) {
  const now = new Date();
  const deadlineDate = deadline ? new Date(deadline) : null;
  const isPastDeadline = deadlineDate && deadlineDate < now;

  // Resolved state
  if (status === 'RESOLVED' && result) {
    const badgeConfig = {
      YES: {
        bg: 'bg-green-500/20',
        border: 'border-green-500/30',
        text: 'text-green-300',
        icon: '✓',
        label: compact ? 'Correct' : 'Resolved: Correct',
      },
      NO: {
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
        text: 'text-red-300',
        icon: '✗',
        label: compact ? 'Wrong' : 'Resolved: Wrong',
      },
      INVALID: {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/30',
        text: 'text-yellow-300',
        icon: '?',
        label: compact ? 'Invalid' : 'Resolved: Invalid',
      },
    };

    const config = badgeConfig[result];

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.text}`}
      >
        <span aria-hidden>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  // Ready to resolve (past deadline, not yet resolved)
  if (isPastDeadline && status !== 'RESOLVED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-orange-500/20 border-orange-500/30 text-orange-300">
        <span aria-hidden>⏰</span>
        <span>{compact ? 'Ready' : 'Ready to Resolve'}</span>
      </span>
    );
  }

  // Active (not past deadline)
  if (status === 'OPEN' || status === 'COMMITTED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-blue-500/20 border-blue-500/30 text-blue-300">
        <span aria-hidden>⏳</span>
        <span>{compact ? 'Active' : 'Active Prediction'}</span>
      </span>
    );
  }

  // Default
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-gray-500/20 border-gray-500/30 text-gray-300">
      <span aria-hidden>●</span>
      <span>{status}</span>
    </span>
  );
}
