// app/components/advisor/RiskPill.tsx
interface RiskPillProps {
  risk: 'low' | 'medium' | 'high' | 'critical';
  score?: number;
  className?: string;
}

export default function RiskPill({ risk, score, className = '' }: RiskPillProps) {
  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'low':
        return {
          color: 'text-green-600 bg-green-100',
          icon: '✅',
          label: 'LOW RISK'
        };
      case 'medium':
        return {
          color: 'text-yellow-600 bg-yellow-100',
          icon: '⚠️',
          label: 'MEDIUM RISK'
        };
      case 'high':
        return {
          color: 'text-orange-600 bg-orange-100',
          icon: '🚨',
          label: 'HIGH RISK'
        };
      case 'critical':
        return {
          color: 'text-red-600 bg-red-100',
          icon: '🔥',
          label: 'CRITICAL RISK'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-100',
          icon: '❓',
          label: 'UNKNOWN'
        };
    }
  };

  const config = getRiskConfig(risk);

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${config.color} ${className}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="text-xs opacity-75">({score}/100)</span>
      )}
    </div>
  );
}
