// Visual progress indicator for analysis stages

interface ProgressStepsProps {
  step: 'idle' | 'collecting' | 'analyzing' | 'complete';
}

export default function ProgressSteps({ step }: ProgressStepsProps) {
  const steps = [
    { id: 'collecting', label: 'Collecting Data' },
    { id: 'analyzing', label: 'Analyzing' },
    { id: 'complete', label: 'Complete' },
  ];

  return (
    <div className="flex items-center space-x-4" role="progressbar" aria-label="Analysis progress">
      {steps.map((s, index) => (
        <div key={s.id} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === s.id || (index === 2 && step === 'complete')
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {index + 1}
          </div>
          {index < steps.length - 1 && <div className="w-16 h-1 bg-gray-200 mx-2" />}
        </div>
      ))}
    </div>
  );
}
