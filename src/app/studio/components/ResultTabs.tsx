// Tabbed interface for analysis results

interface ResultTabsProps {
  hasData: boolean;
}

export default function ResultTabs({ hasData }: ResultTabsProps) {
  if (!hasData) {
    return (
      <div className="p-8 text-center text-gray-500" role="status" aria-live="polite">
        Ingen data ennå
      </div>
    );
  }

  const tabs = ['Overview', 'Technical', 'Sentiment', 'Scenarios'];

  return (
    <div className="w-full">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Analysis tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
              role="tab"
              aria-selected="false"
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4 p-4 bg-gray-50 rounded">Tab content will be displayed here</div>
    </div>
  );
}
