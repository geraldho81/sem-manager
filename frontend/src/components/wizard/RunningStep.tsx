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
    pending: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600',
    running: 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700',
    completed: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700',
    failed: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

export function RunningStep({ agentUpdates, connected, onCancel }: RunningStepProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 pulse-glow' : 'bg-red-500'}`} />
          <span className="text-sm font-semibold text-gray-700">
            {connected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="px-5 py-2 text-sm font-semibold text-red-600 border-2 border-red-300 rounded-xl hover:bg-red-50 transition-all duration-200"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        {AGENT_ORDER.map(({ key, label, icon }) => {
          const update = agentUpdates[key];
          const status = update?.status || 'pending';
          const progress = update?.progress || 0;
          const message = update?.message || '';

          return (
            <div
              key={key}
              className={`p-5 rounded-xl border-2 transition-all duration-300 ${status === 'running'
                ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg'
                : status === 'completed'
                  ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50'
                  : status === 'failed'
                    ? 'border-red-400 bg-gradient-to-br from-red-50 to-pink-50'
                    : 'border-gray-200 bg-white/50 backdrop-blur-sm'
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${status === 'completed'
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg'
                      : status === 'running'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
                        : status === 'failed'
                          ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg'
                          : 'bg-white/70 text-gray-400 backdrop-blur-sm'
                      }`}
                  >
                    {status === 'completed' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : status === 'running' ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      icon
                    )}
                  </div>
                  <span className="font-semibold text-gray-800 text-base">{label}</span>
                </div>
                <StatusBadge status={status} />
              </div>

              {status === 'running' && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {message && (
                    <p className="text-sm text-blue-700 font-medium">{message}</p>
                  )}
                </>
              )}

              {status === 'completed' && message && (
                <p className="text-sm text-green-700 font-medium mt-2">{message}</p>
              )}

              {status === 'failed' && message && (
                <p className="text-sm text-red-700 font-medium mt-2">{message}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
