'use client';

import { useState } from 'react';
import { ResearchSummary } from '@/components/results/ResearchSummary';
import { PersonaCards } from '@/components/results/PersonaCards';
import { KeywordDashboard } from '@/components/results/KeywordDashboard';
import { StrategyView } from '@/components/results/StrategyView';
import { RSAPreview } from '@/components/results/RSAPreview';
import { api } from '@/services/api';

const TABS = [
  { key: 'research', label: 'Research Summary' },
  { key: 'personas', label: 'Personas' },
  { key: 'keywords', label: 'Keywords' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'rsas', label: 'RSAs' },
  { key: 'export', label: 'Export' },
];

interface ResultsStepProps {
  results: Record<string, any>;
  projectId: string;
  onRestart: () => void;
}

export function ResultsStep({ results, projectId, onRestart }: ResultsStepProps) {
  const [tab, setTab] = useState('research');

  const synthesis = results?.synthesis || {};
  const personas = results?.persona_research?.personas || [];
  const keywords = results?.keyword_research || {};
  const strategy = results?.strategy || {};
  const rsas = results?.rsas?.ad_group_rsas || [];
  const currency = results?.keyword_research?.currency || 'USD';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'research' && <ResearchSummary synthesis={synthesis} />}
      {tab === 'personas' && <PersonaCards personas={personas} />}
      {tab === 'keywords' && <KeywordDashboard keywords={keywords} currency={currency} />}
      {tab === 'strategy' && <StrategyView strategy={strategy} currency={currency} />}
      {tab === 'rsas' && <RSAPreview adGroups={rsas} />}
      {tab === 'export' && (
        <ExportTab projectId={projectId} onRestart={onRestart} />
      )}
    </div>
  );
}

function ExportTab({ projectId, onRestart }: { projectId: string; onRestart: () => void }) {
  const zipUrl = api.getExportZipUrl(projectId);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Export Results</h3>
      <div className="max-w-sm">
        <a
          href={zipUrl}
          download
          className="flex flex-col items-center p-8 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
        >
          <svg className="w-10 h-10 text-blue-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium text-lg">Download All Results</span>
          <span className="text-sm text-gray-500 mt-1">Research, strategy, ads (.md) + media plan (.xlsx)</span>
        </a>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={onRestart}
          className="px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
        >
          Start New Analysis
        </button>
      </div>
    </div>
  );
}
