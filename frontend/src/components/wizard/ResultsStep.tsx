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
        <ExportTab projectId={projectId} onRestart={onRestart} results={results} currency={currency} />
      )}
    </div>
  );
}

interface ExportTabProps {
  projectId: string;
  onRestart: () => void;
  results: Record<string, any>;
  currency: string;
}

function ExportTab({ projectId, onRestart, results, currency }: ExportTabProps) {
  const zipUrl = api.getExportZipUrl(projectId);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleExportPDF = async () => {
    setPdfLoading(true);
    setPdfError(null);
    
    try {
      // Validate results before attempting export
      if (!results || Object.keys(results).length === 0) {
        throw new Error('No results data available. Please complete the analysis first.');
      }
      
      await exportResultsToPDF({
        filename: `sem-analysis-${projectId}.pdf`,
        results,
        currency,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPdfError(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Export Results</h3>
      
      {pdfError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Export Failed</p>
              <p className="mt-1">{pdfError}</p>
              <button 
                onClick={() => setPdfError(null)}
                className="mt-2 text-red-800 underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
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
