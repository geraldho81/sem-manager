'use client';

import { useState } from 'react';
import { ResearchSummary } from '@/components/results/ResearchSummary';
import { PersonaCards } from '@/components/results/PersonaCards';
import { KeywordDashboard } from '@/components/results/KeywordDashboard';
import { StrategyView } from '@/components/results/StrategyView';
import { RSAPreview } from '@/components/results/RSAPreview';
import { api } from '@/services/api';
import { exportResultsToPDF } from '@/services/pdfExport';

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
      <div id="research-tab-content" className={tab === 'research' ? '' : 'hidden'}>
        <ResearchSummary synthesis={synthesis} />
      </div>
      <div id="personas-tab-content" className={tab === 'personas' ? '' : 'hidden'}>
        <PersonaCards personas={personas} />
      </div>
      <div id="keywords-tab-content" className={tab === 'keywords' ? '' : 'hidden'}>
        <KeywordDashboard keywords={keywords} currency={currency} />
      </div>
      <div id="strategy-tab-content" className={tab === 'strategy' ? '' : 'hidden'}>
        <StrategyView strategy={strategy} currency={currency} />
      </div>
      <div id="rsas-tab-content" className={tab === 'rsas' ? '' : 'hidden'}>
        <RSAPreview adGroups={rsas} />
      </div>
      {tab === 'export' && (
        <ExportTab projectId={projectId} onRestart={onRestart} />
      )}
    </div>
  );
}

function ExportTab({ projectId, onRestart }: { projectId: string; onRestart: () => void }) {
  const zipUrl = api.getExportZipUrl(projectId);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      await exportResultsToPDF({
        filename: `sem-analysis-${projectId}.pdf`,
      });
    } catch (error) {
      alert('Failed to generate PDF. Please try again.');
      console.error('PDF export error:', error);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Export Results</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        {/* ZIP Download */}
        <a
          href={zipUrl}
          download
          className="flex flex-col items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors"
        >
          <svg className="w-10 h-10 text-blue-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium">Download ZIP</span>
          <span className="text-xs text-gray-500 mt-1">Research, strategy, ads (.md) + media plan (.xlsx)</span>
        </a>

        {/* PDF Download */}
        <button
          onClick={handleExportPDF}
          disabled={pdfLoading}
          className="flex flex-col items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pdfLoading ? (
            <svg className="w-10 h-10 text-blue-600 mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-red-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          <span className="font-medium">{pdfLoading ? 'Generating...' : 'Export to PDF'}</span>
          <span className="text-xs text-gray-500 mt-1">All tabs as a single PDF document</span>
        </button>
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
