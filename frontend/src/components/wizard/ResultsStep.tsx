'use client';

import { useState } from 'react';
import { ResearchSummary } from '@/components/results/ResearchSummary';
import { PersonaCards } from '@/components/results/PersonaCards';
import { KeywordDashboard } from '@/components/results/KeywordDashboard';
import { StrategyView } from '@/components/results/StrategyView';
import { RSAPreview } from '@/components/results/RSAPreview';
import { CompetitorView } from '@/components/results/CompetitorView';
import { api } from '@/services/api';

const TABS = [
  { key: 'research', label: 'Research Summary' },
  { key: 'personas', label: 'Personas' },
  { key: 'competitors', label: 'Competitors' },
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
  const competitorResearch = results?.competitor_research || {};
  const keywords = results?.keyword_research || {};
  const strategy = results?.strategy || {};
  const rsas = results?.rsas?.ad_group_rsas || [];
  const currency = results?.keyword_research?.currency || 'USD';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Tab bar */}
      <div className="flex border-b-2 border-purple-200 mb-8 overflow-x-auto bg-white/50 backdrop-blur-sm rounded-t-xl p-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-sm font-bold whitespace-nowrap rounded-lg transition-all duration-300 ${tab === t.key
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
              : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content - conditionally render only active tab */}
      {tab === 'research' && (
        <div id="research-tab-content">
          <ResearchSummary synthesis={synthesis} />
        </div>
      )}
      {tab === 'personas' && (
        <div id="personas-tab-content">
          <PersonaCards personas={personas} />
        </div>
      )}
      {tab === 'competitors' && (
        <div id="competitors-tab-content">
          <CompetitorView competitorResearch={competitorResearch} />
        </div>
      )}
      {tab === 'keywords' && (
        <div id="keywords-tab-content">
          <KeywordDashboard keywords={keywords} currency={currency} />
        </div>
      )}
      {tab === 'strategy' && (
        <div id="strategy-tab-content">
          <StrategyView strategy={strategy} currency={currency} />
        </div>
      )}
      {tab === 'rsas' && (
        <div id="rsas-tab-content">
          <RSAPreview adGroups={rsas} />
        </div>
      )}
      {tab === 'export' && (
        <ExportTab projectId={projectId} onRestart={onRestart} />
      )}
    </div>
  );
}

interface ExportTabProps {
  projectId: string;
  onRestart: () => void;
}

function ExportTab({ projectId, onRestart }: ExportTabProps) {
  const zipUrl = api.getExportZipUrl(projectId);

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-gray-800">Export Results</h3>

      <div className="max-w-md">
        {/* ZIP Download */}
        <a
          href={zipUrl}
          download
          className="flex items-center gap-6 p-8 border-2 border-purple-200 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:shadow-xl hover:scale-105 bg-white"
        >
          <svg className="w-16 h-16 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <span className="font-bold text-gray-900 text-lg">Download ZIP</span>
            <p className="text-sm text-gray-600 mt-2">
              Research, strategy, ads (.md) + media plan (.xlsx)
            </p>
          </div>
        </a>
      </div>

      <div className="pt-6 border-t-2 border-purple-200">
        <button
          onClick={onRestart}
          className="px-6 py-3 text-sm font-bold text-purple-600 border-2 border-purple-300 rounded-xl hover:bg-purple-50 transition-all duration-200"
        >
          Start New Analysis
        </button>
      </div>
    </div>
  );
}
