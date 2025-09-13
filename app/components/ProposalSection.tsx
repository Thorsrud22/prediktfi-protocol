'use client';

import React, { useState } from 'react';

interface ProposalSectionProps {
  insightId: string;
  resolverKind: 'URL' | 'TEXT';
}

interface Proposal {
  result: 'YES' | 'NO' | null;
  confidence: number;
  reasoning: string;
  evidence: Record<string, any>;
}

interface ProposalResponse {
  insightId: string;
  canonical: string;
  resolverKind: 'URL' | 'TEXT';
  proposal: Proposal;
  requiresManualReview: boolean;
  createdAt: string;
}

export default function ProposalSection({ insightId, resolverKind }: ProposalSectionProps) {
  const [proposal, setProposal] = useState<ProposalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualText, setActualText] = useState('');
  const [confirming, setConfirming] = useState(false);

  const generateProposal = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const requestBody: any = { insightId };
      if (resolverKind === 'TEXT' && actualText.trim()) {
        requestBody.actualText = actualText.trim();
      }
      
      const response = await fetch('/api/resolve/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate proposal');
      }
      
      const proposalData = await response.json();
      setProposal(proposalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const confirmProposal = async (action: 'confirm' | 'reject', result?: 'YES' | 'NO' | 'INVALID') => {
    if (!proposal) return;
    
    setConfirming(true);
    setError(null);
    
    try {
      const requestBody: any = {
        insightId: proposal.insightId,
        action,
      };
      
      if (action === 'confirm' && result) {
        requestBody.result = result;
        if (proposal.proposal.evidence.url) {
          requestBody.evidenceUrl = proposal.proposal.evidence.url;
        }
        requestBody.reasoning = proposal.proposal.reasoning;
      }
      
      const response = await fetch('/api/resolve/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm proposal');
      }
      
      const responseData = await response.json();
      
      if (responseData.success) {
        // Refresh the page to show the resolved status
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setConfirming(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="px-8 py-6 border-b border-gray-200 bg-blue-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">
            Resolution Proposal ({resolverKind})
          </h3>
        </div>

        {!proposal && (
          <div className="space-y-4">
            {resolverKind === 'TEXT' && (
              <div>
                <label htmlFor="actualText" className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Text (for comparison)
                </label>
                <textarea
                  id="actualText"
                  rows={3}
                  value={actualText}
                  onChange={(e) => setActualText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the actual text to compare against the expected text..."
                />
              </div>
            )}
            
            <button
              onClick={generateProposal}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Generating Proposal...' : 'Generate Proposal'}
            </button>
          </div>
        )}

        {proposal && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Proposed Outcome</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  proposal.proposal.result === 'YES' ? 'bg-green-100 text-green-800' :
                  proposal.proposal.result === 'NO' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {proposal.proposal.result || 'NEEDS_REVIEW'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Confidence:</span>
                  <span className={`ml-2 text-sm font-medium ${getConfidenceColor(proposal.proposal.confidence)}`}>
                    {getConfidenceText(proposal.proposal.confidence)} ({Math.round(proposal.proposal.confidence * 100)}%)
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Reasoning:</span>
                  <p className="mt-1 text-sm text-gray-700">{proposal.proposal.reasoning}</p>
                </div>

                {proposal.proposal.evidence.url && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Evidence URL:</span>
                    <a 
                      href={proposal.proposal.evidence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      {proposal.proposal.evidence.url}
                    </a>
                  </div>
                )}

                {proposal.proposal.evidence.extractedText && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Extracted Text:</span>
                    <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded text-xs font-mono">
                      {proposal.proposal.evidence.extractedText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {proposal.requiresManualReview && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Manual Review Required</h3>
                    <p className="mt-2 text-sm text-yellow-700">
                      The confidence is too low for automatic resolution. Please review the evidence and manually confirm the outcome.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              {proposal.proposal.result && (
                <button
                  onClick={() => confirmProposal('confirm', proposal.proposal.result!)}
                  disabled={confirming}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Confirm {proposal.proposal.result}
                </button>
              )}
              
              {proposal.requiresManualReview && (
                <>
                  <button
                    onClick={() => confirmProposal('confirm', 'YES')}
                    disabled={confirming}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    Confirm YES
                  </button>
                  <button
                    onClick={() => confirmProposal('confirm', 'NO')}
                    disabled={confirming}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    Confirm NO
                  </button>
                </>
              )}
              
              <button
                onClick={() => confirmProposal('reject')}
                disabled={confirming}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Reject Proposal
              </button>
              
              <button
                onClick={() => setProposal(null)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Generate New
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
