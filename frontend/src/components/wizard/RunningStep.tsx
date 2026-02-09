'use client';

import { AgentProgress } from '@/types';

const AGENT_ORDER = [
  { key: 'LandingPageAgent', label: 'Landing Page Analysis', icon: '1' },
  { key: 'CompetitorAgent', label: 'Competitor Analysis', icon: '2' },
  { key: 'PersonaAgent', label: 'Persona Research', icon: '3' },
  { key: 'KeywordAgent', label: 'Keyword Research', icon: '4' },
  { key: 'SynthesisAgent', label: 'Research Synthesis', icon: '5' },
  { key: 'StrategyAgent', label: 'Strategy Builder', icon: '6' },
  { key: 'RSAAgent', label: 'RSA Generation', icon: '7' },
];

interface RunningStepProps {
  agentUpdates: Record<string, AgentProgress>;
  connected: boolean;
  onCancel: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    running: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

export function RunningStep({ agentUpdates, connected, onCancel }: RunningStepProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-500">
            {connected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-3">
        {AGENT_ORDER.map(({ key, label, icon }) => {
          const update = agentUpdates[key];
          const status = update?.status || 'pending';
          const progress = update?.progress || 0;
          const message = update?.message || '';

          return (
            <div
              key={key}
              className={`p-4 rounded-lg border ${
                status === 'running'
                  ? 'border-blue-300 bg-blue-50'
                  : status === 'completed'
                  ? 'border-green-300 bg-green-50'
                  : status === 'failed'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      status === 'completed'
                        ? 'bg-green-500 text-white'
                        : status === 'running'
                        ? 'bg-blue-500 text-white'
                        : status === 'failed'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {status === 'completed' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : status === 'running' ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      icon
                    )}
                  </div>
                  <span className="font-medium text-gray-800">{label}</span>
                </div>
                <StatusBadge status={status} />
              </div>

              {status === 'running' && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {message && (
                    <p className="text-sm text-blue-700">{message}</p>
                  )}
                </>
              )}

              {status === 'completed' && message && (
                <p className="text-sm text-green-700 mt-1">{message}</p>
              )}

              {status === 'failed' && message && (
                <p className="text-sm text-red-700 mt-1">{message}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
