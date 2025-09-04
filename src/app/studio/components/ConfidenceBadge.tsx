// Visual confidence indicator

interface ConfidenceBadgeProps {
  confidence?: number; // 0 to 1
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'bg-green-100 text-green-800';
    if (conf >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.6) return 'Medium';
    return 'Low';
  };

  if (!confidence) {
    return (
      <span
        className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded"
        role="status"
      >
        No data
      </span>
    );
  }

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded ${getConfidenceColor(confidence)}`}
      role="status"
      aria-label={`Confidence level: ${getConfidenceLabel(confidence)}`}
    >
      {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
    </span>
  );
}
