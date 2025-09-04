// Display bull/bear/base case scenarios

interface ScenariosProps {
  scenarios?: any[]; // TODO: Type this with proper scenario data
}

export default function Scenarios({ scenarios }: ScenariosProps) {
  const defaultScenarios = ['Bear Case', 'Base Case', 'Bull Case'];

  return (
    <div className="space-y-4" role="region" aria-label="Price scenarios">
      <h3 className="text-lg font-medium">Scenarios</h3>
      <div className="grid grid-cols-3 gap-4">
        {defaultScenarios.map(scenario => (
          <div key={scenario} className="p-4 bg-white border rounded">
            <div className="text-sm text-gray-500">{scenario}</div>
            <div className="text-lg font-mono">--</div>
            <div className="text-xs text-gray-400">Probability: --</div>
          </div>
        ))}
      </div>
    </div>
  );
}
