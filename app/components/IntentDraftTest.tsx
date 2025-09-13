'use client'

import React from 'react'
import { useIntentDraft } from '../lib/store/intent-draft-store'

/**
 * Test component to verify draft state functionality
 * This can be used to test the intent draft system
 */
export default function IntentDraftTest() {
  const { draft, setDraft, createDraft, clearDraft } = useIntentDraft()

  const handleCreateTestDraft = () => {
    const testDraft = createDraft({
      assetSymbol: 'BTC',
      direction: 'Long',
      probability: 75,
      confidence: 80,
      thesis: 'Bitcoin showing strong bullish momentum with institutional adoption increasing',
      horizonDays: 30
    })
    setDraft(testDraft)
  }

  return (
    <div className="p-4 border border-slate-600 rounded-lg bg-slate-800/30">
      <h3 className="font-semibold text-slate-200 mb-4">🧪 Intent Draft Test</h3>
      
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={handleCreateTestDraft}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Create Test Draft
          </button>
          <button
            onClick={clearDraft}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Clear Draft
          </button>
        </div>

        {draft ? (
          <div className="bg-slate-900/50 rounded p-3">
            <h4 className="font-medium text-slate-300 mb-2">Current Draft:</h4>
            <pre className="text-xs text-slate-400 overflow-auto">
              {JSON.stringify(draft, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-slate-400 text-sm">No draft available</div>
        )}
      </div>
    </div>
  )
}